const Database = require('../database/Database');
const { DatabaseError } = require('../utils/Errors');

class RepositroyAbstract {
    static async get(filters = {}) {
        try {
            const pool = Database.getPool();
            const queryParts = ['SELECT * FROM', this.tableName, 'WHERE 1=1'];
            const values = [];
            let paramCount = 1;
        
            const { order_by, ...filterEntries } = filters;
        
            for (const [key, value] of Object.entries(filterEntries)) {
                if (value != null) {
                    if (Array.isArray(value)) {
                        const placeholders = Array(value.length).fill(0)
                            .map(() => `$${paramCount++}`)
                            .join(', ');
                        queryParts.push(`AND ${key} IN (${placeholders})`);
                        values.push(...value);
                    } else {
                        queryParts.push(`AND ${key} = $${paramCount++}`);
                        values.push(value);
                    }
                }
            }
        
            if (order_by) {
                queryParts.push(`ORDER BY ${order_by}`);
            }
        
            const query = queryParts.join(' ');
            return await pool.query(query, values);
        } catch (error) {
            console.error(`Error getting ${this.tableName}:`, error);
            throw new DatabaseError(`${this.tableName}資料庫查詢錯誤: ${error.message}`);
        }
    }

    static async insert(data, {transaction} = {}) {
        throw new Error('Method not implemented');
    }

    static async update(id, data, {transaction} = {}){
        throw new Error('Method not implemented');
    }

    static async delete(id, {transaction} = {}){
        throw new Error('Method not implemented');
    }

}

module.exports = RepositroyAbstract;