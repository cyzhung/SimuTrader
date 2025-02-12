require('dotenv').config({ path: '.env.test' });
// 設置測試環境變量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const Database = require('../database/Database');
const OrderBookService = require('../services/OrderBook/OrderBookService');


let server;

beforeAll(async () => {
    try {
        await Database.initialize(); 
        console.log('Database connection initialized successfully');
        await OrderBookService.initialize();
        console.log('OrderBook initialized successfully');
    } catch (error) {
        console.error('Failed to initialize OrderBook:', error);
        throw error;
    }
});

afterAll(async () => {
    console.log('開始關閉測試環境...');
    try {
        // 關閉數據庫連接
        await Database.close();
        console.log('數據庫連接已關閉');
    } catch (error) {
        console.error('關閉測試環境時出錯:', error);
        throw error;
    }
}, 10000);  // 增加超時時間到 10 秒