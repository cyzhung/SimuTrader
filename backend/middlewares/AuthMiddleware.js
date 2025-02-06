const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../utils/Errors');

const authMiddleware = async (req, res, next) => {
    try {
        // 從 header 獲取 token

        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            throw new AuthenticationError('未提供認證令牌');
        }

        const token = authHeader.split(' ')[1]; // Bearer <token>

        // 驗證 token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);

        // 將解碼後的用戶信息添加到 request 對象中
        req.user = {
            user_id: decoded.user_id,
            role: decoded.role // 如果有角色信息的話
        };
        
        next();
    } catch (error) {
        res.status(error.status || 401).json(error.toJSON());
    }
};

module.exports = { authMiddleware };