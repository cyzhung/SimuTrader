const app = require('express')();
const Database = require('./database/Database');
const OrderBookService = require('./services/OrderBook/OrderBookService');

// 初始化應用
async function initializeApp() {
    try {
        await Database.initialize();
        console.log('Database connection initialized successfully');
        // 初始化 OrderBook
        await OrderBookService.initialize();
        console.log('OrderBook initialized successfully');


        // 啟動服務器
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
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
