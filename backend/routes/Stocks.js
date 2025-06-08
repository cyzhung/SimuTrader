const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const redisClient = require('../utils/redisClient'); // 引入 Redis 客戶端
const StockRepository = require('../repository/StockRepository');

const {authMiddleware} = require('../middlewares/AuthMiddleware');

router.get('/', authMiddleware, async (req, res)=>{
    console.log('stocks api');
    res.status(200).json({ message: `
      Welcome to stocks API page, Currently have
      /search api is get request for search stocks, parameters  {stock_symbol, stock_name, market_type},
      /update api is post request for update stocks infomation
      `});
});

router.get('/search', authMiddleware, async (req, res) => {
    const { stock_symbol, stock_name, market_type } = req.body;
    try{
        const result = await StockRepository.get({stock_symbol: stock_symbol, stock_name: stock_name, market_type: market_type});
        res.status(200).json({ message: result });
    }
    catch(error){
        console.error('Error during search operation:', error.message);
        res.status(error.status || 500).json({ message: 'Internal server error', error: error.message });
    }
    
});

router.post('/update', authMiddleware, async (req, res) =>{
    const user = req.user;
    if(user.role !== 'admin')
        return res.status(401).json({ message: 'Unauthorized' });

    const pythonPath = process.env.PYTHONBINPATH;
    const scriptPath = process.env.UPDATE_SCRIPT_PATH;

    exec(`${pythonPath}  ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`執行錯誤: ${error.message}`);
          return res.status(500).json({ error: `執行錯誤: ${error.message}` });
        }
        if (stderr) {
          console.error(`Python 錯誤輸出: ${stderr}`);
          return res.status(500).json({ error: `Python 錯誤輸出: ${stderr}` });
        }
        
        res.status(200).json({ message: '更新成功', output: stdout });
      });

});



router.get('/popular', authMiddleware, async (req, res) => {
    try {
        // 取 Redis 中的前 10 名熱門股票，包含分數
        const result = await redisClient.zRevRange('hot_stocks', 0, 9, { WITHSCORES: true });

        const stocks = [];
        for (let i = 0; i < result.length; i += 2) {
            stocks.push({
                symbol: result[i],
                score: parseInt(result[i + 1]),
            });
        }

        res.status(200).json({
            message: '熱門股票排行榜',
            stocks: stocks,
        });
    } catch (error) {
        console.error('Error fetching popular stocks:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


module.exports = router;