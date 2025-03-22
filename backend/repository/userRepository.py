from typing import Dict, Any, Optional
from backend.repository.repositoryAbs import RepositoryAbstract
from backend.database.database import Database
from utils.errors import DatabaseError

class UserRepository(RepositoryAbstract):
    table_name = "users"

    @classmethod
    async def user_exist(cls, user_id: int) -> bool:
        """
        檢查用戶是否存在
        
        Args:
            user_id: 用戶ID
            
        Returns:
            bool: 用戶是否存在
        """
        result = await cls.get({"user_id": user_id})
        return len(result.rows) > 0

    @classmethod
    async def insert(
        cls, 
        user: Dict[str, Any], 
        transaction: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        新增用戶
        
        Args:
            user: 用戶數據
            transaction: 事務對象
            
        Returns:
            Dict: 新增的用戶數據
            
        Raises:
            DatabaseError: 數據庫操作錯誤
        """
        pool = transaction or Database.get_pool()
        query = """
            INSERT INTO users (username, email, password_hash, role) 
            VALUES ($1, $2, $3, $4)
            RETURNING *
        """
        values = [
            user["username"], 
            user["email"], 
            user["password_hash"], 
            user["role"]
        ]

        try:
            result = await pool.fetchrow(query, *values)
            return dict(result)
        except Exception as error:
            print(f"Error adding user: {error}")
            raise DatabaseError(f"用戶資料庫新增錯誤: {str(error)}")

    @classmethod
    async def delete(
        cls, 
        user_id: int, 
        transaction: Optional[Any] = None
    ) -> None:
        """
        刪除用戶
        
        Args:
            user_id: 用戶ID
            transaction: 事務對象
            
        Raises:
            DatabaseError: 數據庫操作錯誤
        """
        pool = transaction or Database.get_pool()
        query = "DELETE FROM users WHERE user_id = $1"
        values = [user_id]
        
        try:
            await pool.fetch(query, *values)
        except Exception as error:
            print(f"Error deleting user: {error}")
            raise DatabaseError(f"用戶資料庫刪除錯誤: {str(error)}")

    @classmethod
    async def update(
        cls, 
        data: Dict[str, Any], 
        transaction: Optional[Any] = None
    ) -> None:
        """
        更新用戶信息
        
        Args:
            data: 更新的用戶數據
            transaction: 事務對象
            
        Raises:
            DatabaseError: 數據庫操作錯誤
        """
        pool = transaction or Database.get_pool()
        query = """
            UPDATE users 
            SET username = $1, email = $2 
            WHERE user_id = $3
        """
        values = [data["username"], data["email"], data["user_id"]]
        
        try:
            await pool.query(query, values)
        except Exception as error:
            print(f"Error updating user: {error}")
            raise DatabaseError(f"用戶資料庫更新錯誤: {str(error)}")

    @classmethod
    async def get_by_email(
        cls, 
        email: str, 
        transaction: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        通過郵箱獲取用戶
        
        Args:
            email: 用戶郵箱
            transaction: 事務對象
            
        Returns:
            Dict: 用戶數據
            
        Raises:
            DatabaseError: 數據庫操作錯誤
        """
        pool = transaction or Database.get_pool()
        query = "SELECT * FROM users WHERE email = $1"
        
        try:
            result = await pool.query(query, [email])
            return result.rows[0] if result.rows else None
        except Exception as error:
            print(f"Error getting user by email: {error}")
            raise DatabaseError(f"獲取用戶資料錯誤: {str(error)}")