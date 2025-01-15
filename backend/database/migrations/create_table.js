
const pool = require('../connection'); // 引入資料庫連線

const initDatabase = async () => {
  console.log('Testing database connection...');
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('Database connection successful:', result.rows[0]);
    } catch (err) {
      console.error('Database connection failed:', err);
      return; // 如果連線失敗，不繼續執行
    }

  try {
    console.log('Starting database initialization...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );`
    );
    console.log('Users table created.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stocks (
        stock_id SERIAL PRIMARY KEY,
        stock_symbol VARCHAR(10) UNIQUE NOT NULL,
        stock_name VARCHAR(255) NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        market_type VARCHAR(2) NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );`
    );
    console.log('Stocks table created.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_stocks (
        user_stock_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        stock_id INT REFERENCES stocks(stock_id) ON DELETE CASCADE,
        quantity INT NOT NULL,
        purchase_price NUMERIC(10, 2) NOT NULL
      );
    `);
    console.log('User stocks table created.');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_prices (
        price_id SERIAL PRIMARY KEY,
        stock_id INT REFERENCES stocks(stock_id) ON DELETE CASCADE, -- 外鍵，連結到 stocks 表
        price_date TIMESTAMP NOT NULL,           -- 價格的日期
        open_price NUMERIC(10, 2),               -- 開盤價
        close_price NUMERIC(10, 2),              -- 收盤價
        high_price NUMERIC(10, 2),               -- 最高價
        low_price NUMERIC(10, 2),                -- 最低價
        volume BIGINT,                           -- 交易量
        UNIQUE(stock_id, price_date)             -- 防止同一日期重複插入
      );`
    );
    console.log('stock_prices table created.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,    -- 外鍵，連結到 users 表
        stock_id INT REFERENCES stocks(stock_id) ON DELETE CASCADE, -- 外鍵，連結到 stocks 表
        transaction_date TIMESTAMP DEFAULT NOW(),                   -- 交易日期
        transaction_type VARCHAR(10) NOT NULL,                      -- 交易類型(買入/賣出)
        price NUMERIC(10, 2) NOT NULL CHECK(price > 0),             -- 交易價格
        quantity INT NOT NULL CHECK (quantity > 0)                  -- 交易數量
      );`
    );
    console.log('stock_prices table created.');

    await pool.query(`
      CREATE TABLE orders (
        order_id SERIAL PRIMARY KEY,              -- 訂單唯一ID
        user_id INT REFERENCES users(user_id),    -- 下單用戶
        stock_id INT REFERENCES stocks(stock_id), -- 股票ID
        order_type VARCHAR(10) NOT NULL,          -- 訂單類型（'buy' 或 'sell'）
        price NUMERIC(10, 2) NOT NULL,            -- 訂單價格（限價單需要）
        quantity INT NOT NULL,                    -- 訂單數量
        remaining_quantity INT NOT NULL,          -- 剩餘未成交數量
        created_at TIMESTAMP DEFAULT NOW(),       -- 訂單創建時間
        status VARCHAR(10) DEFAULT 'pending'      -- 訂單狀態（'pending', 'partial', 'completed', 'cancelled'）
    );`)
    console.log('orders table created.');

    console.log('Database initialized successfully!');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    // 確保連線池被關閉
    try {
      await pool.end();
      console.log('Database connection pool closed.');
    } catch (err) {
      console.error('Error closing pool:', err);
    }
  }
};

module.exports = initDatabase;

// 執行初始化
initDatabase();
