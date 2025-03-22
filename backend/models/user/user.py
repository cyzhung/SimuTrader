from pydantic import BaseModel, EmailStr, validator
from typing import Optional

class User(BaseModel):
    user_id: int
    email: str
    username: Optional[str] = None
    role: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True  # 允許從 ORM 模型創建

# 請求和響應模型
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @validator('password')
    def password_length(cls, v):
        if len(v) < 8:
            raise ValueError('密碼長度必須至少8個字符')
        return v

class RegisterRequest(LoginRequest):
    username: str

class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    # 不包含密碼欄位，確保安全性
    class Config:
        from_attributes = True