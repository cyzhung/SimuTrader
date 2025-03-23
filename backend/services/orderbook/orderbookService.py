import os
import dotenv

from typing import Optional, Any, Dict, List
from backend.models.orderbook.priorityQueueOrderbook import PriorityQueueOrderBook
from backend.models.orderbook.databaseOrderbook import DatabaseOrderBook
from backend.utils.errors import OrderError
from backend.models.orderbook.orderbook import OrderBook
from backend.repository.orderRepository import OrderRepository
from backend.models.order.order import OrderBase, OrderStatus, OrderSide

dotenv.load_dotenv()

class OrderBookService:
    _orderBook: PriorityQueueOrderBook = None
    @classmethod
    async def initialize(cls) -> None:
        """
        初始化訂單簿服務
        
        Raises:
            OrderError: 初始化失敗時
        """
        if not cls._orderBook:
            cls._orderBook = (
                PriorityQueueOrderBook.get_instance() 
                if os.getenv("ORDER_BOOK") == "PriorityQueue"
                else DatabaseOrderBook.get_instance()
            )
            await cls._orderBook.initialize()

    @classmethod
    async def add_order(cls, order: Any) -> None:
        """
        添加訂單到訂單簿
        
        Args:
            order: 要添加的訂單
            
        Raises:
            OrderError: 訂單處理失敗時
        """
        try:
            if not cls._orderBook:
                await cls.initialize()
            cls._orderBook.add_order(order)
        except Exception as error:
            raise OrderError(f"訂單處理失敗: {str(error)}")

    @classmethod
    async def remove_order(cls, order_id: int) -> None:
        """
        從訂單簿中移除訂單
        
        Args:
            order_id: 要移除的訂單ID
            
        Raises:
            OrderError: 訂單處理失敗時
        """
        try:
            if not cls._orderBook:
                await cls.initialize()
            cls._orderBook.remove_order(order_id)
        except Exception as error:
            raise OrderError(f"訂單處理失敗: {str(error)}")

    @classmethod
    def get_lowest_sell_order(cls, stock_id: int) -> Any:
        """
        獲取指定股票的最低賣單
        
        Args:
            stock_id: 股票ID
            
        Returns:
            最低賣單
            
        Raises:
            OrderError: OrderBook未初始化時
        """
        if not cls._orderBook:
            raise OrderError("OrderBook 未初始化")
        return cls._orderBook.get_lowest_sell_order(stock_id)

    @classmethod
    def get_highest_buy_order(cls, stock_id: int) -> Any:
        """
        獲取指定股票的最高買單
        
        Args:
            stock_id: 股票ID
            
        Returns:
            最高買單
            
        Raises:
            OrderError: OrderBook未初始化時
        """
        if not cls._orderBook:
            raise OrderError("OrderBook 未初始化")
        return cls._orderBook.get_highest_buy_order(stock_id)

    @classmethod
    def get_order_book(cls, stock_id: str) -> OrderBook:
        """
        獲取訂單簿實例
        
        Returns:
            訂單簿實例
            
        Raises:
            OrderError: OrderBook未初始化時
        """
        return cls._orderBook.get_order_queues(stock_id)

    @classmethod
    async def update_user_holdings(cls, order_id: int, transaction_data: dict) -> Any:
        """
        更新用戶持倉
        
        Args:
            order_id: 訂單ID
            transaction_data: 交易數據
            
        Returns:
            更新結果
        """
        return await cls._orderBook.update_user_holdings(order_id, transaction_data)
    
    @classmethod
    async def get_pending_orders(cls) -> List[OrderBase]:
        """
        獲取所有待搓合的訂單
        
        Returns: List[BaseOrder]
        """
        if not cls._orderBook:
            raise OrderError("OrderBook 未初始化")
        orders = await OrderRepository.get({"status": OrderStatus.Pending, "order_side": OrderSide.Buy})
        return [cls._orderBook.get_order(order["order_id"]) for order in orders]
