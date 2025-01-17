class Database {
    static instance = null;

    static async initialize(pool) {
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