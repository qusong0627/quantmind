"""LLM提供商单元测试"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
import aiohttp
from aiohttp import ClientSession

from ai_strategy.providers.base import BaseLLMProvider, LLMConfig
from ai_strategy.providers.qwen import QwenProvider
from ai_strategy.providers.gemini import GeminiProvider
from ai_strategy.providers.factory import ProviderFactory, get_provider_factory


class TestLLMConfig:
    """LLMConfig 测试类"""
    
    def test_llm_config_creation(self):
        """测试LLM配置创建"""
        config = LLMConfig(
            api_key="test_key",
            base_url="https://api.test.com",
            model="test-model",
            max_tokens=1000,
            temperature=0.7
        )
        
        assert config.api_key == "test_key"
        assert config.base_url == "https://api.test.com"
        assert config.model == "test-model"
        assert config.max_tokens == 1000
        assert config.temperature == 0.7
    
    def test_llm_config_defaults(self):
        """测试LLM配置默认值"""
        config = LLMConfig(
            api_key="test_key",
            base_url="https://api.test.com",
            model="test-model"
        )
        
        assert config.max_tokens == 2000
        assert config.temperature == 0.7
        assert config.timeout == 30
        assert config.max_retries == 3


class TestBaseLLMProvider:
    """BaseLLMProvider 测试类"""
    
    def setup_method(self):
        """测试前设置"""
        self.config = LLMConfig(
            api_key="test_key",
            base_url="https://api.test.com",
            model="test-model"
        )
    
    def test_base_provider_abstract(self):
        """测试基础提供商是抽象类"""
        with pytest.raises(TypeError):
            BaseLLMProvider(self.config)
    
    def test_extract_code_blocks(self):
        """测试代码块提取"""
        # 创建一个具体的子类用于测试
        class TestProvider(BaseLLMProvider):
            async def _initialize_client(self):
                pass
            
            async def generate_content(self, prompt, **kwargs):
                pass
            
            def _get_system_prompt(self):
                return "test prompt"
        
        provider = TestProvider(self.config)
        
        text_with_code = """
        这是一些文本
        ```python
        def test_function():
            return "hello"
        ```
        更多文本
        ```python
        class TestClass:
            pass
        ```
        """
        
        code_blocks = provider._extract_code_blocks(text_with_code)
        assert len(code_blocks) == 2
        assert "def test_function():" in code_blocks[0]
        assert "class TestClass:" in code_blocks[1]
    
    def test_extract_description(self):
        """测试描述提取"""
        class TestProvider(BaseLLMProvider):
            async def _initialize_client(self):
                pass
            
            async def generate_content(self, prompt, **kwargs):
                pass
            
            def _get_system_prompt(self):
                return "test prompt"
        
        provider = TestProvider(self.config)
        
        text_with_description = """
        ## 策略描述
        这是一个双均线交叉策略，用于股票交易。
        
        ## 参数说明
        - short_period: 短期均线周期
        - long_period: 长期均线周期
        """
        
        description = provider._extract_description(text_with_description)
        assert "双均线交叉策略" in description
        assert "参数说明" in description
    
    def test_calculate_confidence_score(self):
        """测试置信度计算"""
        class TestProvider(BaseLLMProvider):
            async def _initialize_client(self):
                pass
            
            async def generate_content(self, prompt, **kwargs):
                pass
            
            def _get_system_prompt(self):
                return "test prompt"
        
        provider = TestProvider(self.config)
        
        # 测试高质量代码
        high_quality_code = """
        class MovingAverageStrategy(BaseStrategy):
            def __init__(self, short_period=5, long_period=20):
                super().__init__()
                self.short_period = short_period
                self.long_period = long_period
            
            def on_bar(self, bar):
                # 计算移动平均线
                short_ma = self.get_indicator('SMA', self.short_period)
                long_ma = self.get_indicator('SMA', self.long_period)
                
                if short_ma > long_ma:
                    self.buy()
                elif short_ma < long_ma:
                    self.sell()
        """
        
        score = provider._calculate_confidence_score(high_quality_code)
        assert 0.7 <= score <= 1.0
        
        # 测试低质量代码
        low_quality_code = "print('hello')"
        score = provider._calculate_confidence_score(low_quality_code)
        assert 0.0 <= score <= 0.5


class TestQwenProvider:
    """QwenProvider 测试类"""
    
    def setup_method(self):
        """测试前设置"""
        self.config = LLMConfig(
            api_key="test_qwen_key",
            base_url="https://dashscope.aliyuncs.com/api/v1",
            model="qwen-turbo"
        )
    
    @pytest.mark.asyncio
    async def test_qwen_provider_initialization(self):
        """测试千问提供商初始化"""
        provider = QwenProvider(self.config)
        assert provider.config.model == "qwen-turbo"
        assert provider.provider_name == "qwen"
    
    @pytest.mark.asyncio
    async def test_generate_content_success(self):
        """测试成功生成内容"""
        provider = QwenProvider(self.config)
        
        mock_response = {
            "output": {
                "choices": [{
                    "message": {
                        "content": "```python\nclass TestStrategy:\n    pass\n```"
                    }
                }]
            },
            "usage": {
                "total_tokens": 100
            }
        }
        
        with patch.object(provider, '_make_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            
            result = await provider.generate_content("Generate a strategy")
            
            assert result is not None
            assert "code" in result
            assert "class TestStrategy:" in result["code"]
            assert result["confidence_score"] > 0
    
    @pytest.mark.asyncio
    async def test_generate_content_failure(self):
        """测试生成内容失败"""
        provider = QwenProvider(self.config)
        
        with patch.object(provider, '_make_request', new_callable=AsyncMock) as mock_request:
            mock_request.side_effect = Exception("API Error")
            
            result = await provider.generate_content("Generate a strategy")
            assert result is None
    
    @pytest.mark.asyncio
    async def test_verify_connection_success(self):
        """测试连接验证成功"""
        provider = QwenProvider(self.config)
        
        mock_response = {
            "output": {
                "choices": [{
                    "message": {
                        "content": "Hello"
                    }
                }]
            }
        }
        
        with patch.object(provider, '_make_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            
            is_connected = await provider.verify_connection()
            assert is_connected is True
    
    @pytest.mark.asyncio
    async def test_verify_connection_failure(self):
        """测试连接验证失败"""
        provider = QwenProvider(self.config)
        
        with patch.object(provider, '_make_request', new_callable=AsyncMock) as mock_request:
            mock_request.side_effect = Exception("Connection Error")
            
            is_connected = await provider.verify_connection()
            assert is_connected is False
    
    def test_get_model_info(self):
        """测试获取模型信息"""
        provider = QwenProvider(self.config)
        model_info = provider.get_model_info()
        
        assert model_info["name"] == "qwen-turbo"
        assert model_info["provider"] == "qwen"
        assert "max_tokens" in model_info
        assert "temperature" in model_info


class TestGeminiProvider:
    """GeminiProvider 测试类"""
    
    def setup_method(self):
        """测试前设置"""
        self.config = LLMConfig(
            api_key="test_gemini_key",
            base_url="https://generativelanguage.googleapis.com/v1beta",
            model="gemini-pro"
        )
    
    @pytest.mark.asyncio
    async def test_gemini_provider_initialization(self):
        """测试Gemini提供商初始化"""
        provider = GeminiProvider(self.config)
        assert provider.config.model == "gemini-pro"
        assert provider.provider_name == "gemini"
    
    @pytest.mark.asyncio
    async def test_generate_content_success(self):
        """测试成功生成内容"""
        provider = GeminiProvider(self.config)
        
        mock_response = {
            "candidates": [{
                "content": {
                    "parts": [{
                        "text": "```python\nclass GeminiStrategy:\n    pass\n```"
                    }]
                }
            }],
            "usageMetadata": {
                "totalTokenCount": 150
            }
        }
        
        with patch.object(provider, '_make_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            
            result = await provider.generate_content("Generate a strategy")
            
            assert result is not None
            assert "code" in result
            assert "class GeminiStrategy:" in result["code"]
            assert result["confidence_score"] > 0
    
    @pytest.mark.asyncio
    async def test_verify_connection_success(self):
        """测试连接验证成功"""
        provider = GeminiProvider(self.config)
        
        mock_response = {
            "candidates": [{
                "content": {
                    "parts": [{
                        "text": "Hello from Gemini"
                    }]
                }
            }]
        }
        
        with patch.object(provider, '_make_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            
            is_connected = await provider.verify_connection()
            assert is_connected is True
    
    def test_get_model_info(self):
        """测试获取模型信息"""
        provider = GeminiProvider(self.config)
        model_info = provider.get_model_info()
        
        assert model_info["name"] == "gemini-pro"
        assert model_info["provider"] == "gemini"
        assert "max_tokens" in model_info
        assert "temperature" in model_info


class TestProviderFactory:
    """ProviderFactory 测试类"""
    
    def setup_method(self):
        """测试前设置"""
        self.factory = ProviderFactory()
        self.qwen_config = LLMConfig(
            api_key="test_qwen_key",
            base_url="https://dashscope.aliyuncs.com/api/v1",
            model="qwen-turbo"
        )
        self.gemini_config = LLMConfig(
            api_key="test_gemini_key",
            base_url="https://generativelanguage.googleapis.com/v1beta",
            model="gemini-pro"
        )
    
    def test_create_provider_qwen(self):
        """测试创建千问提供商"""
        provider = self.factory.create_provider("qwen", self.qwen_config)
        assert isinstance(provider, QwenProvider)
        assert provider.config.model == "qwen-turbo"
    
    def test_create_provider_gemini(self):
        """测试创建Gemini提供商"""
        provider = self.factory.create_provider("gemini", self.gemini_config)
        assert isinstance(provider, GeminiProvider)
        assert provider.config.model == "gemini-pro"
    
    def test_create_provider_unsupported(self):
        """测试创建不支持的提供商"""
        with pytest.raises(ValueError, match="Unsupported provider"):
            self.factory.create_provider("unsupported", self.qwen_config)
    
    def test_get_provider_singleton(self):
        """测试获取提供商单例"""
        provider1 = self.factory.get_provider("qwen", self.qwen_config)
        provider2 = self.factory.get_provider("qwen", self.qwen_config)
        assert provider1 is provider2
    
    def test_create_multiple_providers(self):
        """测试批量创建提供商"""
        configs = {
            "qwen": self.qwen_config,
            "gemini": self.gemini_config
        }
        
        providers = self.factory.create_multiple_providers(configs)
        
        assert len(providers) == 2
        assert "qwen" in providers
        assert "gemini" in providers
        assert isinstance(providers["qwen"], QwenProvider)
        assert isinstance(providers["gemini"], GeminiProvider)
    
    def test_get_supported_providers(self):
        """测试获取支持的提供商列表"""
        supported = self.factory.get_supported_providers()
        assert "qwen" in supported
        assert "gemini" in supported
        assert "openai" in supported  # 预留的
        assert "claude" in supported  # 预留的
    
    def test_clear_cache(self):
        """测试清除缓存"""
        # 创建一个提供商实例
        provider1 = self.factory.get_provider("qwen", self.qwen_config)
        assert len(self.factory._instances) == 1
        
        # 清除缓存
        self.factory.clear_cache()
        assert len(self.factory._instances) == 0
        
        # 再次获取应该是新实例
        provider2 = self.factory.get_provider("qwen", self.qwen_config)
        assert provider1 is not provider2
    
    @pytest.mark.asyncio
    async def test_verify_all_connections(self):
        """测试验证所有连接"""
        configs = {
            "qwen": self.qwen_config,
            "gemini": self.gemini_config
        }
        
        with patch.object(QwenProvider, 'verify_connection', new_callable=AsyncMock) as mock_qwen:
            with patch.object(GeminiProvider, 'verify_connection', new_callable=AsyncMock) as mock_gemini:
                mock_qwen.return_value = True
                mock_gemini.return_value = False
                
                results = await self.factory.verify_all_connections(configs)
                
                assert results["qwen"] is True
                assert results["gemini"] is False
    
    def test_get_all_model_info(self):
        """测试获取所有模型信息"""
        configs = {
            "qwen": self.qwen_config,
            "gemini": self.gemini_config
        }
        
        model_info = self.factory.get_all_model_info(configs)
        
        assert "qwen" in model_info
        assert "gemini" in model_info
        assert model_info["qwen"]["name"] == "qwen-turbo"
        assert model_info["gemini"]["name"] == "gemini-pro"


class TestGlobalFactory:
    """全局工厂测试类"""
    
    def test_get_provider_factory_singleton(self):
        """测试全局工厂单例模式"""
        factory1 = get_provider_factory()
        factory2 = get_provider_factory()
        assert factory1 is factory2
    
    def test_get_provider_factory_type(self):
        """测试全局工厂类型"""
        factory = get_provider_factory()
        assert isinstance(factory, ProviderFactory)


if __name__ == "__main__":
    pytest.main([__file__])