const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();


class Database {
    static pool;
    static async initialize() {
        if (this.pool) {
            return;
        }

        try {
            this.pool = new Pool({
                user: process.env.DB_USER,
                host: process.env.DB_HOST,
                database: process.env.DB_NAME,
                password: process.env.DB_PASSWORD,
                port: process.env.DB_PORT,
            })
            // 測試連接
            await this.pool.query('SELECT NOW()');
        } catch (error) {
            console.error('Database connection test failed:', error);
            throw error;
        }
    }

    static getPool() {
        if (!this.pool) {
            throw new Error('Database not initialized');
        }
        return this.pool;
    }

    /**
     * 開始一個新的事務
     * @returns {Promise<Object>} 包含 client 和事務方法的物件
     */
    static async transaction() {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            let isReleased = false; // 確保連線不會被多次釋放

            const releaseClient = () => {
                if (!isReleased) {
                    client.release();
                    isReleased = true;
                }
            };

            return {
                query: (...args) => client.query(...args),
                commit: async () => {
                    try {
                        await client.query('COMMIT');
                    } finally {
                        releaseClient();
                    }
                },
                rollback: async () => {
                    try {
                        await client.query('ROLLBACK');
                    } finally {
                        releaseClient();
                    }
                }
            };
        } catch (error) {
            client.release(); // 出錯時保證釋放連線
            throw error;
        }
    }


    /**
     * 執行查詢
     * @param {string} text - SQL 查詢語句
     * @param {Array} params - 查詢參數
     */
    static async query(text, params) {
        return await this.pool.query(text, params);
    }

    static async close() {
        if (this.pool) {
            try {
                await this.pool.end();
                this.pool = null;
            } catch (error) {
                console.error('Error closing database connection:', error);
                throw error;
            }
        }
    }
}

module.exports = Database; 