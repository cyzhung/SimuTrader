const { OrderAbstract } = require('./OrderAbstract');

class MarketOrder extends OrderAbstract {
    constructor(orderInfo) {
        super(orderInfo);
    }

    async match() {
        // TODO: 實現市價單的撮合邏輯
        const orderBook = OrderBookService.getOrderBook();
        const transactions = [];
        while(this.remaining_quantity > 0){
            if(this.order_side === "Buy"){
                const lowestSellOrder = orderBook.getLowestSellOrder(this.stock_id);
                const transaction_quantity = Math.min(this.remaining_quantity, lowestSellOrder.remaining_quantity);
                const transaction_price = lowestSellOrder.price;
                const transaction = {
                    order_id: this.order_id,
                    matching_order_id: lowestSellOrder.order_id,
                    transaction_quantity: transaction_quantity,
                    transaction_price: transaction_price
                }
                transactions.push(transaction);
                orderBook.updateUserOrderState(this.order_id, transaction);
                orderBook.updateUserOrderState(lowestSellOrder.order_id, transaction);
            }
            else{
                const highestBuyOrder = orderBook.getHighestBuyOrder(this.stock_id);
                const transaction_quantity = Math.min(this.remaining_quantity, highestBuyOrder.remaining_quantity);
                const transaction_price = highestBuyOrder.price;
                const transaction = {
                    order_id: this.order_id,
                    matching_order_id: highestBuyOrder.order_id,
                    transaction_quantity: transaction_quantity,
                    transaction_price: transaction_price
                }
                transactions.push(transaction);
                orderBook.updateUserOrderState(this.order_id, transaction);
                orderBook.updateUserOrderState(highestBuyOrder.order_id, transaction);
            }
        }
        return transactions;
    }
}

module.exports = { MarketOrder };
