const express = require('express');
const router = express.Router();
const pool = require('../database/connection');


router.post('/buy', async (req, res) => {
    const { user_id, stock_symbol, quantity, price } = req.body;
    const transaction_date = req.body.transaction_date || new Date(); // 預設當前時間

    try {
        // 檢查用戶是否存在
        const checkUserSQL = `SELECT * FROM users WHERE user_id = $1`;
        const existingUser = await pool.query(checkUserSQL, [user_id]);
        if (existingUser.rows.length === 0)
            return res.status(404).json({ message: `User ${user_id} doesn't exist` });

        // 檢查股票是否存在
        const getIDSQL = `SELECT stock_id FROM stocks WHERE stock_symbol = $1`;
        const existingStock = await pool.query(getIDSQL, [stock_symbol]);
        if (existingStock.rows.length === 0)
            return res.status(404).json({ message: `Stock symbol ${stock_symbol} doesn't exist` });

        const stock_id = existingStock.rows[0]['stock_id'];

        // 更新或新增 user_stocks 中的記錄
        const userStocksSQL = `
            INSERT INTO user_stocks (user_id, stock_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, stock_id)
            DO UPDATE SET quantity = user_stocks.quantity + EXCLUDED.quantity;
        `;
        await pool.query(userStocksSQL, [user_id, stock_id, quantity]);

        // 插入交易紀錄到 transactions 表格
        const transactionSQL = `
            INSERT INTO transactions (user_id, stock_id, quantity, price, transaction_date, transaction_type)
            VALUES ($1, $2, $3, $4, $5, $6);
        `;
        await pool.query(transactionSQL, [user_id, stock_id, quantity, price, transaction_date, 'buy']);

        // 返回成功訊息
        res.status(201).json({
            message: `User ${user_id} successfully purchased stock ${stock_symbol}`,
            user_id: user_id,
            stock_id: stock_id,
            quantity: quantity,
            price: price,
            transaction_date: transaction_date
        });
    } catch (error) {
        console.error('Error during buy operation:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


router.post('/sell', async(req, res)=>{
    const { user_id, stock_symbol, quantity, transaction_date } = req.body;
    try{
        const checkUserSQL = `SELECT * FROM users WHERE user_id = $1`;
        const existingUser = await pool.query(checkUserSQL, [user_id]);
        if(existingUser.rows.length === 0)
            return res.status(201).json({ message: `User ${user_id} doesn't exist`});

        const getIDSQL = 'SELECT stock_id FROM stocks WHERE stock_symbol = $1';
        const existingStock = await pool.query(getIDSQL, [stock_symbol]);
        if(existingStock.rows.length === 0)
            return res.status(201).json({ message: `stock_symbol ${stock_symbol} doesn't exist`});

        const stock_id = existingStock.rows[0]['stock_id']

        const sql = 'INSERT INTO user_stocks (user_id, stock_id, quantity, purchase_price, transaction_date) VALUES ($1, $2, $3, $4, $5)'; 

        await pool.query(sql, [user_id, stock_id, quantity, price, transaction_date]);
        res.status(201).json({ message: `User ${user_id} purchase ${stock_id}`, user_id: user_id, stock_id: stock_id, quantity: quantity, price: price, transaction_date: transaction_date});
    } catch (error){
        console.error('Error during sell operation:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

module.exports = router;