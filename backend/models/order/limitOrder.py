from typing import List, Dict, Any
from backend.models.order.order import OrderType, OrderBase
# 限價單
class LimitOrder(OrderBase):
    order_type: OrderType = OrderType.Limit
    price: float

    def validate_order(self) -> List[Dict[str, str]]:
        errors = super().validate_order()
        if self.price <= 0:
            errors.append({
                "field": "price",
                "message": "價格必須大於0"
            })
        return errors

    async def match(self) -> List[Dict[str, Any]]:
        # 實現限價單撮合邏輯
        pass
