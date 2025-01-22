const request = require('supertest');
const {app} = require('../../app');  // 導入 app 實例
const Database = require('../../database/Database');
const pool = require('../../database/utils/DatabaseConnection');

beforeAll(async () => {
    await Database.initialize(pool);

});

afterAll(async () => {
    await Database.close();
});

describe('訂單相關 API 測試', () => {
    let authToken;

    beforeAll(async () => {
        const response = await request(app)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        authToken = response.body.data.token;
    });

    describe('GET /api/orders/search', () => {
        it('應該成功搜索訂單', async () => {
            const response = await request(app)
                .get('/api/orders/search')
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    status: 'pending'
                });
            expect(response.status).toBe(200);
            expect(response.body.message).toBeDefined();
        });
    });
});