from fastapi import APIRouter, Depends, Response
from typing import Optional
from backend.models.order.order import OrderSide, OrderType, OrderRequest
from backend.repository.orderRepository import OrderRepository

from backend.models.user.user import User
from backend.services.auth.authService import AuthService
from backend.services.transaction.transactionService import TransactionService
from backend.services.order.orderService import OrderService
from backend.services.orderbook.orderbookService import OrderBookService
router = APIRouter()
get_current_user = AuthService.get_current_user_dependency




@router.get("/search")
async def search_orders(
    current_user: User = Depends(get_current_user),
    order_id: Optional[int] = None,
    stock_id: Optional[int] = None,
    order_type: Optional[str] = None
):
    try:
        filters = {
            "user_id": current_user.user_id,
            "order_id": order_id,
            "stock_id": stock_id,
            "order_type": order_type
        }
        # 移除 None 值的過濾條件
        filters = {k: v for k, v in filters.items() if v is not None}
        
        orders = await OrderRepository.get(filters=filters)
        return {"message": orders}
    except Exception as error:
        print('Error during search operation:', str(error))
        raise error
    
@router.post("/createOrder")
async def createLimitOrder(
    request: OrderRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        #創建訂單
        orderInfo = {
            'user_id': current_user.user_id,
            'stock_id': request.stock_id,
            'quantity': request.quantity,
            'remaining_quantity': request.quantity,
            'price': request.price if request.order_type == 'Limit' else None,
            'order_side': OrderSide.Buy if request.order_side == 'Buy' else OrderSide.Sell,
            'order_type': OrderType.Limit if request.order_type == 'Limit' else OrderType.Market
        }
        order = await OrderService.create_order(orderInfo)  

        # 加入至訂單簿
        await OrderBookService.add_order(order)

        return {
            "success": True,
            "message": f"成功建立訂單",
            "data": order
        }
    except Exception as error:
        print('Error during buy operation:', str(error))
        raise  error


@router.post("/cancelOrder")
async def cancel_order(
    request: dict,
    current_user: User = Depends(get_current_user),
):
    try:
        await OrderService.cancel_order(request['order_id'], current_user.user_id)
        return {
            "success": True,
            "message": f"成功取消訂單 {request['order_id']}"
        }
    except Exception as error:
        print('Error during cancel operation:', str(error))
        raise error
    

