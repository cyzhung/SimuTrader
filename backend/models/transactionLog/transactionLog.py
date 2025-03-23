from pydantic import BaseModel
from typing import Optional
class TransactionLog(BaseModel):
    event_type: str
    buy_order_id: int
    sell_order_id: int
    quantity: int
    price: float
    additional_info: Optional[str] = None