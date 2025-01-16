const { match } = require('assert');
const OrderBook_abs = require('./OrderBookFactory');
const priorityQueue = require('./PriorityQueue')
const { validateOrder } = require('./Order');

class PriorityQueueOB extends OrderBook_abs{
    constructor(){
        this.buyQueue = priorityQueue(true);
        this.sellQueue = priorityQueue(false);
    }

    async addddOrder(order) {
        // 訂單驗證
        const errors = validateOrder(order);
        if (errors.length > 0) {
            throw new Error(`訂單驗證失敗: ${JSON.stringify(errors)}`);
        }

        try {
            await super.addOrder(order);
        } catch (error) {
            throw new Error(`訂單存儲失敗: ${error.message}`);
        }

        try {
            if (this.matchOrder(order)) {
                this._transaction(order);
            }
            
            if (order.quantity > 0) {
                if (order.side === "Buy") {
                    this.buyQueue.enqueue(order);
                } else if (order.side === "Sell") {
                    this.sellQueue.enqueue(order);
                }
            }
        } catch (error) {
            // 如果處理失敗，需要回滾數據庫操作
            throw new Error(`訂單處理失敗: ${error.message}`);
        }
    }

    matchOrder(order) {
        try {
            if (!order) throw new Error('訂單不能為空');
            
            if (order.side === "Buy") {
                const sellOrder = this.sellQueue.getTop();
                if (!sellOrder) return false;
                return order.price >= sellOrder.price;
            } else if (order.side === "Sell") {
                const buyOrder = this.buyQueue.getTop();
                if (!buyOrder) return false;
                return order.price <= buyOrder.price;
            }
            
            throw new Error('無效的訂單方向');
        } catch (error) {
            throw new Error(`訂單撮合失敗: ${error.message}`);
        }
    }

    _transaction(order1, order2) {
        if (!order1 || !order2) {
            throw new Error('交易訂單不能為空');
        }

        try {
            const quantity = Math.min(order1.quantity, order2.quantity);
            if (quantity <= 0) {
                throw new Error('交易數量必須大於0');
            }

            order1.quantity -= quantity;
            order2.quantity -= quantity;

            // 這裡可以添加交易記錄
            this._logTransaction(order1, order2, quantity);
        } catch (error) {
            throw new Error(`交易執行失敗: ${error.message}`);
        }
    }

    _logTransaction(order1, order2, quantity) {
        // 記錄交易日誌
        console.log(`Transaction: ${order1.orderId} <-> ${order2.orderId}, Quantity: ${quantity}`);
    }
}