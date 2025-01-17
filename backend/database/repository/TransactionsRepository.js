class TransactionsRepository{
    static async insertTransaction(user_id, stock_id, quantity, price, transaction_date, transaction_type){
        const pool = Database.getPool();
        const query = `INSERT INTO transactions (user_id, stock_id, quantity, price, transaction_date, transaction_type) 
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING transaction_id`;
        const values = [user_id, stock_id, quantity, price, transaction_date, transaction_type];
        try{
            const result = await pool.query(query, values);
            return result.rows[0].transaction_id;
        }catch(error){
            console.error('Error adding transaction:', error);
            throw error;
        }
    }

    static async getTransactionsByUserId(user_id){
        const pool = Database.getPool();
        const query = `SELECT * FROM transactions WHERE user_id = $1`;
        const values = [user_id];
        try{
            const result = await pool.query(query, values);
            return result.rows;
        }catch(error){
            console.error('Error getting transactions by user_id:', error);
            throw error;
        }
    }

    static async getTransactionsByStockId(stock_id){
        const pool = Database.getPool();
        const query = `SELECT * FROM transactions WHERE stock_id = $1`;
        const values = [stock_id];
        try{
            const result = await pool.query(query, values);
            return result.rows;
        }catch(error){
            console.error('Error getting transactions by stock_id:', error);
            throw error;
        }
    }
}

module.exports = TransactionsRepository;

