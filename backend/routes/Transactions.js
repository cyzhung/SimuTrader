const express = require('express');
const router = express.Router();
const transactionServices = require('../services/Transactions/TransactionServices');
const { authMiddleware } = require('../middlewares/AuthMiddleware');

router.post('/buy', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { stock_symbol, quantity, price} = req.body;
 
        const result = await transactionServices.createBuyTransaction({
            user_id: user_id,
            stock_symbol: stock_symbol,
            quantity: quantity,
            price: price,
            order_side: "Buy",
            order_type: price? "Limit":"Market"
        });

        res.status(201).json({
            success: true,
            message: `成功建立買單 ${req.body.stock_symbol}`,
            data: result
        });
    } catch (error) {
        // 使用錯誤類的 toJSON 方法
        console.error('Error during buy operation:', error.message);
        res.status(error.status || 500).json(error.toJSON());
    }
});


router.post('/sell', authMiddleware, async(req, res)=>{

    const user_id = req.user.user_id;
    const { stock_symbol, quantity, price } = req.body;
    try{
        const result = await transactionServices.createSellTransaction({
            user_id: user_id,
            stock_symbol: stock_symbol,
            quantity: quantity,
            price: price,
            order_side: "Sell",
            order_type: price? "Limit" : "Market"
        });

        res.status(201).json({
            success: true,
            message: `成功建立賣單 ${req.body.stock_symbol}`,
            data: result
        });
    } catch (error){
        console.error('Error during sell operation:', error.message);
        res.status(error.status || 500).json({ message: 'Internal server error', error: error.message });
    }
});

module.exports = router;