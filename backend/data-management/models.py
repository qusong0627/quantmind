from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy import create_engine
from datetime import datetime
import sys
import os

# 添加共享模块路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from shared.database import Base, get_db, db_manager

class DataSource(Base):
    """数据源模型"""
    __tablename__ = 'data_sources'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment='数据源名称')
    symbol = Column(String(20), nullable=False, comment='股票代码')
    description = Column(Text, comment='数据源描述')
    source_type = Column(String(50), default='csv', comment='数据源类型')
    update_frequency = Column(String(20), default='daily', comment='更新频率')
    remote_url = Column(String(500), comment='远程数据URL')
    is_active = Column(Boolean, default=True, comment='是否激活')
    auto_update = Column(Boolean, default=False, comment='是否自动更新')
    created_at = Column(DateTime, default=datetime.utcnow, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment='更新时间')
    
    # 关联关系
    files = relationship("DataFile", back_populates="data_source", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'symbol': self.symbol,
            'description': self.description,
            'source_type': self.source_type,
            'update_frequency': self.update_frequency,
            'remote_url': self.remote_url,
            'is_active': self.is_active,
            'auto_update': self.auto_update,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'file_count': len(self.files) if self.files else 0
        }

class DataFile(Base):
    """数据文件模型"""
    __tablename__ = 'data_files'
    
    id = Column(Integer, primary_key=True, index=True)
    data_source_id = Column(Integer, ForeignKey('data_sources.id'), nullable=False)
    filename = Column(String(255), nullable=False, comment='文件名')
    file_path = Column(String(500), nullable=False, comment='文件路径')
    file_size = Column(Integer, comment='文件大小(字节)')
    record_count = Column(Integer, comment='记录数量')
    start_date = Column(DateTime, comment='数据开始日期')
    end_date = Column(DateTime, comment='数据结束日期')
    status = Column(String(20), default='uploaded', comment='文件状态')
    error_message = Column(Text, comment='错误信息')
    checksum = Column(String(64), comment='文件校验和')
    created_at = Column(DateTime, default=datetime.utcnow, comment='创建时间')
    processed_at = Column(DateTime, comment='处理时间')
    
    # 关联关系
    data_source = relationship("DataSource", back_populates="files")
    
    def to_dict(self):
        return {
            'id': self.id,
            'data_source_id': self.data_source_id,
            'filename': self.filename,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'record_count': self.record_count,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'error_message': self.error_message,
            'checksum': self.checksum,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None
        }

class StockData(Base):
    """股票数据模型(存储在InfluxDB中的元数据)"""
    __tablename__ = 'stock_data_meta'
    
    id = Column(Integer, primary_key=True, index=True)
    data_source_id = Column(Integer, ForeignKey('data_sources.id'), nullable=False)
    symbol = Column(String(20), nullable=False, comment='股票代码')
    date = Column(DateTime, nullable=False, comment='交易日期')
    open_price = Column(Float, comment='开盘价')
    high_price = Column(Float, comment='最高价')
    low_price = Column(Float, comment='最低价')
    close_price = Column(Float, comment='收盘价')
    volume = Column(Integer, comment='成交量')
    amount = Column(Float, comment='成交额')
    created_at = Column(DateTime, default=datetime.utcnow, comment='创建时间')
    
    def to_dict(self):
        return {
            'id': self.id,
            'data_source_id': self.data_source_id,
            'symbol': self.symbol,
            'date': self.date.isoformat() if self.date else None,
            'open_price': self.open_price,
            'high_price': self.high_price,
            'low_price': self.low_price,
            'close_price': self.close_price,
            'volume': self.volume,
            'amount': self.amount,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

def create_tables():
    """创建数据表"""
    Base.metadata.create_all(bind=db_manager.mysql_engine)

if __name__ == "__main__":
    create_tables()
    print("数据表创建完成")