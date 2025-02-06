const TransactionsRepository = require('../../repository/TransactionsRepository');
const OrderRepository = require('../../repository/OrderRepository');
const OrderBookService = require('../OrderBook/OrderBookService');
const OrderService = require('../Order/OrderService');
const Database = require('../../database/Database');
const userRepository = require('../../repository/UserRepository');
const stockRepository = require('../../repository/StockRepository');
const UserStocksRepository = require('../../repository/UserStocksRepository');
const UserRepository = require('../../repository/UserRepository');
const { TransactionError, ValidationError, NotFoundError } = require('../../utils/Errors');

class TransactionServices {
    /**
     * 創建買入訂單並進行撮合
     * @param {Object} transactionData - 交易數據
     * @returns {Promise<Object>} 交易結果
     */
    static async createBuyTransaction(transactionData) {
        const client = await Database.transaction();
        
        try {
            // 1. 基礎驗證
            const stock_id = await this._validateTransactionDataAndGetStockID(transactionData);
            // 2. 創建訂單
            transactionData.stock_id = stock_id;
            await client.query('SAVEPOINT order_creation');
            const order = await this._createOrder(transactionData,  client);

            try {
                // 3. 進行撮合
                const result = await this._processTransaction(order, client);

                // 4. 更新用戶持股
                if (result.transactions.length > 0) {
                    await this._updateUserHoldings(result.transactions, client);
                }

                // 5. 提交事務
                await client.commit();
                return this._formatTransactionResult(order, result);

            } catch (error) {
                await client.query('ROLLBACK TO SAVEPOINT order_creation');
                throw error;
            }

        } catch (error) {
            await client.rollback();
            console.error(error)
            throw error;
        }
    }

    /**
     * 創建賣出訂單並進行撮合
     * @param {Object} transactionData - 交易數據
     * @returns {Promise<Object>} 交易結果
     */
    static async createSellTransaction(transactionData) {
        const client = await Database.transaction();
        
        try {
            // 1. 基礎驗證
            
            const stock_id = await this._validateTransactionDataAndGetStockID(transactionData);

            // 2. 檢查持股
            await this._validateUserHoldings(transactionData, client);

            // 3. 創建訂單
            await client.query('SAVEPOINT order_creation');
            transactionData.stock_id = stock_id;
            const order = await this._createOrder(transactionData, client);
            try {
                // 4. 進行撮合
                const result = await this._processTransaction(order, client);

                // 5. 更新用戶持股
                if (result.transactions.length > 0) {
                    await this._updateUserHoldings(transactionData, result.transactions, client);
                }

                // 6. 提交事務
                await client.commit();
                return this._formatTransactionResult(order, result);

            } catch (error) {
                await client.query('ROLLBACK TO SAVEPOINT order_creation');
                throw error;
            }

        } catch (error) {
            await client.rollback();
            console.error(error)
            throw error;
        }
    }

    static async _updateUserHoldings(transactionData, transactions, client) {
        for (const transaction of transactions) {
            if (transactionData.order_side === 'Buy') {
                await this._updateBuyerHoldings(transactionData, transaction, client);
            } else {
                await this._updateSellerHoldings(transactionData, transaction, client);
            }
        }
    }

    /**
     * 更新買方持股
     * @private
     */
    static async _updateBuyerHoldings(transactionData, transaction, client) {
        const user_id = await OrderRepository.get({
            order_id: order_id
        }).rows[0].user_id;

        const stock_id = await StockRepository.get({
            stock_symbol: transaction.stock_symbol
        }).rows[0].stock_id;

        const userStocks = await UserStocksRepository.get({
            user_id: user_id,
            stock_id: stock_id
        }, { transaction: client });

        if (userStocks.rows.length === 0) {
            await UserStocksRepository.insert({
                user_id: transactionData.user_id,
                stock_id: transactionData.stock_id,
                quantity: transaction.quantity,
                purchase_price: transaction.price
            }, { transaction: client });
        } else {
            const currentHolding = userStocks.rows[0];
            const newQuantity = currentHolding.quantity + transaction.quantity;
            const newAvgPrice = (currentHolding.purchase_price * currentHolding.quantity + 
                              transaction.price * transaction.quantity) / newQuantity;
            
            await UserStocksRepository.update({
                user_id: transactionData.user_id,
                stock_id: transactionData.stock_id,
                quantity: newQuantity,
                purchase_price: newAvgPrice
            }, { transaction: client });
        }
    }

    /**
     * 更新賣方持股
     * @private
     */
    static async _updateSellerHoldings(transactionData, transaction, client) {
        const currentHolding = await UserStocksRepository.get({
            user_id: transactionData.user_id,
            stock_id: transactionData.stock_id
        }, { transaction: client });

        const newQuantity = currentHolding.rows[0].quantity - transaction.quantity;
        
        if (newQuantity === 0) {
            await UserStocksRepository.delete({
                user_id: transactionData.user_id,
                stock_id: transactionData.stock_id
            }, { transaction: client });
        } else {
            await UserStocksRepository.update({
                user_id: transactionData.user_id,
                stock_id: transactionData.stock_id,
                quantity: newQuantity
            }, { transaction: client });
        }
    }

    /**
     * 驗證交易數據
     * @private
     */
    static async _validateTransactionDataAndGetStockID(transactionData) {
        // 檢查用戶
        if (!await userRepository.userExist(transactionData.user_id)) {
            throw new ValidationError(`用戶 ${transactionData.user_id} 不存在`);
        }

        // 檢查股票
        const stocks = await stockRepository.get({
            stock_symbol: transactionData.stock_symbol
        });
        if (stocks.rows.length === 0) {
            throw new ValidationError(`股票代碼 ${transactionData.stock_symbol} 不存在`);
        }

        return stocks.rows[0].stock_id;
    }

    /**
     * 驗證用戶持股
     * @private
     */
    static async _validateUserHoldings(transactionData, client) {
        const userStocks = await UserStocksRepository.get({
            user_id: transactionData.user_id,
            stock_id: transactionData.stock_id
        }, { transaction: client });
        
        if (!userStocks.rows.length || userStocks.rows[0].quantity < transactionData.quantity) {
            throw new ValidationError('持股不足');
        }
    }

    /**
     * 創建訂單
     * @private
     */
    static async _createOrder(transactionData, client) {
        const order = OrderService.createOrder(transactionData)
        const order_id = await OrderRepository.insert(order, { transaction: client });
        return { ...order, order_id:order_id };
    }

    /**
     * 處理交易撮合
     * @private
     */
    static async _processTransaction(order, client) {
        OrderBookService.addOrder(order);
        return await this._matchOrders(order, client);
    }

    /**
     * 撮合訂單
     * @private
     */
    static async _matchOrders(order, client) {
        const transactions = [];
        
        while (order.remaining_quantity > 0) {
            const matchResult = await this._findMatchingOrder(order);
            if (!matchResult) break;

            const transaction = await this._executeTransaction(order, matchResult, client);
            transactions.push(transaction);
        }

        return {
            status: order.remaining_quantity === 0 ? 'filled' : 'partial',
            message: order.remaining_quantity === 0 ? '訂單完全成交' : '部分成交',
            transactions
        };
    }
    static async _findMatchingOrder(order){
        return OrderBookService.findMatchingOrder(order);
    }
    static async _executeTransaction(order, matchResult, client){
        const transaction_quantity = Math.min(order.remaining_quantity, matchResult.remaining_quantity);
        const transaction_price = order.order_side==="Buy"? matchResult.price : order.price;

        const buy_order = order.side==="Buy"? order : matchResult;
        const sell_order = order.side==="Sell"? order : matchResult;

        const transaction_id = await TransactionsRepository.insert({
            buy_order_id: buy_order.order_id,
            sell_order_id: sell_order.order_id,
            quantity: transaction_quantity,
            price: transaction_price
        }, { transaction: client });

        return {
            transation_id: transaction_id,
            transaction_quantity: transaction_quantity,
            transaction_price: transaction_price,
            buy_order: buy_order,
            sell_order: sell_order
        }
    }

    /**
     * 格式化交易結果
     * @private
     */
    static _formatTransactionResult(order, result) {
        return {
            order_id: order.order_id,
            stock_id: order.stock_id,
            quantity: order.quantity,
            price: order.price,
            status: result.status,
            message: result.message,
            transactions: result.transactions
        };
    }
}

module.exports = TransactionServices;