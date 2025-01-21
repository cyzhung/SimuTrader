const request = require('supertest');
const app = require('../../app');  // 導入 app 實例
const Database = require('../../database/Database');
const pool = require('../../database/utils/DatabaseConnection');

// 在所有測試開始前連接數據庫
beforeAll(async () => {
    await Database.initialize(pool);
});

// 在所有測試結束後關閉數據庫連接
afterAll(async () => {
    await Database.close();
});

describe('認證相關 API 測試', () => {
    let authToken;

    describe('POST /api/users/register', () => {
        it('應該成功註冊新用戶', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    username: 'testuser'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.token).toBeDefined();
        });

        it('應該拒絕重複的電子郵件', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    username: 'testuser2'
                });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/users/login', () => {
        it('應該成功登入', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            console.log(response.body);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();

            authToken = response.body.data.token;
        });

        it('應該拒絕錯誤的密碼', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
});