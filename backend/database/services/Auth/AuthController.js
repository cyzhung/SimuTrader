const authService = require('./authService');
const jwt = require('jsonwebtoken');

class AuthController {
    static async login(req, res) {
        const { email, password } = req.body;
        
        try {
            const user = await authService.validateUser(email, password);
            if (!user) {
                return res.status(401).json({ message: '帳號或密碼錯誤' });
            }

            const token = jwt.sign(
                { user_id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('登入失敗:', error);
            res.status(500).json({ message: '登入失敗' });
        }
    }

    static async register(req, res) {
        const { email, password, name } = req.body;
        
        try {
            const user = await authService.createUser({ email, password, name });
            res.status(201).json({
                message: '註冊成功',
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('註冊失敗:', error);
            res.status(500).json({ message: '註冊失敗' });
        }
    }

    static async logout(req, res) {
        // 如果使用了 refresh token，這裡可以處理 token 的廢止
        res.json({ message: '登出成功' });
    }
}

module.exports = AuthController;