import sys
import pytest
import pytest_asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient

sys.path.append('/home/cyzhung/Desktop/SimuTrader')
from backend.main import app
from backend.services.auth.authService import AuthService
from backend.database.database import Database
from backend.services.orderbook.orderbookService import OrderBookService
client = TestClient(app)

@pytest.fixture
async def test_db():
    """初始化測試數據庫"""
    await Database.initialize()
    yield
    await Database.close()

@pytest.fixture
async def admin_token():
    """獲取管理員 token"""
    admin_data = {
        "email": "admin@test.com",
        "password": "admin12345"
    }
    response = client.post("/api/users/login", json=admin_data)
    return response.json()["data"]["access_token"]

@pytest.fixture
async def user_token():
    """獲取普通用戶 token"""
    user_data = {
        "email": "user@test.com",
        "password": "user12345"
    }
    response = client.post("/api/users/login", json=user_data)
    return response.json()["data"]["access_token"]

@pytest.mark.asyncio(scope="session")
class TestUserAPI:
    async def test_register(self):
        """測試用戶註冊"""
        data = {
            "email": "pytest@example.com",
            "password": "password123",
            "username": "pytest"
        }
        result = await AuthService.register(data["email"], data["password"], data["username"])
        assert "user_id" in result["user"]

    async def test_login(self):
        """測試用戶登入"""
        data = {
            "email": "pytest@example.com",
            "password": "password123"
        }
        result = await AuthService.login(data["email"], data["password"])
        assert "token" in result

# 股票相關測試
@pytest.mark.asyncio
class TestStockAPI:
    def test_search_stocks(self):
        """測試搜尋股票"""
        
        response = client.get("/api/stocks/search",params={
            "stock_symbol": "2330",  # 測試台積電
        })
        print(response.json())
        assert response.status_code == 200
        

    def test_update_stocks(self, admin_token):
        """測試更新股票資訊（需要管理員權限）"""
        async def _test():
            async with AsyncClient(app=app, base_url="http://test") as ac:
                headers = {"Authorization": f"Bearer {admin_token}"}
                response = await ac.post("/api/stocks/update", headers=headers)
                assert response.status_code == 200
        
        import asyncio
        asyncio.run(_test())

# 訂單相關測試
class TestOrderAPI:
    def test_create_limit_order(self, user_token):
        """測試建立限價單"""
        headers = {"Authorization": f"Bearer {user_token}"}
        order_data = {
            "stock_id": 1,
            "quantity": 100,
            "price": 50.5,
            "order_side": "Buy",
            "order_type": "Limit"
        }
        response = client.post(
            "/api/orders/createOrder",
            json=order_data,
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["success"] == True

    def test_create_market_order(self, user_token):
        """測試建立市價單"""
        headers = {"Authorization": f"Bearer {user_token}"}
        order_data = {
            "stock_id": 1,
            "quantity": 100,
            "order_side": "Buy",
            "order_type": "Market"
        }
        response = client.post(
            "/api/orders/createOrder",
            json=order_data,
            headers=headers
        )
        assert response.status_code == 200

    def test_search_orders(self, user_token):
        """測試搜尋訂單"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/orders/search", headers=headers)
        assert response.status_code == 200

    def test_cancel_order(self, user_token):
        """測試取消訂單"""
        headers = {"Authorization": f"Bearer {user_token}"}
        data = {"order_id": 1}
        response = client.post(
            "/api/orders/cancelOrder",
            json=data,
            headers=headers
        )
        assert response.status_code == 200

# 交易相關測試
class TestTransactionAPI:
    def test_get_transaction_history(self, user_token):
        """測試獲取交易歷史"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/transactions/history", headers=headers)
        assert response.status_code == 200

if __name__ == "__main__":

    pytest.main(["-v"])