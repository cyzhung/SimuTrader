from typing import Any
from fastapi import Response
from backend.database.database import Database
from backend.services.order.orderService import OrderService
from backend.models.order.order import OrderBase
from backend.models.user.user import User
from backend.repository.orderRepository import OrderRepository
from backend.services.orderbook.orderbookService import OrderBookService
from backend.utils.errors import ForbiddenError, ValidationError

class OrderController:
    @staticmethod
    async def create_order(orderInfo: dict[str, Any]):
        try:
            async with Database.transaction() as client:
                
                order_id = await OrderRepository.insert(orderInfo, client)
                orderInfo.order_id = order_id
                order = await OrderService.create_order(orderInfo)
                print(order)
            return order
        except Exception as e:
            raise e
    
    @staticmethod
    async def cancel_order(order_data: OrderBase, response: Response):
        try:
            order = await OrderRepository.get(order_id=order_data.order_id, user_id=order_data.user_id)
            if not order:
                raise ValueError("Order not found")
            token = response.headers.get("Authorization")
            if token is None:
                raise ForbiddenError("無權限取消此訂單")
            user_id = token.split(" ")[1]
            
            if order["user_id"] != user_id:
                raise ForbiddenError("無權限取消此訂單")

            # 2. 檢查訂單是否可以取消
            if order["status"] not in ["pending", "partial"]:
                raise ValidationError("訂單狀態不允許取消")
            
            await OrderRepository.delete(order_id=order, user_id=order_data.user_id)
            await OrderService.cancel_order(order_id=order, user_id=order_data.user_id)
        except Exception as e:
            raise e
    
    @staticmethod
    async def get_order_status(order_id: int, user_id: int):
        return await OrderService.get_order_status(order_id, user_id)
    
