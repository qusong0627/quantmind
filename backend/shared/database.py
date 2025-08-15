"""统一数据库连接管理"""
import logging
from typing import Optional
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import redis
from influxdb_client import InfluxDBClient
from config.settings import settings

logger = logging.getLogger(__name__)

# SQLAlchemy配置
Base = declarative_base()
metadata = MetaData()

class DatabaseManager:
    """数据库连接管理器"""
    
    def __init__(self):
        self._mysql_engine = None
        self._session_factory = None
        self._redis_client = None
        self._influxdb_client = None
    
    @property
    def mysql_engine(self):
        """MySQL引擎"""
        if self._mysql_engine is None:
            self._mysql_engine = create_engine(
                settings.database.mysql_url,
                poolclass=QueuePool,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                echo=settings.debug
            )
            logger.info("MySQL engine initialized")
        return self._mysql_engine
    
    @property
    def session_factory(self):
        """Session工厂"""
        if self._session_factory is None:
            self._session_factory = sessionmaker(
                bind=self.mysql_engine,
                autocommit=False,
                autoflush=False
            )
        return self._session_factory
    
    def get_db_session(self) -> Session:
        """获取数据库会话"""
        return self.session_factory()
    
    @property
    def redis_client(self):
        """Redis客户端"""
        if self._redis_client is None:
            self._redis_client = redis.from_url(
                settings.database.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            logger.info("Redis client initialized")
        return self._redis_client
    
    @property
    def influxdb_client(self):
        """InfluxDB客户端"""
        if self._influxdb_client is None:
            self._influxdb_client = InfluxDBClient(
                url=settings.database.influxdb_url,
                token=settings.database.influxdb_token,
                org=settings.database.influxdb_org
            )
            logger.info("InfluxDB client initialized")
        return self._influxdb_client
    
    def test_connections(self) -> dict:
        """测试所有数据库连接"""
        results = {}
        
        # 测试MySQL
        try:
            with self.mysql_engine.connect() as conn:
                conn.execute("SELECT 1")
            results['mysql'] = {'status': 'connected', 'error': None}
        except Exception as e:
            results['mysql'] = {'status': 'error', 'error': str(e)}
            logger.error(f"MySQL connection failed: {e}")
        
        # 测试Redis
        try:
            self.redis_client.ping()
            results['redis'] = {'status': 'connected', 'error': None}
        except Exception as e:
            results['redis'] = {'status': 'error', 'error': str(e)}
            logger.error(f"Redis connection failed: {e}")
        
        # 测试InfluxDB
        try:
            health = self.influxdb_client.health()
            if health.status == 'pass':
                results['influxdb'] = {'status': 'connected', 'error': None}
            else:
                results['influxdb'] = {'status': 'error', 'error': 'Health check failed'}
        except Exception as e:
            results['influxdb'] = {'status': 'error', 'error': str(e)}
            logger.error(f"InfluxDB connection failed: {e}")
        
        return results
    
    def close_connections(self):
        """关闭所有连接"""
        if self._mysql_engine:
            self._mysql_engine.dispose()
            logger.info("MySQL engine disposed")
        
        if self._redis_client:
            self._redis_client.close()
            logger.info("Redis client closed")
        
        if self._influxdb_client:
            self._influxdb_client.close()
            logger.info("InfluxDB client closed")

# 全局数据库管理器实例
db_manager = DatabaseManager()

# 便捷函数
def get_db() -> Session:
    """获取数据库会话的依赖注入函数"""
    db = db_manager.get_db_session()
    try:
        yield db
    finally:
        db.close()

def get_redis():
    """获取Redis客户端"""
    return db_manager.redis_client

def get_influxdb():
    """获取InfluxDB客户端"""
    return db_manager.influxdb_client