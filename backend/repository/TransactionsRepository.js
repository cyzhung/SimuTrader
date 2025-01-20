const RepositroyAbstract = require('./RepositoryFactory');
const Database = require('../database/Database');

class TransactionsRepository extends RepositroyAbstract{
    static async insert(transaction){
        const pool = Database.getPool();
        const query = `INSERT INTO transactions (user_id, stock_id, quantity, price, transaction_date, transaction_type) 
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING transaction_id`;
        const values = [transaction.user_id, transaction.stock_id, transaction.quantity, transaction.price, transaction.transaction_date, transaction.transaction_type];
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
        const query = `SELECT * FROM transactions WHERE user_id = $1`;
        const values = [filters.user_id];
        let paramCount = 1;

        if(filters.stock_id){
            query += ` AND stock_id = $2`;
            values.push(filters.stock_id);
            paramCount++;
        }

        try{
            const result = await pool.query(query, values);
            return result.rows;
        }catch(error){
            console.error('Error getting transactions by user_id:', error);
            throw error;
        }
    }

}

module.exports = TransactionsRepository;

