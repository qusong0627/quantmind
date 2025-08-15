"""
数据服务 - 提供金融数据访问接口
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from typing import Dict, Any

# 创建FastAPI应用
app = FastAPI(
    title="QuantMind Data Service",
    description="金融数据服务API",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """根路径"""
    return {"message": "QuantMind Data Service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "data-service",
        "version": "1.0.0"
    }

@app.get("/api/v1/stock/{symbol}")
async def get_stock_data(symbol: str):
    """获取股票数据"""
    try:
        # 这里应该实现实际的股票数据获取逻辑
        return {
            "symbol": symbol,
            "data": "mock_data",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8005))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True
    )
