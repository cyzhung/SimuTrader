const express = require('express');
const app = express();
const usersRoutes = require('./routes/Users');
const stocksRoutes = require('./routes/Stocks');
const ordersRoutes = require('./routes/Orders');
const transactionsRoutes = require('./routes/Transactions');

// Express 中間件
app.use(express.json());

// API 路由
app.use('/api/users', usersRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/transactions', transactionsRoutes);
// 根路徑
app.get('/', (req, res) => {
    res.send('Welcome to the Stock Tracker API!');
});

module.exports = {app};  // 只導出 app 實例