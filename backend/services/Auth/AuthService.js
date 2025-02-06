const bcrypt = require('bcrypt');
const UserRepository = require('../../repository/UserRepository');
const JwtService = require('./JwtService');
const { ValidationError, AuthenticationError } = require('../../utils/Errors');
const Database = require('../../database/Database');
class AuthService {
    static async login(email, password) {
        try {
            // 基本驗證
            if (!email || !password) {
                throw new ValidationError('Email 和密碼為必填項');
            }

            // 查找用戶
            const result = await UserRepository.get({ filters: { email: email } });
            const user = result.rows[0];
            if (!user) {
                throw new ValidationError('帳號或密碼錯誤');
            }

            // 驗證密碼
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                throw new ValidationError('帳號或密碼錯誤');
            }

            // 生成 token
            const token = JwtService.generateToken({
                user_id: user.user_id,
                email: user.email,
                role: user.role
            });


            // 返回用戶信息和 token
            return {
                user: this._sanitizeUser(user),
                token: token
            };
        } catch (error) {
            throw new AuthenticationError(error.message);
        }
    }

    static async register(userData) {
        const transaction = await Database.transaction();

        try {
            const { email, password, username } = userData;
            // 驗證必填字段
            if (!email || !password) {
                throw new ValidationError('Email、密碼和用戶名為必填項');
            }

            // 驗證 email 格式
            if (!this._validateEmail(email)) {
                throw new ValidationError('無效的 Email 格式');
            }

            // 驗證密碼強度
            if (!this._validatePassword(password)) {
                throw new ValidationError('密碼至少需要 8 個字符');
            }

            // 檢查用戶是否已存在
            const existingUser = await UserRepository.get({ 
                filters: { email:email },
                transaction 
            });
            
            if (existingUser.rows.length > 0) {
                throw new ValidationError('該 Email 已被註冊');
            }

            // 密碼加密
            const passwordHash = await bcrypt.hash(password, 10);

            // 創建用戶
            const user = await UserRepository.insert({
                email,
                password_hash: passwordHash,
                username,
                role: 'user'
            }, { transaction });

            // 生成 token
            let token;
            try {
                token = JwtService.generateToken({
                    user_id: user.user_id,
                    email: user.email,
                    role: user.role
                });
            } catch (error) {
                await transaction.rollback();
                throw new Error('生成令牌失敗');
            }

            // 提交事務
            await transaction.commit();

            return {
                user: this._sanitizeUser(user),
                token: token
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // 驗證 Email 格式
    static _validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 驗證密碼強度
    static _validatePassword(password) {
        return password.length >= 8;
    }

    // 清理用戶數據（移除敏感信息）
    static _sanitizeUser(user) {
        const { password_hash, ...safeUser } = user;
        return safeUser;
    }
}

module.exports = AuthService;