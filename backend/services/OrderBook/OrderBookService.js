const PriorityQueueOrderBook = require('./PriorityQueueOrderBook');
const DatabaseOrderBook = require('./DatabaseOrderBook');
const dotenv = require('dotenv');
const {OrderError} = require('../../utils/Errors');
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
            throw new OrderError(`訂單處理失敗: ${error.message}`);
        }
    }

    static async removeOrder(order_id) {
        try {
            if (!this.orderBook) {
                await this.initialize();
            }
            await this.orderBook.removeOrder(order_id);
        } catch (error) {
            throw new OrderError(`訂單處理失敗: ${error.message}`);
        }
    }

    static getBestAskPrice(stock_id) {
        if (!this.orderBook) {
            throw new OrderError('OrderBook 未初始化');
        }
        return this.orderBook.getLowestSellPrice(stock_id);
    }

    static getBestBidPrice(stock_id) {
        if (!this.orderBook) {
            throw new OrderError('OrderBook 未初始化');
        }
        return this.orderBook.getHighestBuyPrice(stock_id);
    }

    static getOrderBook() {
        if (!this.orderBook) {
            throw new OrderError('OrderBook 未初始化');
        }
        return this.orderBook;
    }

    static updateUserHoldings(order_id, transactionData){
        return this.orderBook.updateUserHoldings(order_id, transactionData);
    }
}

module.exports = OrderBookService;  