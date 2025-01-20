const TransactionsRepository = require('../../repository/TransactionsRepository');
const OrderRepository = require('../../repository/OrderRepository');
const OrderService = require('../OrderBook/OrderService');
class TransactionServices{
    constructor(){

    }
    static async matchOrders(buyOrder, sellOrder){
        if(buyOrder.price < sellOrder.price){
            return false;
        }
        else{
            return true;
        }
    }
    static async _transaction(buyOrder, sellOrder) {
        try {
            // 計算交易數量
            const transactionQuantity = Math.min(buyOrder.remaining_quantity, sellOrder.remaining_quantity);
            
            // 創建交易記錄
            const transaction_id = await TransactionsRepository.insert({
                buy_order_id: buyOrder.order_id,
                sell_order_id: sellOrder.order_id,
                quantity: transactionQuantity,
                price: buyOrder.price
            });

            // 更新訂單數量
            buyOrder.remaining_quantity -= transactionQuantity;
            sellOrder.remaining_quantity -= transactionQuantity;

            // 更新訂單狀態
            buyOrder.status = buyOrder.remaining_quantity === 0 ? 'filled' : 'partial';
            sellOrder.status = sellOrder.remaining_quantity === 0 ? 'filled' : 'partial';

            return {
                buy_order: buyOrder,
                sell_order: sellOrder,
                transaction_id
            };
        } catch (error) {
            throw new Error(`交易執行失敗: ${error.message}`);
        }
    }
    static async transaction(order) {
        const orderbook = OrderBook.getInstance();
        const transactions = [];
        OrderService.insert(order);
        while (order.remaining_quantity > 0) {
            const {buyQueue, sellQueue} = orderbook.getOrderQueues(order.stock_id);
            let buyOrder, sellOrder;

            if (order.side === 'buy') {
                buyOrder = order;
                sellOrder = sellQueue.getTop();
                if (!sellOrder) break;
            } else {
                sellOrder = order;
                buyOrder = buyQueue.getTop();
                if (!buyOrder) break;
            }

            if (!this.matchOrders(buyOrder, sellOrder)) {
               break;
            }

            const transaction = await this._transaction(buyOrder, sellOrder);
            transactions.push(transaction);
            
            for(const transaction of transactions){
                await Promise.all([
                    OrderService.updateOrder(transaction.buy_order),
                    OrderService.updateOrder(transaction.sell_order)
                ]);
            }
            // 只移除不是新進訂單的完成訂單
            if (buyOrder.remaining_quantity === 0 && buyOrder !== order) {
                buyQueue.dequeue();
            }
            if (sellOrder.remaining_quantity === 0 && sellOrder !== order) {
                sellQueue.dequeue();
            }
        }
        // 如果還有剩餘數量，加入訂單簿
        if (order.remaining_quantity > 0 && order.status !== 'filled') {
            orderbook.addOrder(order);
            return {
                status: 'partial',
                message: '部分成交，剩餘訂單已加入訂單簿',
                transactions
            };
        }

        return {
            status: 'filled',
            message: '訂單完全成交',
            transactions
        };
    }
}

module.exports = TransactionServices;