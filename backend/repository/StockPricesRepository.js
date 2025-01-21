const RepositroyAbstract = require('./RepositoryFactory');
const Database = require('../Database');
class StockPricesRepository extends RepositroyAbstract{
    static async insert(stock_price){
        const pool = Database.getPool();
        const query = `INSERT INTO stock_prices (stock_id, price_date, open_price, close_price, high_price, low_price, volume) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING price_id`;
        const values = [stock_price.stock_id, stock_price.timestamp, stock_price.open_price, stock_price.close_price, stock_price.high_price, stock_price.low_price, stock_price.volume];
        try{
            const result = await pool.query(query, values);
            return result.rows[0].price_id;
        }catch(error){
            console.error('Error adding stock price:', error);
            throw error;
        }
    }
    static async get({ filters = {}, transaction = null } = {}) {
        const pool = transaction || Database.getPool();
        let query = `SELECT * FROM stock_prices WHERE 1=1`;
        const values = [];
        let paramCount = 1;

        // 定義特殊處理的過濾條件
        const specialFilters = {
            start_date: (value) => {
                if (filters.end_date) {
                    query += ` AND price_date BETWEEN $${paramCount} AND $${paramCount + 1}`;
                    values.push(value, filters.end_date);
                    paramCount += 2;
                } else {
                    query += ` AND price_date = $${paramCount}`;
                    values.push(value);
                    paramCount++;
                }
            }
        };

        // 處理所有過濾條件
        Object.entries(filters).forEach(([key, value]) => {
            if (value === null || value === undefined || key === 'end_date') {
                return;
            }

            // 使用特殊處理邏輯或默認處理邏輯
            if (specialFilters[key]) {
                specialFilters[key](value);
            } else {
                query += ` AND ${key} = $${paramCount}`;
                values.push(value);
                paramCount++;
            }
        });

        try {
            const result = await pool.query(query, values);
            return result;
        } catch (error) {
            console.error('Error getting stock prices:', error);
            throw error;
        }
    }

    static async delete(id){
        const pool = Database.getPool();
        const query = `DELETE FROM stock_prices WHERE price_id = $1`;
        const values = [id];
        try{
            await pool.query(query, values);
        }catch(error){
            console.error('Error deleting stock price:', error);
            throw error;
        }
    }
}

module.exports = StockPricesRepository;