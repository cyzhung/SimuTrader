const { match } = require('assert');
const OrderBook_abs = require('./OrderBookFactory');
const priorityQueue = require('./PriorityQueue')
const { validateOrder } = require('./Order');

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
            if(order.side === "Buy"){
                const sellOrder = sellQueue.getTop();
                const buyOrder = order;
            }
            else if(order.side === "Sell"){
                const buyOrder = buyQueue.getTop();
                const sellOrder = order;
            }
            if (this._matchOrder(buyOrder, sellOrder)) {
                this._transaction(buyOrder, sellOrder);
            }
            
            if (order.quantity > 0) {
                if (order.side === "Buy") {
                    buyQueue.enqueue(order);
                } else if (order.side === "Sell") {
                    sellQueue.enqueue(order);
                }
            }
        } catch (error) {
            // 如果處理失敗，需要回滾數據庫操作
            throw new Error(`訂單處理失敗: ${error.message}`);
        }
    }

    async _matchOrder(buyOrder, sellOrder) {
        try {
            if (!buyOrder || !sellOrder) 
                throw new Error('訂單不能為空');
            return buyOrder.price >= sellOrder.price;
            
        } catch (error) {
            throw new Error(`訂單撮合失敗: ${error.message}`);
        }
    }

    async _transaction(buyOrder, sellOrder) {
        if (!buyOrder || !sellOrder) {
            throw new Error('交易訂單不能為空');
        }

        try {
            if(buyOrder.side === sellOrder.side){
                throw new Error('交易訂單方向不能相同');
            }
            const transaction_id = await TransactionServices.transaction(buyOrder, sellOrder);
            console.log(`交易成功: ${transaction_id}`);
        } catch (error) {
            throw new Error(`交易執行失敗: ${error.message}`);
        }
    }

    async_logTransaction(order1, order2, quantity) {
        // 記錄交易日誌
        console.log(`Transaction: ${order1.orderId} <-> ${order2.orderId}, Quantity: ${quantity}`);
    }
}

module.exports = PriorityQueueOrderBook;