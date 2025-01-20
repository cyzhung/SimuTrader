const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const salt = 99
const UserRepository = require('../repository/UserRepository');
const {authMiddleware} = require('../middleware/AuthMiddleware');
const AuthService = require('../services/Auth/AuthService');
// 創建帳號API
router.post('/register', AuthService.createUser);
//登入請求API
router.post('/login', AuthService.loginUser)


// 範例 API：取得所有用戶
router.get('/', authMiddleware, async (req, res) => {
  if(req.user.role !== 'admin')
    return res.status(401).json({ message: 'Unauthorized' });

  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
