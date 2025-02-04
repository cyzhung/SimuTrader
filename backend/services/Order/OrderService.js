const OrderRepository = require('../../repository/OrderRepository');
const Order = require('./Order');

class OrderService {
    static createOrder(orderData) {
        try {
            const order = Order.createOrder(orderData);
            return order;
        } catch (error) {
            throw new Error(`創建訂單失敗: ${error.message}`);
        }
    }
    static async cancelOrder(order_id, user_id) {
        try {
            // 1. 檢查訂單是否存在且屬於該用戶
            const orderResult = await OrderRepository.get({ order_id });
            if (!orderResult.rows.length) {
                throw new Error('訂單不存在');
            }

            const order = orderResult.rows[0];
            if (order.user_id !== user_id) {
                throw new Error('無權限取消此訂單');
            }

            // 2. 檢查訂單是否可以取消
            if (order.status !== 'pending' && order.status !== 'partial') {
                throw new Error('訂單狀態不允許取消');
            }

            // 3. 從 OrderBook 中移除訂單
            const orderbook = OrderBookService.getOrderBook();
            await orderbook.removeOrder(order_id);

            // 4. 更新訂單狀態
            await OrderRepository.update(order_id, { 
                status: 'cancelled' 
            });

            return true;

        } catch (error) {
            throw new Error(`取消訂單失敗: ${error.message}`);
        }
    }

    static async getOrderStatus(order_id, user_id) {
        try {
            const orderResult = await OrderRepository.get({ order_id });
            if (!orderResult.rows.length) {
                throw new Error('訂單不存在');
            }

            const order = orderResult.rows[0];
            if (order.user_id !== user_id) {
                throw new Error('無權限查看此訂單');
            }

            return {
                order_id,
                status: order.status,
                filled_quantity: order.quantity - order.remaining_quantity,
                remaining_quantity: order.remaining_quantity,
                price: order.price,
                created_at: order.created_at
            };

        } catch (error) {
            throw new Error(`獲取訂單狀態失敗: ${error.message}`);
        }
    }

}

module.exports = OrderService;