class UserRepository{

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
    static async getUser(user_id){
        const pool = Database.getPool();
        const query = 'SELECT * FROM users WHERE user_id = $1';
        const values = [user_id];
        try{
            const result = await pool.query(query, values);
            return result.rows[0];
        }catch(error){
            console.error('Error getting user:', error);
            throw error;
        }
    }

    static async addUser(user){
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

    static async deleteUser(user_id){
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

    static async getUserByEmail(email){
        const pool = Database.getPool();
        const query = 'SELECT * FROM users WHERE email = $1';
        const values = [email];
        try{
            const result = await pool.query(query, values);
            return result.rows[0];
        }catch(error){
            console.error('Error getting user by email:', error);
            throw error;
        }
    }
}

module.exports = UserRepository;