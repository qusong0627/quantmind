#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
QuantMind 统一配置管理器
集中管理所有数据源、AI服务、数据库等配置
"""

import os
import json
from typing import Dict, Any, Optional, List
from pathlib import Path
import logging
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class ConfigType(Enum):
    """配置类型枚举"""
    DATA_SOURCE = "data_sources"
    AI_SERVICE = "ai_services"
    DATABASE = "databases"
    SYSTEM = "system_config"

class ServiceStatus(Enum):
    """服务状态枚举"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    OPTIONAL = "optional"
    MAINTENANCE = "maintenance"

@dataclass
class ConnectionConfig:
    """连接配置数据类"""
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    api_token: Optional[str] = None
    refresh_token: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    timeout: int = 30
    verify_ssl: bool = True
    env_var: Optional[str] = None
    env_vars: Optional[Dict[str, str]] = None

@dataclass
class ServiceConfig:
    """服务配置数据类"""
    name: str
    description: str
    type: str
    priority: int
    status: ServiceStatus
    required: bool
    connection: ConnectionConfig
    features: Optional[Dict[str, bool]] = None
    markets: Optional[Dict[str, Any]] = None
    rate_limits: Optional[Dict[str, int]] = None
    data_quality: Optional[str] = None
    reliability_score: Optional[float] = None
    cost_level: Optional[str] = None

class UnifiedConfigManager:
    """统一配置管理器"""
    
    def __init__(self, config_file: str = None):
        """
        初始化配置管理器
        
        Args:
            config_file: 配置文件路径，默认为 config/unified_data_sources.local.json
        """
        self.config_dir = Path(__file__).parent
        self.config_file = config_file or self.config_dir / "unified_data_sources.local.json"
        self.fallback_file = self.config_dir / "unified_data_sources.json"
        self._config = None
        self._service_cache = {}
        self._load_config()
    
    def _load_config(self):
        """加载配置文件"""
        try:
            # 优先加载本地配置文件
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    self._config = json.load(f)
                logger.info(f"已加载本地配置文件: {self.config_file}")
            # 回退到模板文件
            elif os.path.exists(self.fallback_file):
                with open(self.fallback_file, 'r', encoding='utf-8') as f:
                    self._config = json.load(f)
                logger.warning(f"使用模板配置文件: {self.fallback_file}，请创建本地配置文件")
            else:
                raise FileNotFoundError("未找到配置文件")
                
            # 验证配置文件格式
            self._validate_config()
            
        except Exception as e:
            logger.error(f"加载配置文件失败: {e}")
            self._config = {}
    
    def _validate_config(self):
        """验证配置文件格式"""
        required_sections = ['data_sources', 'ai_services', 'databases', 'system_config']
        for section in required_sections:
            if section not in self._config:
                logger.warning(f"配置文件缺少必需部分: {section}")
    
    def get_service_config(self, service_name: str, config_type: ConfigType = None) -> Optional[ServiceConfig]:
        """
        获取服务配置
        
        Args:
            service_name: 服务名称
            config_type: 配置类型，如果不指定则自动查找
            
        Returns:
            服务配置对象
        """
        # 检查缓存
        cache_key = f"{config_type.value if config_type else 'auto'}:{service_name}"
        if cache_key in self._service_cache:
            return self._service_cache[cache_key]
        
        # 查找服务配置
        service_config = None
        search_types = [config_type] if config_type else [ConfigType.DATA_SOURCE, ConfigType.AI_SERVICE, ConfigType.DATABASE]
        
        for cfg_type in search_types:
            if cfg_type.value in self._config and service_name in self._config[cfg_type.value]:
                raw_config = self._config[cfg_type.value][service_name]
                service_config = self._parse_service_config(service_name, raw_config)
                break
        
        # 缓存结果
        if service_config:
            self._service_cache[cache_key] = service_config
        
        return service_config
    
    def _parse_service_config(self, service_name: str, raw_config: Dict[str, Any]) -> ServiceConfig:
        """解析服务配置"""
        # 解析连接配置
        connection_data = raw_config.get('connection', {})
        connection = ConnectionConfig(
            base_url=connection_data.get('base_url'),
            api_key=self._get_config_value(connection_data, 'api_key'),
            api_token=self._get_config_value(connection_data, 'api_token'),
            refresh_token=self._get_config_value(connection_data, 'refresh_token'),
            username=self._get_config_value(connection_data, 'username'),
            password=self._get_config_value(connection_data, 'password'),
            host=self._get_config_value(connection_data, 'host'),
            port=connection_data.get('port'),
            database=self._get_config_value(connection_data, 'database'),
            timeout=connection_data.get('timeout', 30),
            verify_ssl=connection_data.get('verify_ssl', True),
            env_var=connection_data.get('env_var'),
            env_vars=connection_data.get('env_vars')
        )
        
        # 创建服务配置对象
        return ServiceConfig(
            name=raw_config.get('name', service_name),
            description=raw_config.get('description', ''),
            type=raw_config.get('type', 'unknown'),
            priority=raw_config.get('priority', 999),
            status=ServiceStatus(raw_config.get('status', 'inactive')),
            required=raw_config.get('required', False),
            connection=connection,
            features=raw_config.get('features'),
            markets=raw_config.get('markets'),
            rate_limits=raw_config.get('rate_limits'),
            data_quality=raw_config.get('data_quality'),
            reliability_score=raw_config.get('reliability_score'),
            cost_level=raw_config.get('cost_level')
        )
    
    def _get_config_value(self, config: Dict[str, Any], key: str) -> Optional[str]:
        """
        获取配置值，优先从环境变量获取
        
        Args:
            config: 配置字典
            key: 配置键名
            
        Returns:
            配置值
        """
        # 检查是否有对应的环境变量
        env_var = config.get('env_var') if key in ['api_key', 'api_token', 'refresh_token'] else None
        if not env_var and 'env_vars' in config and key in config['env_vars']:
            env_var = config['env_vars'][key]
        
        # 优先从环境变量获取
        if env_var:
            env_value = os.getenv(env_var)
            if env_value:
                return env_value
        
        # 从配置文件获取
        config_value = config.get(key)
        if config_value and not str(config_value).startswith('your_'):
            return config_value
        
        return None
    
    def get_data_sources_by_priority(self, status_filter: List[ServiceStatus] = None) -> List[ServiceConfig]:
        """
        按优先级获取数据源列表
        
        Args:
            status_filter: 状态过滤器
            
        Returns:
            按优先级排序的数据源列表
        """
        if status_filter is None:
            status_filter = [ServiceStatus.ACTIVE]
        
        data_sources = []
        if 'data_sources' in self._config:
            for service_name, raw_config in self._config['data_sources'].items():
                service_config = self._parse_service_config(service_name, raw_config)
                if service_config.status in status_filter:
                    data_sources.append(service_config)
        
        # 按优先级排序
        data_sources.sort(key=lambda x: x.priority)
        return data_sources
    
    def get_ai_services(self, status_filter: List[ServiceStatus] = None) -> List[ServiceConfig]:
        """
        获取AI服务列表
        
        Args:
            status_filter: 状态过滤器
            
        Returns:
            AI服务列表
        """
        if status_filter is None:
            status_filter = [ServiceStatus.ACTIVE]
        
        ai_services = []
        if 'ai_services' in self._config:
            for service_name, raw_config in self._config['ai_services'].items():
                service_config = self._parse_service_config(service_name, raw_config)
                if service_config.status in status_filter:
                    ai_services.append(service_config)
        
        # 按优先级排序
        ai_services.sort(key=lambda x: x.priority)
        return ai_services
    
    def get_databases(self, status_filter: List[ServiceStatus] = None) -> List[ServiceConfig]:
        """
        获取数据库配置列表
        
        Args:
            status_filter: 状态过滤器
            
        Returns:
            数据库配置列表
        """
        if status_filter is None:
            status_filter = [ServiceStatus.ACTIVE, ServiceStatus.OPTIONAL]
        
        databases = []
        if 'databases' in self._config:
            for service_name, raw_config in self._config['databases'].items():
                service_config = self._parse_service_config(service_name, raw_config)
                if service_config.status in status_filter:
                    databases.append(service_config)
        
        # 按优先级排序
        databases.sort(key=lambda x: x.priority)
        return databases
    
    def get_system_config(self, section: str = None) -> Dict[str, Any]:
        """
        获取系统配置
        
        Args:
            section: 配置部分名称
            
        Returns:
            系统配置字典
        """
        system_config = self._config.get('system_config', {})
        if section:
            return system_config.get(section, {})
        return system_config
    
    def validate_required_configs(self) -> Dict[str, bool]:
        """
        验证必需的配置是否已设置
        
        Returns:
            验证结果字典
        """
        results = {}
        validation_rules = self._config.get('validation_rules', {})
        
        # 检查生产环境必需配置
        required_configs = validation_rules.get('required_for_production', [])
        for config_path in required_configs:
            results[config_path] = self._check_config_path(config_path)
        
        return results
    
    def _check_config_path(self, config_path: str) -> bool:
        """检查配置路径是否有值"""
        try:
            parts = config_path.split('.')
            current = self._config
            
            for part in parts[:-1]:
                if part not in current:
                    return False
                current = current[part]
            
            final_key = parts[-1]
            if final_key not in current:
                return False
            
            value = current[final_key]
            return value is not None and str(value) != '' and not str(value).startswith('your_')
            
        except Exception:
            return False
    
    def create_local_config(self) -> bool:
        """
        创建本地配置文件
        
        Returns:
            是否创建成功
        """
        try:
            if os.path.exists(self.config_file):
                logger.info(f"本地配置文件已存在: {self.config_file}")
                return True
            
            # 复制模板文件
            if os.path.exists(self.fallback_file):
                with open(self.fallback_file, 'r', encoding='utf-8') as f:
                    template_config = json.load(f)
                
                with open(self.config_file, 'w', encoding='utf-8') as f:
                    json.dump(template_config, f, indent=2, ensure_ascii=False)
                
                logger.info(f"已创建本地配置文件: {self.config_file}")
                return True
            else:
                logger.error("模板配置文件不存在")
                return False
                
        except Exception as e:
            logger.error(f"创建本地配置文件失败: {e}")
            return False
    
    def get_service_status_summary(self) -> Dict[str, Any]:
        """
        获取所有服务状态摘要
        
        Returns:
            服务状态摘要
        """
        summary = {
            'data_sources': {
                'total': 0,
                'active': 0,
                'configured': 0,
                'services': {}
            },
            'ai_services': {
                'total': 0,
                'active': 0,
                'configured': 0,
                'services': {}
            },
            'databases': {
                'total': 0,
                'active': 0,
                'configured': 0,
                'services': {}
            }
        }
        
        # 统计数据源
        for service_name in self._config.get('data_sources', {}):
            service_config = self.get_service_config(service_name, ConfigType.DATA_SOURCE)
            if service_config:
                summary['data_sources']['total'] += 1
                if service_config.status == ServiceStatus.ACTIVE:
                    summary['data_sources']['active'] += 1
                
                # 检查是否已配置
                is_configured = self._is_service_configured(service_config)
                if is_configured:
                    summary['data_sources']['configured'] += 1
                
                summary['data_sources']['services'][service_name] = {
                    'name': service_config.name,
                    'status': service_config.status.value,
                    'configured': is_configured,
                    'priority': service_config.priority
                }
        
        # 统计AI服务
        for service_name in self._config.get('ai_services', {}):
            service_config = self.get_service_config(service_name, ConfigType.AI_SERVICE)
            if service_config:
                summary['ai_services']['total'] += 1
                if service_config.status == ServiceStatus.ACTIVE:
                    summary['ai_services']['active'] += 1
                
                is_configured = self._is_service_configured(service_config)
                if is_configured:
                    summary['ai_services']['configured'] += 1
                
                summary['ai_services']['services'][service_name] = {
                    'name': service_config.name,
                    'status': service_config.status.value,
                    'configured': is_configured,
                    'priority': service_config.priority
                }
        
        # 统计数据库
        for service_name in self._config.get('databases', {}):
            service_config = self.get_service_config(service_name, ConfigType.DATABASE)
            if service_config:
                summary['databases']['total'] += 1
                if service_config.status in [ServiceStatus.ACTIVE, ServiceStatus.OPTIONAL]:
                    summary['databases']['active'] += 1
                
                is_configured = self._is_service_configured(service_config)
                if is_configured:
                    summary['databases']['configured'] += 1
                
                summary['databases']['services'][service_name] = {
                    'name': service_config.name,
                    'status': service_config.status.value,
                    'configured': is_configured,
                    'priority': service_config.priority
                }
        
        return summary
    
    def _is_service_configured(self, service_config: ServiceConfig) -> bool:
        """检查服务是否已配置"""
        connection = service_config.connection
        
        # 检查主要认证信息
        auth_fields = [connection.api_key, connection.api_token, connection.refresh_token, connection.password]
        has_auth = any(field for field in auth_fields)
        
        # 检查连接信息
        if connection.base_url and connection.base_url.startswith(('http', 'local://', 'mock://')):
            return has_auth or connection.base_url.startswith(('local://', 'mock://'))
        
        if connection.host:
            return True
        
        return False

# 全局配置管理器实例
unified_config = UnifiedConfigManager()

# 便捷函数
def get_service_config(service_name: str, config_type: ConfigType = None) -> Optional[ServiceConfig]:
    """获取服务配置的便捷函数"""
    return unified_config.get_service_config(service_name, config_type)

def get_data_sources(status_filter: List[ServiceStatus] = None) -> List[ServiceConfig]:
    """获取数据源列表的便捷函数"""
    return unified_config.get_data_sources_by_priority(status_filter)

def get_ai_services(status_filter: List[ServiceStatus] = None) -> List[ServiceConfig]:
    """获取AI服务列表的便捷函数"""
    return unified_config.get_ai_services(status_filter)

def get_databases(status_filter: List[ServiceStatus] = None) -> List[ServiceConfig]:
    """获取数据库配置的便捷函数"""
    return unified_config.get_databases(status_filter)

def get_system_config(section: str = None) -> Dict[str, Any]:
    """获取系统配置的便捷函数"""
    return unified_config.get_system_config(section)

def validate_config() -> Dict[str, bool]:
    """验证配置的便捷函数"""
    return unified_config.validate_required_configs()

# 使用示例
if __name__ == "__main__":
    # 创建本地配置文件
    unified_config.create_local_config()
    
    # 获取服务状态摘要
    status_summary = unified_config.get_service_status_summary()
    print("=== 服务状态摘要 ===")
    print(json.dumps(status_summary, indent=2, ensure_ascii=False))
    
    # 验证配置
    validation_results = validate_config()
    print("\n=== 配置验证结果 ===")
    for config_path, is_valid in validation_results.items():
        status = "✓" if is_valid else "✗"
        print(f"  {status} {config_path}")
    
    # 获取数据源列表
    print("\n=== 可用数据源 ===")
    data_sources = get_data_sources()
    for ds in data_sources:
        configured = "✓" if unified_config._is_service_configured(ds) else "✗"
        print(f"  {configured} {ds.name} (优先级: {ds.priority}) - {ds.description}")