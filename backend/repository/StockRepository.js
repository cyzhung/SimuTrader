const RepositroyAbstract = require("./RepositoryFactory");
const Database = require('../database/Database');

class StockRepository extends RepositroyAbstract{

    static async get(filters={stock_symbol: null, stock_name: null, market_type: null}){
        const pool = Database.getPool();
        let query = 'SELECT * FROM stocks WHERE 1=1';
        let values = [];
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
            console.error('Error getting stocks by filters:', error);
            throw new DatabaseError(`數據庫查詢錯誤: ${error.message}`);
        }
    }

    static async insert(stock){
        const pool = Database.getPool();
        const query = `INSERT INTO stocks (stock_symbol, stock_name, market_type) 
                        VALUES ($1, $2, $3)
                        RETURNING stock_id`;
        const values = [stock.stock_symbol, stock.stock_name, stock.market_type];
        try{
            const result = await pool.query(query, values);
            return result.rows[0].stock_id;
        }catch(error){
            console.error('Error adding stock:', error);
            throw new DatabaseError(`數據庫新增錯誤: ${error.message}`);
        }
    }

    static async update(id, data){
        const pool = Database.getPool();
        const query = `
            UPDATE stocks 
            SET stock_symbol = COALESCE($1, stock_symbol),
                stock_name = COALESCE($2, stock_name),
                market_type = COALESCE($3, market_type)
            WHERE stock_id = $4
            RETURNING *`;
        const values = [data.stock_symbol, data.stock_name, data.market_type, id];
        try{
            await pool.query(query, values);
            console.log('Stock updated successfully');
        }catch(error){
            console.error('Error updating stock:', error);
            throw new DatabaseError(`數據庫更新錯誤: ${error.message}`);
        }
    }

    static async delete(id){
        const pool = Database.getPool();
        const query = `DELETE FROM stocks WHERE stock_id = $1`;
        const values = [id];
        try{
            await pool.query(query, values);
            console.log('Stock deleted successfully');
        }catch(error){
            console.error('Error deleting stock:', error);
            throw new DatabaseError(`數據庫刪除錯誤: ${error.message}`);
        }
    }

    static async stockExist(stock_symbol){
        const pool = Database.getPool();
        const query = 'SELECT * FROM stocks WHERE stock_symbol = $1';
        const values = [stock_symbol];
        try{
            const result = await pool.query(query, values);
            return result.rows.length > 0;
        }catch(error){
            console.error('Error checking if stock exists:', error);
            throw new DatabaseError(`數據庫查詢錯誤: ${error.message}`);
        }
    }
}

module.exports = StockRepository;
