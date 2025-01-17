class StockRepository{
    static async getStock(stock_id){
        const pool = Database.getPool();
        const query = 'SELECT * FROM stocks WHERE stock_id = $1';
        const values = [stock_id];
        try{
            const result = await pool.query(query, values);
            return result.rows[0];
        }catch(error){
            console.error('Error getting stock:', error);
            throw error;
        }
    }

    static async getStocksByFilters(filters=[]){
        const pool = Database.getPool();
        let query = 'SELECT * FROM stocks';
        const values = [];
        let paramCount = 1;
        if(filters.stock_symbol){
            query += ` WHERE stock_symbol = $${paramCount}`;
            values.push(filters.stock_symbol);
            paramCount++;
        }
        if(filters.stock_name){
            query += ` WHERE stock_name = $${paramCount}`;
            values.push(filters.stock_name);
            paramCount++;
        }
        if(filters.market_type){
            query += ` WHERE market_type = $${paramCount}`;
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
