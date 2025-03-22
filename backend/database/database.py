import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# 載入 .env 環境變數
load_dotenv()

class Database:
    _pool = None  # 靜態變數，存儲連線池
    _initialized = False

    @classmethod
    @asynccontextmanager
    async def transaction(cls):
        """
        異步事務上下文管理器
        """
        if not cls._pool:
            raise RuntimeError("Database not initialized")
            
        async with cls._pool.acquire() as conn:
            transaction = conn.transaction()
            try:
                await transaction.start()
                yield conn
                await transaction.commit()
            except Exception as e:
                await transaction.rollback()
                raise e

    @classmethod
    async def initialize(cls):
        """初始化資料庫連線池"""
        if cls._initialized:
            return

        try:
            cls._pool = await asyncpg.create_pool(
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                host=os.getenv("DB_HOST"),
                port=os.getenv("DB_PORT"),
                database=os.getenv("DB_NAME")
            )
            cls._initialized = True
        except Exception as e:
            print(f"Database initialization failed: {e}")
            raise

    @classmethod
    def get_pool(cls):
        """取得連線池"""
        if not cls._pool:
            raise RuntimeError("Database not initialized")
        return cls._pool

    @classmethod
    async def query(cls, query_text, params=None):
        """執行 SQL 查詢"""
        if not cls._pool:
            raise RuntimeError("Database not initialized")

        async with cls._pool.acquire() as conn:
            return await conn.fetch(query_text, *params if params else [])

    @classmethod
    async def close(cls):
        """關閉資料庫連線"""
        if cls._pool:
            await cls._pool.close()
            cls._pool = None
