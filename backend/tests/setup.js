require('dotenv').config({ path: '.env.test' });
const {app} = require('../app');
// 設置測試環境變量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const Database = require('../database/Database');
const OrderBookService = require('../services/OrderBook/OrderBookService');



beforeAll(async () => {
    try {
        await Database.initialize(); 

        await OrderBookService.initialize();

    } catch (error) {
        console.error('Failed to initialize OrderBook:', error);
        throw error;
    }
});

afterAll(async () => {
    
    try {      
        // 關閉數據庫連接
        await Database.close();
    } catch (error) {
        console.error('關閉測試環境時出錯:', error);
        throw error;
    }
}, 50000);  // 增加超時時間到 10 秒