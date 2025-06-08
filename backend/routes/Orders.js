const express = require('express');
const router = express.Router();
const OrderRepository = require('../repository/OrderRepository');
const {authMiddleware} = require('../middlewares/AuthMiddleware');

router.get('/search', authMiddleware, async (req, res) => {

    const user_id = req.user.user_id;

    const { order_id, stock_id, order_type } = req.body;

    try{
        const orders = await OrderRepository.get(filters={user_id:user_id, order_id:order_id, stock_id:stock_id, order_type:order_type});
        res.status(200).json({ message: orders });
    }catch(error){
        console.error('Error during search operation:', error.message);
        res.status(error.status || 500 ).json({ message: 'Internal server error', error: error.message });
        res
    }
});


module.exports = router;