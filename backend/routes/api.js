const express = require('express');
const router = express.Router();
const pool = require('../database/connection');


// 根目錄
router.get('/', (req, res) => {
    res.send("Hello");
  });


// 範例 API：取得所有用戶
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
