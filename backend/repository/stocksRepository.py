from backend.database.database import Database
from backend.utils.errors import DatabaseError
from backend.repository.repositoryAbs import RepositoryAbstract

class StockRepository(RepositoryAbstract):
    table_name = 'stocks'
    key = 'stock_id'
    @classmethod
    async def insert(cls, stock, transaction=None):
        pool = transaction or Database.get_pool()
        query = """INSERT INTO stocks (stock_symbol, stock_name, market_type) 
                   VALUES ($1, $2, $3)
                   RETURNING stock_id"""
        values = [
            stock.stock_symbol,
            stock.stock_name,
            stock.market_type
        ]
        try:
            result = await pool.fetchrow(query, *values)
            return result['stock_id']
        except Exception as error:
            print('Error adding stock:', error)
            raise DatabaseError(f"股票資訊資料庫新增錯誤: {str(error)}")


    @classmethod
    async def delete(cls, id, transaction=None):
        pool = transaction or Database.get_pool()
        query = "DELETE FROM stocks WHERE stock_id = $1"
        values = [id]
        try:
            await pool.execute(query, *values)
            print('Stock deleted successfully')
        except Exception as error:
            print('Error deleting stock:', error)
            raise DatabaseError(f"股票資訊資料庫刪除錯誤: {str(error)}")

    @classmethod
    async def stock_exist(cls, stock_symbol):
        try:
            result = await cls.get({'stock_symbol': stock_symbol})
            return len(result) > 0
        except Exception as error:
            print('Error checking if stock exists:', error)
            raise DatabaseError(f"股票資訊資料庫查詢錯誤: {str(error)}")