const RepositroyAbstract = require('./RepositoryFactory');
const Database = require('../Database');
class StockPricesRepository extends RepositroyAbstract {
    static tableName = 'stock_prices';

    static async insert(stock_price,  {transaction} = {}){
        const pool = transaction || Database.getPool();
        const query = `INSERT INTO stock_prices (stock_id, price_date, open_price, close_price, high_price, low_price, volume) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING price_id`;
        const values = [stock_price.stock_id, stock_price.timestamp, stock_price.open_price, stock_price.close_price, stock_price.high_price, stock_price.low_price, stock_price.volume];
        try{
            const result = await pool.query(query, values);
            return result.rows[0].price_id;
        }catch(error){
            throw new DatabaseError(`股票資料庫新增錯誤: ${error.message}`);
        }
    }

    static async get(filters = {},  {transaction}  = {}) {
        const pool = transaction || Database.getPool();
        let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
        let values = [];
        let paramCount = 1;

        Object.entries(filters).forEach(([key, value]) => {
            if (value === null || value === undefined || key === 'end_date' || key === 'order_by') {
                return;
            }

            if (key === 'start_date') {
                if (filters.end_date) {
                    query += ` AND price_date BETWEEN $${paramCount} AND $${paramCount + 1}`;
                    values.push(value, filters.end_date);
                    paramCount += 2;
                } else {
                    query += ` AND price_date = $${paramCount}`;
                    values.push(value);
                    paramCount++;
                }
            } else if (Array.isArray(value)) {
                const placeholders = value.map(() => `$${paramCount++}`).join(', ');
                query += ` AND ${key} IN (${placeholders})`;
                values.push(...value);
            } else {
                query += ` AND ${key} = $${paramCount}`;
                values.push(value);
                paramCount++;
            }
        });

        if (filters.order_by) {
            query += ` ORDER BY ${filters.order_by}`;
        }

        try {
            const result = await pool.query(query, values);
            return result;
        } catch (error) {
            console.error('Error getting stock prices:', error);
            throw new DatabaseError(`股票價格資料庫查詢錯誤: ${error.message}`);
        }
    }

    static async delete(id,  {transaction}  = {}){
        const pool = transaction || Database.getPool();
        const query = `DELETE FROM stock_prices WHERE price_id = $1`;
        const values = [id];
        try{
            await pool.query(query, values);
        }catch(error){
            console.error('Error deleting stock price:', error);
            throw new DatabaseError(`股票資料庫刪除錯誤: ${error.message}`);
        }
    }
}

module.exports = StockPricesRepository;