const pool = require('../../connection');
const { validateOrder } = require('../services/OrderBook/Order');

class DatabaseUtils{
    async insertOrder(order){
        const errors = validateOrder(order);
        if(errors.length>0)
            throw new Error(`訂單驗證失敗: ${JSON.stringify(errors)}`);
        try{
            const query = 'INSERT INTO orders (order_id, user_id, symbol, side, type, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const values = [order.orderId, order.userId, order.side, order.type, order.price, order.quantity];
            const result = await pool.query(query, values);
            return result;
        }catch(error){
            throw new Error(`訂單存儲失敗: ${error.message}`);
        }
    }
    
}

module.exports = DatabaseUtils;