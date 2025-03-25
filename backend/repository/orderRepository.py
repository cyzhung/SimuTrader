from backend.database.database import Database
from backend.utils.errors import DatabaseError
from backend.repository.repositoryAbs import RepositoryAbstract
from backend.models.order.order import OrderType
from typing import Dict

class OrderRepository(RepositoryAbstract):
    table_name = 'orders'
    key = 'order_id'
    @classmethod
    async def insert(cls, order, transaction=None):
        pool = transaction or Database.get_pool()
        query = """
            INSERT INTO orders (
                user_id, 
                stock_id, 
                order_type,      
                order_side,      
                quantity,
                remaining_quantity,
                status,
                price
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *"""
        
        values = [
            order.user_id, 
            order.stock_id, 
            order.order_type,    # Limit/Market
            order.order_side,    # Buy/Sell
            order.quantity,
            order.remaining_quantity,
            order.status,
            order.price if order.order_type == OrderType.Limit else None  # 只有限價單才設置價格
        ]

        try:
            result = await pool.fetchrow(query, *values)
            return result['order_id']
        except Exception as error:
            print('Error adding order:', error)
            raise DatabaseError(f"訂單資料庫新增錯誤: {str(error)}")

    @classmethod
    async def delete(cls, order_id, transaction=None):
        pool = transaction or Database.get_pool()
        query = 'DELETE FROM orders WHERE order_id = $1'
        values = [order_id]
        try:
            await pool.execute(query, *values)
        except Exception as error:
            print('Error deleting order:', error)
            raise DatabaseError(f"訂單資料庫刪除錯誤: {str(error)}")
