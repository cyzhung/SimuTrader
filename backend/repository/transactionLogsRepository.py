from backend.database.database import Database
from backend.utils.errors import DatabaseError
from backend.repository.repositoryAbs import RepositoryAbstract

class TransactionLogsRepository(RepositoryAbstract):
    table_name = 'transaction_log'
    key = 'log_id'
    @classmethod
    async def insert(cls, data, transaction=None):
        pool = transaction or Database.get_pool()
        query = """INSERT INTO transaction_log 
                   (event_type, buy_order_id, sell_order_id, quantity, price, additional_info) 
                   VALUES ($1, $2, $3, $4, $5, $6)
                   RETURNING *"""
        values = [
            data.event_type,
            data.buy_order_id,
            data.sell_order_id,
            data.quantity,
            data.price,
            data.additional_info
        ]
        try:
            result = await pool.fetchrow(query, *values)
            return result['log_id']
        except Exception as error:
            print('Error adding transaction:', error)
            raise DatabaseError(f"交易資料庫新增錯誤: {str(error)}")