const TransactionLogsRepository = require('../../repository/TransactionLogsRepository');
const OrderRepository = require('../../repository/OrderRepository');
const OrderBookService = require('../OrderBook/OrderBookService');
const OrderService = require('../Order/OrderService');
const Database = require('../../database/Database');
const userRepository = require('../../repository/UserRepository');
const stockRepository = require('../../repository/StockRepository');
const UserStocksRepository = require('../../repository/UserStocksRepository');

const { ValidationError } = require('../../utils/Errors');

class TransactionServices {
    /**
     * 驗證交易數據
     * @private
     */
    static async _validateTransactionData(transactionData) {
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
    }

    /**
     * 創建買入訂單並進行撮合
     * @param {Object} transactionData - 交易數據
     * @returns {Promise<Object>} 交易結果
     */
    static async createBuyTransaction(transactionData) {
        const client = await Database.transaction();
        
        try {
            // 1. 基礎驗證
            await this._validateTransactionData(transactionData);
            
            // 2. 創建訂單
            const order = await this._createOrder(transactionData, client);

            // 3. 進行撮合
            const transactions = this._processTransaction(order, client);
            // 4. 更新用戶持股
            if (transactions.length > 0) {
                await this._updateUserHoldings(transactions, client);
                const transactionInfo = this._computeTransactionsInfo(transactions);
                this._updateOrderState(order, transactionInfo)
            }

            // 6. 提交事務
            await client.commit();
            return this._formatTransactionResult(order, transactionInfo, result);

        } catch (error) {
            await client.rollback();
            console.error(error);
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
            transactionData.stock_id = stock_id;
            const order = await this._createOrder(transactionData, client);

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
        });

        if (userStocks.rows.length === 0) {
            await UserStocksRepository.insert({
                user_id: transactionData.user_id,
                stock_id: transactionData.stock_id,
                quantity: transaction.quantity,
                purchase_price: transaction.price
            },  {transaction : client} );
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
        } );

        const newQuantity = currentHolding.rows[0].quantity - transaction.quantity;
        
        if (newQuantity === 0) {
            await UserStocksRepository.delete({
                user_id: transactionData.user_id,
                stock_id: transactionData.stock_id
            },  client );
        } else {
            await UserStocksRepository.update({
                user_id: transactionData.user_id,
                stock_id: transactionData.stock_id,
                quantity: newQuantity
            },  client );
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
        },  {transaction : client} );
        
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
        const order_id = await OrderRepository.insert(order,  {transaction : client});
        return { ...order, order_id:order_id };
    }

    /**
     * 處理交易撮合
     * @private
     */
    static async _processTransaction(order, client) {
        OrderBookService.addOrder(order);
        const transactions = await order.match();
        for(const transaction of transactions){
            await TransactionsRepository.insert(transaction,  {transaction : client} );
        }
        return transactions;
    }
    static _computeTransactionsInfo(transactions){
        let avgPrice = 0;
        let quantity = 0;
        for(const transaction of transactions){
            avgPrice += transaction.transaction_price;
            quantity += transaction.transaction_quantity;
        }

        return {
            totalQuantity: quantity,
            avgPrice: avgPrice
        }
    }
    static async _updateOrderState(order, transactionInfo){
        if(order.order_type === "Market"){
            const beforeQuantity = (order.quantity - order.remaining_quantity);
            const totalQuantity = beforeQuantity + transactionInfo.totalQuantit;
            const beforePrice = order.price * beforeQuantity;
            const transactionPrice = transactionInfo.avgPrice * transactionInfo.totalQuantity;
            order.price = (beforePrice + transactionPrice) / totalQuantity;

            OrderRepository.update({
                order_id: order.order_id,
                price: order.price,
                remaining_quantity: order.remaining_quantity
            })
        }
    }
    /**
     * 格式化交易結果
     * @private
     */
    static _formatTransactionResult(order, transactionInfo, result) {
        return {
            order_id: order.order_id,
            stock_id: order.stock_id,
            quantity: transactionInfo.totalQuantity,
            price: transactionInfo.avgPrice,
            status: result.status,
            message: result.message
        };
    }
}

module.exports = TransactionServices;