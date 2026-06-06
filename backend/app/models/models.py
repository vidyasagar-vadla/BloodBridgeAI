from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, Text, ForeignKey, Enum as SqlEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DONOR = "donor"
    ADMIN = "admin"


class BloodGroup(str, enum.Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"


class ThalassemiaType(str, enum.Enum):
    ALPHA_MAJOR = "Alpha Thalassemia Major"
    ALPHA_INTERMEDIA = "Alpha Thalassemia Intermedia"
    ALPHA_MINOR = "Alpha Thalassemia Minor"
    BETA_MAJOR = "Beta Thalassemia Major"
    BETA_INTERMEDIA = "Beta Thalassemia Intermedia"
    BETA_MINOR = "Beta Thalassemia Minor"


class RequestStatus(str, enum.Enum):
    REQUEST_SENT = "Request Sent"
    ACCEPTED = "Accepted"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class DonorAvailability(str, enum.Enum):
    AVAILABLE_NOW = "Available Now"
    AVAILABLE_WEEK = "Available This Week"
    EMERGENCY_ONLY = "Emergency Only"
    NOT_AVAILABLE = "Not Available"


class NotificationType(str, enum.Enum):
    SMS = "sms"
    EMAIL = "email"
    PUSH = "push"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(SqlEnum(UserRole))
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="user", uselist=False)
    donor = relationship("Donor", back_populates="user", uselist=False)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    full_name = Column(String(255))
    age = Column(Integer)
    gender = Column(String(50))
    mobile = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    emergency_contact = Column(String(20))
    blood_group = Column(SqlEnum(BloodGroup))
    thalassemia_type = Column(SqlEnum(ThalassemiaType))
    hemoglobin_level = Column(Float)
    ferritin_level = Column(Float)
    weight = Column(Float)
    last_transfusion_date = Column(Date)
    transfusion_interval = Column(Integer)  # in days
    hospital_name = Column(String(255))
    doctor_name = Column(String(255))
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="patient")
    blood_requests = relationship("BloodRequest", back_populates="patient")
    chat_messages = relationship("ChatMessage", back_populates="patient")
    notifications = relationship("Notification", back_populates="patient")


class Donor(Base):
    __tablename__ = "donors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    full_name = Column(String(255))
    age = Column(Integer)
    gender = Column(String(50))
    blood_group = Column(SqlEnum(BloodGroup))
    mobile = Column(String(20))
    email = Column(String(255))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    last_donation_date = Column(Date, nullable=True)
    availability = Column(SqlEnum(DonorAvailability), default=DonorAvailability.AVAILABLE_NOW)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    reliability_score = Column(Integer, default=100)  # mock score 0-100
    total_donations = Column(Integer, default=0)
    patients_supported = Column(Integer, default=0)
    emergency_donations = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="donor")
    chat_messages = relationship("ChatMessage", back_populates="donor")
    notifications = relationship("Notification", back_populates="donor")
    blood_support_circles = relationship("BloodSupportCircle", back_populates="donor")


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    phone = Column(String(20))
    email = Column(String(255))
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    blood_group = Column(SqlEnum(BloodGroup))
    units_required = Column(Integer, default=1)
    is_emergency = Column(Boolean, default=False)
    status = Column(SqlEnum(RequestStatus), default=RequestStatus.REQUEST_SENT)
    request_date = Column(DateTime(timezone=True), server_default=func.now())
    required_by_date = Column(Date)
    notes = Column(Text, nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)

    patient = relationship("Patient", back_populates="blood_requests")
    hospital = relationship("Hospital")
    request_assignments = relationship("RequestAssignment", back_populates="blood_request")
    tracking = relationship("RequestTracking", back_populates="blood_request")


class RequestAssignment(Base):
    __tablename__ = "request_assignments"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("blood_requests.id"))
    donor_id = Column(Integer, ForeignKey("donors.id"))
    status = Column(String(50), default="pending")  # pending, accepted, rejected, completed
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)

    blood_request = relationship("BloodRequest", back_populates="request_assignments")
    donor = relationship("Donor")


class RequestTracking(Base):
    __tablename__ = "request_tracking"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("blood_requests.id"))
    status = Column(String(100))
    location = Column(String(255), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    blood_request = relationship("BloodRequest", back_populates="tracking")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    donor_id = Column(Integer, ForeignKey("donors.id"))
    sender_role = Column(String(50))  # patient or donor
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="chat_messages")
    donor = relationship("Donor", back_populates="chat_messages")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    donor_id = Column(Integer, ForeignKey("donors.id"), nullable=True)
    title = Column(String(255))
    message = Column(Text)
    notification_type = Column(SqlEnum(NotificationType), default=NotificationType.PUSH)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="notifications")
    donor = relationship("Donor", back_populates="notifications")


class BloodSupportCircle(Base):
    __tablename__ = "blood_support_circles"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    donor_id = Column(Integer, ForeignKey("donors.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    donor = relationship("Donor", back_populates="blood_support_circles")
    patient = relationship("Patient")


class ChatbotConversation(Base):
    __tablename__ = "chatbot_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_role = Column(String(50))
    message = Column(Text)
    response = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AchievementBadge(Base):
    __tablename__ = "achievement_badges"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("donors.id"))
    badge_name = Column(String(255))
    badge_description = Column(Text)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())