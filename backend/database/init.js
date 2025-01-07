const pool = require('./connection'); // 引入資料庫連線

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
      );
    `);
    console.log('Users table created.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stocks (
        stock_id SERIAL PRIMARY KEY,
        stock_symbol VARCHAR(10) UNIQUE NOT NULL,
        stock_name VARCHAR(255) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Stocks table created.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_stocks (
        user_stock_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        stock_id INT REFERENCES stocks(stock_id) ON DELETE CASCADE,
        quantity INT NOT NULL,
        purchase_price NUMERIC(10, 2) NOT NULL,
        transaction_date TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('User stocks table created.');

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
