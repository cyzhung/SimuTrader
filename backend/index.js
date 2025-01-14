const express = require('express');
const app = express();
const usersRoutes = require('./routes/usersAPI');  // 引入路由
const stocksRoutes = require('./routes/stocksAPI');
const userSrocksRoutes = require('./routes/userStocksAPI');


app.use(express.json());
// 使用 API 路由
app.use('/api/users', usersRoutes);  // 這裡設置了路徑前綴 /api
app.use('/api/stocks', stocksRoutes);
app.use('/api/userStocks', userSrocksRoutes)
// 設置根路徑的處理器（可選）
app.get('/', (req, res) => {
  res.send('Welcome to the Stock Tracker API!');
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
