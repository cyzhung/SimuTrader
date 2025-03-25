from backend.repository.userPositionRepository import UserPositionRepository
from backend.models.order.order import OrderSide, OrderBase, MatchRecord
from backend.models.userPosition.userPosition import UserPosition
from typing import List

class UserPositionService:   #倉位
    @classmethod
    async def update_positions(cls, match_record: MatchRecord):
        """更新買賣雙方的持股數量"""

        buy_order = match_record.buy_order
        sell_order = match_record.sell_order
        # 更新買方持股（增加）
        buy_user_position = await UserPositionRepository.get({
            'user_id':buy_order.user_id,
            'stock_id':buy_order.stock_id,
        })
        if buy_user_position:
            await UserPositionRepository.update(
                buy_user_position['position_id'],
                {
                'quantity':buy_user_position['quantity'] + match_record.quantity,
                }
            )
        else:
            await UserPositionRepository.insert(
                UserPosition(
                    user_id=buy_order.user_id,
                    stock_id=buy_order.stock_id,
                    quantity=match_record.quantity,
                    avg_price=match_record.price
                )
            )
        
        # 更新賣方持股（減少）
        await UserPositionRepository.update(
            sell_order.user_id,
            {
            'stock_id':sell_order.stock_id,
            'quantity':sell_order.quantity - match_record.quantity,
            }
        )