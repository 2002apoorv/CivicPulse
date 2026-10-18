from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from server.app.models.user import UserRole

class UserBase(BaseModel):
    email: str = Field(..., pattern=r"^[\w\.\+\-]+@[a-zA-Z0-9\.\-]+\.[a-zA-Z0-9]{2,}$")
    full_name: str = Field(..., min_length=2, max_length=255)
    phone_number: Optional[str] = None
    role: UserRole = UserRole.CITIZEN

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)
    department_id: Optional[int] = None

class UserLogin(BaseModel):
    email: str = Field(..., pattern=r"^[\w\.\+\-]+@[a-zA-Z0-9\.\-]+\.[a-zA-Z0-9]{2,}$")
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: Optional[bool] = None
    department_id: Optional[int] = None
    role: Optional[UserRole] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    phone_number: Optional[str] = None
    is_active: bool
    department_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
