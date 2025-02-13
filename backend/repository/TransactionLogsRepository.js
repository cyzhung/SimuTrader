const RepositroyAbstract = require('./RepositoryFactory');
const Database = require('../database/Database');

class TransactionLogsRepository extends RepositroyAbstract{
    static tableName = 'transaction_log';
    static async insert(data,  { transaction } = {}){
        const pool = transaction || Database.getPool();
        const query = `INSERT INTO transaction_log (event_type, buy_order_id, sell_order_id, quantity, price, additional_info) 
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING *`;
        const values = [
            data.event_type,
            data.buy_order_id,
            data.sell_order_id,
            data.quantity,
            data.price,
            data.additional_info
        ];
        try{
            const result = await pool.query(query, values);
            return result.rows[0].log_id;
        }catch(error){
            console.error('Error adding transaction:', error);
            throw new DatabaseError(`交易資料庫新增錯誤: ${error.message}`);
        }
    }
}

module.exports = TransactionLogsRepository;

