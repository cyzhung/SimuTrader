from typing import List, Any, Optional
from backend.models.orderbook.orderbookAbs import OrderBookAbstract
from backend.repository.orderRepository import OrderRepository
from backend.utils.errors import OrderError

from backend.utils.errors import OrderError

class DatabaseOrderBook(OrderBookAbstract):
    """
    基於數據庫的訂單簿實現
    
    此實現將訂單存儲在數據庫中，並使用數據庫進行訂單匹配
    """
    
    def __init__(self):
        """初始化數據庫訂單簿"""
        super().__init__()
        self.buy_order_list: List[Any] = []

    async def add_order(self, order: Any) -> None:
        """
        添加訂單到訂單簿
        
        Args:
            order: 要添加的訂單
            
        Returns:
            None
            
        Raises:
            OrderError: 訂單處理失敗時
        """
        try:
            # 嘗試匹配訂單
            is_matched = await self.match_order(order)
            if not is_matched:
                self.buy_order_list.append(order)
        except Exception as error:
            raise OrderError(f"添加訂單失敗: {str(error)}")
    async def initialize(self) -> None:
        """
        初始化訂單簿
        
        從數據庫加載現有訂單
        
        Raises:
            OrderError: 初始化失敗時
        """
        try:
            # 從數據庫加載訂單
            orders = await DatabaseUtils.get_active_orders()
            self.buy_order_list = orders.rows
        except Exception as error:
            raise OrderError(f"訂單簿初始化失敗: {str(error)}")

    def get_order_count(self) -> dict[str, int]:
        """
        獲取訂單數量
        
        Returns:
            dict[str, int]: 包含訂單數量的字典
        """
        return {"totalOrders": len(self.buy_order_list)}

    def clear_order_book(self) -> None:
        """清空訂單簿（僅用於測試）"""
        self.buy_order_list.clear()

    async def remove_order(self, order_id: int) -> None:
        """
        移除訂單
        
        Args:
            order_id: 要移除的訂單ID
            
        Raises:
            OrderError: 訂單不存在或移除失敗時
        """
        try:
            # 從數據庫中移除訂單
            await DatabaseRepository.remove_order(order_id)
            # 從內存中移除訂單
            self.buy_order_list = [
                order for order in self.buy_order_list 
                if order.order_id != order_id
            ]
        except Exception as error:
            raise OrderError(f"移除訂單失敗: {str(error)}")

    async def get_lowest_sell_order(self, stock_id: int) -> Optional[Any]:
        """
        獲取最低賣單
        
        Args:
            stock_id: 股票ID
            
        Returns:
            Optional[Any]: 最低賣單或None
            
        Raises:
            OrderError: 查詢失敗時
        """
        try:
            result = await DatabaseUtils.get_lowest_sell_order(stock_id)
            return result.rows[0] if result.rows else None
        except Exception as error:
            raise OrderError(f"獲取最低賣單失敗: {str(error)}")

    async def get_highest_buy_order(self, stock_id: int) -> Optional[Any]:
        """
        獲取最高買單
        
        Args:
            stock_id: 股票ID
            
        Returns:
            Optional[Any]: 最高買單或None
            
        Raises:
            OrderError: 查詢失敗時
        """
        try:
            result = await DatabaseUtils.get_highest_buy_order(stock_id)
            return result.rows[0] if result.rows else None
        except Exception as error:
            raise OrderError(f"獲取最高買單失敗: {str(error)}")