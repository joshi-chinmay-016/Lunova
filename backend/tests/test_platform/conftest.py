import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.core.database import async_session_maker, engine

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest_asyncio.fixture
async def db_session():
    async with async_session_maker() as session:
        yield session
    await engine.dispose()

@pytest_asyncio.fixture(autouse=True)
async def dispose_engine_after_test():
    yield
    await engine.dispose()
