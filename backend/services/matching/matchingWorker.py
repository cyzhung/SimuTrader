import asyncio
from typing import Optional
from datetime import datetime
from backend.services.matching.matchingService import MatchingService
from backend.services.orderbook.orderbookService import OrderBookService

class MatchingWorker:
    _instance: Optional['MatchingWorker'] = None
    _is_running: bool = False
    _interval: int = 60  # 搓合間隔（秒）

    @classmethod
    def get_instance(cls) -> 'MatchingWorker':
        if not cls._instance:
            cls._instance = cls()
        return cls._instance

    async def start(self):
        """啟動搓合工作"""
        if self._is_running:
            return
            
        self._is_running = True
        while self._is_running:
            try:
                print(f"開始搓合循環: {datetime.now()}")
                await self._match_cycle()
                await asyncio.sleep(self._interval)
            except Exception as e:
                print(f"搓合錯誤: {str(e)}")
                await asyncio.sleep(1)  # 錯誤後暫停一下

    async def stop(self):
        """停止搓合工作"""
        self._is_running = False

    async def _match_cycle(self):
        """執行一次完整的搓合循環"""
        # 獲取所有待搓合的訂單
        pending_orders = await OrderBookService.get_pending_orders()
        
        for order in pending_orders:
            try:
                await MatchingService.execute_order(order)
            except Exception as e:
                print(f"訂單 {order.order_id} 搓合失敗: {str(e)}")
