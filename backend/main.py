import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal
from app.models.models import User, UserRole, Patient, Donor
from app.services.auth import get_password_hash
from app.routes import auth, patient, donor, admin, chatbot

app = FastAPI(
    title="Thalassemia Coordination Platform API",
    description="Nationwide platform connecting Thalassemia patients, blood donors, hospitals, and administrators across India.",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://main.d2haxtphae6f08.amplifyapp.com/login", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(donor.router)
app.include_router(admin.router)
app.include_router(chatbot.router)


@app.on_event("startup")
def startup():
    """Create tables and seed initial data"""
    try:
        Base.metadata.create_all(bind=engine)
        print("[OK] Database tables created successfully")
    except Exception as e:
        print(f"[WARN] Database connection failed: {e}")
        print("Running in mock mode - database tables won't be created")
        print("To set up MySQL, update the DATABASE_URL in .env file")


@app.get("/")
def root():
    return {
        "name": "Thalassemia Coordination Platform API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "auth": "/api/auth/*",
            "patient": "/api/patient/*",
            "donor": "/api/donor/*",
            "admin": "/api/admin/*",
            "chatbot": "/api/chatbot/*",
        }
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Server is running"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)