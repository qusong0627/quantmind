"""服务配置模板"""
from pydantic import BaseSettings
from typing import Optional
import os

class ServiceConfig(BaseSettings):
    """基础服务配置"""
    service_name: str
    service_version: str = "1.0.0"
    debug: bool = False
    log_level: str = "INFO"
    
    # 数据库配置
    database_url: Optional[str] = None
    redis_url: Optional[str] = None
    influxdb_url: Optional[str] = None
    
    # 服务端口
    port: int = 8000
    host: str = "0.0.0.0"
    
    # 健康检查
    health_check_path: str = "/health"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

class DatabaseConfig(BaseSettings):
    """数据库配置"""
    mysql_host: str = "mysql"
    mysql_port: int = 3306
    mysql_user: str = "quantmind"
    mysql_password: str = "quantmind123"
    mysql_database: str = "quantmind"
    
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_password: Optional[str] = None
    
    influxdb_url: str = "http://influxdb:8086"
    influxdb_token: Optional[str] = None
    influxdb_org: str = "quantmind"
    influxdb_bucket: str = "market_data"
    
    @property
    def mysql_url(self) -> str:
        return f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
    
    @property
    def redis_url(self) -> str:
        if self.redis_password:
            return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}"
        return f"redis://{self.redis_host}:{self.redis_port}"
