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
    async def login(email, password) -> Dict[str, Any]:
        try:
            user = await AuthService.validate_login(email, password)

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
        try:
            async with Database.transaction() as client:
                await AuthService.validateRegister(email, password, username)
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
    async def delete(email, password):
        """
        用戶刪除
        """
        try:
            user = await AuthService.validate_login(email, password)

            is_password_valid = bcrypt.checkpw(
                password.encode('utf-8'), 
                user["password_hash"].encode('utf-8')
            )
            
            if not is_password_valid:
                raise ValidationError('帳號或密碼錯誤')
            

            async with Database.transaction() as client:
                users = await UserRepository.get({"email": user['email']})
                user_id = users[0]['user_id']
                await UserRepository.delete(user_id, transaction=client)
            return {
                "user": AuthService._sanitize_user(dict(user)),
            }
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
    

    @staticmethod
    async def validate_login(email, password):
        if not email or not password:
            raise ValidationError('Email 和密碼為必填項')
        # 查找用戶
        result = await UserRepository.get({"email": email})
        if not len(result):
            raise ValidationError('帳號或密碼錯誤')
        user = result[0]
        return user
    
    @staticmethod
    async def validateRegister(email, password, username):
    # 驗證必填字段
        if not email or not password or not username:
            raise ValidationError('Email、密碼和用戶名為必填項')

        # 驗證 email 格式
        if not AuthService._validate_email(email):
            raise ValidationError('無效的 Email 格式')

        # 驗證密碼強度
        if not AuthService._validate_password(password):
            raise ValidationError('密碼至少需要 8 個字符')

        # 檢查用戶是否已存在
        existing_user = await UserRepository.get({"email": email})

        if len(existing_user)>0:
            raise ValidationError('該 Email 已被註冊')
    
    @staticmethod
    def _validate_email(email: str) -> bool:
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        return bool(re.match(email_regex, email))

    @staticmethod
    def _validate_password(password: str) -> bool:
        return len(password) >= 8