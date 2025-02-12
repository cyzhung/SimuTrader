const request = require('supertest');
const {app} = require('../../app');  // 導入 app 實例




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
                    order_type: 'Limit'
                });
            expect(response.status).toBe(200);
            expect(response.body.message).toBeDefined();
        });
    });
});