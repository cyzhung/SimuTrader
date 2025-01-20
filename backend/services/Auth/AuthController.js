const AuthService = require('./AuthService');
const { validateRequest } = require('../../middlewares/Validators');

class AuthController {
    static async login(req, res) {
        try {
            // 驗證請求參數
            const { error } = validateRequest(req.body, {
                email: 'required|email',
                password: 'required|min:8'
            });

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: '請求參數錯誤',
                    errors: error.details
                });
            }

            const { email, password } = req.body;
            const result = await AuthService.login(email, password);

            // 設置 JWT token 到 cookie
            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24小時
            });

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('登入錯誤:', error);
            
            // 根據錯誤類型返回適當的狀態碼和信息
            if (error.message === '帳號或密碼錯誤') {
                return res.status(401).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '登入失敗，請稍後再試'
            });
        }
    }

    static async register(req, res) {
        try {
            // 驗證請求參數
            const { error } = validateRequest(req.body, {
                email: 'required|email',
                password: 'required|min:8',
                username: 'required|min:2'
            });

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: '請求參數錯誤',
                    errors: error.details
                });
            }

            const result = await AuthService.register(req.body);

            // 設置 JWT token 到 cookie
            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000
            });

            return res.status(201).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('註冊錯誤:', error);

            if (error.message === '該 Email 已被註冊') {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: '註冊失敗，請稍後再試'
            });
        }
    }

    static async logout(req, res) {
        try {
            // 清除 cookie
            res.clearCookie('token');
            
            return res.status(200).json({
                success: true,
                message: '登出成功'
            });
        } catch (error) {
            console.error('登出錯誤:', error);
            return res.status(500).json({
                success: false,
                message: '登出失敗，請稍後再試'
            });
        }
    }
}

module.exports = AuthController;