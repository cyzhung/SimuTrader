import re
from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict
from backend.models.user.user import User, LoginRequest, RegisterRequest
from backend.services.auth.authService import AuthService
from backend.repository.userRepository import UserRepository
from utils.errors import ValidationError, AuthenticationError

router = APIRouter()

class AuthController:
    """認證控制器"""
    
    @staticmethod
    async def login(request: LoginRequest):
        """
        用戶登入
        
        Args:
            request: 登入請求數據
            response: FastAPI response 對象
            
        Returns:
            AuthResponse: 登入響應
        """
        try:
            user_data = request.dict()
            email = user_data.get("email")
            password = user_data.get("password")

            user = await AuthController.validateLogin(email, password)
            result = await AuthService.login(user, password)
            

            return {
                "success": True,
                "data": result
            }

        except Exception as error:
            print('登入錯誤:', str(error))
            raise error

    @staticmethod
    async def register(request: RegisterRequest):
        """
        用戶註冊
        
        Args:
            request: 註冊請求數據
            response: FastAPI response 對象
            
        Returns:
            AuthResponse: 註冊響應
        """
        try:
            user_data = request.dict()
            email = user_data.get("email")
            password = user_data.get("password")
            username = user_data.get("username")
            await AuthController.validateRegister(email, password, username)
            
            result = await AuthService.register(email, password, username)
            
            return {
                "success": True,
                "data": result
            }

        except Exception as error:
            print('註冊錯誤:', str(error))
            raise error

    @staticmethod
    async def logout(response: Response):
        """
        用戶登出
        
        Args:
            response: FastAPI response 對象
            
        Returns:
            AuthResponse: 登出響應
        """
        try:
            response.delete_cookie(key="token")
            
            return {
                "success": True,
                "message": "登出成功"
            }

        except Exception as error:
            print('登出錯誤:', str(error))
            raise error
    
    @staticmethod
    async def delete(request: User):
        """
        用戶刪除
        """
        try:
            user_data = request.dict()
            email = user_data.get("email")
            password = user_data.get("password")
            user = await AuthController.validateLogin(email, password)
            result = await AuthService.delete(user, password)
            return {
                "success": True,
                "message": "刪除成功",
                "data": result
            }
        except Exception as error:
            print('刪除錯誤:', str(error))
            raise error
    
    @staticmethod
    async def validateLogin(email, password):
         # 基本驗證
        if not email or not password:
            raise ValidationError('Email 和密碼為必填項')
        # 查找用戶
        result = await UserRepository.get({"email": email})
        if not len(result):
            raise ValidationError('帳號或密碼錯誤')
        user = result[0]
        return user
    
    @staticmethod
    def _validate_email(email: str) -> bool:
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        return bool(re.match(email_regex, email))

    @staticmethod
    def _validate_password(password: str) -> bool:
        return len(password) >= 8
    @staticmethod
    async def validateRegister(email, password, username):
        # 驗證必填字段
            if not email or not password or not username:
                raise ValidationError('Email、密碼和用戶名為必填項')

            # 驗證 email 格式
            if not AuthController._validate_email(email):
                raise ValidationError('無效的 Email 格式')

            # 驗證密碼強度
            if not AuthController._validate_password(password):
                raise ValidationError('密碼至少需要 8 個字符')

            # 檢查用戶是否已存在
            existing_user = await UserRepository.get({"email": email})

            if len(existing_user)>0:
                raise ValidationError('該 Email 已被註冊')