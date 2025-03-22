from pydantic import BaseModel
from typing import Optional, Dict

class AuthResponse(BaseModel):
    success: bool
    data: Optional[Dict] = None
    message: Optional[str] = None
