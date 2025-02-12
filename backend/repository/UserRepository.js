const RepositroyAbstract = require('./RepositoryFactory');
const { DatabaseError } = require('../utils/Errors');
const Database = require('../database/Database');

class UserRepository extends RepositroyAbstract {
    static tableName = 'users';

    static async userExist(user_id) {
        const result = await this.get({ user_id });
        return result.rows.length > 0;
    }

    static async insert(user, { transaction } = {}) {
        const pool = transaction || Database.getPool();
        const query = `
            INSERT INTO users (username, email, password_hash, role) 
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [user.username, user.email, user.password_hash, user.role];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error adding user:', error);
            throw new DatabaseError(`用戶資料庫新增錯誤: ${error.message}`);
        }
    }

    static async delete(user_id, { transaction } = {}) {
        const pool = transaction || Database.getPool();
        const query = 'DELETE FROM users WHERE user_id = $1';
        const values = [user_id];
        try {
            await pool.query(query, values);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw new DatabaseError(`用戶資料庫刪除錯誤: ${error.message}`);
        }
    }

    static async update(data, { transaction } = {}) {
        const pool = transaction || Database.getPool();
        const query = `UPDATE users SET username = $1, email = $2 WHERE user_id = $3`;
        const values = [data.username, data.email, data.user_id];
        try {
            await pool.query(query, values);
        } catch (error) {
            console.error('Error updating user:', error);
            throw new DatabaseError(`用戶資料庫更新錯誤: ${error.message}`);
        }
    }
}

module.exports = UserRepository;