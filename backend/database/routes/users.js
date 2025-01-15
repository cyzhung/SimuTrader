const express = require('express');
const router = express.Router();
const pool = require('../connection');
const bcrypt = require('bcrypt');
const salt = 99
// 創建帳號API
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required'});
  }

  try{
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if(existingUser.rows.length > 0)
        return res.status(409).json({ error:'user already exists'});

    const hashed_password = bcrypt.hashSync(password, salt);
    console.log(hashed_password)
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING user_id',
      [email, hashed_password]
    );

    res.status(201).json({ message: 'User created successfully', user_id: result.rows[0].user_id});
  } catch(err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal Server Error'});
  }
});

//登入請求API
router.post('/login', async (req, res) => {
  const {email, password} = req.body;

  try{
    const accountInfo = await pool.query('SELECT email, password_hash FROM users WHERE email = $1', [email]);
    
    if(accountInfo.rows.length === 0)
        return res.status(401).json({ message: 'Invalid username or password' });
    
    const user = accountInfo.rows[0];

    const isPasswordValid  = await bcrypt.compare(password, user.password_hash);
    if(!isPasswordValid)
        return res.status(401).json({ message: 'Invalid username or password' });

    res.status(200).json({ message: 'Login successful' });
  }catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
})


// 範例 API：取得所有用戶
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
