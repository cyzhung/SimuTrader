from database.database import Database
from utils.errors import DatabaseError
from repository.repositoryAbs import RepositoryAbstract

class UserStocksRepository(RepositoryAbstract):
    table_name = 'user_stocks'

    @classmethod
    async def insert(cls, user_stock, transaction=None):
        pool = transaction or Database.get_pool()
        query = """INSERT INTO user_stocks (user_id, stock_id, quantity, purchase_price) 
                   VALUES ($1, $2, $3, $4) RETURNING user_stock_id"""
        values = [
            user_stock.user_id, 
            user_stock.stock_id, 
            user_stock.quantity, 
            user_stock.purchase_price
        ]

        try:
            result = await pool.fetchrow(query, *values)
            return result['user_stock_id']
        except Exception as error:
            print('Error adding user stock:', error)
            raise DatabaseError(f"用戶持股資料庫新增錯誤: {str(error)}")

    @classmethod
    async def get(cls, filters=None):
        if filters is None:
            filters = {}
        if not filters.get('user_id'):
            raise ValueError('User ID is required')
        return await super().get(filters)

    @classmethod
    async def update(cls, data, transaction=None):
        pool = transaction or Database.get_pool()
        query = """
            UPDATE user_stocks 
            SET quantity = $1, purchase_price = $2 
            WHERE user_id = $3 AND stock_id = $4
        """
        values = [
            data.quantity, 
            data.purchase_price, 
            data.user_id, 
            data.stock_id
        ]
        try:
            await pool.execute(query, *values)
        except Exception as error:
            print('Error updating user stock:', error)
            raise DatabaseError(f"用戶持股資料庫更新錯誤: {str(error)}")