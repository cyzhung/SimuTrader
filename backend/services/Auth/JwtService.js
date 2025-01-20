const jwt = require('jsonwebtoken');

class JwtService {
    static #ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET;
    static #REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET;
    
    static #ACCESS_TOKEN_EXPIRES_IN = '1h';  // 訪問令牌過期時間
    static #REFRESH_TOKEN_EXPIRES_IN = '7d'; // 刷新令牌過期時間

    /**
     * 生成訪問令牌
     * @param {Object} payload - 要加入到令牌中的數據
     * @returns {string} 訪問令牌
     */
    static generateToken(payload) {
        try {
            return jwt.sign(payload, this.#ACCESS_TOKEN_SECRET, {
                expiresIn: this.#ACCESS_TOKEN_EXPIRES_IN
            });
        } catch (error) {
            throw new Error('生成訪問令牌失敗');
        }
    }

    /**
     * 生成刷新令牌
     * @param {Object} payload - 要加入到令牌中的數據
     * @returns {string} 刷新令牌
     */
    static generateRefreshToken(payload) {
        try {
            return jwt.sign(payload, this.#REFRESH_TOKEN_SECRET, {
                expiresIn: this.#REFRESH_TOKEN_EXPIRES_IN
            });
        } catch (error) {
            throw new Error('生成刷新令牌失敗');
        }
    }

    /**
     * 驗證訪問令牌
     * @param {string} token - 要驗證的令牌
     * @returns {Object} 解碼後的數據
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, this.#ACCESS_TOKEN_SECRET);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('令牌已過期');
            }
            throw new Error('無效的令牌');
        }
    }

    /**
     * 驗證刷新令牌
     * @param {string} refreshToken - 要驗證的刷新令牌
     * @returns {Object} 解碼後的數據
     */
    static verifyRefreshToken(refreshToken) {
        try {
            return jwt.verify(refreshToken, this.#REFRESH_TOKEN_SECRET);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('刷新令牌已過期');
            }
            throw new Error('無效的刷新令牌');
        }
    }

    /**
     * 從請求頭部獲取令牌
     * @param {Object} headers - 請求頭部
     * @returns {string|null} 令牌或 null
     */
    static getTokenFromHeaders(headers) {
        const authHeader = headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.split(' ')[1];
    }

    /**
     * 解碼令牌（不驗證）
     * @param {string} token - 要解碼的令牌
     * @returns {Object|null} 解碼後的數據或 null
     */
    static decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            return null;
        }
    }
}

module.exports = JwtService;
