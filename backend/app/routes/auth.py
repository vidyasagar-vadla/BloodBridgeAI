from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..database import get_db
from ..models.models import User, UserRole, Patient, Donor
from ..services.auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    name: str


class PatientRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    age: int
    gender: str
    mobile: str
    address: str
    city: str
    state: str
    emergency_contact: str
    blood_group: str
    thalassemia_type: str
    hemoglobin_level: float
    ferritin_level: float
    weight: float
    last_transfusion_date: str
    transfusion_interval: int
    hospital_name: str
    doctor_name: str


class DonorRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    age: int
    gender: str
    blood_group: str
    mobile: str
    address: str
    city: str
    state: str
    last_donation_date: Optional[str] = None


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    name = ""
    if user.role == UserRole.PATIENT and user.patient:
        name = user.patient.full_name
    elif user.role == UserRole.DONOR and user.donor:
        name = user.donor.full_name
    else:
        name = "Admin"

    token = create_access_token({"user_id": user.id, "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role.value,
        "name": name,
    }


@router.post("/register/patient")
def register_patient(request: PatientRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=UserRole.PATIENT,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    patient = Patient(
        user_id=user.id,
        full_name=request.full_name,
        age=request.age,
        gender=request.gender,
        mobile=request.mobile,
        address=request.address,
        city=request.city,
        state=request.state,
        emergency_contact=request.emergency_contact,
        blood_group=request.blood_group,
        thalassemia_type=request.thalassemia_type,
        hemoglobin_level=request.hemoglobin_level,
        ferritin_level=request.ferritin_level,
        weight=request.weight,
        last_transfusion_date=request.last_transfusion_date,
        transfusion_interval=request.transfusion_interval,
        hospital_name=request.hospital_name,
        doctor_name=request.doctor_name,
    )
    db.add(patient)
    db.commit()

    token = create_access_token({"user_id": user.id, "role": "patient"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": "patient",
        "name": request.full_name,
    }


@router.post("/register/donor")
def register_donor(request: DonorRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=UserRole.DONOR,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    donor = Donor(
        user_id=user.id,
        full_name=request.full_name,
        age=request.age,
        gender=request.gender,
        blood_group=request.blood_group,
        mobile=request.mobile,
        address=request.address,
        city=request.city,
        state=request.state,
        last_donation_date=request.last_donation_date,
    )
    db.add(donor)
    db.commit()

    token = create_access_token({"user_id": user.id, "role": "donor"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": "donor",
        "name": request.full_name,
    }


@router.post("/register/admin")
def register_admin(db: Session = Depends(get_db)):
    """Seed admin user"""
    existing = db.query(User).filter(User.email == "admin@thalassemia.org").first()
    if existing:
        return {"message": "Admin already exists"}

    user = User(
        email="admin@thalassemia.org",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    return {"message": "Admin created successfully", "email": "admin@thalassemia.org", "password": "admin123"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = {"id": current_user.id, "email": current_user.email, "role": current_user.role.value}
    if current_user.role == UserRole.PATIENT and current_user.patient:
        p = current_user.patient
        data["profile"] = {
            "id": p.id,
            "full_name": p.full_name,
            "age": p.age,
            "gender": p.gender,
            "mobile": p.mobile,
            "address": p.address,
            "city": p.city,
            "state": p.state,
            "emergency_contact": p.emergency_contact,
            "blood_group": p.blood_group.value if p.blood_group else None,
            "thalassemia_type": p.thalassemia_type.value if p.thalassemia_type else None,
            "hemoglobin_level": p.hemoglobin_level,
            "ferritin_level": p.ferritin_level,
            "weight": p.weight,
            "last_transfusion_date": str(p.last_transfusion_date) if p.last_transfusion_date else None,
            "transfusion_interval": p.transfusion_interval,
            "hospital_name": p.hospital_name,
            "doctor_name": p.doctor_name,
            "latitude": p.latitude,
            "longitude": p.longitude,
        }
    elif current_user.role == UserRole.DONOR and current_user.donor:
        d = current_user.donor
        data["profile"] = {
            "id": d.id,
            "full_name": d.full_name,
            "age": d.age,
            "gender": d.gender,
            "blood_group": d.blood_group.value if d.blood_group else None,
            "mobile": d.mobile,
            "email": d.email,
            "address": d.address,
            "city": d.city,
            "state": d.state,
            "last_donation_date": str(d.last_donation_date) if d.last_donation_date else None,
            "availability": d.availability.value if d.availability else None,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "reliability_score": d.reliability_score,
            "total_donations": d.total_donations,
            "patients_supported": d.patients_supported,
            "emergency_donations": d.emergency_donations,
        }
    return data