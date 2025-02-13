const { match } = require('assert');
const OrderBook_abs = require('./OrderBookFactory');
const priorityQueue = require('../../utils/PriorityQueue')
const OrderService = require('../Order/OrderService');
const OrderRepository = require('../../repository/OrderRepository');
const TransactionLogsRepository = require('../../repository/TransactionLogsRepository');
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

    async initialize() {
        try {
            // 1. 獲取所有未完成的交易事件
            const transactionLogs = await TransactionLogsRepository.get({
                event_type: ["NEW_ORDER", "MATCHED_ORDER"],
                order_by: "log_timestamp ASC"  // 按時間順序處理
            });

            // 2. 重建訂單狀態
            const activeOrders = new Map(); // 暫存活動訂單

            for (const log of transactionLogs.rows) {
                if (log.event_type === "NEW_ORDER") {
                    // 創建新訂單
                    const orderId = log.buy_order_id || log.sell_order_id;
                    const orderSide = log.buy_order_id ? "Buy" : "Sell";
                    
                    const order = {
                        order_id: orderId,
                        stock_id: log.additional_info.stock_id,
                        order_side: orderSide,
                        order_type: log.additional_info.order_type,
                        price: log.price,
                        quantity: log.quantity,
                        remaining_quantity: log.quantity,
                        status: 'pending'
                    };
                    
                    activeOrders.set(orderId, order);
                }
                else if (log.event_type === "MATCHED_ORDER") {
                    // 更新訂單狀態
                    if (log.buy_order_id && activeOrders.has(log.buy_order_id)) {
                        const buyOrder = activeOrders.get(log.buy_order_id);
                        buyOrder.remaining_quantity -= log.quantity;
                        if (buyOrder.remaining_quantity <= 0) {
                            activeOrders.delete(log.buy_order_id);
                        }
                    }
                    
                    if (log.sell_order_id && activeOrders.has(log.sell_order_id)) {
                        const sellOrder = activeOrders.get(log.sell_order_id);
                        sellOrder.remaining_quantity -= log.quantity;
                        if (sellOrder.remaining_quantity <= 0) {
                            activeOrders.delete(log.sell_order_id);
                        }
                    }
                }
            }

            // 3. 將活動訂單加入 OrderBook
            for (const order of activeOrders.values()) {
                if (order.remaining_quantity > 0) {
                    this.addOrder(order);
                }
            }

        } catch (error) {
            console.error('Error initializing OrderBook:', error);
            throw new OrderError(`OrderBook 初始化失敗: ${error.message}`);
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

    updateUserOrderState(order_id, transactionData){
        const order = this.orderMap.get(order_id);
        if(!order)
            throw new Error('訂單不存在');

        order.remaining_quantity -= transactionData.transaction_quantity;
        if(order.remaining_quantity === 0){
            order.status = "filled";
            this.orderMap.delete(order_id);
        }
        else if(order.remaining_quantity != order.quantity){
            order.status = "partial";
            this.addOrder(order);
        }
    }

    getLowestSellOrder(stock_id){
        const {sellQueue} = this._getOrderQueues(stock_id);
        return sellQueue.getTop();
    }

    getHighestBuyOrder(stock_id){
        const {buyQueue} = this._getOrderQueues(stock_id);
        return buyQueue.getTop();
    }
}

module.exports = PriorityQueueOrderBook;