const RepositroyAbstract = require('./RepositoryFactory');

class UserRepository extends RepositroyAbstract{

    static async userExist(email){
        const pool = Database.getPool();
        const query = 'SELECT * FROM users WHERE email = $1';
        const values = [email];
        try{
            const result = await pool.query(query, values);
            return result.rows.length > 0;
        }catch(error){
            console.error('Error checking user:', error);
            throw error;
        }
    }
    static async get(filters={user_id: null, email: null}){
        const pool = Database.getPool();
        const query = 'SELECT * FROM users WHERE 1=1';
        const values = [];
        const paramCount = 1;
        if(filters.user_id){
            query += ` AND user_id = $${paramCount}`;
            values.push(filters.user_id);
            paramCount++;
        }
        if(filters.email){
            query += ` AND email = $${paramCount}`;
            values.push(filters.email);
            paramCount++;
        }

        try{
            const result = await pool.query(query, values);
            return result.rows[0];
        }catch(error){
            console.error('Error getting user:', error);
            throw error;
        }
    }

    static async insert(user){
        const pool = Database.getPool();
        const query = `INSERT INTO users (username, email, password_hash) 
                        VALUES ($1, $2, $3)
                        RETURNING user_id`;
        const values = [user.username, user.email, user.password_hash];
        try{
            const result = await pool.query(query, values);
            return result.rows[0].user_id;
        }catch(error){
            console.error('Error adding user:', error);
            throw error;
        }
    }

    static async delete(user_id){
        const pool = Database.getPool();
        const query = 'DELETE FROM users WHERE user_id = $1';
        const values = [user_id];
        try{
            await pool.query(query, values);
        }catch(error){
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    static async update(id, data){
        const pool = Database.getPool();
        const query = `UPDATE users SET username = $1, email = $2 WHERE user_id = $3`;
        const values = [data.username, data.email, id];
        try{
            await pool.query(query, values);
        }catch(error){
            console.error('Error updating user:', error);
            throw error;
        }
    }
}

module.exports = UserRepository;