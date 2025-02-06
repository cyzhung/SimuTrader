const Database = require('../database/Database');
const { DatabaseError, NotFoundError } = require('../utils/Errors');
const RepositroyAbstract = require('./RepositoryFactory');

class OrderRepository extends RepositroyAbstract{
    static async insert(order, { transaction } = {}){
        const pool = transaction || Database.getPool();
        const query = `
            INSERT INTO orders (
                user_id, 
                stock_id, 
                order_type,      
                order_side,      
                price, 
                quantity,
                remaining_quantity,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7) RETURNING order_id`;
        
        const values = [
            order.user_id, 
            order.stock_id, 
            order.order_type,    // Limit/Market
            order.order_side,    // Buy/Sell
            order.price, 
            order.quantity,
            'pending'            // 初始狀態
        ];
        try{
            const result = await pool.query(query, values);
            return result.rows[0].order_id;
        }catch(error){
            console.error('Error adding order:', error);
            throw new DatabaseError(`數據庫新增錯誤: ${error.message}`);
        }
    }

    static async delete(order_id, { transaction } = {}){
        const pool = transaction || Database.getPool();
        const query = 'DELETE FROM orders WHERE order_id = $1';
        const values = [order_id];
        try{
            await pool.query(query, values);
        }catch(error){
            console.error('Error deleting order:', error);
            throw new DatabaseError(`數據庫刪除錯誤: ${error.message}`);
        }
    }

    static async update(order_id, updates, { transaction } = {}) {
        const pool = transaction || Database.getPool();
        const query = `
            UPDATE orders 
            SET price = COALESCE($1, price),
                remaining_quantity = COALESCE($2, remaining_quantity),
                status = COALESCE($3, status)
            WHERE order_id = $4
            RETURNING *`;
            
        const values = [
            updates.price, 
            updates.remaining_quantity,
            updates.status,
            order_id
        ];
        try{
            const result = await pool.query(query, values);
            return result.rows[0];
        }catch(error){
            console.error('Error updating order:', error);
            throw new DatabaseError(`數據庫更新錯誤: ${error.message}`);
        }
    }

    static async get(filters = {}, { transaction } = {}) {
        const pool = transaction || Database.getPool();        
        let query = `SELECT * FROM orders WHERE 1=1`;
        const values = [];
        let paramCount = 1;

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                query += `AND ${key} = $${paramCount}`;
                values.push(value);
                paramCount++;
            }
        });

        query += ` ORDER BY created_at DESC`;

        try {
            const result = await pool.query(query, values);
            return result;
        } catch(error) {
            console.error('Error getting orders:', error);
            throw new DatabaseError(`數據庫查詢錯誤: ${error.message}`);
        }
    }
}

module.exports = OrderRepository;
