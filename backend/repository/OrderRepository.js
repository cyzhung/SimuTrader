const Database = require('../database/Database');
const RepositroyAbstract = require('./RepositoryFactory');

class OrderRepository extends RepositroyAbstract{
    static async insert(order){
        const pool = Database.getPool();
        const query = `
            INSERT INTO orders (
                user_id, 
                stock_id, 
                order_type,      // 修改：從 side 改為 order_type
                order_side,      // 新增：需要包含 order_side (Limit/Market)
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
            return result.rows[0];
        }catch(error){
            console.error('Error adding order:', error);
            throw error;
        }
    }

    static async delete(order_id){
        const pool = Database.getPool();
        const query = 'DELETE FROM orders WHERE order_id = $1';
        const values = [order_id];
        try{
            await pool.query(query, values);
        }catch(error){
            console.error('Error deleting order:', error);
            throw error;
        }
    }

    static async update(order_id, updates) {
        const pool = Database.getPool();
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
            throw error;
        }
    }

    static async get(filters = {user_id: null}) {
        if(!filters.user_id){
            throw new Error('User ID is required');
        }
        
        const pool = Database.getPool();
        
        let query = `
            SELECT o.*, s.stock_symbol, s.stock_name 
            FROM orders o
            JOIN stocks s ON o.stock_id = s.stock_id
            WHERE 1=1
            AND o.user_id = $1
        `;
        const values = [user_id];
        let paramCount = 1;

        // 根据传入的过滤条件动态构建查询
        if (filters.order_id) {
            query += ` AND o.order_id = $${paramCount}`;
            values.push(filters.order_id);
            paramCount++;
        }
    
        if (filters.stock_id) {
            query += ` AND o.stock_id = $${paramCount}`;
            values.push(filters.stock_id);
            paramCount++;
        }
        if (filters.status) {
            query += ` AND o.status = $${paramCount}`;
            values.push(filters.status);
            paramCount++;
        }

        query += ` ORDER BY o.created_at DESC`;

        try {
            const result = await pool.query(query, values);
            return filters.order_id ? result.rows[0] : result.rows;
        } catch(error) {
            console.error('Error getting orders:', error);
            throw error;
        }
    }
}

module.exports = OrderRepository;
