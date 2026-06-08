from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

# This schema matches what the frontend sends during registration
class UserRegister(BaseModel):
    email: EmailStr
    password: str  # Plaintext password from frontend
    name: str
    treatment_phase: str  # e.g., "Post-Surgery", "Radiation", "Maintenance"
    diagnosis_date: Optional[datetime] = None

# This schema represents how data is stored inside MongoDB
class UserDB(BaseModel):
    email: EmailStr
    hashed_password: str  # NEVER store plaintext passwords
    name: str
    treatment_phase: str
    diagnosis_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# This schema is what we return back to the frontend (hiding the password)
class UserResponse(BaseModel):
    id: str = Field(alias="_id") # MongoDB uses string-based ObjectIds
    email: EmailStr
    name: str
    treatment_phase: str
    created_at: datetime

    class Config:
        populate_by_name = True