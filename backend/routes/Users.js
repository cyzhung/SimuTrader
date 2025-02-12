const express = require('express');
const router = express.Router();

const UserRepository = require('../repository/UserRepository');
const AuthController = require('../services/Auth/AuthController');
// 創建帳號API
router.post('/register', AuthController.register);
//登入請求API
router.post('/login', AuthController.login);


// 範例 API：取得所有用戶
router.get('/', async (req, res) => {
  if(req.user.role !== 'admin')
    return res.status(401).json({ message: 'Unauthorized' });
  
  try {
    const result = await UserRepository.get({});
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(err.status || 500).send('Internal Server Error');
  }
});

module.exports = router;
