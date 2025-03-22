from typing import List, Any, Callable, Optional
from utils.errors import OrderBookError

class PriorityQueue:
    def __init__(self, is_max_heap: bool = False):
        """
        初始化優先隊列
        
        Args:
            is_max_heap: 是否為最大堆，默認為最小堆
        """
        # 定義比較函數
        self.comparator: Callable[[Any, Any], int] = (
            # 最大堆
            lambda a, b: (
                b.price - a.price if a.price != b.price 
                else b.timestamp - a.timestamp
            ) if is_max_heap
            # 最小堆
            else (
                a.price - b.price if a.price != b.price 
                else a.timestamp - b.timestamp
            )
        )
        self.heap: List[Any] = []

    def enqueue(self, order: Any) -> None:
        """
        將訂單加入隊列
        
        Args:
            order: 要入隊的訂單
            
        Raises:
            OrderBookError: 當訂單為空或入隊失敗時
        """
        if not order:
            raise OrderBookError("訂單不能為空")
        
        try:
            self.heap.append(order)
            self._heapify_up()
        except Exception as error:
            raise OrderBookError(f"入隊失敗: {str(error)}")

    def dequeue(self) -> Optional[Any]:
        """
        從隊列中取出最優先的訂單
        
        Returns:
            Optional[Any]: 出隊的訂單
            
        Raises:
            OrderBookError: 當隊列為空或出隊失敗時
        """
        if self.size() == 0:
            raise OrderBookError("隊列為空")

        try:
            if self.size() == 1:
                return self.heap.pop()

            top = self.heap[0]
            self._swap(0, self.size() - 1)
            self.heap.pop()
            self._heapify_down()
            return top
        except Exception as error:
            raise OrderBookError(f"出隊失敗: {str(error)}")

    def get_top(self) -> Optional[Any]:
        """
        查看隊列頂部的訂單
        
        Returns:
            Optional[Any]: 隊列頂部的訂單
            
        Raises:
            OrderBookError: 當隊列為空時
        """
        if self.size() == 0:
            raise OrderBookError("隊列為空")
        return self.heap[0]

    def size(self) -> int:
        """
        獲取隊列大小
        
        Returns:
            int: 隊列中的元素數量
        """
        return len(self.heap)

    def clear(self) -> None:
        """清空隊列"""
        self.heap.clear()

    def _heapify_up(self) -> None:
        """向上調整堆"""
        index = self.size() - 1
        
        while index > 0:
            parent_index = (index - 1) // 2
            if self.comparator(self.heap[index], self.heap[parent_index]) >= 0:
                break
            self._swap(index, parent_index)
            index = parent_index

    def _heapify_down(self) -> None:
        """向下調整堆"""
        index = 0
        last_index = self.size() - 1
        
        while True:
            left_child = index * 2 + 1
            right_child = index * 2 + 2
            next_index = index

            if (left_child <= last_index and 
                self.comparator(self.heap[next_index], self.heap[left_child]) > 0):
                next_index = left_child

            if (right_child <= last_index and 
                self.comparator(self.heap[next_index], self.heap[right_child]) > 0):
                next_index = right_child

            if index == next_index:
                break
                
            self._swap(index, next_index)
            index = next_index

    def _swap(self, i: int, j: int) -> None:
        """
        交換堆中的兩個元素
        
        Args:
            i: 第一個元素的索引
            j: 第二個元素的索引
        """
        self.heap[i], self.heap[j] = self.heap[j], self.heap[i]