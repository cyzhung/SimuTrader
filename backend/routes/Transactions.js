const express = require('express');
const router = express.Router();
const stockRepository = require('../repository/StockRepository');
const userStocksRepository = require('../repository/UserStocksRepository');
const transactionsRepository = require('../repository/TransactionsRepository');
const OrderRepository = require('../repository/OrderRepository');
const Order = require('../services/Order/Order');
const authMiddleware = require('../services/Auth/AuthController');

router.post('/buy', authMiddleware, async (req, res) => {
    const user_id = req.user.user_id;
    const { stock_symbol, quantity, price } = req.body;
    const transaction_date = req.body.transaction_date || new Date(); // 預設當前時間


    try {
        // 檢查用戶是否存在
        if(!await UserRepository.userExist(user_id))
            return res.status(404).json({ message: `User ${user_id} doesn't exist` });

        // 檢查股票是否存在
        const stocks = await stockRepository.get({stock_symbol: stock_symbol});
        if(stocks.rows.length === 0)
            return res.status(404).json({ message: `Stock symbol ${stock_symbol} doesn't exist` });

        const stock_id = stocks.rows[0]['stock_id'];
        const order_id = OrderRepository.add(user_id, stock_id, quantity, price, 'buy');

        const order = Order.createOrder(order_id, user_id, stock_id, quantity, price, 'buy');

        //處理order，包括更新user_stocks和transactions以及match
        try{
            const result = await transactionService.transaction(order);
            
            for(const transaction of result.transactions){
                await TransactionsRepository.insert(transaction);
            }
        } catch (error){
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }


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