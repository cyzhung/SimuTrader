const RepositroyAbstract = require("./RepositoryFactory");
const Database = require('../database/Database');

class StockRepository extends RepositroyAbstract {
    static tableName = 'stocks';


    static async insert(stock,  {transaction} = {}){
        const pool = transaction || Database.getPool();
        const query = `INSERT INTO stocks (stock_symbol, stock_name, market_type) 
                        VALUES ($1, $2, $3)
                        RETURNING stock_id`;
        const values = [stock.stock_symbol, stock.stock_name, stock.market_type];
        try{
            const result = await pool.query(query, values);
            return result.rows[0].stock_id;
        }catch(error){
            console.error('Error adding stock:', error);
            throw new DatabaseError(`股票資訊資料庫新增錯誤: ${error.message}`);
        }
    }

    static async update(data,  {transaction} = {}){
        const pool = transaction || Database.getPool();
        const query = `
            UPDATE stocks 
            SET stock_symbol = COALESCE($1, stock_symbol),
                stock_name = COALESCE($2, stock_name),
                market_type = COALESCE($3, market_type)
            WHERE stock_id = $4
            RETURNING *`;
        const values = [data.stock_symbol, data.stock_name, data.market_type, data.stocK_id];
        try{
            await pool.query(query, values);
            console.log('Stock updated successfully');
        }catch(error){
            console.error('Error updating stock:', error);
            throw new DatabaseError(`股票資訊資料庫更新錯誤: ${error.message}`);
        }
    }

    static async delete(id,  {transaction}  = {}){
        const pool = transaction || Database.getPool();
        const query = `DELETE FROM stocks WHERE stock_id = $1`;
        const values = [id];
        try{
            await pool.query(query, values);
            console.log('Stock deleted successfully');
        }catch(error){
            console.error('Error deleting stock:', error);
            throw new DatabaseError(`股票資訊資料庫刪除錯誤: ${error.message}`);
        }
    }

    static async stockExist(stock_symbol){
        try{
            const result = await this.get({stock_symbol: stock_symbol});
            return result.rows.length > 0;
        }catch(error){
            console.error('Error checking if stock exists:', error);
            throw new DatabaseError(`股票資訊資料庫查詢錯誤: ${error.message}`);
        }
    }
}

module.exports = StockRepository;
