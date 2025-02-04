const RepositroyAbstract = require('./RepositoryFactory');
const Database = require('../database/Database');

class TransactionsRepository extends RepositroyAbstract{
    static async insert(transaction){
        const pool = Database.getPool();
        console.log(transaction)
        const query = `INSERT INTO transactions (buy_order_id, sell_order_id, quantity, price, transaction_date) 
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING transaction_id`;
        const values = [
            transaction.buy_order_id,
            transaction.sell_order_id,
            transaction.quantity,
            transaction.price,
            transaction.transaction_date];
        try{
            const result = await pool.query(query, values);
            return result.rows[0].transaction_id;
        }catch(error){
            console.error('Error adding transaction:', error);
            throw error;
        }
    }

    static async get(filters={user_id: null, stock_id: null}){
        if(!filters.user_id){
            throw new Error('User ID is required');
        }

        const pool = Database.getPool();
        const query = `SELECT * FROM transactions WHERE 1=1`;
        const values = [];
        let paramCount = 1;

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                query += ` AND ${key} = $${paramCount}`;
                values.push(value);
                paramCount++;
            }
        });

        try{
            const result = await pool.query(query, values);
            return result;
        }catch(error){
            console.error('Error getting transactions by user_id:', error);
            throw error;
        }
    }

}

module.exports = TransactionsRepository;

