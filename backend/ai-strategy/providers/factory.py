"""LLM提供商工厂"""

from typing import Dict, List, Optional, Type
from enum import Enum
from .base import BaseLLMProvider, LLMConfig
from .qwen import QwenProvider
from .gemini import GeminiProvider
from utils.config import get_config
from utils.logger import get_logger

class ProviderType(str, Enum):
    """提供商类型枚举"""
    QWEN = "qwen"
    GEMINI = "gemini"
    OPENAI = "openai"  # 预留
    CLAUDE = "claude"  # 预留

class ProviderFactory:
    """LLM提供商工厂类"""
    
    # 提供商类映射
    _PROVIDER_CLASSES: Dict[ProviderType, Type[BaseLLMProvider]] = {
        ProviderType.QWEN: QwenProvider,
        ProviderType.GEMINI: GeminiProvider,
        # 可以在这里添加更多提供商
    }
    
    def __init__(self):
        """初始化工厂"""
        self.logger = get_logger(__name__)
        self._providers: Dict[str, BaseLLMProvider] = {}
        self._config = get_config()
        
    def create_provider(self, provider_type: ProviderType, **kwargs) -> BaseLLMProvider:
        """创建LLM提供商实例
        
        Args:
            provider_type: 提供商类型
            **kwargs: 额外配置参数
        
        Returns:
            LLM提供商实例
        
        Raises:
            ValueError: 不支持的提供商类型
            Exception: 创建失败
        """
        if provider_type not in self._PROVIDER_CLASSES:
            available_types = list(self._PROVIDER_CLASSES.keys())
            raise ValueError(f"不支持的提供商类型: {provider_type}，支持的类型: {available_types}")
        
        try:
            # 获取提供商配置
            provider_config = self._get_provider_config(provider_type, **kwargs)
            
            # 创建提供商实例
            provider_class = self._PROVIDER_CLASSES[provider_type]
            provider = provider_class(provider_config)
            
            self.logger.info(f"成功创建 {provider_type} 提供商实例")
            return provider
            
        except Exception as e:
            self.logger.error(f"创建 {provider_type} 提供商失败: {e}")
            raise Exception(f"创建 {provider_type} 提供商失败: {str(e)}")
    
    def get_or_create_provider(self, provider_type: ProviderType, **kwargs) -> BaseLLMProvider:
        """获取或创建提供商实例（单例模式）
        
        Args:
            provider_type: 提供商类型
            **kwargs: 额外配置参数
        
        Returns:
            LLM提供商实例
        """
        provider_key = f"{provider_type}_{hash(frozenset(kwargs.items()))}"
        
        if provider_key not in self._providers:
            self._providers[provider_key] = self.create_provider(provider_type, **kwargs)
        
        return self._providers[provider_key]
    
    def create_multiple_providers(self, provider_types: List[ProviderType], **kwargs) -> List[BaseLLMProvider]:
        """创建多个提供商实例
        
        Args:
            provider_types: 提供商类型列表
            **kwargs: 额外配置参数
        
        Returns:
            提供商实例列表
        """
        providers = []
        
        for provider_type in provider_types:
            try:
                provider = self.create_provider(provider_type, **kwargs)
                providers.append(provider)
            except Exception as e:
                self.logger.warning(f"创建 {provider_type} 提供商失败，跳过: {e}")
        
        if not providers:
            raise Exception("所有提供商创建都失败了")
        
        self.logger.info(f"成功创建 {len(providers)} 个提供商实例")
        return providers
    
    def _get_provider_config(self, provider_type: ProviderType, **kwargs) -> LLMConfig:
        """获取提供商配置
        
        Args:
            provider_type: 提供商类型
            **kwargs: 额外配置参数
        
        Returns:
            LLM配置
        
        Raises:
            ValueError: 配置缺失或无效
        """
        try:
            # 从配置文件获取基础配置
            base_config = self._config.get_llm_provider_config(provider_type.value)
            
            if not base_config:
                raise ValueError(f"配置文件中未找到 {provider_type} 的配置")
            
            # 合并额外参数
            config_dict = {**base_config, **kwargs}
            
            # 验证必需字段
            required_fields = ['api_key', 'api_url', 'model']
            for field in required_fields:
                if not config_dict.get(field):
                    raise ValueError(f"{provider_type} 配置缺少必需字段: {field}")
            
            # 创建配置对象
            return LLMConfig(
                api_key=config_dict['api_key'],
                api_url=config_dict['api_url'],
                model=config_dict['model'],
                max_tokens=config_dict.get('max_tokens', 4000),
                temperature=config_dict.get('temperature', 0.7),
                timeout=config_dict.get('timeout', 30),
                retry_attempts=config_dict.get('retry_attempts', 3),
                retry_delay=config_dict.get('retry_delay', 1)
            )
            
        except Exception as e:
            self.logger.error(f"获取 {provider_type} 配置失败: {e}")
            raise ValueError(f"获取 {provider_type} 配置失败: {str(e)}")
    
    def get_available_providers(self) -> List[str]:
        """获取可用的提供商列表
        
        Returns:
            可用提供商名称列表
        """
        available = []
        
        for provider_type in ProviderType:
            try:
                # 检查配置是否存在
                config = self._config.get_llm_provider_config(provider_type.value)
                if config and config.get('api_key') and config.get('api_url'):
                    available.append(provider_type.value)
            except Exception:
                continue
        
        return available
    
    async def validate_providers(self, provider_types: Optional[List[ProviderType]] = None) -> Dict[str, bool]:
        """验证提供商连接状态
        
        Args:
            provider_types: 要验证的提供商类型列表，None表示验证所有可用提供商
        
        Returns:
            提供商名称到验证结果的映射
        """
        if provider_types is None:
            provider_types = [ProviderType(name) for name in self.get_available_providers()]
        
        results = {}
        
        for provider_type in provider_types:
            try:
                provider = self.create_provider(provider_type)
                is_valid = await provider.validate_connection()
                results[provider_type.value] = is_valid
                
                if is_valid:
                    self.logger.info(f"{provider_type} 提供商验证成功")
                else:
                    self.logger.warning(f"{provider_type} 提供商验证失败")
                    
            except Exception as e:
                self.logger.error(f"{provider_type} 提供商验证异常: {e}")
                results[provider_type.value] = False
        
        return results
    
    def get_provider_info(self, provider_type: ProviderType) -> Dict[str, any]:
        """获取提供商信息
        
        Args:
            provider_type: 提供商类型
        
        Returns:
            提供商信息
        """
        try:
            provider = self.create_provider(provider_type)
            return provider.get_model_info()
        except Exception as e:
            self.logger.error(f"获取 {provider_type} 提供商信息失败: {e}")
            return {"error": str(e)}
    
    def clear_cache(self):
        """清除缓存的提供商实例"""
        self._providers.clear()
        self.logger.info("提供商缓存已清除")
    
    def __len__(self) -> int:
        """返回缓存的提供商数量"""
        return len(self._providers)
    
    def __contains__(self, provider_type: ProviderType) -> bool:
        """检查是否支持指定的提供商类型"""
        return provider_type in self._PROVIDER_CLASSES

# 全局工厂实例
_factory_instance: Optional[ProviderFactory] = None

def get_provider_factory() -> ProviderFactory:
    """获取全局提供商工厂实例
    
    Returns:
        提供商工厂实例
    """
    global _factory_instance
    if _factory_instance is None:
        _factory_instance = ProviderFactory()
    return _factory_instance

def create_provider(provider_type: ProviderType, **kwargs) -> BaseLLMProvider:
    """便捷函数：创建提供商实例
    
    Args:
        provider_type: 提供商类型
        **kwargs: 额外配置参数
    
    Returns:
        LLM提供商实例
    """
    factory = get_provider_factory()
    return factory.create_provider(provider_type, **kwargs)

def get_available_providers() -> List[str]:
    """便捷函数：获取可用提供商列表
    
    Returns:
        可用提供商名称列表
    """
    factory = get_provider_factory()
    return factory.get_available_providers()