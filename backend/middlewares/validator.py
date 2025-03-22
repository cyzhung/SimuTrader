from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class RequestSchema(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)

def validate_request(data: dict, schema: RequestSchema):
    """
    驗證請求數據是否符合 Pydantic 定義的格式
    """
    return schema(**data)
