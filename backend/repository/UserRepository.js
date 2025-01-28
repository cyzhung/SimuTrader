const RepositroyAbstract = require('./RepositoryFactory');
const Database = require('../database/Database');

class UserRepository extends RepositroyAbstract {

    static async userExist(user_id) {
        const pool = Database.getPool();
        const query = 'SELECT * FROM users WHERE user_id = $1';
        const values = [user_id];
        try {
            const result = await pool.query(query, values);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error checking user:', error);
            throw error;
        }
    }

    static async get({ filters = {}, transaction = null }) {
        const pool = transaction || Database.getPool();
        let query = 'SELECT * FROM users WHERE 1=1';
        const values = [];
        let paramCount = 1;

        // 動態添加過濾條件
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                query += ` AND ${key} = $${paramCount}`;
                values.push(value);
                paramCount++;
            }
        });

        try {
            return await pool.query(query, values);
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }

    static async insert(user, { transaction = null } = {}) {
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
            throw error;
        }
    }

    static async delete(user_id) {
        const pool = Database.getPool();
        const query = 'DELETE FROM users WHERE user_id = $1';
        const values = [user_id];
        try {
            await pool.query(query, values);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    static async update(id, data) {
        const pool = Database.getPool();
        const query = `UPDATE users SET username = $1, email = $2 WHERE user_id = $3`;
        const values = [data.username, data.email, id];
        try {
            await pool.query(query, values);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
}

module.exports = UserRepository;