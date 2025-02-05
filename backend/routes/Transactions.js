const express = require('express');
const router = express.Router();

const transactionServices = require('../services/Transactions/TransactionServices');


const {authMiddleware} = require('../middlewares/AuthMiddleware');

router.post('/buy', authMiddleware, async (req, res) => {
    const user_id = req.user.user_id;
    const { stock_symbol, quantity, price } = req.body;

    try {
        const result = await transactionServices.createBuyTransaction({
            user_id: user_id,
            stock_symbol: stock_symbol,
            quantity: quantity,
            price: price,
            order_type: price? "Limit" : "Market",
            order_side: "Buy"
        });

        res.status(201).json({
            message: `User ${user_id} successfully purchased stock ${stock_symbol}`,
            ...result
        });
    } catch (error) {
        console.error('Error during buy operation:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


router.post('/sell', authMiddleware, async(req, res)=>{

    const user_id = req.user.user_id;
    const { stock_symbol, quantity, transaction_date } = req.body;
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