from database.database import Database
from utils.errors import DatabaseError, NotFoundError, ValidationError
from repository.repositoryAbs import RepositoryAbstract

class OrderRepository(RepositoryAbstract):
    table_name = 'orders'

    @classmethod
    async def insert(cls, order, transaction=None):
        pool = transaction or Database.get_pool()
        query = """
            INSERT INTO orders (
                user_id, 
                stock_id, 
                order_type,      
                order_side,      
                price, 
                quantity,
                remaining_quantity,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7) RETURNING order_id"""
        
        values = [
            order.user_id, 
            order.stock_id, 
            order.order_type,    # Limit/Market
            order.order_side,    # Buy/Sell
            order.price, 
            order.quantity,
            'pending'            # 初始狀態
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

    @classmethod
    async def update(cls, data, transaction=None):
        pool = transaction or Database.get_pool()
        query = """
            UPDATE orders 
            SET price = COALESCE($1, price),
                remaining_quantity = COALESCE($2, remaining_quantity),
                status = COALESCE($3, status)
            WHERE order_id = $4
            RETURNING *"""
            
        values = [
            data.price, 
            data.remaining_quantity,
            data.status,
            data.order_id
        ]
        try:
            result = await pool.fetchrow(query, *values)
            return dict(result) if result else None
        except Exception as error:
            print('Error updating order:', error)
            raise DatabaseError(f"訂單資料庫更新錯誤: {str(error)}")