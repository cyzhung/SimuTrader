const bcrypt = require('bcrypt');
const UserRepository = require('../../repository/UserRepository');

class AuthService {
    static async validateUser(email, password) {
        if (!email || !password) {
            throw new Error('Email 和密碼為必填項');
        }

        const user = await UserRepository.get({filters: {email: email}});
        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    static async createUser(userData) {
        const { email, password, username } = userData;

        // 檢查用戶是否已存在
        const existingUser = await UserRepository.get({email: email});
        if (existingUser) {
            throw new Error('該 Email 已被註冊');
        }

        // 密碼加密
        const passwordHash = await bcrypt.hash(password, 10);

        // 創建新用戶
        const user = await UserRepository.insert({
            email:email,
            password_hash: passwordHash,
            username:username
        });

        return user;
    }
}

module.exports = AuthService;