from typing import List, Dict, Any
from backend.models.order.order import OrderType, OrderBase

class MarketOrder(OrderBase):
    order_type: OrderType = OrderType.Market

    async def match(self) -> List[Dict[str, Any]]:
        # 實現市價單撮合邏輯
        pass


