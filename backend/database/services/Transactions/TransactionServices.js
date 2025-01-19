const TransactionsRepository = require('../../repository/TransactionsRepository');

class TransactionServices{
    constructor(){

    }
    async matchOrders(buyOrder, sellOrder){
        if(buyOrder.price < sellOrder.price){
            return false;
        }
        else{
            return true;
        }
    }
    async transaction(buyOrder, sellOrder){
        if(buyOrder.remaining_quantity === sellOrder.remaining_quantity){
            const transaction_id = await TransactionsRepository.insert({
                buy_order_id: buyOrder.order_id,
                sell_order_id: sellOrder.order_id,
                quantity: buyOrder.quantity,
                price: buyOrder.price
            });
            buyOrder.remaining_quantity = 0;
            sellOrder.remaining_quantity = 0;
            buyOrder.status = 'completed';
            sellOrder.status = 'completed';
            return {
                buy_order: buyOrder,
                sell_order: sellOrder,
                transaction_id: transaction_id
            }
        }
        else if(buyOrder.remaining_quantity > sellOrder.remaining_quantity){
            const transaction_id = await TransactionsRepository.insert({
                buy_order_id: buyOrder.order_id,
                sell_order_id: sellOrder.order_id,
                quantity: sellOrder.remaining_quantity,
                price: buyOrder.price
            });
            buyOrder.remaining_quantity -= sellOrder.remaining_quantity;
            sellOrder.remaining_quantity = 0;
            sellOrder.status = 'filled';
            buyOrder.status = 'partial';
            return {
                buy_order: buyOrder,
                sell_order: sellOrder,
                transaction_id: transaction_id
            }
        }
        else if(buyOrder.remaining_quantity < sellOrder.remaining_quantity){
            const transaction_id = await TransactionsRepository.insert({
                buy_order_id: buyOrder.order_id,
                sell_order_id: sellOrder.order_id,
                quantity: buyOrder.remaining_quantity,
                price: buyOrder.price
            });
            sellOrder.remaining_quantity -= buyOrder.remaining_quantity;
            buyOrder.remaining_quantity = 0;
            buyOrder.status = 'filled';
            sellOrder.status = 'partial';
            return {
                buy_order: buyOrder,
                sell_order: sellOrder,
                transaction_id: transaction_id
            }
        }
    }

    async processOrder(order){
        const orderbook = this.orderbook;
        const order_id = order.order_id;
        const user_id = order.user_id;
        const stock_id = order.stock_id;
        const quantity = order.quantity;
        const price = order.price;
        const type = order.type;
    }
}

module.exports = TransactionServices;