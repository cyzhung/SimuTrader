from typing import Dict, Any, List
from backend.models.order.order import OrderType, OrderStatus
from backend.services.matching.matchEngine import MatchEngine
from backend.repository.transactionLogsRepository import TransactionLogsRepository
from utils.errors import MatchingError
from backend.database.database import Database
from backend.models.transactionLog.transactionLog import TransactionLog
class MatchingService:
    """撮合服務，負責協調撮合流程和記錄交易"""

    @classmethod
    async def execute_order(cls, order: Any) -> Dict[str, Any]:
        """
        執行訂單撮合
        根據訂單類型選擇對應的撮合策略
        """
        try:
            async with Database.transaction() as transaction:
            # 根據訂單類型選擇撮合方法
                matches = (
                    await MatchEngine.match_market_order(order)
                    if order.order_type == OrderType.Market
                    else await MatchEngine.match_limit_order(order)
                )

                # 記錄成交記錄
                if matches:
                    for match in matches:
                        transactionLog = TransactionLog(
                            event_type="match",
                            buy_order_id=match["order_id"],
                            sell_order_id=match["opposite_order_id"],
                            quantity=match["quantity"],
                            price=match["price"]
                        )
                        await TransactionLogsRepository.insert(transactionLog, transaction=transaction)

            return {
                "order_id": order.order_id,
                "matches": matches,
                "status": (
                    OrderStatus.Filled if matches
                    else OrderStatus.Pending
                )
            }

        except Exception as error:
            raise MatchingError(f"訂單撮合失敗: {str(error)}")

    @classmethod
    async def get_trade_history(cls, stock_id: int) -> List[Dict[str, Any]]:
        """獲取交易歷史"""
        return await TransactionLogsRepository.get({"stock_id": stock_id})

    @classmethod
    async def get_order_trades(cls, order_id: int) -> List[Dict[str, Any]]:
        """獲取訂單的成交記錄"""
        return await TransactionLogsRepository.get({"order_id": order_id})
