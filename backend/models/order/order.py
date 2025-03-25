from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum
from abc import ABC, abstractmethod

class OrderSide(str, Enum):
    Buy = "Buy"
    Sell = "Sell"

class OrderType(str, Enum):
    Market = "Market"
    Limit = "Limit"

class OrderStatus(str, Enum):
    Pending = "pending"
    Filled = "filled"
    Partial = "partial"
    Cancelled = "cancelled"


# API 請求模型
class OrderRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    order_type: OrderType
    order_side: OrderSide
    stock_id: int
    quantity: int
    price: Optional[float] = None

# 基礎訂單模型
class OrderBase(BaseModel, ABC):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    order_id: Optional[int] = None
    stock_id: int
    quantity: int
    remaining_quantity: int
    order_side: OrderSide
    order_type: OrderType
    status: OrderStatus = OrderStatus.Pending
    created_at: datetime = Field(default_factory=datetime.now)

    def validate_order(self) -> List[Dict[str, str]]:
        """
        驗證訂單是否有效
        """
        errors = []
        if self.quantity <= 0:
            errors.append({
                "field": "quantity",
                "message": "數量必須大於0"
            })
        return errors


class MatchRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    buy_order: OrderBase
    sell_order: OrderBase
    quantity: int
    price: float
