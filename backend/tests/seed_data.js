const pool = require('../database/utils/DatabaseConnection');
const bcrypt = require('bcrypt');

const seedDatabase = async () => {
    try {
        console.log('開始插入測試數據...');

        // 1. 插入測試用戶
        const hashedPassword = await bcrypt.hash('password123', 10);
        const usersResult = await pool.query(`
            INSERT INTO users (username, role, email, password_hash)
            VALUES 
                ('testuser', 'user', 'test@example.com', $1),
                ('adminuser', 'admin', 'admin@example.com', $1)
            RETURNING user_id;
        `, [hashedPassword]);
        console.log('測試用戶創建成功');

        // 2. 插入股票數據
        const stocksResult = await pool.query(`
            INSERT INTO stocks (stock_symbol, stock_name, price, market_type)
            VALUES 
                ('2330', '台積電', 500.00, 'TW'),
                ('2317', '鴻海', 100.50, 'TW'),
                ('2454', '聯發科', 750.00, 'TW'),
                ('2412', '中華電', 120.50, 'TW')
            RETURNING stock_id;
        `);
        console.log('測試股票創建成功');

        // 3. 插入用戶持股數據
        await pool.query(`
            INSERT INTO user_stocks (user_id, stock_id, quantity, purchase_price)
            VALUES 
                ($1, $2, 1000, 495.00),
                ($1, $3, 500, 98.50)
        `, [usersResult.rows[0].user_id, stocksResult.rows[0].stock_id, stocksResult.rows[1].stock_id]);
        console.log('測試用戶持股創建成功');

        // 4. 插入股票價格歷史數據
        const today = new Date();
        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            for (const stock of stocksResult.rows) {
                await pool.query(`
                    INSERT INTO stock_prices 
                    (stock_id, price_date, open_price, close_price, high_price, low_price, volume)
                    VALUES 
                    ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (stock_id, price_date) DO NOTHING
                `, [
                    stock.stock_id,
                    date,
                    500 + Math.random() * 10,
                    505 + Math.random() * 10,
                    510 + Math.random() * 10,
                    495 + Math.random() * 10,
                    Math.floor(Math.random() * 1000000)
                ]);
            }
        }
        console.log('股票價格歷史數據創建成功');

        // 5. 插入交易記錄
        await pool.query(`
            INSERT INTO transactions 
            (user_id, stock_id, transaction_type, price, quantity)
            VALUES 
                ($1, $2, 'buy', 498.00, 500),
                ($1, $2, 'sell', 505.00, 200),
                ($1, $3, 'buy', 99.50, 300)
        `, [usersResult.rows[0].user_id, stocksResult.rows[0].stock_id, stocksResult.rows[1].stock_id]);
        console.log('測試交易記錄創建成功');

        // 6. 插入訂單數據
        await pool.query(`
            INSERT INTO orders 
            (user_id, stock_id, order_side, order_type, price, quantity, remaining_quantity, status)
            VALUES 
                ($1, $2, 'Buy', 'Limit', 495.00, 100, 100, 'pending'),
                ($1, $2, 'Sell', 'Limit', 510.00, 50, 50, 'pending'),
                ($1, $3, 'Buy', 'Market', 100.00, 200, 200, 'pending')
        `, [usersResult.rows[0].user_id, stocksResult.rows[0].stock_id, stocksResult.rows[1].stock_id]);
        console.log('測試訂單創建成功');

        console.log('所有測試數據插入完成！');

    } catch (error) {
        console.error('插入測試數據時發生錯誤:', error);
    } finally {
        await pool.end();
        console.log('數據庫連接已關閉');
    }
};

// 執行 seed
seedDatabase();