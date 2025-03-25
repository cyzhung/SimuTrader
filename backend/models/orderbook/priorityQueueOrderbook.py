from typing import Dict, Any, Optional, Mapping
from backend.utils.priorityQueue import PriorityQueue
from backend.models.order.order import  OrderSide, OrderType, OrderBase
from backend.models.orderbook.orderbookAbs import OrderBookAbstract
from backend.models.order.orderFactory import OrderFactory
from backend.repository.orderRepository import OrderRepository
from backend.utils.errors import OrderError
from backend.models.order.order import OrderStatus
class PriorityQueueOrderBook(OrderBookAbstract):
    _instance: Optional['PriorityQueueOrderBook'] = None
    
    def __init__(self):
        """
        初始化優先隊列訂單簿
        """
        super().__init__()
        self.order_books: Dict[int, Dict[str, PriorityQueue]] = {}  # stock_id -> {buyQueue, sellQueue}
        self.order_map: Dict[int, OrderBase] = {}  # order_id -> OrderBase (reference)
        self.market_orders: Dict[int, list[OrderBase]] = {}  # stock_id -> [OrderBase]
    @classmethod
    def get_instance(cls) -> 'PriorityQueueOrderBook':
        """
        獲取單例實例
        
        Returns:
            PriorityQueueOrderBook: 訂單簿實例
        """
        if not cls._instance:
            cls._instance = PriorityQueueOrderBook()
        return cls._instance

    def _get_order_queues(self, stock_id: int) -> Dict[str, PriorityQueue]:
        """
        獲取或創建特定股票的訂單隊列
        
        Args:
            stock_id: 股票ID
            
        Returns:
            Dict[str, PriorityQueue]: 包含買賣隊列的字典
        """
        if stock_id not in self.order_books:
            self.order_books[stock_id] = {
                "buyQueue": PriorityQueue(is_max_heap=True),
                "sellQueue": PriorityQueue(is_max_heap=False)
            }
        return self.order_books[stock_id]

    def add_order(self, order: Any) -> None:
        """
        添加訂單到訂單簿
        
        Args:
            order: 要添加的訂單
            
        Raises:
            OrderError: 訂單處理失敗時
        """
        try:
            if order.order_type == OrderType.Market:
                self.market_orders[order.stock_id] = self.market_orders.get(order.stock_id, [])
                self.market_orders[order.stock_id].append(order)
                self.order_map[order.order_id] = order
            else:
                queues = self._get_order_queues(order.stock_id)
                if order.order_side == "Buy":
                    queues["buyQueue"].enqueue(order)
                else:
                    queues["sellQueue"].enqueue(order)
                self.order_map[order.order_id] = order
        except Exception as error:
            raise OrderError(f"訂單處理失敗: {str(error)}")

    async def initialize(self) -> None:
        """
        初始化訂單簿，從交易日誌重建訂單狀態
        
        Raises:
            OrderError: 初始化失敗時
        """
        try:
            pending_orders = await OrderRepository.get({"status": OrderStatus.Pending})
            partial_orders = await OrderRepository.get({"status": OrderStatus.Partial})

            activate_orders = pending_orders + partial_orders

            for order in activate_orders:
                order = await OrderFactory.create_order(order)
                if(order.status != OrderStatus.Cancelled and order.status != OrderStatus.Filled):
                    self.add_order(order)

        except Exception as error:
            print(f"Error initializing OrderBook: {error}")
            raise OrderError(f"OrderBook 初始化失敗: {str(error)}")

    def get_order(self, order_id: int) -> OrderBase:
        """
        獲取指定訂單ID的訂單
        
        Args:
            order_id: 訂單ID
        """
        if order_id not in self.order_map:
            raise OrderError("訂單不存在")
        return self.order_map.get(order_id)
    
    def clear_order_book(self) -> None:
        """清空所有訂單（僅用於測試）"""
        for queues in self.order_books.values():
            queues["buyQueue"].clear()
            queues["sellQueue"].clear()

    def get_order_count(self) -> Dict[str, int]:
        """
        獲取當前訂單數量（用於測試驗證）
        
        Returns:
            Dict[str, int]: 包含總訂單數的字典
        """
        total_orders = sum(
            queues["buyQueue"].size() + queues["sellQueue"].size()
            for queues in self.order_books.values()
        )
        return {"totalOrders": total_orders}

    def remove_order(self, order_id: int) -> None:
        """
        從訂單簿中移除訂單
        
        Args:
            order_id: 要移除的訂單ID
            
        Raises:
            OrderError: 訂單不存在時
        """
        order = self.order_map.get(order_id)

        if not order:
            raise OrderError("訂單不存在")

        order.status = "cancelled"
        self.order_map.pop(order_id, None)
        
    def get_order_queues(self, stock_id: int) -> Dict[str, PriorityQueue]:
        """
        獲取指定股票的訂單隊列
        
        Args:
            stock_id: 股票ID
            
        Returns:
            Dict[str, PriorityQueue]: 包含買賣隊列的字典
        """
        return self._get_order_queues(stock_id)

    def update_user_order_state(
        self, 
        order_id: int, 
        transaction_data: Dict[str, Any]
    ) -> None:
        """
        更新用戶訂單狀態
        
        Args:
            order_id: 訂單ID
            transaction_data: 交易數據
            
        Raises:
            OrderError: 訂單不存在時
        """
        order = self.order_map.get(order_id)
        if not order:
            raise OrderError("訂單不存在")

        order.remaining_quantity -= transaction_data["transaction_quantity"]
        if order.remaining_quantity == 0:
            order.status = "filled"
            self.order_map.pop(order_id, None)
        elif order.remaining_quantity != order.quantity:
            order.status = "partial"
            self.add_order(order)

    def get_lowest_sell_order(self, stock_id: int) -> Optional[Any]:
        """
        獲取最低賣單
        
        Args:
            stock_id: 股票ID
            
        Returns:
            Optional[Any]: 最低賣單或None
        """
        queues = self._get_order_queues(stock_id)
        if queues["sellQueue"].isEmpty():
            return None
        while(queues["sellQueue"].get_top().status == OrderStatus.Cancelled):
            queues["sellQueue"].dequeue()
        return queues["sellQueue"].get_top()

    def get_highest_buy_order(self, stock_id: int) -> Optional[Any]:
        """
        獲取最高買單
        
        Args:
            stock_id: 股票ID
            
        Returns:
            Optional[Any]: 最高買單或None
        """
        queues = self._get_order_queues(stock_id)
        if queues["buyQueue"].isEmpty():
            return None
        while(queues["buyQueue"].get_top().status == OrderStatus.Cancelled):
            queues["buyQueue"].dequeue()
        return queues["buyQueue"].get_top()

    
    def delete_order(self, order_id: int) -> None:
        """
        從訂單簿中刪除訂單
        
        Args:
            order_id: 訂單ID
        """
        order = self.order_map.get(order_id)

        if not order:
            raise OrderError("訂單不存在")

        order.status = "cancelled"
        self.order_map.pop(order_id, None)

