from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime, timedelta
import random
from ..database import get_db
from ..models.models import (
    User, UserRole, Patient, Donor, BloodRequest, RequestAssignment,
    RequestTracking, BloodSupportCircle, RequestStatus, DonorAvailability,
    Notification, NotificationType
)
from ..services.auth import get_current_user
from ..mock_ai.mock_ai_service import mock_ai

router = APIRouter(prefix="/api/patient", tags=["Patient"])


def get_patient_profile(current_user: User, db: Session):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Patient access required")
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient


@router.get("/dashboard")
def patient_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = get_patient_profile(current_user, db)

    # Calculate blood requirement status
    days_since = 0
    if patient.last_transfusion_date:
        days_since = (date.today() - patient.last_transfusion_date).days

    next_expected = patient.transfusion_interval - days_since if patient.transfusion_interval else 15
    status = "Safe"
    if next_expected <= 3:
        status = "Critical"
    elif next_expected <= 7:
        status = "Warning"

    active_requests = db.query(BloodRequest).filter(
        BloodRequest.patient_id == patient.id,
        BloodRequest.status.in_([RequestStatus.REQUEST_SENT, RequestStatus.ACCEPTED, RequestStatus.IN_PROGRESS])
    ).count()

    return {
        "profile": {
            "id": patient.id,
            "full_name": patient.full_name,
            "age": patient.age,
            "gender": patient.gender,
            "blood_group": patient.blood_group.value if patient.blood_group else None,
            "city": patient.city,
            "state": patient.state,
            "hospital_name": patient.hospital_name,
            "doctor_name": patient.doctor_name,
        },
        "medical": {
            "thalassemia_type": patient.thalassemia_type.value if patient.thalassemia_type else None,
            "hemoglobin_level": patient.hemoglobin_level,
            "ferritin_level": patient.ferritin_level,
            "weight": patient.weight,
            "last_transfusion_date": str(patient.last_transfusion_date) if patient.last_transfusion_date else None,
            "transfusion_interval": patient.transfusion_interval,
        },
        "blood_requirement": {
            "last_transfusion_date": str(patient.last_transfusion_date) if patient.last_transfusion_date else None,
            "next_expected_date": str(date.today() + timedelta(days=next_expected)) if next_expected > 0 else "Overdue",
            "days_until_required": max(0, next_expected),
            "status": status,
            "active_requests": active_requests,
        }
    }


@router.post("/predict-blood-requirement")
def predict_blood_requirement(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = get_patient_profile(current_user, db)
    patient_data = {
        "hemoglobin_level": patient.hemoglobin_level,
        "last_transfusion_date": str(patient.last_transfusion_date) if patient.last_transfusion_date else None,
        "transfusion_interval": patient.transfusion_interval,
        "ferritin_level": patient.ferritin_level,
        "age": patient.age,
        "weight": patient.weight,
    }
    loading_steps = mock_ai.simulate_loading([
        "Loading Prediction Model...",
        "Analyzing Patient History...",
        "Generating Prediction..."
    ])
    prediction = mock_ai.predict_blood_requirement(patient_data)
    return {"loading_steps": loading_steps, "prediction": prediction}


@router.get("/find-donors")
def find_donors(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = get_patient_profile(current_user, db)
    all_donors = db.query(Donor).all()

    patient_data = {
        "blood_group": patient.blood_group.value if patient.blood_group else None,
        "city": patient.city,
        "latitude": patient.latitude,
        "longitude": patient.longitude,
    }

    donor_list = []
    for d in all_donors:
        donor_list.append({
            "id": d.id,
            "full_name": d.full_name,
            "blood_group": d.blood_group.value if d.blood_group else None,
            "city": d.city,
            "state": d.state,
            "availability": d.availability.value if d.availability else None,
            "reliability_score": d.reliability_score,
            "total_donations": d.total_donations,
            "mobile": d.mobile,
            "latitude": d.latitude,
            "longitude": d.longitude,
        })

    loading_steps = mock_ai.simulate_loading([
        "Loading Matching Model...",
        "Searching Compatible Donors...",
        "Ranking Donors..."
    ])
    matched_donors = mock_ai.find_compatible_donors(patient_data, donor_list)

    return {"loading_steps": loading_steps, "donors": matched_donors}


class CreateBloodRequest(BaseModel):
    units_required: int = 1
    is_emergency: bool = False
    required_by_date: str
    notes: Optional[str] = None
    hospital_id: Optional[int] = None


@router.post("/blood-requests")
def create_blood_request(
    request: CreateBloodRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = get_patient_profile(current_user, db)

    blood_request = BloodRequest(
        patient_id=patient.id,
        blood_group=patient.blood_group,
        units_required=request.units_required,
        is_emergency=request.is_emergency,
        required_by_date=request.required_by_date,
        notes=request.notes,
        hospital_id=request.hospital_id,
    )
    db.add(blood_request)
    db.flush()

    # Create initial tracking entry
    tracking = RequestTracking(
        request_id=blood_request.id,
        status="Request Sent",
        location=patient.city,
    )
    db.add(tracking)

    # If emergency, find and notify compatible donors
    if request.is_emergency:
        all_donors = db.query(Donor).filter(
            Donor.availability != DonorAvailability.NOT_AVAILABLE
        ).all()
        donor_list = [{
            "id": d.id,
            "full_name": d.full_name,
            "blood_group": d.blood_group.value if d.blood_group else None,
            "city": d.city,
            "state": d.state,
            "availability": d.availability.value if d.availability else None,
            "reliability_score": d.reliability_score,
            "total_donations": d.total_donations,
            "mobile": d.mobile,
        } for d in all_donors]

        patient_data = {
            "blood_group": patient.blood_group.value if patient.blood_group else None,
            "city": patient.city,
        }
        matched = mock_ai.find_compatible_donors(patient_data, donor_list)
        for donor_match in matched:
            assignment = RequestAssignment(
                request_id=blood_request.id,
                donor_id=donor_match["id"],
            )
            db.add(assignment)
            notification = Notification(
                donor_id=donor_match["id"],
                title="🚨 Emergency Blood Request",
                message=f"Emergency blood request from {patient.full_name} in {patient.city}. Blood group: {patient.blood_group.value}",
                notification_type=NotificationType.PUSH,
            )
            db.add(notification)

    db.commit()
    return {
        "message": "Blood request created successfully",
        "request_id": blood_request.id,
        "is_emergency": request.is_emergency,
        "status": "Request Sent"
    }


@router.get("/blood-requests")
def get_blood_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = get_patient_profile(current_user, db)
    requests = db.query(BloodRequest).filter(
        BloodRequest.patient_id == patient.id
    ).order_by(BloodRequest.request_date.desc()).all()

    result = []
    for r in requests:
        tracking_entries = db.query(RequestTracking).filter(
            RequestTracking.request_id == r.id
        ).order_by(RequestTracking.updated_at.desc()).all()

        assignments = db.query(RequestAssignment).filter(
            RequestAssignment.request_id == r.id
        ).all()

        donor_info = []
        for a in assignments:
            donor = db.query(Donor).filter(Donor.id == a.donor_id).first()
            if donor:
                donor_info.append({
                    "donor_id": donor.id,
                    "donor_name": donor.full_name,
                    "status": a.status,
                    "mobile": donor.mobile,
                })

        result.append({
            "id": r.id,
            "blood_group": r.blood_group.value if r.blood_group else None,
            "units_required": r.units_required,
            "is_emergency": r.is_emergency,
            "status": r.status.value if r.status else None,
            "request_date": str(r.request_date),
            "required_by_date": str(r.required_by_date) if r.required_by_date else None,
            "notes": r.notes,
            "tracking": [{"status": t.status, "location": t.location, "updated_at": str(t.updated_at)} for t in tracking_entries],
            "assigned_donors": donor_info,
        })

    return {"requests": result}


@router.post("/blood-requests/{request_id}/cancel")
def cancel_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = get_patient_profile(current_user, db)
    blood_request = db.query(BloodRequest).filter(
        BloodRequest.id == request_id,
        BloodRequest.patient_id == patient.id
    ).first()
    if not blood_request:
        raise HTTPException(status_code=404, detail="Request not found")

    blood_request.status = RequestStatus.CANCELLED
    db.commit()
    return {"message": "Request cancelled"}


class ChatMessageCreate(BaseModel):
    donor_id: int
    message: str


@router.post("/chat/send")
def send_message(
    request: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = get_patient_profile(current_user, db)
    from ..models.models import ChatMessage as ChatMessageModel
    msg = ChatMessageModel(
        patient_id=patient.id,
        donor_id=request.donor_id,
        sender_role="patient",
        message=request.message,
    )
    db.add(msg)
    db.commit()

    # Notify donor
    notification = Notification(
        donor_id=request.donor_id,
        title="New Message from Patient",
        message=f"{patient.full_name}: {request.message[:50]}...",
        notification_type=NotificationType.PUSH,
    )
    db.add(notification)
    db.commit()

    return {"message": "Message sent", "id": msg.id}


@router.get("/chat/{donor_id}")
def get_chat_messages(
    donor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = get_patient_profile(current_user, db)
    from ..models.models import ChatMessage as ChatMessageModel
    messages = db.query(ChatMessageModel).filter(
        ChatMessageModel.patient_id == patient.id,
        ChatMessageModel.donor_id == donor_id,
    ).order_by(ChatMessageModel.created_at).all()

    return {
        "messages": [{
            "id": m.id,
            "sender_role": m.sender_role,
            "message": m.message,
            "is_read": m.is_read,
            "created_at": str(m.created_at),
        } for m in messages]
    }


@router.get("/notifications")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = get_patient_profile(current_user, db)
    notifications = db.query(Notification).filter(
        Notification.patient_id == patient.id
    ).order_by(Notification.created_at.desc()).limit(20).all()

    return {
        "notifications": [{
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": str(n.created_at),
        } for n in notifications]
    }


@router.post("/support-circle/add/{donor_id}")
def add_to_support_circle(
    donor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = get_patient_profile(current_user, db)
    existing = db.query(BloodSupportCircle).filter(
        BloodSupportCircle.patient_id == patient.id,
        BloodSupportCircle.donor_id == donor_id,
    ).first()
    if existing:
        return {"message": "Donor already in support circle"}

    circle = BloodSupportCircle(
        patient_id=patient.id,
        donor_id=donor_id,
    )
    db.add(circle)
    db.commit()
    return {"message": "Donor added to support circle"}


@router.get("/support-circle")
def get_support_circle(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = get_patient_profile(current_user, db)
    circles = db.query(BloodSupportCircle).filter(
        BloodSupportCircle.patient_id == patient.id,
        BloodSupportCircle.is_active == True,
    ).all()

    donors_list = []
    for c in circles:
        donor = db.query(Donor).filter(Donor.id == c.donor_id).first()
        if donor:
            donors_list.append({
                "id": donor.id,
                "name": donor.full_name,
                "blood_group": donor.blood_group.value if donor.blood_group else None,
                "city": donor.city,
                "mobile": donor.mobile,
                "availability": donor.availability.value if donor.availability else None,
                "reliability_score": donor.reliability_score,
                "total_donations": donor.total_donations,
            })

    return {"donors": donors_list}


@router.put("/profile")
def update_patient_profile(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = get_patient_profile(current_user, db)
    for key, value in data.items():
        if hasattr(patient, key) and value is not None:
            setattr(patient, key, value)
    db.commit()
    return {"message": "Profile updated successfully"}