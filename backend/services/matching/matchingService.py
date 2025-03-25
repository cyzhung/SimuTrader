from typing import Dict, Any, List
from backend.models.order.order import OrderType, OrderStatus
from backend.services.matching.matchEngine import MatchEngine
from backend.repository.transactionLogsRepository import TransactionLogsRepository
from backend.utils.errors import MatchingError
from backend.database.database import Database
from backend.models.transactionLog.transactionLog import TransactionLog
from backend.services.userPosition.userPositionService import UserPositionService
from backend.models.order.order import OrderBase
class MatchingService:
    """撮合服務，負責協調撮合流程和記錄交易"""

    @classmethod
    async def execute_order(cls, order: OrderBase) -> Dict[str, Any]:
        """
        執行訂單撮合
        根據訂單類型選擇對應的撮合策略
        由於搓合引擎只會查詢買單，所以order一定是買單
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
                            buy_order_id=match.buy_order.order_id,
                            sell_order_id=match.sell_order.order_id,
                            quantity=match.quantity,
                            price=match.price
                        )
                        print(transactionLog)
                        await TransactionLogsRepository.insert(transactionLog, transaction=transaction)
                        await cls.process_match_record(match)
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
    async def process_match_record(cls, match_record: dict):
        """處理成交記錄"""
        await UserPositionService.update_positions(match_record)

        
    @classmethod
    async def get_trade_history(cls, stock_id: int) -> List[Dict[str, Any]]:
        """獲取交易歷史"""
        return await TransactionLogsRepository.get({"stock_id": stock_id})

    @classmethod
    async def get_order_trades(cls, order_id: int) -> List[Dict[str, Any]]:
        """獲取訂單的成交記錄"""
        return await TransactionLogsRepository.get({"order_id": order_id})
