const request = require('supertest');
const {app, initializeApp} = require('../../app');  // 導入 app 實例
const Database = require('../../database/Database');
const pool = require('../../database/utils/DatabaseConnection');

beforeAll(async () => {
    try{
        await Database.initialize(pool);
        await initializeApp();
    }catch(error){
        console.error("Error initializing app:", error);
    }
});

afterAll(async () => {
    await Database.close();
});


describe('交易相關 API 測試', () => {
    let authToken;

    beforeAll(async () => {
        const response = await request(app)
            .post('/api/users/login')
            .send({
                email: 'admin@example.com',
                password: 'password123'
            });
        authToken = response.body.data.token;
    });

    describe('POST /api/transactions/buy', () => {
        it('應該成功購買股票', async () => {
            const response = await request(app)
                .post('/api/transactions/buy')
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    stock_symbol: '2330',
                    quantity: 1,
                    price: 500
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toContain('successfully purchased');
        });

        it('購買不存在的股票應該失敗', async () => {
            const response = await request(app)
                .post('/api/transactions/buy')
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    stock_symbol: 'INVALID',
                    quantity: 1,
                    price: 500
                });

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/transactions/sell', () => {
        it('應該成功賣出股票', async () => {
            const response = await request(app)
                .post('/api/transactions/sell')
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    stock_symbol: '2330',
                    quantity: 1,
                    price: 500
                });

            expect(response.status).toBe(201);
        });

        it('賣出超過持有數量應該失敗', async () => {
            const response = await request(app)
                .post('/api/transactions/sell')
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    stock_symbol: '2330',
                    quantity: 999999,
                    price: 500
                });

            expect(response.status).toBe(400);
        });
    });
});