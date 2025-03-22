from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from backend.models.order.order import OrderSide, OrderType, OrderRequest
from backend.models.order.limitOrder import LimitOrder
from backend.repository.orderRepository import OrderRepository
from backend.models.user.user import User
from backend.services.auth.authService import AuthService
from backend.services.transaction.transactionService import TransactionService
from backend.services.order.orderController import OrderController
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
    
@router.post("/createLimitOrder")
async def createLimitOrder(
    request: OrderRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        #創建訂單
        orderInfo = LimitOrder(
            user_id=current_user.user_id,
            stock_id=request.stock_id,
            quantity=request.quantity,
            remaining_quantity=request.quantity,
            price=request.price,
            order_side=OrderSide.Buy,
            order_type=OrderType.Limit
        )
        result = await OrderController.create_order(orderInfo)

        # 加入至訂單簿
        await OrderBookService.add_order(result)

        return {
            "success": True,
            "message": f"成功建立買單",
            "data": result
        }
    except Exception as error:
        print('Error during buy operation:', str(error))
        raise  error

@router.post("/createSellOrder")
async def create_sell_order(
    request: OrderRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        result = await TransactionService.create_sell_transaction({
            "user_id": current_user.user_id,
            "stock_symbol": request.stock_symbol,
            "quantity": request.quantity,
            "price": request.price if request.price is not None else float('-inf'),
            "order_side": "Sell",
            "order_type": "Market" if request.price is None else "Limit"
        })

        return {
            "success": True,
            "message": f"成功建立賣單 {request.stock_symbol}",
            "data": result
        }
    except Exception as error:
        print('Error during sell operation:', str(error))
        raise 