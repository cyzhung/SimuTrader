from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional

class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    email: str
    username: Optional[str] = None
    role: Optional[str] = "user"
    is_active: Optional[bool] = True

# 請求和響應模型
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator('password')
    def password_length(cls, v):
        if len(v) < 8:
            raise ValueError('密碼長度必須至少8個字符')
        return v

class RepositoryUser(BaseModel):
    email: EmailStr
    password_hash: str
    username: str
    role: str = "user"

class RegisterRequest(LoginRequest):
    username: str

class UserResponse(BaseModel):
    success: bool
    data: User

