import os
import sys
import contextlib
import asyncio
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

sys.path.append('/home/cyzhung/Desktop/SimuTrader')
from backend.database.database import Database
from backend.services.orderbook.orderbookService import OrderBookService

# 導入路由
from routes import stocks, order, transaction, user

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    應用程序生命週期管理器
    
    Args:
        app: FastAPI 應用實例
    """
    try:
        # 啟動前的初始化
        print("Starting up...")
        
        # 初始化數據庫
        await Database.initialize()
        print("Database connection initialized successfully")

        # 初始化訂單簿
        await OrderBookService.initialize()
        print("OrderBook initialized successfully")
        
        yield  # 應用運行中
        
        # 關閉時的清理
        print("Shutting down...")
        await Database.close()
        print("Database connection closed")
        
    except Exception as error:
        print(f"Error during startup/shutdown: {error}")
        sys.exit(1)

# 創建 FastAPI 應用
app = FastAPI(lifespan=lifespan)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生產環境中應該設置具體的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊路由
app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
app.include_router(order.router, prefix="/api/orders", tags=["orders"])
app.include_router(transaction.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(user.router, prefix="/api/users", tags=["users"])

# 根路由
@app.get("/")
async def root():
    return {
        "message": "Welcome to SimuTrader API",
        "version": "1.0.0"
    }

def main():
    """主函數"""
    # 獲取端口
    port = int(os.getenv("PORT", 3000))
    
    # 啟動服務器
    import uvicorn
    config = uvicorn.Config(
        app=app,
        host="0.0.0.0",
        port=port,
        loop="asyncio",
        reload=os.getenv("DEBUG", "false").lower() == "true",
        workers=int(os.getenv("WORKERS", 1))
    )
    
    server = uvicorn.Server(config)
    server.run()

if __name__ == "__main__":
    main()