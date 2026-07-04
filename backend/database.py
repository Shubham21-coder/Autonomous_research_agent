import os
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import bcrypt
import jwt

# 1. Database Configuration
DATABASE_URL = "sqlite:///./autonomous_agent.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Security Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super_secret_agent_key_change_in_production")
ALGORITHM = "HS256"

# 3. ORM Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Links to the Memory Database 
    searches = relationship("SearchHistory", back_populates="owner")
    preferences = relationship("UserPreference", back_populates="owner")

class SearchHistory(Base):
    __tablename__ = "search_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    query = Column(String)
    result_path = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="searches")

class UserPreference(Base):
    """Stores learned ranking preferences to weight specific domains or sources higher."""
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    preferred_source = Column(String) # e.g., 'Arxiv', 'IIM Case Studies', 'Financial Times'
    weight = Column(Float, default=1.5) # ML multiplier for the cosine similarity matrix
    
    owner = relationship("User", back_populates="preferences")

Base.metadata.create_all(bind=engine)

# 4. Authentication Utilities
# --- Replaced Passlib with Native Bcrypt ---
def get_password_hash(password: str) -> str:
    # bcrypt requires bytes, so we encode the string
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    # Decode back to a standard string for database storage
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_byte_enc = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_byte_enc)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=1440))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)