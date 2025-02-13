const RepositroyAbstract = require('./RepositoryFactory');
const Database = require('../database/Database');
const { DatabaseError } = require('../utils/Errors');
class UserStocksRepository extends RepositroyAbstract{
    static tableName = 'user_stocks';

    static async insert(user_stock,  {transaction} = {}){
        const pool = transaction || Database.getPool();
        const query = `INSERT INTO user_stocks (user_id, stock_id, quantity, purchase_price) 
                        VALUES ($1, $2, $3, $4) RETURNING user_stock_id`;
        const values = [user_stock.user_id, user_stock.stock_id, user_stock.quantity, user_stock.purchase_price];

        try{
            const result = await pool.query(query, values);
            return result.rows[0].user_stock_id;
        }catch(error){
            console.error('Error adding user stock:', error);
            throw new DatabaseError(`用戶持股資料庫新增錯誤: ${error.message}`);
        }
    }

    static async get(filters = {}) {
        if (!filters.user_id) {
            throw new Error('User ID is required');
        }
        return await super.get(filters);
    }

    static async update(data,  {transaction}  = {}){
        const pool = transaction || Database.getPool();
        const query = `
            UPDATE user_stocks SET quantity = $1, purchase_price = $2 WHERE user_id = $3 AND stock_id = $4
        `;
        const values = [data.quantity, data.purchase_price, data.user_id, data.stock_id];
        try{
            await pool.query(query, values);
        }catch(error){
            console.error('Error updating user stock:', error);
            throw new DatabaseError(`用戶持股資料庫更新錯誤: ${error.message}`);
        }
    }
}

module.exports = UserStocksRepository;

