from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict
from backend.repository.stocksRepository import StockRepository
from backend.services.auth.authService import AuthService
import subprocess
import os
from dotenv import load_dotenv

router = APIRouter()
get_current_user = AuthService.get_current_user_dependency
load_dotenv()


@router.get("/")
async def root(current_user: Dict = Depends(get_current_user)):
    return {
        "message": """
        Welcome to stocks API page, Currently have
        /search api is get request for search stocks, parameters {stock_symbol, stock_name, market_type},
        /update api is post request for update stocks infomation
        """
    }

@router.get("/search")
async def search_stocks(
    current_user: Dict = Depends(get_current_user),
    stock_symbol: Optional[str] = None,
    stock_name: Optional[str] = None,
    market_type: Optional[str] = None
):
    try:
        filters = {
            "stock_symbol": stock_symbol,
            "stock_name": stock_name,
            "market_type": market_type
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        
        result = await StockRepository.get(filters)
        return {"message": result}
    except Exception as error:
        print('Error during search operation:', str(error))
        raise error

@router.post("/update")
async def update_stocks(current_user: Dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )

    python_path = os.getenv("PYTHONBINPATH")
    script_path = os.getenv("UPDATE_SCRIPT_PATH")

    try:
        process = subprocess.run(
            [python_path, script_path],
            capture_output=True,
            text=True,
            check=True
        )
        return {
            "message": "更新成功",
            "output": process.stdout
        }
    except subprocess.CalledProcessError as error:
        print(f"執行錯誤: {error.stderr}")
        raise error