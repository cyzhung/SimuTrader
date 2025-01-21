require('dotenv').config({ path: '.env.test' });
// 設置測試環境變量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';