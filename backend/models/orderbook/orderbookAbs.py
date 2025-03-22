from abc import ABC, abstractmethod
from typing import Any

class OrderBookAbstract(ABC):
    """
    訂單簿抽象基類
    
    定義了訂單簿的基本接口，所有具體的訂單簿實現都應該繼承此類
    """
    
    def __init__(self):
        """
        初始化訂單簿
        
        Raises:
            TypeError: 當嘗試直接實例化此抽象類時
        """
        if self.__class__ == OrderBookAbstract:
            raise TypeError("Abstract Class cannot be instantiated directly.")

    @abstractmethod
    async def add_order(self, order: Any) -> None:
        """
        添加訂單到訂單簿
        
        Args:
            order: 要添加的訂單
            
        Raises:
            NotImplementedError: 當子類沒有實現此方法時
        """
        raise NotImplementedError("add_order() must be implemented in derived classes.")

    @abstractmethod
    async def delete_order(self, order_id: int, user_id: int) -> None:
        """
        從訂單簿中刪除訂單
        
        Args:
            order_id: 訂單ID
            user_id: 用戶ID
            
        Raises:
            NotImplementedError: 當子類沒有實現此方法時
        """
        raise NotImplementedError("delete_order() must be implemented in derived classes.")

    @abstractmethod
    async def initialize(self) -> None:
        """
        初始化訂單簿
        
        Raises:
            NotImplementedError: 當子類沒有實現此方法時
        """
        raise NotImplementedError("initialize() must be implemented in derived classes.")

    @abstractmethod
    def get_lowest_sell_order(self, stock_id: int) -> Any:
        """
        獲取最低賣單
        
        Args:
            stock_id: 股票ID
            
        Returns:
            最低賣單
            
        Raises:
            NotImplementedError: 當子類沒有實現此方法時
        """
        raise NotImplementedError("get_lowest_sell_order() must be implemented in derived classes.")

    @abstractmethod
    def get_highest_buy_order(self, stock_id: int) -> Any:
        """
        獲取最高買單
        
        Args:
            stock_id: 股票ID
            
        Returns:
            最高買單
            
        Raises:
            NotImplementedError: 當子類沒有實現此方法時
        """
        raise NotImplementedError("get_highest_buy_order() must be implemented in derived classes.")