from backend.database.database import Database
from backend.utils.errors import DatabaseError
from backend.repository.repositoryAbs import RepositoryAbstract
from backend.models.order.order import OrderType
from typing import Dict

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

    @classmethod
    async def update(cls, order_id: int, data: Dict, transaction=None):
        """
        更新訂單
        
        Args:
            order_id: 訂單ID
            data: 要更新的字段，可以包含 price, remaining_quantity, status 中的任意幾個
            transaction: 事務對象
        """
        pool = transaction or Database.get_pool()
        
        # 構建更新字段
        update_fields = []
        values = []
        param_count = 1

        if 'price' in data:
            update_fields.append(f"price = ${param_count}")
            values.append(data['price'])
            param_count += 1

        if 'remaining_quantity' in data:
            update_fields.append(f"remaining_quantity = ${param_count}")
            values.append(data['remaining_quantity'])
            param_count += 1

        if 'status' in data:
            update_fields.append(f"status = ${param_count}")
            values.append(data['status'])
            param_count += 1

        if not update_fields:
            raise ValueError("沒有提供要更新的字段")

        # 添加 order_id 到值列表
        values.append(order_id)
        
        query = f"""
            UPDATE orders 
            SET {', '.join(update_fields)}
            WHERE order_id = ${param_count}
            RETURNING *
        """

        try:
            result = await pool.fetchrow(query, *values)
            return dict(result) if result else None
        except Exception as error:
            print('Error updating order:', error)
            raise DatabaseError(f"訂單資料庫更新錯誤: {str(error)}")