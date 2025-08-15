"""健康检查工具"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import psutil
import os

router = APIRouter()

@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """基础健康检查"""
    return {
        "status": "healthy",
        "service": os.getenv("SERVICE_NAME", "unknown"),
        "version": os.getenv("SERVICE_VERSION", "1.0.0"),
        "timestamp": __import__("datetime").datetime.now().isoformat()
    }

@router.get("/health/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """详细健康检查"""
    try:
        # 系统资源检查
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "status": "healthy",
            "service": os.getenv("SERVICE_NAME", "unknown"),
            "version": os.getenv("SERVICE_VERSION", "1.0.0"),
            "timestamp": __import__("datetime").datetime.now().isoformat(),
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")
