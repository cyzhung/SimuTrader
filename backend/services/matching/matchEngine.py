from typing import List, Dict, Any, Optional
from backend.models.order.order import OrderSide, OrderType, OrderStatus, OrderBase
from backend.services.orderbook.orderbookService import OrderBookService
from backend.repository.orderRepository import OrderRepository
from backend.utils.errors import MatchingError
from backend.models.order.order import MatchRecord
class MatchEngine:
    """撮合引擎，負責訂單的撮合邏輯"""
    @classmethod
    async def match_market_order(cls, order: OrderBase) -> List[Dict[str, Any]]:
        """
        市價單撮合
        立即以當前最優價格成交
        """
        try:
            matches = []
            remaining_quantity = order.quantity

            while remaining_quantity > 0:
                # 獲取對手方最優價格訂單
                opposite_order = (
                    OrderBookService.get_lowest_sell_order(order.stock_id)
                    if order.order_side == OrderSide.Buy
                    else OrderBookService.get_highest_buy_order(order.stock_id)
                )

                if not opposite_order:
                    raise MatchingError("沒有可撮合的訂單")
                if order.status == OrderStatus.Pending:
                    order.status = OrderStatus.Partial
                    await OrderRepository.update(order.order_id, {"status": order.status})
                # 計算成交數量
                match_quantity = min(
                    remaining_quantity,
                    opposite_order.remaining_quantity
                )

                # 記錄成交
                match_record = MatchRecord(
                    buy_order = order,
                    sell_order = opposite_order,
                    quantity = match_quantity,
                    price = opposite_order.price
                )
                matches.append(match_record)

                # 更新剩餘數量
                remaining_quantity -= match_quantity
                opposite_order.remaining_quantity -= match_quantity

                # 更新訂單狀態
                if opposite_order.remaining_quantity == 0:
                    await OrderBookService.remove_order(opposite_order.order_id)
                    await OrderRepository.update(
                        opposite_order.order_id,
                        {"status": OrderStatus.Filled}
                    )
                else:
                    await OrderRepository.update(
                        opposite_order.order_id,
                        {"remaining_quantity": opposite_order.remaining_quantity}
                    )

            # 更新市價單狀態
            await OrderRepository.update(
                order.order_id, 
                {"status": OrderStatus.Filled}
            )
            return matches

        except Exception as error:
            raise MatchingError(f"市價單撮合失敗: {str(error)}")

    @classmethod
    async def match_limit_order(cls, order: Any) -> List[Dict[str, Any]]:
        """
        限價單撮合
        只有當價格滿足條件時才成交
        """
        try:
            matches = []
            remaining_quantity = order.quantity

            while remaining_quantity > 0:
                # 獲取對手方最優價格訂單
                opposite_order = (
                    OrderBookService.get_lowest_sell_order(order.stock_id)
                    if order.order_side == OrderSide.Buy
                    else OrderBookService.get_highest_buy_order(order.stock_id)
                )

                if not opposite_order:
                    raise MatchingError("沒有可撮合的訂單")

                # 檢查價格是否滿足條件
                if (order.order_side == OrderSide.Buy and order.price < opposite_order.price) or \
                   (order.order_side == OrderSide.Sell and order.price > opposite_order.price):
                    raise MatchingError("價格不滿足條件")

                # 計算成交數量
                match_quantity = min(
                    remaining_quantity,
                    opposite_order.remaining_quantity
                )

                # 記錄成交
                match_record = MatchRecord(
                    buy_order = order,
                    sell_order = opposite_order,
                    quantity = match_quantity,
                    price = opposite_order.price
                )
                matches.append(match_record)

                # 更新剩餘數量
                remaining_quantity -= match_quantity
                opposite_order.remaining_quantity -= match_quantity

                # 更新訂單狀態
                if opposite_order.remaining_quantity == 0:
                    await OrderBookService.remove_order(opposite_order.order_id)
                    await OrderRepository.update(
                        opposite_order.order_id,
                        {"status": OrderStatus.Filled}
                    )
                else:
                    await OrderRepository.update(
                        opposite_order.order_id,
                        {"remaining_quantity": opposite_order.remaining_quantity}
                    )

            # 更新當前訂單狀態
            if remaining_quantity == 0:
                await OrderRepository.update(order.order_id, {"status": OrderStatus.Filled})
            elif remaining_quantity < order.quantity:
                await OrderRepository.update(order.order_id, {"status": OrderStatus.Partial})
                await OrderRepository.update(order.order_id, {"remaining_quantity": remaining_quantity})
            return matches

        except Exception as error:
            raise MatchingError(f"限價單撮合失敗: {str(error)}")
    