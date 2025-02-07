const request = require('supertest');
const {app, initializeApp} = require('../../app');  // 導入 app 實例
const Database = require('../../database/Database');
const pool = require('../../database/utils/DatabaseConnection');
const UserStocksRepository = require('../../repository/UserStocksRepository');

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
    const testUserId = 1;  // 假設測試用戶 ID 為 1
    const testStockId = 1; // 假設台積電的 stock_id 為 1

    beforeAll(async () => {
        const response = await request(app)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        authToken = response.body.data.token;
    });

    describe('POST /api/transactions/buy', () => {
        it('應該成功購買股票並更新持股數量', async () => {
            // 1. 獲取購買前的持股數量
            const beforeHolding = await UserStocksRepository.get({
                user_id: testUserId,
                stock_id: testStockId
            });
            const beforeQuantity = beforeHolding.rows[0]?.quantity || 0;

            // 2. 執行購買
            const buyQuantity = 100;
            const response = await request(app)
                .post('/api/transactions/buy')
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    stock_symbol: '2330',
                    quantity: buyQuantity,
                    price: 500
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            // 3. 檢查購買後的持股數量
            const afterHolding = await UserStocksRepository.get({
                user_id: testUserId,
                stock_id: testStockId
            });
            const afterQuantity = afterHolding.rows[0].quantity;

            // 4. 驗證持股數量增加正確
            expect(afterQuantity).toBe(beforeQuantity + buyQuantity);
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

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/transactions/sell', () => {
        it('應該成功賣出股票並更新持股數量', async () => {
            // 1. 獲取賣出前的持股數量
            const beforeHolding = await UserStocksRepository.get({
                user_id: testUserId,
                stock_id: testStockId
            });
            const beforeQuantity = beforeHolding.rows[0].quantity;

            // 2. 執行賣出
            const sellQuantity = 50;
            const response = await request(app)
                .post('/api/transactions/sell')
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    stock_symbol: '2330',
                    quantity: sellQuantity,
                    price: 500
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            // 3. 檢查賣出後的持股數量
            const afterHolding = await UserStocksRepository.get({
                user_id: testUserId,
                stock_id: testStockId
            });
            
            // 4. 驗證持股數量減少正確
            if (beforeQuantity === sellQuantity) {
                // 如果全部賣出，應該沒有持股記錄
                expect(afterHolding.rows.length).toBe(0);
            } else {
                const afterQuantity = afterHolding.rows[0].quantity;
                expect(afterQuantity).toBe(beforeQuantity - sellQuantity);
            }
        });

        it('賣出超過持有數量應該失敗且持股不變', async () => {
            // 1. 獲取賣出前的持股數量
            const beforeHolding = await UserStocksRepository.get({
                user_id: testUserId,
                stock_id: testStockId
            });
            const beforeQuantity = beforeHolding.rows[0]?.quantity || 0;

            // 2. 嘗試賣出超過持有數量
            const response = await request(app)
                .post('/api/transactions/sell')
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    stock_symbol: '2330',
                    quantity: 999999,
                    price: 500
                });

            expect(response.status).toBe(400);

            // 3. 檢查持股數量是否維持不變
            const afterHolding = await UserStocksRepository.get({
                user_id: testUserId,
                stock_id: testStockId
            });
            const afterQuantity = afterHolding.rows[0]?.quantity || 0;

            expect(afterQuantity).toBe(beforeQuantity);
        });
    });

    describe('交易價格測試', () => {
        it('市價單應該以最新成交價格成交', async () => {
            // 1. 執行市價買單
            const response = await request(app)
                .post('/api/transactions/buy')
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    stock_symbol: '2330',
                    quantity: 100,
                    // 不提供 price，表示市價單
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            // 2. 檢查成交價格是否合理
            const transaction = response.body.data.transactions[0];
            expect(transaction.price).toBeTruthy();  // 確保有成交價格
            expect(typeof transaction.price).toBe('number');
        });
    });
});