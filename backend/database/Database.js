const pool = require('./utils/DatabaseConnection');


class Database {

    static async initialize() {
        if (Database.instance) {
            return;
        }

        try {
            // 測試連接
            await pool.query('SELECT NOW()');
            Database.instance = pool;
            console.log('Database connection test successful');
        } catch (error) {
            console.error('Database connection test failed:', error);
            throw error;
        }
    }

    static getPool() {
        if (!Database.instance) {
            throw new Error('Database not initialized');
        }
        return Database.instance;
    }

    /**
     * 開始一個新的事務
     * @returns {Promise<Object>} 包含 client 和事務方法的物件
     */
    static async transaction() {

        const client = await Database.instance.connect();

        try {
            await client.query('BEGIN');
            
            return {
                query: (...args) => client.query(...args),
                commit: async () => {
                    try {
                        await client.query('COMMIT');
                    } finally {
                        client.release();
                    }
                },
                rollback: async () => {
                    try {
                        await client.query('ROLLBACK');
                    } finally {
                        client.release();
                    }
                },
                release: () => client.release()
            };
        } catch (error) {
            client.release();
            throw error;
        }
    }

    /**
     * 執行查詢
     * @param {string} text - SQL 查詢語句
     * @param {Array} params - 查詢參數
     */
    static async query(text, params) {
        return Database.instance.query(text, params);
    }

    static async close() {
        if (Database.instance) {
            try {
                await Database.instance.end();
                Database.instance = null;
                console.log('Database connection closed');
            } catch (error) {
                console.error('Error closing database connection:', error);
                throw error;
            }
        }
    }
}

module.exports = Database; 
module.exports = Database; 