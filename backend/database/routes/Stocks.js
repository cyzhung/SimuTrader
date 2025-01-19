const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const StockRepository = require('../repository/StockRepository');

router.get('/', async (req, res)=>{
    console.log('stocks api');
    res.status(200).json({ message: `
      Welcome to stocks API page, Currently have
      /search api is get request for search stocks, parameters  {stock_symbol, stock_name, market_type},
      /update api is post request for update stocks infomation
      `});
});
router.get('/search', async (req, res) => {
    const { stock_symbol, stock_name, market_type } = req.body;
    const result = await StockRepository.get({stock_symbol: stock_symbol, stock_name: stock_name, market_type: market_type});

    res.status(200).json({ message: result });
});

router.post('/update', async (req, res) =>{
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

module.exports = router;