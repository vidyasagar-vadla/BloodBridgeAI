from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from ..database import get_db
from ..models.models import (
    User, UserRole, Patient, Donor, Hospital, BloodRequest,
    RequestStatus, DonorAvailability, Notification, NotificationType
)
from ..services.auth import get_current_user, get_admin_user, get_password_hash
from ..mock_ai.mock_ai_service import mock_ai

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard")
def admin_dashboard(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    total_patients = db.query(Patient).count()
    total_donors = db.query(Donor).count()
    active_requests = db.query(BloodRequest).filter(
        BloodRequest.status.in_([RequestStatus.REQUEST_SENT, RequestStatus.ACCEPTED, RequestStatus.IN_PROGRESS])
    ).count()
    emergency_requests = db.query(BloodRequest).filter(
        BloodRequest.is_emergency == True,
        BloodRequest.status != RequestStatus.COMPLETED
    ).count()
    total_hospitals = db.query(Hospital).count()

    return {
        "total_patients": total_patients,
        "total_donors": total_donors,
        "active_requests": active_requests,
        "emergency_requests": emergency_requests,
        "total_hospitals": total_hospitals,
    }


# ---- Patient Management ----

@router.get("/patients")
def list_patients(
    search: Optional[str] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(Patient)
    if search:
        query = query.filter(
            Patient.full_name.ilike(f"%{search}%") |
            Patient.city.ilike(f"%{search}%") |
            Patient.hospital_name.ilike(f"%{search}%")
        )
    patients = query.order_by(Patient.created_at.desc()).all()
    return {
        "patients": [{
            "id": p.id,
            "user_id": p.user_id,
            "full_name": p.full_name,
            "age": p.age,
            "gender": p.gender,
            "mobile": p.mobile,
            "email": p.user.email if p.user else "",
            "blood_group": p.blood_group.value if p.blood_group else None,
            "city": p.city,
            "state": p.state,
            "hospital_name": p.hospital_name,
            "hemoglobin_level": p.hemoglobin_level,
            "is_verified": p.user.is_verified if p.user else False,
        } for p in patients]
    }


@router.post("/patients")
def create_patient(
    data: dict,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    import random
    email = data.get("email", f"patient{random.randint(1000,9999)}@example.com")
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        email=email,
        password_hash=get_password_hash("password123"),
        role=UserRole.PATIENT,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    patient = Patient(
        user_id=user.id,
        full_name=data.get("full_name"),
        age=data.get("age"),
        gender=data.get("gender"),
        mobile=data.get("mobile"),
        address=data.get("address", ""),
        city=data.get("city"),
        state=data.get("state"),
        blood_group=data.get("blood_group"),
        thalassemia_type=data.get("thalassemia_type"),
        hemoglobin_level=data.get("hemoglobin_level", 10.0),
        ferritin_level=data.get("ferritin_level", 200),
        weight=data.get("weight", 50),
        hospital_name=data.get("hospital_name"),
        doctor_name=data.get("doctor_name"),
        emergency_contact=data.get("emergency_contact", ""),
    )
    db.add(patient)
    db.commit()
    return {"message": "Patient created", "id": patient.id}


@router.put("/patients/{patient_id}")
def update_patient(
    patient_id: int,
    data: dict,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for key, value in data.items():
        if hasattr(patient, key) and value is not None:
            setattr(patient, key, value)
    db.commit()
    return {"message": "Patient updated"}


@router.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.query(Notification).filter(Notification.patient_id == patient.id).delete()
    db.query(BloodRequest).filter(BloodRequest.patient_id == patient.id).delete()
    db.delete(patient)
    if patient.user:
        db.delete(patient.user)
    db.commit()
    return {"message": "Patient deleted"}


# ---- Donor Management ----

@router.get("/donors")
def list_donors(
    search: Optional[str] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(Donor)
    if search:
        query = query.filter(
            Donor.full_name.ilike(f"%{search}%") |
            Donor.city.ilike(f"%{search}%") |
            Donor.blood_group.ilike(f"%{search}%")
        )
    donors = query.order_by(Donor.created_at.desc()).all()
    return {
        "donors": [{
            "id": d.id,
            "user_id": d.user_id,
            "full_name": d.full_name,
            "age": d.age,
            "gender": d.gender,
            "mobile": d.mobile,
            "email": d.user.email if d.user else "",
            "blood_group": d.blood_group.value if d.blood_group else None,
            "city": d.city,
            "state": d.state,
            "availability": d.availability.value if d.availability else None,
            "total_donations": d.total_donations,
            "reliability_score": d.reliability_score,
            "is_verified": d.user.is_verified if d.user else False,
        } for d in donors]
    }


@router.post("/donors")
def create_donor(
    data: dict,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    import random
    email = data.get("email", f"donor{random.randint(1000,9999)}@example.com")
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        email=email,
        password_hash=get_password_hash("password123"),
        role=UserRole.DONOR,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    donor = Donor(
        user_id=user.id,
        full_name=data.get("full_name"),
        age=data.get("age"),
        gender=data.get("gender"),
        mobile=data.get("mobile"),
        email=email,
        address=data.get("address", ""),
        city=data.get("city"),
        state=data.get("state"),
        blood_group=data.get("blood_group"),
        availability=DonorAvailability.AVAILABLE_NOW,
    )
    db.add(donor)
    db.commit()
    return {"message": "Donor created", "id": donor.id}


@router.put("/donors/{donor_id}")
def update_donor(
    donor_id: int,
    data: dict,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    for key, value in data.items():
        if hasattr(donor, key) and value is not None:
            setattr(donor, key, value)
    db.commit()
    return {"message": "Donor updated"}


@router.delete("/donors/{donor_id}")
def delete_donor(
    donor_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    db.query(Notification).filter(Notification.donor_id == donor.id).delete()
    db.delete(donor)
    if donor.user:
        db.delete(donor.user)
    db.commit()
    return {"message": "Donor deleted"}


# ---- Hospital Management ----

@router.get("/hospitals")
def list_hospitals(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    hospitals = db.query(Hospital).order_by(Hospital.name).all()
    return {
        "hospitals": [{
            "id": h.id,
            "name": h.name,
            "address": h.address,
            "city": h.city,
            "state": h.state,
            "phone": h.phone,
            "email": h.email,
        } for h in hospitals]
    }


@router.post("/hospitals")
def create_hospital(
    data: dict,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    hospital = Hospital(
        name=data.get("name"),
        address=data.get("address"),
        city=data.get("city"),
        state=data.get("state"),
        phone=data.get("phone"),
        email=data.get("email"),
    )
    db.add(hospital)
    db.commit()
    return {"message": "Hospital created", "id": hospital.id}


@router.put("/hospitals/{hospital_id}")
def update_hospital(
    hospital_id: int,
    data: dict,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    for key, value in data.items():
        if hasattr(hospital, key) and value is not None:
            setattr(hospital, key, value)
    db.commit()
    return {"message": "Hospital updated"}


@router.delete("/hospitals/{hospital_id}")
def delete_hospital(
    hospital_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    db.delete(hospital)
    db.commit()
    return {"message": "Hospital deleted"}


# ---- Blood Request Management ----

@router.get("/blood-requests")
def list_blood_requests(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(BloodRequest)
    if status_filter:
        query = query.filter(BloodRequest.status == status_filter)
    requests = query.order_by(BloodRequest.request_date.desc()).all()

    result = []
    for r in requests:
        patient = db.query(Patient).filter(Patient.id == r.patient_id).first()
        result.append({
            "id": r.id,
            "patient_name": patient.full_name if patient else "Unknown",
            "patient_city": patient.city if patient else "",
            "blood_group": r.blood_group.value if r.blood_group else None,
            "units_required": r.units_required,
            "is_emergency": r.is_emergency,
            "status": r.status.value if r.status else None,
            "request_date": str(r.request_date),
            "required_by_date": str(r.required_by_date) if r.required_by_date else None,
        })

    return {"requests": result}


@router.put("/blood-requests/{request_id}/status")
def update_request_status(
    request_id: int,
    data: dict,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    blood_request = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not blood_request:
        raise HTTPException(status_code=404, detail="Blood request not found")

    new_status = data.get("status")
    try:
        blood_request.status = RequestStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")

    from ..models.models import RequestTracking
    tracking = RequestTracking(
        request_id=blood_request.id,
        status=f"Status updated to: {new_status}",
        location=data.get("location", ""),
    )
    db.add(tracking)
    db.commit()
    return {"message": "Status updated"}


# ---- User Verification ----

@router.post("/users/{user_id}/verify")
def verify_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = not user.is_verified
    db.commit()
    return {"message": f"User verification toggled", "is_verified": user.is_verified}


# ---- Analytics ----

@router.get("/analytics")
def get_analytics(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    patients_data = db.query(Patient).all()
    donors_data = db.query(Donor).all()
    requests_data = db.query(BloodRequest).all()

    patients_list = [{
        "state": p.state,
        "blood_group": p.blood_group.value if p.blood_group else None,
        "hemoglobin_level": p.hemoglobin_level,
        "city": p.city,
    } for p in patients_data]

    donors_list = [{
        "state": d.state,
        "availability": d.availability.value if d.availability else None,
        "city": d.city,
    } for d in donors_data]

    requests_list = [{
        "blood_group": r.blood_group.value if r.blood_group else None,
        "is_emergency": r.is_emergency,
        "status": r.status.value if r.status else None,
        "city": db.query(Patient).filter(Patient.id == r.patient_id).first().city if db.query(Patient).filter(Patient.id == r.patient_id).first() else "",
    } for r in requests_data]

    return {
        "patients": patients_list,
        "donors": donors_list,
        "requests": requests_list,
    }


@router.post("/run-analysis")
def run_analysis(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    patients_data = db.query(Patient).all()
    donors_data = db.query(Donor).all()
    requests_data = db.query(BloodRequest).all()

    patients_list = [{
        "state": p.state,
        "hemoglobin_level": p.hemoglobin_level,
        "blood_group": p.blood_group.value if p.blood_group else None,
    } for p in patients_data]

    donors_list = [{
        "availability": d.availability.value if d.availability else None,
    } for d in donors_data]

    requests_list = [{
        "blood_group": r.blood_group.value if r.blood_group else None,
        "is_emergency": r.is_emergency,
    } for r in requests_data]

    loading_steps = mock_ai.simulate_loading([
        "Loading Forecasting Model...",
        "Processing Historical Data...",
        "Generating Insights..."
    ])
    analytics = mock_ai.admin_analytics(patients_list, donors_list, requests_list)

    return {"loading_steps": loading_steps, "analytics": analytics}