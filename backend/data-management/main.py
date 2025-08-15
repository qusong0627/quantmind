from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import os
from typing import List, Optional

from models import DataSource, DataFile, get_db
from controllers import DataController
from services import DataService
from data_config import settings

app = FastAPI(
    title="QuantMind Data Management Service",
    description="数据管理服务 - 处理量化回测数据源的上传、解析和存储",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化控制器
data_controller = DataController()

# 根路径欢迎页面
@app.get("/")
async def root():
    return {
        "message": "QuantMind Data Management Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "data_sources": "/api/data-sources",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "data-management"}

# 数据源管理API
@app.get("/api/data-sources", response_model=List[dict])
async def get_data_sources(db: Session = Depends(get_db)):
    """获取所有数据源列表"""
    return await data_controller.get_data_sources(db)

@app.post("/api/data-sources", response_model=dict)
async def create_data_source(data_source: dict, db: Session = Depends(get_db)):
    """创建新的数据源"""
    return await data_controller.create_data_source(data_source, db)

@app.get("/api/data-sources/{source_id}", response_model=dict)
async def get_data_source(source_id: int, db: Session = Depends(get_db)):
    """获取指定数据源详情"""
    return await data_controller.get_data_source(source_id, db)

@app.put("/api/data-sources/{source_id}", response_model=dict)
async def update_data_source(source_id: int, data_source: dict, db: Session = Depends(get_db)):
    """更新数据源信息"""
    return await data_controller.update_data_source(source_id, data_source, db)

@app.delete("/api/data-sources/{source_id}")
async def delete_data_source(source_id: int, db: Session = Depends(get_db)):
    """删除数据源"""
    return await data_controller.delete_data_source(source_id, db)

# 文件上传和管理API
@app.post("/api/data-sources/{source_id}/upload")
async def upload_data_file(
    source_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """上传CSV数据文件"""
    return await data_controller.upload_data_file(source_id, file, db)

@app.get("/api/data-sources/{source_id}/files", response_model=List[dict])
async def get_data_files(source_id: int, db: Session = Depends(get_db)):
    """获取数据源的所有文件"""
    return await data_controller.get_data_files(source_id, db)

@app.post("/api/data-sources/{source_id}/validate")
async def validate_data_source(source_id: int, db: Session = Depends(get_db)):
    """验证数据源数据完整性"""
    return await data_controller.validate_data_source(source_id, db)

@app.get("/api/data-sources/{source_id}/status")
async def get_data_source_status(source_id: int, db: Session = Depends(get_db)):
    """获取数据源状态"""
    return await data_controller.get_data_source_status(source_id, db)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.DATA_MANAGEMENT_PORT,
        reload=True
    )