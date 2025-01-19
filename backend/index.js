const express = require('express');
const app = express();
const usersRoutes = require('./database/routes/Users');
const stocksRoutes = require('./database/routes/Stocks');
const userSrocksRoutes = require('./database/routes/Transactions');
const Database = require('./database/Database');
const pool = require('./database/utils/DatabaseConnection');
const PriorityQueueOrderBook = require('./database/services/OrderBook/PriorityQueueOrderBook');
// 初始化數據庫連接
async function initializeApp() {
    try {
        // 初始化數據庫連接
        await Database.initialize(pool);
        console.log('Database connection initialized successfully');

        //獲得OrderBook實例
        const orderbook = PriorityQueueOrderBook.getInstance();
        console.log('OrderBook instance obtained');

        // 初始化 OrderBook
        // await orderbook.initialize();
        // console.log('OrderBook initialized successfully');

        // Express 中間件
        app.use(express.json());
        
        app.locals.orderbook = orderbook;
        // API 路由
        app.use('/api/users', usersRoutes);
        app.use('/api/stocks', stocksRoutes);
        app.use('/api/userStocks', userSrocksRoutes);
        
        // 根路徑
        app.get('/', (req, res) => {
            res.send('Welcome to the Stock Tracker API!');
        });

        // 啟動服務器
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);  // 如果數據庫初始化失敗，結束程序
    }
}

// 啟動應用
initializeApp();

// 優雅關閉
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await Database.close();
    process.exit(0);
});
