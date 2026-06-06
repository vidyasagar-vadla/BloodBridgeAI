"""Seed the database with sample data for testing"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, Base, SessionLocal
from app.models.models import User, Patient, Donor, Hospital, BloodRequest, RequestStatus, UserRole, BloodGroup, ThalassemiaType, DonorAvailability
from app.services.auth import get_password_hash
from datetime import date, timedelta

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Create admin
    admin = User(
        email="admin@thalassemia.org",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_verified=True,
    )
    db.add(admin)
    db.flush()

    # Create hospitals
    hospitals_data = [
        ("AIIMS Delhi", "Ansari Nagar", "New Delhi", "Delhi", "011-26588500", "aiims@gov.in"),
        ("CMC Vellore", "Vellore", "Vellore", "Tamil Nadu", "0416-2282000", "cmc@cmcvellore.ac.in"),
        ("KEM Hospital", "Parel", "Mumbai", "Maharashtra", "022-24136000", "kem@kem.edu"),
        ("Narayana Health", "Bommasandra", "Bangalore", "Karnataka", "080-27822000", "info@narayanahealth.org"),
        ("Apollo Hospitals", "Greams Road", "Chennai", "Tamil Nadu", "044-28290000", "contact@apollohospitals.com"),
    ]
    hospitals = []
    for name, addr, city, state, phone, email in hospitals_data:
        h = Hospital(name=name, address=addr, city=city, state=state, phone=phone, email=email)
        db.add(h)
        hospitals.append(h)
    db.flush()

    # Create sample patients
    patients_data = [
        ("Rahul Sharma", 24, "Male", "9876543210", "Delhi", "Delhi", BloodGroup.B_POSITIVE, ThalassemiaType.BETA_MAJOR, 8.2, 350, 55, date.today() - timedelta(days=12), 15, "AIIMS Delhi"),
        ("Priya Patel", 22, "Female", "9876543211", "Mumbai", "Maharashtra", BloodGroup.A_POSITIVE, ThalassemiaType.BETA_INTERMEDIA, 9.1, 280, 48, date.today() - timedelta(days=7), 18, "KEM Hospital"),
        ("Arun Kumar", 28, "Male", "9876543212", "Bangalore", "Karnataka", BloodGroup.O_POSITIVE, ThalassemiaType.ALPHA_MAJOR, 7.5, 420, 60, date.today() - timedelta(days=5), 12, "Narayana Health"),
        ("Sneha Reddy", 20, "Female", "9876543213", "Chennai", "Tamil Nadu", BloodGroup.AB_POSITIVE, ThalassemiaType.BETA_MAJOR, 8.8, 310, 52, date.today() - timedelta(days=10), 14, "CMC Vellore"),
        ("Vikram Singh", 32, "Male", "9876543214", "Jaipur", "Rajasthan", BloodGroup.B_NEGATIVE, ThalassemiaType.BETA_INTERMEDIA, 9.5, 250, 58, date.today() - timedelta(days=20), 20, "AIIMS Delhi"),
        ("Ananya Gupta", 18, "Female", "9876543215", "Lucknow", "Uttar Pradesh", BloodGroup.A_NEGATIVE, ThalassemiaType.BETA_MAJOR, 7.8, 380, 45, date.today() - timedelta(days=3), 14, "Apollo Hospitals"),
        ("Rajesh Verma", 26, "Male", "9876543216", "Pune", "Maharashtra", BloodGroup.O_NEGATIVE, ThalassemiaType.ALPHA_INTERMEDIA, 8.5, 300, 62, date.today() - timedelta(days=8), 16, "KEM Hospital"),
    ]

    patients = []
    for i, (name, age, gender, mobile, city, state, bg, tt, hb, fer, wt, ltd, interval, hospital) in enumerate(patients_data):
        user = User(
            email=f"patient{i+1}@test.com",
            password_hash=get_password_hash("password"),
            role=UserRole.PATIENT,
            is_verified=True,
        )
        db.add(user)
        db.flush()

        patient = Patient(
            user_id=user.id,
            full_name=name,
            age=age,
            gender=gender,
            mobile=mobile,
            address=f"Address of {name}",
            city=city,
            state=state,
            emergency_contact=f"99{mobile[2:]}",
            blood_group=bg,
            thalassemia_type=tt,
            hemoglobin_level=hb,
            ferritin_level=fer,
            weight=wt,
            last_transfusion_date=ltd,
            transfusion_interval=interval,
            hospital_name=hospital,
            doctor_name=f"Dr. {'Sharma' if gender == 'Male' else 'Patel'}",
        )
        db.add(patient)
        patients.append(patient)
    db.flush()

    # Create sample donors
    donors_data = [
        ("Amit Singh", 30, "Male", BloodGroup.B_POSITIVE, "Delhi", "Delhi", DonorAvailability.AVAILABLE_NOW, 5, 3, 1, 95),
        ("Neha Kapoor", 27, "Female", BloodGroup.A_POSITIVE, "Mumbai", "Maharashtra", DonorAvailability.AVAILABLE_WEEK, 3, 2, 0, 88),
        ("Ravi Kumar", 35, "Male", BloodGroup.O_POSITIVE, "Bangalore", "Karnataka", DonorAvailability.AVAILABLE_NOW, 8, 5, 2, 98),
        ("Sonia Jain", 25, "Female", BloodGroup.AB_POSITIVE, "Chennai", "Tamil Nadu", DonorAvailability.EMERGENCY_ONLY, 2, 1, 1, 82),
        ("Deepak Yadav", 29, "Male", BloodGroup.B_NEGATIVE, "Jaipur", "Rajasthan", DonorAvailability.AVAILABLE_NOW, 6, 4, 0, 90),
        ("Pooja Sharma", 24, "Female", BloodGroup.A_NEGATIVE, "Lucknow", "Uttar Pradesh", DonorAvailability.AVAILABLE_WEEK, 4, 2, 0, 85),
        ("Sunil Patel", 32, "Male", BloodGroup.O_NEGATIVE, "Pune", "Maharashtra", DonorAvailability.AVAILABLE_NOW, 10, 7, 3, 97),
        ("Kiran Rao", 28, "Female", BloodGroup.O_POSITIVE, "Hyderabad", "Telangana", DonorAvailability.AVAILABLE_NOW, 7, 4, 1, 92),
    ]

    donors = []
    for i, (name, age, gender, bg, city, state, avail, donations, patients_sup, emergency, score) in enumerate(donors_data):
        user = User(
            email=f"donor{i+1}@test.com",
            password_hash=get_password_hash("password"),
            role=UserRole.DONOR,
            is_verified=True,
        )
        db.add(user)
        db.flush()

        last_donation = date.today() - timedelta(days=90) if donations > 0 else None

        donor = Donor(
            user_id=user.id,
            full_name=name,
            age=age,
            gender=gender,
            blood_group=bg,
            mobile=f"99887766{i+1:02d}",
            email=f"donor{i+1}@test.com",
            address=f"Address of {name}",
            city=city,
            state=state,
            last_donation_date=last_donation,
            availability=avail,
            total_donations=donations,
            patients_supported=patients_sup,
            emergency_donations=emergency,
            reliability_score=score,
        )
        db.add(donor)
        donors.append(donor)
    db.flush()

    # Create sample blood requests
    blood_requests_data = [
        (patients[0], BloodGroup.B_POSITIVE, 1, False, date.today() + timedelta(days=3)),
        (patients[1], BloodGroup.A_POSITIVE, 2, False, date.today() + timedelta(days=7)),
        (patients[2], BloodGroup.O_POSITIVE, 1, True, date.today() + timedelta(days=1)),
        (patients[3], BloodGroup.AB_POSITIVE, 1, False, date.today() + timedelta(days=5)),
        (patients[4], BloodGroup.B_NEGATIVE, 2, True, date.today()),
        (patients[5], BloodGroup.A_NEGATIVE, 1, True, date.today() + timedelta(days=2)),
    ]

    for patient, bg, units, emergency, req_by in blood_requests_data:
        blood_request = BloodRequest(
            patient_id=patient.id,
            blood_group=bg,
            units_required=units,
            is_emergency=emergency,
            required_by_date=req_by,
        )
        db.add(blood_request)
    db.flush()

    # Create some blood support circle entries
    from app.models.models import BloodSupportCircle
    # Support circle: Rahul Sharma (patient 0) with Amit Singh (donor 0)
    circle1 = BloodSupportCircle(patient_id=patients[0].id, donor_id=donors[0].id)
    circle2 = BloodSupportCircle(patient_id=patients[0].id, donor_id=donors[2].id)
    circle3 = BloodSupportCircle(patient_id=patients[2].id, donor_id=donors[2].id)
    db.add_all([circle1, circle2, circle3])

    db.commit()
    print("✅ Database seeded successfully!")
    print(f"   - {len(patients)} patients created")
    print(f"   - {len(donors)} donors created")
    print(f"   - {len(hospitals)} hospitals created")
    print(f"   - Admin: admin@thalassemia.org / admin123")
    print(f"   - Patient login: patient1@test.com / password")
    print(f"   - Donor login: donor1@test.com / password")

except Exception as e:
    db.rollback()
    print(f"❌ Error seeding database: {e}")
    raise
finally:
    db.close()