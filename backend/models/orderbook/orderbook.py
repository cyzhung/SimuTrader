from typing import Optional, Dict, Any

class OrderBook:
    def __init__(self, stock_id: str):
        self.stock_id = stock_id
        self.buy_orders = []
        self.sell_orders = []

    async def get_lowest_sell_order(self, stock_id: str) -> Optional[Dict[str, Any]]:
        # TODO: 實現獲取最低賣單邏輯
        if self.sell_orders:
            return min(self.sell_orders, key=lambda x: x.price)
        return None

    async def get_highest_buy_order(self, stock_id: str) -> Optional[Dict[str, Any]]:
        # TODO: 實現獲取最高買單邏輯
        if self.buy_orders:
            return max(self.buy_orders, key=lambda x: x.price)
        return None

    async def update_user_order_state(self, order_id: str, transaction: dict):
        # TODO: 實現更新訂單狀態邏輯
        pass 