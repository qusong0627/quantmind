from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging
import os
from datetime import datetime

from models import DataSource, DataFile
from services import DataService

logger = logging.getLogger(__name__)

class DataController:
    """数据管理控制器"""
    
    def __init__(self):
        self.data_service = DataService()
    
    async def get_data_sources(self, db: Session) -> List[Dict[str, Any]]:
        """获取所有数据源"""
        try:
            data_sources = db.query(DataSource).filter(DataSource.is_active == True).all()
            return [ds.to_dict() for ds in data_sources]
        except Exception as e:
            logger.error(f"获取数据源列表失败: {str(e)}")
            raise HTTPException(status_code=500, detail="获取数据源列表失败")
    
    async def create_data_source(self, data_source_data: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """创建新数据源"""
        try:
            # 验证必填字段
            required_fields = ['name', 'symbol']
            for field in required_fields:
                if field not in data_source_data or not data_source_data[field]:
                    raise HTTPException(status_code=400, detail=f"缺少必填字段: {field}")
            
            # 检查股票代码是否已存在
            existing = db.query(DataSource).filter(
                DataSource.symbol == data_source_data['symbol'],
                DataSource.is_active == True
            ).first()
            
            if existing:
                raise HTTPException(status_code=400, detail=f"股票代码 {data_source_data['symbol']} 已存在")
            
            # 创建数据源
            data_source = DataSource(
                name=data_source_data['name'],
                symbol=data_source_data['symbol'].upper(),
                description=data_source_data.get('description', ''),
                source_type=data_source_data.get('source_type', 'csv'),
                update_frequency=data_source_data.get('update_frequency', 'daily'),
                remote_url=data_source_data.get('remote_url'),
                auto_update=data_source_data.get('auto_update', False)
            )
            
            db.add(data_source)
            db.commit()
            db.refresh(data_source)
            
            logger.info(f"创建数据源成功: {data_source.name} ({data_source.symbol})")
            return data_source.to_dict()
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"创建数据源失败: {str(e)}")
            raise HTTPException(status_code=500, detail="创建数据源失败")
    
    async def get_data_source(self, source_id: int, db: Session) -> Dict[str, Any]:
        """获取指定数据源"""
        try:
            data_source = db.query(DataSource).filter(
                DataSource.id == source_id,
                DataSource.is_active == True
            ).first()
            
            if not data_source:
                raise HTTPException(status_code=404, detail="数据源不存在")
            
            return data_source.to_dict()
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"获取数据源失败: {str(e)}")
            raise HTTPException(status_code=500, detail="获取数据源失败")
    
    async def update_data_source(self, source_id: int, data_source_data: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """更新数据源"""
        try:
            data_source = db.query(DataSource).filter(
                DataSource.id == source_id,
                DataSource.is_active == True
            ).first()
            
            if not data_source:
                raise HTTPException(status_code=404, detail="数据源不存在")
            
            # 更新字段
            updatable_fields = ['name', 'description', 'update_frequency', 'remote_url', 'auto_update']
            for field in updatable_fields:
                if field in data_source_data:
                    setattr(data_source, field, data_source_data[field])
            
            data_source.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(data_source)
            
            logger.info(f"更新数据源成功: {data_source.name}")
            return data_source.to_dict()
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"更新数据源失败: {str(e)}")
            raise HTTPException(status_code=500, detail="更新数据源失败")
    
    async def delete_data_source(self, source_id: int, db: Session) -> Dict[str, str]:
        """删除数据源(软删除)"""
        try:
            data_source = db.query(DataSource).filter(
                DataSource.id == source_id,
                DataSource.is_active == True
            ).first()
            
            if not data_source:
                raise HTTPException(status_code=404, detail="数据源不存在")
            
            # 软删除
            data_source.is_active = False
            data_source.updated_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"删除数据源成功: {data_source.name}")
            return {"message": "数据源删除成功"}
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"删除数据源失败: {str(e)}")
            raise HTTPException(status_code=500, detail="删除数据源失败")
    
    async def upload_data_file(self, source_id: int, file: UploadFile, db: Session) -> Dict[str, Any]:
        """上传数据文件"""
        try:
            # 验证数据源存在
            data_source = db.query(DataSource).filter(
                DataSource.id == source_id,
                DataSource.is_active == True
            ).first()
            
            if not data_source:
                raise HTTPException(status_code=404, detail="数据源不存在")
            
            # 验证文件格式
            if not file.filename.endswith('.csv'):
                raise HTTPException(status_code=400, detail="只支持CSV格式文件")
            
            # 处理文件上传
            result = await self.data_service.process_uploaded_file(source_id, file, db)
            
            logger.info(f"文件上传成功: {file.filename} -> 数据源 {data_source.name}")
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"文件上传失败: {str(e)}")
            raise HTTPException(status_code=500, detail="文件上传失败")
    
    async def get_data_files(self, source_id: int, db: Session) -> List[Dict[str, Any]]:
        """获取数据源的所有文件"""
        try:
            # 验证数据源存在
            data_source = db.query(DataSource).filter(
                DataSource.id == source_id,
                DataSource.is_active == True
            ).first()
            
            if not data_source:
                raise HTTPException(status_code=404, detail="数据源不存在")
            
            files = db.query(DataFile).filter(DataFile.data_source_id == source_id).all()
            return [f.to_dict() for f in files]
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"获取文件列表失败: {str(e)}")
            raise HTTPException(status_code=500, detail="获取文件列表失败")
    
    async def validate_data_source(self, source_id: int, db: Session) -> Dict[str, Any]:
        """验证数据源数据完整性"""
        try:
            # 验证数据源存在
            data_source = db.query(DataSource).filter(
                DataSource.id == source_id,
                DataSource.is_active == True
            ).first()
            
            if not data_source:
                raise HTTPException(status_code=404, detail="数据源不存在")
            
            # 执行数据验证
            validation_result = await self.data_service.validate_data_source(source_id, db)
            
            logger.info(f"数据源验证完成: {data_source.name}")
            return validation_result
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"数据验证失败: {str(e)}")
            raise HTTPException(status_code=500, detail="数据验证失败")
    
    async def get_data_source_status(self, source_id: int, db: Session) -> Dict[str, Any]:
        """获取数据源状态"""
        try:
            # 验证数据源存在
            data_source = db.query(DataSource).filter(
                DataSource.id == source_id,
                DataSource.is_active == True
            ).first()
            
            if not data_source:
                raise HTTPException(status_code=404, detail="数据源不存在")
            
            # 获取状态信息
            status = await self.data_service.get_data_source_status(source_id, db)
            
            return status
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"获取数据源状态失败: {str(e)}")
            raise HTTPException(status_code=500, detail="获取数据源状态失败")