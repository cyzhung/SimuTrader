const PriorityQueueOrderBook = require('./PriorityQueueOrderBook');
const DatabaseOrderBook = require('./DatabaseOrderBook');
const dotenv = require('dotenv');
dotenv.config();

class OrderBookService {
    static orderBook = null;

    static async initialize() {
        if (!this.orderBook) {
            this.orderBook = process.env.ORDER_BOOK === 'PriorityQueue' 
                ? PriorityQueueOrderBook.getInstance() 
                : DatabaseOrderBook.getInstance();
            await this.orderBook.initialize();
        }
    }

    static async addOrder(order) {
        try {
            if (!this.orderBook) {
                await this.initialize();
            }
            await this.orderBook.addOrder(order);
        } catch (error) {
            throw new Error(`訂單處理失敗: ${error.message}`);
        }
    }

    static async removeOrder(order_id) {
        try {
            if (!this.orderBook) {
                await this.initialize();
            }
            await this.orderBook.removeOrder(order_id);
        } catch (error) {
            throw new Error(`訂單處理失敗: ${error.message}`);
        }
    }

    static async matchOrders(buyOrder, sellOrder) {
        if (!this.orderBook) {
            await this.initialize();
        }

        // 市價單直接匹配
        if (buyOrder.order_type === 'Market' || sellOrder.order_type === 'Market') {
            return true;
        }

        // 限價單邏輯
        if (buyOrder.order_type === 'Limit' && sellOrder.order_type === 'Limit') {
            return buyOrder.price >= sellOrder.price;
        }
    }

    static getBestAskPrice() {
        if (!this.orderBook) {
            throw new Error('OrderBook 未初始化');
        }
        return this.orderBook.getLowestSellPrice();
    }

    static getBestBidPrice() {
        if (!this.orderBook) {
            throw new Error('OrderBook 未初始化');
        }
        return this.orderBook.getHighestBuyPrice();
    }

    static getOrderBook() {
        if (!this.orderBook) {
            throw new Error('OrderBook 未初始化');
        }
        return this.orderBook;
    }
}

module.exports = OrderBookService;  