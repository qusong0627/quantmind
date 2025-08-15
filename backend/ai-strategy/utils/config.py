"""配置管理模块"""

import os
import yaml
from typing import Dict, Any, Optional
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class ConfigManager:
    """配置管理器"""
    
    def __init__(self, config_path: Optional[str] = None):
        """初始化配置管理器
        
        Args:
            config_path: 配置文件路径，默认为当前目录下的config.yaml
        """
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config.yaml"
        
        self.config_path = Path(config_path)
        self._config: Dict[str, Any] = {}
        self._load_config()
    
    def _load_config(self) -> None:
        """加载配置文件"""
        try:
            if self.config_path.exists():
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    self._config = yaml.safe_load(f) or {}
            else:
                raise FileNotFoundError(f"配置文件不存在: {self.config_path}")
        except Exception as e:
            raise RuntimeError(f"加载配置文件失败: {e}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """获取配置值
        
        Args:
            key: 配置键，支持点号分隔的嵌套键，如 'app.name'
            default: 默认值
        
        Returns:
            配置值
        """
        keys = key.split('.')
        value = self._config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        # 如果值是字符串且包含环境变量引用，则替换
        if isinstance(value, str) and value.startswith('${') and value.endswith('}'):
            env_key = value[2:-1]
            return os.getenv(env_key, default)
        
        return value
    
    def get_llm_config(self, provider: str) -> Dict[str, Any]:
        """获取LLM提供商配置
        
        Args:
            provider: 提供商名称
        
        Returns:
            提供商配置
        """
        config = self.get(f'llm_providers.{provider}', {})
        if not config:
            raise ValueError(f"未找到LLM提供商配置: {provider}")
        
        # 从环境变量获取API密钥
        api_key_env = f"{provider.upper()}_API_KEY"
        config['api_key'] = os.getenv(api_key_env)
        
        if not config['api_key']:
            raise ValueError(f"未找到API密钥环境变量: {api_key_env}")
        
        return config
    
    def get_app_config(self) -> Dict[str, Any]:
        """获取应用配置"""
        return self.get('app', {})
    
    def get_logging_config(self) -> Dict[str, Any]:
        """获取日志配置"""
        return self.get('logging', {})
    
    def get_security_config(self) -> Dict[str, Any]:
        """获取安全配置"""
        return self.get('security', {})
    
    def get_performance_config(self) -> Dict[str, Any]:
        """获取性能配置"""
        return self.get('performance', {})
    
    def is_provider_enabled(self, provider: str) -> bool:
        """检查LLM提供商是否启用
        
        Args:
            provider: 提供商名称
        
        Returns:
            是否启用
        """
        return self.get(f'llm_providers.{provider}.enabled', False)
    
    def get_enabled_providers(self) -> list[str]:
        """获取所有启用的LLM提供商
        
        Returns:
            启用的提供商列表
        """
        providers = []
        llm_config = self.get('llm_providers', {})
        
        for provider, config in llm_config.items():
            if config.get('enabled', False):
                providers.append(provider)
        
        return providers
    
    def reload(self) -> None:
        """重新加载配置"""
        self._load_config()
    
    def validate_config(self) -> bool:
        """验证配置完整性
        
        Returns:
            配置是否有效
        """
        required_sections = ['app', 'llm_providers']
        
        for section in required_sections:
            if not self.get(section):
                raise ValueError(f"缺少必需的配置节: {section}")
        
        # 验证至少有一个启用的LLM提供商
        enabled_providers = self.get_enabled_providers()
        if not enabled_providers:
            raise ValueError("至少需要启用一个LLM提供商")
        
        # 验证每个启用的提供商都有必需的配置
        for provider in enabled_providers:
            config = self.get(f'llm_providers.{provider}')
            required_keys = ['api_url', 'model']
            
            for key in required_keys:
                if not config.get(key):
                    raise ValueError(f"LLM提供商 {provider} 缺少必需配置: {key}")
        
        return True

# 全局配置实例
config = ConfigManager()

# 便捷函数
def get_config(key: str = None, default: Any = None) -> Any:
    """获取配置值的便捷函数
    
    Args:
        key: 配置键，如果为None则返回全局配置实例
        default: 默认值
    
    Returns:
        配置值或配置实例
    """
    if key is None:
        return config
    return config.get(key, default)

def get_llm_config(provider: str) -> Dict[str, Any]:
    """获取LLM配置的便捷函数"""
    return config.get_llm_config(provider)

def is_debug_mode() -> bool:
    """检查是否为调试模式"""
    return config.get('app.debug', False)

def get_app_port() -> int:
    """获取应用端口"""
    return config.get('app.port', 8005)

def get_app_host() -> str:
    """获取应用主机"""
    return config.get('app.host', '0.0.0.0')