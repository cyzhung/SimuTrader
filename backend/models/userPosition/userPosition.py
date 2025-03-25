from pydantic import BaseModel

class UserPosition(BaseModel):
    user_id: int
    stock_id: int
    quantity: int
    avg_price: float