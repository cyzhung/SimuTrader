from backend.database.database import Database
from backend.utils.errors import DatabaseError
from backend.repository.repositoryAbs import RepositoryAbstract
from backend.models.userPosition.userPosition import UserPosition
class UserPositionRepository(RepositoryAbstract):
    table_name = 'user_Position'
    key = 'position_id'
    @classmethod
    async def insert(cls, position: UserPosition, transaction=None):
        pool = transaction or Database.get_pool()
        query = """INSERT INTO userPosition (user_id, stock_id, quantity, purchase_price) 
                   VALUES ($1, $2, $3, $4) RETURNING positin_id"""
        values = [
            position.user_id, 
            position.stock_id, 
            position.quantity, 
            position.purchase_price
        ]

        try:
            result = await pool.fetchrow(query, *values)
            return result['position_id']
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
