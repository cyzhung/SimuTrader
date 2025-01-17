
class StockPricesRepository{
    static async addStockPrice(stock_price){
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

    static async getStockPricesByDateRange(stock_id, start_date, end_date){
        const pool = Database.getPool();
        const query = `SELECT * FROM stock_prices WHERE stock_id = $1 AND price_date BETWEEN $2 AND $3`;
        const values = [stock_id, start_date, end_date];
        try{
            const result = await pool.query(query, values);
            return result.rows;
        }catch(error){
            console.error('Error getting stock prices by date range:', error);
            throw error;
        }
    }

}

module.exports = StockPricesRepository;