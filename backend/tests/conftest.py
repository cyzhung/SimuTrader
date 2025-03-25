import sys
sys.path.append('/home/cyzhung/Desktop/SimuTrader')
import pytest
import pytest_asyncio
import asyncio
from backend.database.database import Database
from backend.services.orderbook.orderbookService import OrderBookService

@pytest_asyncio.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_services():
    """Initialize all required services"""
    await Database.initialize()
    await OrderBookService.initialize()
    yield
    await Database.close()