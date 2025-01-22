const express = require('express');
const app = express();
const usersRoutes = require('./routes/Users');
const stocksRoutes = require('./routes/Stocks');
const userStocksRoutes = require('./routes/Transactions');
const ordersRoutes = require('./routes/Orders');
const transactionsRoutes = require('./routes/Transactions');
const PriorityQueueOrderBook = require('./services/OrderBook/PriorityQueueOrderBook');

// Express 中間件
app.use(express.json());

// 初始化 OrderBook 並添加到 app.locals
const initializeApp = async () => {
    try {
        const orderbook = PriorityQueueOrderBook.getInstance();
        orderbook.initialize();
        app.locals.orderbook = orderbook;
    } catch (error) {
        console.error('Failed to initialize OrderBook:', error);
        throw error;
    }
};

// API 路由
app.use('/api/users', usersRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/userStocks', userStocksRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/transactions', transactionsRoutes);
// 根路徑
app.get('/', (req, res) => {
    res.send('Welcome to the Stock Tracker API!');
});

module.exports = { app, initializeApp };  // 導出 app 實例和初始化函數