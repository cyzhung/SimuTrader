const TransactionsRepository = require('../../repository/TransactionsRepository');
const OrderRepository = require('../../repository/OrderRepository');
const OrderService = require('../Order/OrderService');
const OrderBookService = require('../OrderBook/OrderBookService');
const Database = require('../../database/Database');
const userRepository = require('../../repository/UserRepository');
const stockRepository = require('../../repository/StockRepository');
const UserStocksRepository = require('../../repository/UserStocksRepository');

class TransactionServices {
    static async createBuyTransaction(transactionData) {
        const client = await Database.transaction();
        
        try {
            // 1. 檢查用戶和股票
            if (!await userRepository.userExist(transactionData.user_id)) {
                throw new Error(`用戶 ${transactionData.user_id} 不存在`);
            }

            const stocks = await stockRepository.get({
                stock_symbol: transactionData.stock_symbol
            });
            if (stocks.rows.length === 0) {
                throw new Error(`股票代碼 ${transactionData.stock_symbol} 不存在`);
            }
            
            // 2. 創建買入訂單
            const order = OrderService.createOrder({
                user_id: transactionData.user_id,
                stock_id: stocks.rows[0].stock_id,
                quantity: transactionData.quantity,
                remaining_quantity: transactionData.quantity,
                price: transactionData.price,
                order_side: 'Buy',
                order_type: transactionData.price ? 'Limit' : 'Market',
                status: 'pending'
            });

            const order_id = await OrderRepository.insert(order, { transaction: client });
            OrderBookService.addOrder({
                ...order,
                order_id: order_id
            });
    
            // 3. 將訂單加入訂單簿並進行撮合
            const result = await this.transaction({
                ...order,
                order_id
            });

            // 4. 如果有成交，更新用戶持股
            if (result.transactions.length > 0) {
                for (const transaction of result.transactions) {
                    const userStocks = await UserStocksRepository.get({
                        user_id: transactionData.user_id,
                        stock_id: stocks.rows[0].stock_id
                    }, { transaction: client });

                    if (userStocks.rows.length === 0) {
                        // 新建持股記錄
                        await UserStocksRepository.insert({
                            user_id: transactionData.user_id,
                            stock_id: stocks.rows[0].stock_id,
                            quantity: transaction.quantity,
                            purchase_price: transaction.price
                        }, { transaction: client });
                    } else {
                        // 更新現有持股
                        const currentHolding = userStocks.rows[0];
                        const newQuantity = currentHolding.quantity + transaction.quantity;
                        const newAvgPrice = (currentHolding.purchase_price * currentHolding.quantity + 
                                          transaction.price * transaction.quantity) / newQuantity;
                        
                        await UserStocksRepository.update({
                            user_id: transactionData.user_id,
                            stock_id: stocks.rows[0].stock_id,
                            quantity: newQuantity,
                            purchase_price: newAvgPrice
                        }, { transaction: client });
                    }
                }
            }

            await client.commit();
            return {
                order_id,
                stock_id: stocks.rows[0].stock_id,
                quantity: transactionData.quantity,
                price: transactionData.price,
                status: result.status,
                message: result.message,
                transactions: result.transactions
            };

        } catch (error) {
            await client.rollback();
            throw error;
        }
    }

    static async createSellTransaction(transactionData) {
        const client = await Database.transaction();
        
        try {
            // 1. 檢查用戶和股票
            if (!await userRepository.userExist(transactionData.user_id)) {
                throw new Error(`用戶 ${transactionData.user_id} 不存在`);
            }

            const stocks = await stockRepository.get({
                stock_symbol: transactionData.stock_symbol
            });
            if (stocks.rows.length === 0) {
                throw new Error(`股票代碼 ${transactionData.stock_symbol} 不存在`);
            }

            // 2. 檢查用戶持股
            const userStocks = await UserStocksRepository.get({
                user_id: transactionData.user_id,
                stock_id: stocks.rows[0].stock_id
            });

            if (!userStocks.rows.length || userStocks.rows[0].quantity < transactionData.quantity) {
                throw new Error('持股不足');
            }

            // 3. 創建賣出訂單
            const order = {
                user_id: transactionData.user_id,
                stock_id: stocks.rows[0].stock_id,
                quantity: transactionData.quantity,
                remaining_quantity: transactionData.quantity,
                price: transactionData.price,
                order_side: 'Sell',
                order_type: transactionData.price ? 'Limit' : 'Market',
                status: 'pending'
            };

            const order_id = await OrderRepository.insert(order, { transaction: client });

            // 4. 將訂單加入訂單簿並進行撮合
            const result = await this.transaction({
                ...order,
                order_id
            });

            // 5. 如果有成交，更新用戶持股
            if (result.transactions.length > 0) {
                for (const transaction of result.transactions) {
                    const currentHolding = userStocks.rows[0];
                    const newQuantity = currentHolding.quantity - transaction.quantity;
                    
                    if (newQuantity === 0) {
                        await UserStocksRepository.delete({
                            user_id: transactionData.user_id,
                            stock_id: stocks.rows[0].stock_id
                        }, { transaction: client });
                    } else {
                        await UserStocksRepository.update({
                            user_id: transactionData.user_id,
                            stock_id: stocks.rows[0].stock_id,
                            quantity: newQuantity
                        }, { transaction: client });
                    }
                }
            }

            await client.commit();
            return {
                order_id,
                stock_id: stocks.rows[0].stock_id,
                quantity: transactionData.quantity,
                price: transactionData.price,
                status: result.status,
                message: result.message,
                transactions: result.transactions
            };

        } catch (error) {
            await client.rollback();
            throw error;
        }
    }

    static async _transaction(buyOrder, sellOrder) {
        try {
            // 計算交易數量
            const transactionQuantity = Math.min(buyOrder.remaining_quantity, sellOrder.remaining_quantity);
            
            const transactionInfo = {
                buy_order_id: buyOrder.order_id,
                sell_order_id: sellOrder.order_id,
                quantity: transactionQuantity,
                price: buyOrder.price
            }
            // 創建交易記錄
            const transaction_id = await TransactionsRepository.insert({
                buy_order_id: buyOrder.order_id,
                sell_order_id: sellOrder.order_id,
                quantity: transactionQuantity,
                price: buyOrder.price
            });

            // 更新訂單數量
            buyOrder.remaining_quantity -= transactionQuantity;
            sellOrder.remaining_quantity -= transactionQuantity;

            // 更新訂單狀態
            buyOrder.status = buyOrder.remaining_quantity === 0 ? 'filled' : 'partial';
            sellOrder.status = sellOrder.remaining_quantity === 0 ? 'filled' : 'partial';

            return {
                buy_order: buyOrder,
                sell_order: sellOrder,
                transaction_id
            };
        } catch (error) {
            throw new Error(`交易執行失敗: ${error.message}`);
        }
    }
    static async transaction(order) {
        const orderbook = OrderBookService.getOrderBook();
        const transactions = [];
        OrderBookService.addOrder(order);
        while (order.remaining_quantity > 0) {
            const {buyQueue, sellQueue} = orderbook.getOrderQueues(order.stock_id);
            let buyOrder, sellOrder;

            if (order.side === 'buy') {
                buyOrder = order;
                sellOrder = sellQueue.getTop();
                if (!sellOrder) break;
            } else {
                sellOrder = order;
                buyOrder = buyQueue.getTop();
                if (!buyOrder) break;
            }

            if (!OrderBookService.matchOrders(buyOrder, sellOrder)) {
               break;
            }

            const transaction = await this._transaction(buyOrder, sellOrder);
            transactions.push(transaction);
            
            for(const transaction of transactions){
                await Promise.all([
                    OrderRepository.updateOrder(transaction.buy_order),
                    OrderRepository.updateOrder(transaction.sell_order)
                ]);
            }
            // 只移除不是新進訂單的完成訂單
            if (buyOrder.remaining_quantity === 0 && buyOrder !== order) {
                buyQueue.dequeue();
            }
            if (sellOrder.remaining_quantity === 0 && sellOrder !== order) {
                sellQueue.dequeue();
            }
        }
        // 如果還有剩餘數量，加入訂單簿
        if (order.remaining_quantity > 0 && order.status !== 'filled') {
            orderbook.addOrder(order);
            return {
                status: 'partial',
                message: '部分成交，剩餘訂單已加入訂單簿',
                transactions
            };
        }

        return {
            status: 'filled',
            message: '訂單完全成交',
            transactions
        };
    }
}

module.exports = TransactionServices;