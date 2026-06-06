import os
from dotenv import load_dotenv

load_dotenv()

# Try MySQL first, fallback to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    try:
        import mysql.connector
        DATABASE_URL = "mysql+mysqlconnector://root:password@localhost:3306/thalassemia"
    except:
        DATABASE_URL = "sqlite:///./thalassemia.db"
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-abc123xyz")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
