from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from backend.services.transaction.transactionService import TransactionService
from backend.models.user.user import User
from backend.services.auth.authService import AuthService

router = APIRouter()
get_current_user = AuthService.get_current_user_dependency

class TransactionRequest(BaseModel):
    stock_symbol: str
    quantity: int
    price: Optional[float] = None

@router.post("/buy")
async def create_buy_order(
    request: TransactionRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        result = await TransactionService.create_buy_transaction({
            "user_id": current_user.user_id,
            "stock_symbol": request.stock_symbol,
            "quantity": request.quantity,
            "price": request.price if request.price is not None else float('inf'),
            "order_side": "Buy",
            "order_type": "Market" if request.price is None else "Limit"
        })

        return {
            "success": True,
            "message": f"成功建立買單 {request.stock_symbol}",
            "data": result
        }
    except Exception as error:
        print('Error during buy operation:', str(error))
        raise 

@router.post("/sell")
async def create_sell_order(
    request: TransactionRequest,
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