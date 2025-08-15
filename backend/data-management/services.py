import pandas as pd
import hashlib
import os
from datetime import datetime
from typing import Dict, Any, List
from fastapi import UploadFile
from sqlalchemy.orm import Session
import logging
import aiofiles
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

from models import DataSource, DataFile, StockData
from config import settings
from shared.database import db_manager

logger = logging.getLogger(__name__)

class DataService:
    """数据处理服务"""
    
    def __init__(self):
        self.upload_dir = os.path.join(os.getcwd(), 'data', 'uploads')
        os.makedirs(self.upload_dir, exist_ok=True)
        
        # InfluxDB客户端
        self.influx_client = db_manager.influxdb_client
        self.write_api = self.influx_client.write_api(write_options=SYNCHRONOUS)
    
    async def process_uploaded_file(self, source_id: int, file: UploadFile, db: Session) -> Dict[str, Any]:
        """处理上传的CSV文件"""
        try:
            # 生成文件路径
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{source_id}_{timestamp}_{file.filename}"
            file_path = os.path.join(self.upload_dir, filename)
            
            # 保存文件
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # 计算文件校验和
            checksum = hashlib.md5(content).hexdigest()
            file_size = len(content)
            
            # 解析CSV文件
            parse_result = await self._parse_csv_file(file_path, source_id)
            
            # 创建文件记录
            data_file = DataFile(
                data_source_id=source_id,
                filename=file.filename,
                file_path=file_path,
                file_size=file_size,
                record_count=parse_result['record_count'],
                start_date=parse_result['start_date'],
                end_date=parse_result['end_date'],
                status='processed' if parse_result['success'] else 'error',
                error_message=parse_result.get('error_message'),
                checksum=checksum,
                processed_at=datetime.utcnow()
            )
            
            db.add(data_file)
            db.commit()
            db.refresh(data_file)
            
            # 如果解析成功，存储到InfluxDB
            if parse_result['success']:
                await self._store_to_influxdb(parse_result['data'], source_id)
            
            return {
                'file_id': data_file.id,
                'filename': data_file.filename,
                'status': data_file.status,
                'record_count': data_file.record_count,
                'start_date': data_file.start_date.isoformat() if data_file.start_date else None,
                'end_date': data_file.end_date.isoformat() if data_file.end_date else None,
                'error_message': data_file.error_message
            }
            
        except Exception as e:
            logger.error(f"处理上传文件失败: {str(e)}")
            # 清理已上传的文件
            if os.path.exists(file_path):
                os.remove(file_path)
            raise e
    
    async def _parse_csv_file(self, file_path: str, source_id: int) -> Dict[str, Any]:
        """解析CSV文件"""
        try:
            # 读取CSV文件
            df = pd.read_csv(file_path)
            
            # 验证必需的列
            required_columns = ['date', 'open', 'high', 'low', 'close', 'volume']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return {
                    'success': False,
                    'error_message': f"缺少必需的列: {', '.join(missing_columns)}",
                    'record_count': 0
                }
            
            # 数据类型转换和清理
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # 验证数据完整性
            if df.empty:
                return {
                    'success': False,
                    'error_message': "文件中没有有效数据",
                    'record_count': 0
                }
            
            # 检查数据范围
            numeric_columns = ['open', 'high', 'low', 'close', 'volume']
            for col in numeric_columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # 移除无效行
            df = df.dropna(subset=numeric_columns)
            
            if df.empty:
                return {
                    'success': False,
                    'error_message': "文件中没有有效的数值数据",
                    'record_count': 0
                }
            
            return {
                'success': True,
                'data': df,
                'record_count': len(df),
                'start_date': df['date'].min().to_pydatetime(),
                'end_date': df['date'].max().to_pydatetime()
            }
            
        except Exception as e:
            logger.error(f"解析CSV文件失败: {str(e)}")
            return {
                'success': False,
                'error_message': f"文件解析错误: {str(e)}",
                'record_count': 0
            }
    
    async def _store_to_influxdb(self, df: pd.DataFrame, source_id: int):
        """将数据存储到InfluxDB"""
        try:
            # 获取数据源信息
            data_source = db.query(DataSource).filter(DataSource.id == source_id).first()
            if not data_source:
                raise ValueError(f"数据源 {source_id} 不存在")
            
            points = []
            for _, row in df.iterrows():
                point = Point("stock_data") \
                    .tag("symbol", data_source.symbol) \
                    .tag("source_id", str(source_id)) \
                    .field("open", float(row['open'])) \
                    .field("high", float(row['high'])) \
                    .field("low", float(row['low'])) \
                    .field("close", float(row['close'])) \
                    .field("volume", int(row['volume'])) \
                    .time(row['date'])
                
                # 添加可选字段
                if 'amount' in row and pd.notna(row['amount']):
                    point = point.field("amount", float(row['amount']))
                
                points.append(point)
            
            # 批量写入InfluxDB
            self.write_api.write(bucket=settings.INFLUXDB_BUCKET, record=points)
            logger.info(f"成功写入 {len(points)} 条数据到InfluxDB")
            
        except Exception as e:
            logger.error(f"存储数据到InfluxDB失败: {str(e)}")
            raise e
    
    async def validate_data_source(self, source_id: int, db: Session) -> Dict[str, Any]:
        """验证数据源数据完整性"""
        try:
            # 获取数据源信息
            data_source = db.query(DataSource).filter(DataSource.id == source_id).first()
            files = db.query(DataFile).filter(DataFile.data_source_id == source_id).all()
            
            validation_result = {
                'source_id': source_id,
                'symbol': data_source.symbol,
                'total_files': len(files),
                'processed_files': len([f for f in files if f.status == 'processed']),
                'error_files': len([f for f in files if f.status == 'error']),
                'total_records': sum(f.record_count or 0 for f in files),
                'date_range': {},
                'data_gaps': [],
                'validation_status': 'passed'
            }
            
            if files:
                # 计算日期范围
                start_dates = [f.start_date for f in files if f.start_date]
                end_dates = [f.end_date for f in files if f.end_date]
                
                if start_dates and end_dates:
                    validation_result['date_range'] = {
                        'start': min(start_dates).isoformat(),
                        'end': max(end_dates).isoformat()
                    }
                
                # 检查数据缺口(简化版)
                if len([f for f in files if f.status == 'error']) > 0:
                    validation_result['validation_status'] = 'warning'
                    validation_result['issues'] = ['存在处理失败的文件']
            
            return validation_result
            
        except Exception as e:
            logger.error(f"数据验证失败: {str(e)}")
            raise e
    
    async def get_data_source_status(self, source_id: int, db: Session) -> Dict[str, Any]:
        """获取数据源状态"""
        try:
            data_source = db.query(DataSource).filter(DataSource.id == source_id).first()
            files = db.query(DataFile).filter(DataFile.data_source_id == source_id).all()
            
            # 计算统计信息
            total_files = len(files)
            processed_files = len([f for f in files if f.status == 'processed'])
            error_files = len([f for f in files if f.status == 'error'])
            total_records = sum(f.record_count or 0 for f in files)
            
            # 最近更新时间
            last_update = None
            if files:
                last_update = max(f.processed_at for f in files if f.processed_at)
            
            status = {
                'source_id': source_id,
                'name': data_source.name,
                'symbol': data_source.symbol,
                'is_active': data_source.is_active,
                'auto_update': data_source.auto_update,
                'statistics': {
                    'total_files': total_files,
                    'processed_files': processed_files,
                    'error_files': error_files,
                    'total_records': total_records,
                    'success_rate': round(processed_files / total_files * 100, 2) if total_files > 0 else 0
                },
                'last_update': last_update.isoformat() if last_update else None,
                'created_at': data_source.created_at.isoformat() if data_source.created_at else None
            }
            
            return status
            
        except Exception as e:
            logger.error(f"获取数据源状态失败: {str(e)}")
            raise e
    
    def __del__(self):
        """清理资源"""
        if hasattr(self, 'influx_client'):
            self.influx_client.close()