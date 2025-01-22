const { match } = require('assert');
const OrderBook_abs = require('./OrderBookFactory');
const priorityQueue = require('../../utils/PriorityQueue')
const { validateOrder } = require('../Order/Order');
const OrderRepository = require('../../repository/OrderRepository');

class PriorityQueueOrderBook extends OrderBook_abs{
    constructor(){
        super();
        this.orderBooks = new Map(); // stock_id -> {buyQueue, sellQueue}
    }

    static instance = null;

    static getInstance(){
        if(!PriorityQueueOrderBook.instance){
            PriorityQueueOrderBook.instance = new PriorityQueueOrderBook();
        }
        return PriorityQueueOrderBook.instance;
    }

    // 獲取或創建特定股票的訂單隊列
    _getOrderQueues(stock_id) {
        if (!this.orderBooks.has(stock_id)) {
            this.orderBooks.set(stock_id, {
                buyQueue: new priorityQueue(true),
                sellQueue: new priorityQueue(false)
            });
        }
        return this.orderBooks.get(stock_id);
    }

    async addOrder(order) {
        // 訂單驗證
        const errors = validateOrder(order);
        if (errors.length > 0) {
            throw new Error(`訂單驗證失敗: ${JSON.stringify(errors)}`);
        }

        try {
            const { buyQueue, sellQueue } = this._getOrderQueues(order.stock_id);
            
            if (order.quantity > 0) {
                if (order.side === "Buy") {
                    buyQueue.enqueue(order);
                } else if (order.side === "Sell") {
                    sellQueue.enqueue(order);
                }
            }
            else{
                throw new Error('訂單數量不能為0');
            }
        } catch (error) {
            // 如果處理失敗，需要回滾數據庫操作
            throw new Error(`訂單處理失敗: ${error.message}`);
        }
    }

    async initialize(){
        const pendingOrder = await OrderRepository.get({status:"pending"});
        const partialOrder = await OrderRepository.get({status:"partial"});

        for(const order of pendingOrder.rows){
            this.addOrder(order);
        }

        for(const order of partialOrder.rows){
            this.addOrder(order);
        }

    }

    getOrderQueues(stock_id){
        return this._getOrderQueues(stock_id);
    }

    // 用於測試的方法
    clearOrderBook() {
        // 清空所有訂單（僅用於測試）
        this.orderBooks.forEach((queues) => {
            queues.buyQueue.clear();
            queues.sellQueue.clear();
        });
    }

    getOrderCount() {
        // 獲取當前訂單數量（用於測試驗證）
        let totalOrders = 0;
        this.orderBooks.forEach((queues) => {
            totalOrders += queues.buyQueue.size();
            totalOrders += queues.sellQueue.size();
        });
        return { totalOrders };
    }
}

module.exports = PriorityQueueOrderBook;