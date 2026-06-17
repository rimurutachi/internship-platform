"""Tests for FastAPI endpoints"""
import pytest
from httpx import AsyncClient, ASGITransport
from main import app

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert data["version"] == "2.0.0"

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "components" in data

@pytest.mark.asyncio
async def test_analyze_trends_empty_body():
    """Should return 422 when no evaluations provided"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/analyze-trends", json={"evaluations": []})
    # Pydantic validation: min_length=1
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_dashboard_insights_empty():
    """Empty evaluations should return empty insights, not error"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/dashboard-insights", json={
            "evaluations": [],
            "max_insights": 5
        })
    assert response.status_code == 200
    data = response.json()
    assert data["total_evaluations"] == 0
