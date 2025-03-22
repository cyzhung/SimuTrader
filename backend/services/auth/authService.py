import re
import bcrypt
from typing import Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.errors import ValidationError, AuthenticationError
from backend.repository.userRepository import UserRepository
from backend.services.auth.jwtService import JwtService
from backend.database.database import Database
from backend.models.user.user import User

security = HTTPBearer()
class AuthService:
    @staticmethod
    async def login(user, password) -> Dict[str, Any]:
        try:

            is_password_valid = bcrypt.checkpw(
                password.encode('utf-8'), 
                user["password_hash"].encode('utf-8')
            )
            
            if not is_password_valid:
                raise ValidationError('帳號或密碼錯誤')

            # 生成 token
            token = JwtService.generate_token({
                "user_id": user["user_id"],
                "email": user["email"],
                "role": user["role"]
            })

            # 返回用戶信息和 token
            return {
                "user": AuthService._sanitize_user(dict(user)),
                "token": token
            }
            
        except Exception as error:
            raise AuthenticationError(str(error))

    @staticmethod
    async def register(email, password, username) -> Dict[str, Any]:
        async with Database.transaction() as client:
            try:
                # 密碼加密
                password_hash = bcrypt.hashpw(
                    password.encode('utf-8'), 
                    bcrypt.gensalt()
                ).decode('utf-8')

                # 創建用戶
                user = await UserRepository.insert({
                    "email": email,
                    "password_hash": password_hash,
                    "username": username,
                    "role": "user"
                }, transaction=client)

                # 生成 token
                token = JwtService.generate_token({
                    "user_id": user["user_id"],
                    "email": user["email"],
                    "role": user["role"]
                })

                return {
                    "user": AuthService._sanitize_user(dict(user)),
                    "token": token
                }

            except Exception as error:
                raise error

    @staticmethod
    def _sanitize_user(user: Dict[str, Any]) -> Dict[str, Any]:
        safe_user = user.copy()
        safe_user.pop("password_hash", None)
        return safe_user
    @staticmethod
    async def delete(user, password):
        """
        用戶刪除
        """
        try:

            is_password_valid = bcrypt.checkpw(
                password.encode('utf-8'), 
                user["password_hash"].encode('utf-8')
            )
            
            if not is_password_valid:
                raise ValidationError('帳號或密碼錯誤')
            

            async with Database.transaction() as client:
                users = await UserRepository.get({"email": user['email']})
                user_id = users[0]['user_id']
                result = await UserRepository.delete(user_id, transaction=client)
                return result
        except Exception as error:
            raise error
    @staticmethod
    async def get_current_user(token: str) -> User:
        """
        獲取當前登入用戶
        
        Args:
            token: JWT token
            
        Returns:
            User: 用戶對象
            
        Raises:
            HTTPException: 當認證失敗時
        """
        try:
            # 驗證 token
            payload = JwtService.verify_token(token)
            
            # 從數據庫獲取用戶信息
            user_result = await UserRepository.get({"user_id": payload["user_id"]})
            if not len(user_result):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="用戶不存在"
                )
            
            user_data = user_result[0]
            return User(
                user_id=user_data["user_id"],
                username=user_data["username"],
                email=user_data["email"],
                role=user_data["role"]
            )
            
        except Exception as error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(error)
            )

    @staticmethod
    async def get_current_user_dependency(
        credentials = Depends(security)
    ) -> User:
        """
        FastAPI 依賴項，用於獲取當前用戶
        
        Args:
            credentials: Bearer token 憑證
            
        Returns:
            User: 用戶對象
        """
        token = credentials.credentials
        return await AuthService.get_current_user(token)
        