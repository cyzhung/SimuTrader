const express = require('express');
const app = express();
const usersRoutes = require('./routes/Users');
const stocksRoutes = require('./routes/Stocks');
const userStocksRoutes = require('./routes/Transactions');

// Express 中間件
app.use(express.json());

// API 路由
app.use('/api/users', usersRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/userStocks', userStocksRoutes);

// 根路徑
app.get('/', (req, res) => {
    res.send('Welcome to the Stock Tracker API!');
});

module.exports = app;  // 導出 app 實例