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
    static async get(filters={}){
        const pool = Database.getPool();
        const query = `SELECT * FROM stock_prices WHERE 1=1`;
        const values = [];
        let paramCount = 0;
        if(filters.stock_id){
            query += ` AND stock_id = $${paramCount}`;
            values.push(filters.stock_id);
            paramCount++;
        }
        if(filters.price_id){
            query += ` AND price_id = $${paramCount}`;
            values.push(filters.price_id);
            paramCount++;
        }
        if(filters.start_date){
            //若只給定一天，則將end_date設為start_date
            if(!filters.end_date){
                filters.end_date = filters.start_date;
            }
            query += ` AND price_date BETWEEN $${paramCount} AND $${paramCount + 1}`;
            values.push(filters.start_date, filters.end_date);
            paramCount += 2;
        }

        try{
            const result = await pool.query(query, values);
            return result.rows[0];
        }catch(error){
            console.error('Error getting stock price:', error);
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