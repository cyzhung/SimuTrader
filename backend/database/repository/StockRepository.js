const RepositroyAbstract = require("./RepositoryFactory");
const Database = require('../Database');

class StockRepository extends RepositroyAbstract{

    static async get(filters={stock_symbol: null, stock_name: null, market_type: null}){
        const pool = Database.getPool();
        let query = 'SELECT * FROM stocks WHERE 1=1';
        const values = [];
        let paramCount = 1;
        if(filters.stock_symbol){
            query += ` AND stock_symbol = $${paramCount}`;
            values.push(filters.stock_symbol);
            paramCount++;
        }
        if(filters.stock_name){
            query += ` AND stock_name = $${paramCount}`;
            values.push(filters.stock_name);
            paramCount++;
        }
        if(filters.market_type){
            query += ` AND market_type = $${paramCount}`;
            values.push(filters.market_type);
            paramCount++;
        }


        try{
            const result = await pool.query(query, values);
            return result.rows;
        }catch(error){
            console.error('Error getting stocks by filters:', error);
            throw error;
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
            throw error;
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
            throw error;
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
            throw error;
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
            throw error;
        }
    }
}

module.exports = StockRepository;
