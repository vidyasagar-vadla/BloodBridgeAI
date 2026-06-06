from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from ..database import get_db
from ..models.models import (
    User, UserRole, Donor, Patient, BloodRequest, RequestAssignment,
    BloodSupportCircle, RequestStatus, DonorAvailability, Notification,
    NotificationType, AchievementBadge
)
from ..services.auth import get_current_user
from ..mock_ai.mock_ai_service import mock_ai

router = APIRouter(prefix="/api/donor", tags=["Donor"])


def get_donor_profile(current_user: User, db: Session):
    if current_user.role != UserRole.DONOR:
        raise HTTPException(status_code=403, detail="Donor access required")
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")
    return donor


@router.get("/dashboard")
def donor_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    donor = get_donor_profile(current_user, db)
    return {
        "profile": {
            "id": donor.id,
            "full_name": donor.full_name,
            "age": donor.age,
            "gender": donor.gender,
            "blood_group": donor.blood_group.value if donor.blood_group else None,
            "mobile": donor.mobile,
            "email": donor.email,
            "city": donor.city,
            "state": donor.state,
        },
        "availability": donor.availability.value if donor.availability else None,
        "donation_stats": {
            "total_donations": donor.total_donations,
            "patients_supported": donor.patients_supported,
            "emergency_donations": donor.emergency_donations,
            "reliability_score": donor.reliability_score,
            "last_donation_date": str(donor.last_donation_date) if donor.last_donation_date else None,
        }
    }


class AvailabilityUpdate(BaseModel):
    availability: str


@router.put("/availability")
def update_availability(
    request: AvailabilityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donor = get_donor_profile(current_user, db)
    try:
        donor.availability = DonorAvailability(request.availability)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid availability status")
    db.commit()
    return {"message": "Availability updated", "availability": donor.availability.value}


@router.get("/patient-demand")
def patient_demand_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donor = get_donor_profile(current_user, db)
    all_requests = db.query(BloodRequest).filter(
        BloodRequest.status.in_([RequestStatus.REQUEST_SENT, RequestStatus.ACCEPTED])
    ).all()

    request_list = []
    for r in all_requests:
        patient = db.query(Patient).filter(Patient.id == r.patient_id).first()
        request_list.append({
            "id": r.id,
            "patient_name": patient.full_name if patient else "Unknown",
            "blood_group": r.blood_group.value if r.blood_group else None,
            "city": patient.city if patient else "",
            "is_emergency": r.is_emergency,
            "required_by_date": str(r.required_by_date) if r.required_by_date else None,
        })

    all_donors = db.query(Donor).all()
    donor_list = [{
        "id": d.id,
        "blood_group": d.blood_group.value if d.blood_group else None,
        "availability": d.availability.value if d.availability else None,
        "city": d.city,
    } for d in all_donors]

    analysis = mock_ai.demand_analysis(request_list, donor_list)

    return {"analysis": analysis}


@router.get("/incoming-requests")
def get_incoming_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donor = get_donor_profile(current_user, db)

    # Get assignments for this donor
    assignments = db.query(RequestAssignment).filter(
        RequestAssignment.donor_id == donor.id
    ).all()

    result = []
    for assignment in assignments:
        blood_request = db.query(BloodRequest).filter(
            BloodRequest.id == assignment.request_id
        ).first()
        if blood_request:
            patient = db.query(Patient).filter(
                Patient.id == blood_request.patient_id
            ).first()
            result.append({
                "assignment_id": assignment.id,
                "request_id": blood_request.id,
                "patient_name": patient.full_name if patient else "Unknown",
                "patient_city": patient.city if patient else "",
                "patient_state": patient.state if patient else "",
                "blood_group": blood_request.blood_group.value if blood_request.blood_group else None,
                "units_required": blood_request.units_required,
                "is_emergency": blood_request.is_emergency,
                "status": assignment.status,
                "required_by_date": str(blood_request.required_by_date) if blood_request.required_by_date else None,
                "assigned_at": str(assignment.assigned_at),
                "notes": blood_request.notes,
                "patient_mobile": patient.mobile if patient else "",
            })

    return {"requests": sorted(result, key=lambda x: (-x["is_emergency"], x["assigned_at"]))}


@router.post("/requests/{assignment_id}/accept")
def accept_request(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donor = get_donor_profile(current_user, db)
    assignment = db.query(RequestAssignment).filter(
        RequestAssignment.id == assignment_id,
        RequestAssignment.donor_id == donor.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.status = "accepted"
    assignment.responded_at = datetime.now()

    blood_request = db.query(BloodRequest).filter(
        BloodRequest.id == assignment.request_id
    ).first()
    if blood_request:
        blood_request.status = RequestStatus.ACCEPTED
        tracking = db.query(BloodSupportCircle).filter(
            BloodSupportCircle.request_id == assignment.request_id
        ).first()
        from ..models.models import RequestTracking
        rt = RequestTracking(
            request_id=blood_request.id,
            status="Accepted by Donor",
            location=donor.city,
        )
        db.add(rt)

        # Notify patient
        patient = db.query(Patient).filter(Patient.id == blood_request.patient_id).first()
        if patient:
            notification = Notification(
                patient_id=patient.id,
                title="✅ Donor Accepted Request",
                message=f"{donor.full_name} has accepted your blood request!",
                notification_type=NotificationType.PUSH,
            )
            db.add(notification)

    db.commit()
    return {"message": "Request accepted successfully"}


@router.post("/requests/{assignment_id}/reject")
def reject_request(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donor = get_donor_profile(current_user, db)
    assignment = db.query(RequestAssignment).filter(
        RequestAssignment.id == assignment_id,
        RequestAssignment.donor_id == donor.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.status = "rejected"
    assignment.responded_at = datetime.now()
    db.commit()
    return {"message": "Request rejected"}


@router.get("/impact")
def donor_impact(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    donor = get_donor_profile(current_user, db)
    badges = db.query(AchievementBadge).filter(
        AchievementBadge.donor_id == donor.id
    ).all()

    # Generate badges based on stats
    badges_list = [{"name": b.badge_name, "description": b.badge_description} for b in badges]

    # Add default badges based on stats
    if donor.total_donations >= 1 and not any(b.badge_name == "First Donation" for b in badges):
        badges_list.insert(0, {"name": "First Donation", "description": "Completed your first blood donation"})
    if donor.total_donations >= 5:
        badges_list.append({"name": "Regular Donor", "description": "Donated blood 5 times"})
    if donor.total_donations >= 10:
        badges_list.append({"name": "Super Donor", "description": "Donated blood 10 times"})
    if donor.emergency_donations >= 1:
        badges_list.append({"name": "Emergency Hero", "description": "Responded to an emergency request"})

    return {
        "stats": {
            "total_donations": donor.total_donations,
            "patients_supported": donor.patients_supported,
            "emergency_donations": donor.emergency_donations,
            "reliability_score": donor.reliability_score,
        },
        "badges": badges_list,
    }


@router.post("/chat/send")
def send_message(
    request_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donor = get_donor_profile(current_user, db)
    patient_id = request_data.get("patient_id")
    message = request_data.get("message")
    if not patient_id or not message:
        raise HTTPException(status_code=400, detail="patient_id and message required")

    from ..models.models import ChatMessage as ChatMessageModel
    msg = ChatMessageModel(
        patient_id=patient_id,
        donor_id=donor.id,
        sender_role="donor",
        message=message,
    )
    db.add(msg)

    # Notify patient
    notification = Notification(
        patient_id=patient_id,
        title="New Message from Donor",
        message=f"{donor.full_name}: {message[:50]}...",
        notification_type=NotificationType.PUSH,
    )
    db.add(notification)
    db.commit()

    return {"message": "Message sent", "id": msg.id}


@router.get("/chat/{patient_id}")
def get_chat(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donor = get_donor_profile(current_user, db)
    from ..models.models import ChatMessage as ChatMessageModel
    messages = db.query(ChatMessageModel).filter(
        ChatMessageModel.patient_id == patient_id,
        ChatMessageModel.donor_id == donor.id,
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
    donor = get_donor_profile(current_user, db)
    notifications = db.query(Notification).filter(
        Notification.donor_id == donor.id
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


@router.put("/profile")
def update_donor_profile(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donor = get_donor_profile(current_user, db)
    for key, value in data.items():
        if hasattr(donor, key) and value is not None:
            setattr(donor, key, value)
    db.commit()
    return {"message": "Profile updated successfully"}