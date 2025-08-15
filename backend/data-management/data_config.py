import os
from typing import Optional
import sys

from config.settings import settings

class DataManagementSettings:
    """数据管理服务配置"""
    
    def __init__(self):
        self.base_settings = settings
        
        # 服务端口
        self.DATA_MANAGEMENT_PORT = int(os.getenv('DATA_MANAGEMENT_PORT', 8008))
        
        # 数据库配置
        self.DATABASE_URL = self.base_settings.database.mysql_url
        
        # InfluxDB配置
        self.INFLUXDB_URL = self.base_settings.database.influxdb_url
        self.INFLUXDB_TOKEN = self.base_settings.database.influxdb_token
        self.INFLUXDB_ORG = self.base_settings.database.influxdb_org
        self.INFLUXDB_BUCKET = os.getenv('INFLUXDB_BUCKET', 'stock_data')
        
        # Redis配置
        self.REDIS_URL = self.base_settings.database.redis_url
        
        # 文件上传配置
        self.UPLOAD_DIR = os.getenv('UPLOAD_DIR', os.path.join(os.getcwd(), 'data', 'uploads'))
        self.MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 100 * 1024 * 1024))  # 100MB
        self.ALLOWED_EXTENSIONS = ['.csv']
        
        # 数据处理配置
        self.BATCH_SIZE = int(os.getenv('BATCH_SIZE', 1000))
        self.MAX_RECORDS_PER_FILE = int(os.getenv('MAX_RECORDS_PER_FILE', 100000))
        
        # 日志配置
        self.LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
        self.LOG_FILE = os.getenv('LOG_FILE', 'logs/data_management.log')
        
        # 安全配置
        self.JWT_SECRET_KEY = self.base_settings.security.secret_key
        self.JWT_ALGORITHM = self.base_settings.security.jwt_algorithm
        
        # API配置
        self.API_PREFIX = '/api/v1'
        self.CORS_ORIGINS = ['http://localhost:3000']
        
        # 数据验证配置
        self.VALIDATE_DATA_TYPES = True
        self.ALLOW_MISSING_VALUES = False
        self.DATE_FORMAT = '%Y-%m-%d'
        
        # 自动更新配置
        self.AUTO_UPDATE_ENABLED = os.getenv('AUTO_UPDATE_ENABLED', 'false').lower() == 'true'
        self.UPDATE_SCHEDULE = os.getenv('UPDATE_SCHEDULE', '0 2 * * *')  # 每天凌晨2点
        
        # 监控配置
        self.ENABLE_METRICS = os.getenv('ENABLE_METRICS', 'true').lower() == 'true'
        self.METRICS_PORT = int(os.getenv('METRICS_PORT', 9090))
    
    def get_database_url(self) -> str:
        """获取数据库连接URL"""
        return self.DATABASE_URL
    
    def get_influxdb_config(self) -> dict:
        """获取InfluxDB配置"""
        return {
            'url': self.INFLUXDB_URL,
            'token': self.INFLUXDB_TOKEN,
            'org': self.INFLUXDB_ORG,
            'bucket': self.INFLUXDB_BUCKET
        }
    
    def get_upload_config(self) -> dict:
        """获取文件上传配置"""
        return {
            'upload_dir': self.UPLOAD_DIR,
            'max_file_size': self.MAX_FILE_SIZE,
            'allowed_extensions': self.ALLOWED_EXTENSIONS
        }
    
    def is_development(self) -> bool:
        """判断是否为开发环境"""
        return os.getenv('DEV_MODE', 'false').lower() == 'true'

# 全局配置实例
settings = DataManagementSettings()

# 配置验证
def validate_config():
    """验证配置参数"""
    errors = []
    
    # 检查必需的配置
    if not settings.DATABASE_URL:
        errors.append("DATABASE_URL 未配置")
    
    if not settings.INFLUXDB_URL:
        errors.append("INFLUXDB_URL 未配置")
    
    if not os.path.exists(os.path.dirname(settings.UPLOAD_DIR)):
        try:
            os.makedirs(os.path.dirname(settings.UPLOAD_DIR), exist_ok=True)
        except Exception as e:
            errors.append(f"无法创建上传目录: {str(e)}")
    
    if errors:
        raise ValueError(f"配置验证失败: {'; '.join(errors)}")
    
    return True

if __name__ == "__main__":
    try:
        validate_config()
        print("配置验证通过")
        print(f"数据管理服务端口: {settings.DATA_MANAGEMENT_PORT}")
        print(f"数据库URL: {settings.DATABASE_URL}")
        print(f"InfluxDB URL: {settings.INFLUXDB_URL}")
        print(f"上传目录: {settings.UPLOAD_DIR}")
    except Exception as e:
        print(f"配置验证失败: {str(e)}")