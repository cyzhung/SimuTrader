class UserStocksRepository{
    static async addUserStock(user_id, stock_id, quantity, purchase_price){
        const pool = Database.getPool();
        const query = `INSERT INTO user_stocks (user_id, stock_id, quantity, purchase_price) 
                        VALUES ($1, $2, $3, $4)`;
        const values = [user_id, stock_id, quantity, purchase_price];
        try{
            await pool.query(query, values);
        }catch(error){
            console.error('Error adding user stock:', error);
            throw error;
        }
    }

    static async getUserStocks(user_id, stock_id = null) {
        const pool = Database.getPool();
        let query = `
            SELECT us.*, s.stock_symbol, s.stock_name 
            FROM user_stocks us
            JOIN stocks s ON us.stock_id = s.stock_id
            WHERE us.user_id = $1
        `;
        const values = [user_id];

        if (stock_id) {
            query += ` AND us.stock_id = $2`;
            values.push(stock_id);
        }

        try{
            const result = await pool.query(query, values);
            return result.rows;
        }catch(error){
            console.error('Error getting user stocks:', error);
            throw error;
        }
    }

    static async upsertUserStock(user_id, stock_id, quantity, purchase_price){
        const pool = Database.getPool();
        const query = `
            INSERT INTO user_stocks (user_id, stock_id, quantity, purchase_price)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, stock_id)
            DO UPDATE SET quantity = user_stocks.quantity + EXCLUDED.quantity;
        `;
        const values = [user_id, stock_id, quantity, purchase_price];
        try{
            await pool.query(query, values);
        }catch(error){
            console.error('Error updating user stock:', error);
            throw error;
        }
    }

    static async getUserStockByDate(user_id, date){
        const pool = Database.getPool();
        const query = `SELECT * FROM user_stocks WHERE user_id = $1 AND created_at = $2`;
        const values = [user_id, date];
        try{
            const result = await pool.query(query, values);
            return result.rows[0];
        }catch(error){
            console.error('Error getting user stock by timestamp:', error);
            throw error;
        }
    }
}

module.exports = UserStocksRepository;

