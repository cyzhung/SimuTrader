from fastapi import APIRouter, Depends, Response
from typing import List
from backend.models.user.user import User, UserResponse
from backend.repository.userRepository import UserRepository
from backend.services.auth.authController import AuthController
from backend.services.auth.authService import AuthService
from backend.models.user.user import LoginRequest, RegisterRequest
from backend.utils.errors import AuthenticationError
router = APIRouter()
get_current_user = AuthService.get_current_user_dependency


@router.post("/delete")
async def delete_user(user_data: LoginRequest, response: Response):
    try:
        result = await AuthController.delete(user_data)
        response.delete_cookie(key="token")
        return result
    except Exception as error:
        print('刪除錯誤:', str(error))
        raise error
    
# 註冊路由
@router.post("/register", response_model=UserResponse)
async def register(user_data: RegisterRequest, response: Response):
    try:
        result = await AuthController.register(user_data)
        # 設置 JWT token 到 cookie
        response.set_cookie(
            key="token",
            value=result["data"]["token"],
            httponly=True,
            secure=True,
            max_age=24 * 60 * 60,
            samesite="lax"
        )

        return result["data"]["user"]
    except Exception as error:
        raise error

# 登入路由
@router.post("/login")
async def login(user_data: LoginRequest, response: Response):  # 添加 response 參數
    try:
        result = await AuthController.login(user_data)

        # 設置 JWT token 到 cookie
        response.set_cookie(
            key="token",
            value=result["data"]["token"],
            httponly=True,
            secure=True,
            max_age=24 * 60 * 60,
            samesite="lax"
        )

        return result
    except Exception as error:
        raise error

# 獲取所有用戶路由
@router.get("/", response_model=List[UserResponse])
async def get_all_users(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise AuthenticationError("Unauthorized")
    
    try:
        result = await UserRepository.get({})
        return result
    except Exception as error:
        print("Error fetching users:", str(error))
        raise error