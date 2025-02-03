const PriorityQueueOrderBook = require('./PriorityQueueOrderBook');
const DatabaseOrderBook = require('./DatabaseOrderBook');
const OrderService = require('../Order/OrderService');
const dotenv = require('dotenv');
dotenv.config();

class OrderBookService{
    static async initialize(){
        this.orderBook = process.env.ORDER_BOOK === 'PriorityQueue' ? PriorityQueueOrderBook.getInstance() : DatabaseOrderBook.getInstance();
        await this.orderBook.initialize();
    }

    static async addOrder(order){
        try{
            OrderService.validateOrder(order);
            this.orderbook.addOrder(order);
        }
        catch(error){
            throw new Error(`訂單處理失敗: ${error.message}`);
        }
    }
    static async removeOrder(order_id){
        try{
            this.orderbook.removeOrder(order_id);
        }
        catch(error){
            throw new Error(`訂單處理失敗: ${error.message}`);
        }
    }
    static async matchOrder(buyOrder, sellOrder) {
        // 市價單直接匹配
        if (buyOrder.order_type === 'Market' || sellOrder.order_type === 'Market') {
            return true;
        }

        // 限價單邏輯：
        // 1. 買方願意買入的最高價格 >= 賣方願意賣出的最低價格
        // 2. 成交價格以先到先得為原則
        if (buyOrder.order_type === 'Limit' && sellOrder.order_type === 'Limit') {
            return buyOrder.price >= sellOrder.price;
        }
    }

    // 取得最佳賣價（給買方參考）
    static getBestAskPrice() {
        return this.orderbook.getLowestSellPrice();
    }

    // 取得最佳買價（給賣方參考）
    static getBestBidPrice() {
        return this.orderbook.getHighestBuyPrice();
    }
}

module.exports = OrderBookService;  