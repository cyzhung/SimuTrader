require('dotenv').config({ path: '.env.test' });
// 設置測試環境變量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const { app, initializeApp } = require('../app');
const Database = require('../database/Database');
const pool = require('../database/utils/DatabaseConnection');

beforeAll(async () => {
    // 初始化數據庫
    await Database.initialize(pool);
    
    // 初始化 app（包括 OrderBook）
    await initializeApp();
});

afterAll(async () => {
    await Database.close();
});