import jwt
import os
import dotenv
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from utils.errors import AuthenticationError

dotenv.load_dotenv()

class JwtService:
    _ACCESS_TOKEN_SECRET = os.getenv("JWT_ACCESS_TOKEN_SECRET")
    _REFRESH_TOKEN_SECRET = os.getenv("JWT_REFRESH_TOKEN_SECRET")
    
    _ACCESS_TOKEN_EXPIRES_IN = timedelta(hours=1)  # 訪問令牌過期時間
    _REFRESH_TOKEN_EXPIRES_IN = timedelta(days=7)  # 刷新令牌過期時間

    @classmethod
    def generate_token(cls, payload: Dict[str, Any]) -> str:
        """
        生成訪問令牌
        
        Args:
            payload: 要加入到令牌中的數據
            
        Returns:
            str: 訪問令牌
            
        Raises:
            AuthenticationError: 當令牌生成失敗時
        """
        try:
            payload["exp"] = datetime.utcnow() + cls._ACCESS_TOKEN_EXPIRES_IN
            return jwt.encode(
                payload,
                cls._ACCESS_TOKEN_SECRET,
                algorithm="HS256"
            )
        except Exception as error:
            raise AuthenticationError('生成訪問令牌失敗')

    @classmethod
    def generate_refresh_token(cls, payload: Dict[str, Any]) -> str:
        """
        生成刷新令牌
        
        Args:
            payload: 要加入到令牌中的數據
            
        Returns:
            str: 刷新令牌
            
        Raises:
            AuthenticationError: 當令牌生成失敗時
        """
        try:
            payload["exp"] = datetime.utcnow() + cls._REFRESH_TOKEN_EXPIRES_IN
            return jwt.encode(
                payload,
                cls._REFRESH_TOKEN_SECRET,
                algorithm="HS256"
            )
        except Exception as error:
            raise AuthenticationError('生成刷新令牌失敗')

    @classmethod
    def verify_token(cls, token: str) -> Dict[str, Any]:
        """
        驗證訪問令牌
        
        Args:
            token: 要驗證的令牌
            
        Returns:
            Dict[str, Any]: 解碼後的數據
            
        Raises:
            AuthenticationError: 當令牌無效或過期時
        """
        try:
            return jwt.decode(
                token,
                cls._ACCESS_TOKEN_SECRET,
                algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationError('令牌已過期')
        except jwt.InvalidTokenError:
            raise AuthenticationError('無效的令牌')

    @classmethod
    def verify_refresh_token(cls, refresh_token: str) -> Dict[str, Any]:
        """
        驗證刷新令牌
        
        Args:
            refresh_token: 要驗證的刷新令牌
            
        Returns:
            Dict[str, Any]: 解碼後的數據
            
        Raises:
            AuthenticationError: 當令牌無效或過期時
        """
        try:
            return jwt.decode(
                refresh_token,
                cls._REFRESH_TOKEN_SECRET,
                algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationError('刷新令牌已過期')
        except jwt.InvalidTokenError:
            raise AuthenticationError('無效的刷新令牌')

    @staticmethod
    def get_token_from_headers(headers: Dict[str, str]) -> Optional[str]:
        """
        從請求頭部獲取令牌
        
        Args:
            headers: 請求頭部
            
        Returns:
            Optional[str]: 令牌或 None
        """
        auth_header = headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        return auth_header.split(" ")[1]

    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        """
        解碼令牌（不驗證）
        
        Args:
            token: 要解碼的令牌
            
        Returns:
            Optional[Dict[str, Any]]: 解碼後的數據或 None
        """
        try:
            return jwt.decode(token, options={"verify_signature": False})
        except Exception:
            return None