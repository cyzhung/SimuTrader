from typing import Dict, Any
from backend.repository.orderRepository import OrderRepository
from utils.errors import NotFoundError, ForbiddenError, ValidationError, OrderError
from backend.models.order.orderFactory import OrderFactory
from backend.services.orderbook.orderbookService import OrderBookService
from backend.models.order.order import OrderBase
from backend.database.database import Database
class OrderService:
    @staticmethod
    async def create_order(order_data: Dict[str, Any]) -> Any:
        """
        創建訂單
        
        Args:
            order_data: 訂單數據
            
        Returns:
            創建的訂單對象
            
        Raises:
            OrderError: 創建訂單失敗時
            ValidationError: 訂單驗證失敗時
        """
        try:
            async with Database.transaction() as client:
                order = await OrderFactory.create_order(order_data)
                validation_errors = order.validate_order()
                
                if validation_errors:
                    raise ValidationError(f"訂單驗證失敗: {validation_errors}")
                order_id = await OrderRepository.insert(order, client)
                order.order_id = order_id
            return order
            
        except Exception as error:
            raise error

    @staticmethod
    async def cancel_order(order_id: int, user_id: int) -> bool:
        """
        取消訂單
        
        Args:
            order_id: 訂單ID
            user_id: 用戶ID
            
        Returns:
            bool: 是否成功取消
            
        Raises:
            NotFoundError: 訂單不存在時
            ForbiddenError: 無權限時
            ValidationError: 訂單狀態不允許取消時
            OrderError: 取消訂單失敗時
        """
        try:
            orders = await OrderRepository.get({"order_id": order_id})

            if len(orders)==0:
                raise NotFoundError("訂單不存在")
            order = orders[0]
            if order["user_id"] != user_id:
                raise ForbiddenError("無權限取消此訂單")
            
            # 3. 從 OrderBook 中移除訂單
            await OrderBookService.remove_order(order_id)

            order = dict(order)

            # 4. 更新訂單狀態
            await OrderRepository.update(
                order['order_id'],
                {"status": "canceled"}
            )

            return True

        except Exception as error:
            raise OrderError(f"取消訂單失敗: {str(error)}")

    @staticmethod
    async def get_order_status(order_id: int, user_id: int) -> Dict[str, Any]:
        """
        獲取訂單狀態
        
        Args:
            order_id: 訂單ID
            user_id: 用戶ID
            
        Returns:
            Dict[str, Any]: 訂單狀態信息
            
        Raises:
            NotFoundError: 訂單不存在時
            ForbiddenError: 無權限時
            OrderError: 獲取狀態失敗時
        """
        try:
            order_result = await OrderRepository.get({"order_id": order_id})
            if not order_result.rows:
                raise NotFoundError("訂單不存在")

            order = order_result.rows[0]
            if order["user_id"] != user_id:
                raise ForbiddenError("無權限查看此訂單")

            return {
                "order_id": order_id,
                "status": order["status"],
                "filled_quantity": order["quantity"] - order["remaining_quantity"],
                "remaining_quantity": order["remaining_quantity"],
                "price": order["price"],
                "created_at": order["created_at"]
            }

        except Exception as error:
            raise OrderError(f"獲取訂單狀態失敗: {str(error)}")