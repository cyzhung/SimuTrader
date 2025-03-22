import jwt
import os
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.status import HTTP_401_UNAUTHORIZED
from dotenv import load_dotenv

# 載入 .env
load_dotenv()

# JWT 設定
SECRET_KEY = os.getenv("JWT_ACCESS_TOKEN_SECRET", "your_secret_key")  # 你的 JWT 密鑰
ALGORITHM = "HS256"

# FastAPI 內建的 Bearer Token 驗證
security = HTTPBearer()

def auth_middleware(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    驗證 JWT Token，並將解碼後的使用者資訊回傳
    """
    token = credentials.credentials  # 取得 Bearer Token

    if token == "null":
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="未提供認證令牌")

    try:
        # 驗證並解碼 Token
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # 回傳解碼後的使用者資訊
        return {
            "user_id": decoded.get("user_id"),
            "role": decoded.get("role")
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Token 已過期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="無效的 Token")

