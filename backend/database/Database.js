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

    static async transaction() {
        if (!Database.instance) {
            throw new Error('Database not initialized');
        }

        const client = await Database.instance.connect();
        let isReleased = false;
        
        try {
            await client.query('BEGIN');
            
            return {
                async query(text, params) {
                    return client.query(text, params);
                },
                
                async commit() {
                    if (!isReleased) {
                        try {
                            await client.query('COMMIT');
                        } finally {
                            client.release();
                            isReleased = true;
                        }
                    }
                },
                
                async rollback() {
                    if (!isReleased) {
                        try {
                            await client.query('ROLLBACK');
                        } finally {
                            client.release();
                            isReleased = true;
                        }
                    }
                }
            };
        } catch (error) {
            if (!isReleased) {
                client.release();
                isReleased = true;
            }
            throw error;
        }
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