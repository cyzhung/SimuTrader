const RepositroyAbstract = require('./RepositoryFactory');

class UserStocksRepository extends RepositroyAbstract{
    static async insert(user_stock){
        const pool = Database.getPool();
        const query = `INSERT INTO user_stocks (user_id, stock_id, quantity, purchase_price) 
                        VALUES ($1, $2, $3, $4) RETURNING user_stock_id`;
        const values = [user_stock.user_id, user_stock.stock_id, user_stock.quantity, user_stock.purchase_price];

        try{
            const result = await pool.query(query, values);
            return result.rows[0].user_stock_id;
        }catch(error){
            console.error('Error adding user stock:', error);
            throw error;
        }
    }

    static async get(filters={user_id: null, stock_id: null}) {
        if(!filters.user_id){
            throw new Error('User ID is required');
        }

        const pool = Database.getPool();
        let query = `
            SELECT * FROM user_stocks WHERE user_id = $1
        `;
        const values = [filters.user_id];
        const paramsCount = 1;

        if (filters.stock_id) {
            query += ` AND stock_id = $${paramsCount}`;
            values.push(filters.stock_id);
            paramsCount++;
        }
        if(filters.date){
            query += ` AND created_at = $${paramsCount}`;
            values.push(filters.date);
            paramsCount++;
        }
        try{
            const result = await pool.query(query, values);
            return result.rows;
        }catch(error){
            console.error('Error getting user stocks:', error);
            throw error;
        }
    }

    static async update(user_id, data){
        const pool = Database.getPool();
        const query = `
            UPDATE user_stocks SET quantity = $1, purchase_price = $2 WHERE user_id = $3 AND stock_id = $4
        `;
        const values = [user_id, data.stock_id, data.quantity, data.purchase_price];
        try{
            await pool.query(query, values);
        }catch(error){
            console.error('Error updating user stock:', error);
            throw error;
        }
    }
}

module.exports = UserStocksRepository;

