const request = require('supertest');
const express = require('express');
const app = express();

describe('股票相關 API 測試', () => {
    let authToken;

    // 在測試開始前先登入獲取 token
    beforeAll(async () => {
        const response = await request(app)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        authToken = response.body.data.token;
    });

    describe('GET /api/stocks/search', () => {
        it('應該成功搜索股票', async () => {
            const response = await request(app)
                .get('/api/stocks/search')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    stock_symbol: '2330'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBeDefined();
        });

        it('未授權應該被拒絕', async () => {
            const response = await request(app)
                .get('/api/stocks/search')
                .send({
                    stock_symbol: '2330'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/stocks/update', () => {
        it('非管理員應該無法更新股票資訊', async () => {
            const response = await request(app)
                .post('/api/stocks/update')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(401);
        });
    });
});