const express = require('express');
const app = express();
const apiRoutes = require('./routes/usersApi');  // 引入路由

app.use(express.json());
// 設置根路徑的處理器（可選）
app.get('/', (req, res) => {
  res.send('Welcome to the Stock Tracker API!');
});

// 使用 API 路由
app.use('/api', apiRoutes);  // 這裡設置了路徑前綴 /api

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
