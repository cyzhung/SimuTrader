const { OrderAbstract } = require('./OrderAbstract');
const OrderBookService = require('../OrderBook/OrderBookService');
class LimitOrder extends OrderAbstract {
    constructor(orderInfo) {
        super(orderInfo);
        this.price = orderInfo.price;
    }

    validate_order() {
        const errors = super.validate_order();
        
        if (this.price <= 0) {
            errors.push({ field: 'price', message: '價格必須大於0' });
        }

        return errors;
    }
    
    async match() {
        // TODO: 實現限價單的撮合邏輯
        const orderBook = OrderBookService.getOrderBook();
        const transactions = [];
        while(this.remaining_quantity > 0){
            if(this.order_side === "Buy"){
                const lowestSellOrder = OrderBookService.getLowestSellOrder(this.stock_id);
                if(lowestSellOrder.price <= this.price){
                    const matchingOrder = orderBook.dequeue();
                    const transaction_quantity = Math.min(this.remaining_quantity, matchingOrder.remaining_quantity);

                    const transaction = {
                        order_id: this.order_id,
                        matching_order_id: matchingOrder.order_id,
                        transaction_quantity: transaction_quantity,
                        transaction_price: lowestSellOrder.price
                    }
                    transactions.push(transaction);
                    orderBook.updateUserOrderState(this.order_id, transaction);
                    orderBook.updateUserOrderState(matchingOrder.order_id, transaction);
                }
                else{
                    break;
                }
            }
            else{
                const highestBuyOrder = OrderBookService.getHighestBuyOrder(this.stock_id);
                if(highestBuyOrder.price >= this.price){
                    const matchingOrder = orderBook.dequeue();
                    const transaction_quantity = Math.min(this.remaining_quantity, matchingOrder.remaining_quantity);

                    const transaction = {
                        order_id: this.order_id,
                        matching_order_id: matchingOrder.order_id,
                        transaction_quantity: transaction_quantity,
                        transaction_price: highestBuyOrder.price
                    }
                    transactions.push(transaction);
                    orderBook.updateUserOrderState(this.order_id, transaction);
                    orderBook.updateUserOrderState(matchingOrder.order_id, transaction);
                }
                else{
                    break;
                }
            }
        }
        return transactions;
    }
}
module.exports = { LimitOrder };
