const { match } = require('assert');
const OrderBook_abs = require('./OrderBookFactory');
const priorityQueue = require('../../utils/PriorityQueue')
const OrderService = require('../Order/OrderService');
const OrderRepository = require('../../repository/OrderRepository');
const {OrderError} = require('../../utils/Errors');
class PriorityQueueOrderBook extends OrderBook_abs{
    constructor(){
        super();
        this.orderBooks = new Map(); // stock_id -> {buyQueue, sellQueue}
        this.orderMap = new Map();   // order_id -> order (reference)
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

    addOrder(order) {
        try {
            const { buyQueue, sellQueue } = this._getOrderQueues(order.stock_id);
            if(order.order_side === "Buy"){
                buyQueue.enqueue(order);
            }else{
                sellQueue.enqueue(order);
            }
            this.orderMap.set(order.order_id, order);
        } catch (error) {
            // 如果處理失敗，需要回滾數據庫操作
            throw new Error(`訂單處理失敗: ${error.message}`);
        }
    }

    async initialize(){
        const pendingOrdersInfo = await OrderRepository.get({status:"pending"});
        const partialOrdersInfo = await OrderRepository.get({status:"partial"});
 
        for(const orderInfo of pendingOrdersInfo.rows){
            const order = await OrderService.createOrder(orderInfo);
            this.addOrder(order);
        }

        for(const orderInfo of partialOrdersInfo.rows){
            const order = await OrderService.createOrder(orderInfo);
            this.addOrder(order);
        }

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

    removeOrder(orderId) {
        const order = this.orderMap.get(orderId);
        if (!order) {
            throw new Error('訂單不存在');
        }

        // 直接修改訂單狀態，因為是參考，所以在 queue 中的訂單狀態也會改變
        order.status = 'cancelled';
        
        // 從 Map 中移除參考（可選）
        this.orderMap.delete(orderId);
    }

    getOrderQueues(stock_id){
        return this._getOrderQueues(stock_id);
    }

    findMatchingOrder(order){
        const { buyQueue, sellQueue } = this._getOrderQueues(order.stock_id);
        if(order.order_type === "Market"){
            return order.order_side==="Buy"? sellQueue.dequeue() : buyQueue.dequeue();;
        }

        if(order.order_side === "Buy"){
            const top = sellQueue.getTop();
            if(order.price>top.price)
                return sellQueue.dequeue();
        }else{
            const top = buyQueue.geTop();
            if(order.price<top.price)
                return buyQueue.dequeue();
        }
    }

    updateUserOrderState(order_id, transactionData){
        const order = this.orderMap.get(order_id);
        if(!order)
            throw new Error('訂單不存在');

        order.remaining_quantity -= transactionData.transaction_quantity;
        if(order.remaining_quantity === 0){
            order.status = "filled";
        }
        else if(order.remaining_quantity != order.quantity){
            order.status = "partial";
        }
    }
}

module.exports = PriorityQueueOrderBook;