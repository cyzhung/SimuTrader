from backend.database.database import Database
from backend.utils.errors import DatabaseError
from backend.repository.repositoryAbs import RepositoryAbstract

class StockPricesRepository(RepositoryAbstract):
    table_name = 'stock_prices'
    key = 'price_id'
    @classmethod
    async def insert(cls, stock_price, transaction=None):
        pool = transaction or Database.get_pool()
        query = """INSERT INTO stock_prices 
                   (stock_id, price_date, open_price, close_price, high_price, low_price, volume) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                   RETURNING price_id"""
        values = [
            stock_price.stock_id,
            stock_price.timestamp,
            stock_price.open_price,
            stock_price.close_price,
            stock_price.high_price,
            stock_price.low_price,
            stock_price.volume
        ]
        try:
            result = await pool.fetchrow(query, *values)
            return result['price_id']
        except Exception as error:
            print('Error adding stock price:', error)
            raise DatabaseError(f"股票資料庫新增錯誤: {str(error)}")

    @classmethod
    async def get(cls, filters=None, transaction=None):
        if filters is None:
            filters = {}
        pool = transaction or Database.get_pool()
        query = f"SELECT * FROM {cls.table_name} WHERE 1=1"
        values = []
        param_count = 1

        for key, value in filters.items():
            if value is None or key == 'end_date' or key == 'order_by':
                continue

            if key == 'start_date':
                if filters.get('end_date'):
                    query += f" AND price_date BETWEEN ${param_count} AND ${param_count + 1}"
                    values.extend([value, filters['end_date']])
                    param_count += 2
                else:
                    query += f" AND price_date = ${param_count}"
                    values.append(value)
                    param_count += 1
            elif isinstance(value, list):
                placeholders = [f"${param_count + i}" for i in range(len(value))]
                query += f" AND {key} IN ({', '.join(placeholders)})"
                values.extend(value)
                param_count += len(value)
            else:
                query += f" AND {key} = ${param_count}"
                values.append(value)
                param_count += 1

        if filters.get('order_by'):
            query += f" ORDER BY {filters['order_by']}"

        try:
            result = await pool.fetch(query, *values)
            return result
        except Exception as error:
            print('Error getting stock prices:', error)
            raise DatabaseError(f"股票價格資料庫查詢錯誤: {str(error)}")

    @classmethod
    async def delete(cls, id, transaction=None):
        pool = transaction or Database.get_pool()
        query = "DELETE FROM stock_prices WHERE price_id = $1"
        values = [id]
        try:
            await pool.execute(query, *values)
        except Exception as error:
            print('Error deleting stock price:', error)
            raise DatabaseError(f"股票資料庫刪除錯誤: {str(error)}")