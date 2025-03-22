from typing import Dict, Any, Union
from .limitOrder import LimitOrder
from .marketOrder import MarketOrder
from backend.repository.stocksRepository import StockRepository
from backend.utils.errors import ValidationError
from backend.models.order.order import OrderSide
class OrderFactory:
    @staticmethod
    async def create_order(order_info: Dict[str, Any]) -> Union[LimitOrder, MarketOrder]:
        """
        根據訂單信息創建適當類型的訂單
        
        Args:
            order_info: 訂單信息字典，包含訂單的所有必要信息
            
        Returns:
            Union[LimitOrder, MarketOrder]: 創建的訂單對象
            
        Raises:
            ValidationError: 當股票不存在時
            
        Note:
            如果提供了價格，創建限價單；否則創建市價單
            如果沒有提供 stock_id，會根據 stock_symbol 查詢
        """
        # 如果沒有 stock_id，根據 stock_symbol 查詢
        if not order_info.stock_id:
            stock_result = await StockRepository.get({
                "stock_symbol": order_info.stock_symbol
            })
            
            if not stock_result:
                raise ValidationError("股票不存在")
                
            order_info["stock_id"] = stock_result[0]["stock_id"]

        # 根據是否有價格決定創建何種訂單
        if "price" in order_info and order_info["price"] is not None:
            return LimitOrder(order_info)
        else:
            print(order_info)
            return MarketOrder(order_info)
