"""统一配置管理模块"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from config.api_config import api_config, get_api_key

class DatabaseSettings(BaseSettings):
    """数据库配置"""
    mysql_host: str = "localhost"
    
    class Config:
        extra = "allow"
    mysql_port: int = 3306
    mysql_user: str = "quantmind"
    mysql_password: str = "quantmind123"
    mysql_database: str = "quantmind"
    
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: Optional[str] = None
    
    influxdb_url: str = "http://localhost:8086"
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

class APISettings(BaseSettings):
    """API配置"""
    # 服务端口配置
    gateway_port: int = 8000
    
    class Config:
        extra = "allow"
    user_service_port: int = 8001
    backtest_service_port: int = 8002
    ai_strategy_port: int = 8003
    data_service_port: int = 8005
    
    # API限制配置
    rate_limit_per_minute: int = 100
    request_timeout: int = 30
    
    # 外部API配置 - 通过API配置管理器获取
    @property
    def tsanghi_api_key(self) -> Optional[str]:
        return get_api_key('tsanghi')
    
    @property
    def ifind_refresh_token(self) -> Optional[str]:
        return get_api_key('ifind', 'refresh_token')
    
    @property
    def qwen_api_key(self) -> Optional[str]:
        return get_api_key('qwen')
    
    @property
    def gemini_api_key(self) -> Optional[str]:
        return get_api_key('gemini')
    
    @property
    def openai_api_key(self) -> Optional[str]:
        return get_api_key('openai')
    
    @property
    def alpha_vantage_api_key(self) -> Optional[str]:
        return get_api_key('alpha_vantage')
    
    @property
    def juhe_api_key(self) -> Optional[str]:
        return get_api_key('juhe')
    
    @property
    def canghai_api_key(self) -> Optional[str]:
        return get_api_key('canghai_ai')

class LoggingSettings(BaseSettings):
    """日志配置"""
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    log_file: Optional[str] = None
    max_log_size: int = 10 * 1024 * 1024  # 10MB
    backup_count: int = 5

class SecuritySettings(BaseSettings):
    """安全配置"""
    jwt_algorithm: str = "HS256"
    
    class Config:
        extra = "allow"
    jwt_expire_minutes: int = 30
    cors_origins: list = ["http://localhost:3000"]
    
    @property
    def secret_key(self) -> str:
        """从API配置管理器获取JWT密钥"""
        key = get_api_key('jwt')
        return key if key else "your-secret-key-here"

class Settings(BaseSettings):
    """主配置类"""
    environment: str = "development"
    debug: bool = True
    
    database: DatabaseSettings = DatabaseSettings()
    api: APISettings = APISettings()
    logging: LoggingSettings = LoggingSettings()
    security: SecuritySettings = SecuritySettings()
    
    class Config:
        env_file = ".env"
        env_nested_delimiter = "__"
        extra = "allow"

# 全局配置实例
settings = Settings()