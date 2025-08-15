"""配置管理器单元测试"""

import pytest
import tempfile
import os
from unittest.mock import patch, mock_open

from ai_strategy.utils.config import ConfigManager, get_config

class TestConfigManager:
    """配置管理器测试类"""
    
    def test_load_config_success(self):
        """测试成功加载配置"""
        config_content = """
app:
  host: "0.0.0.0"
  port: 8001
  debug: true

llm_providers:
  qwen:
    enabled: true
    api_key: "test_key"
    model: "qwen-max"
"""
        
        with patch("builtins.open", mock_open(read_data=config_content)):
            with patch("os.path.exists", return_value=True):
                config_manager = ConfigManager("test_config.yaml")
                
                assert config_manager.get("app.host") == "0.0.0.0"
                assert config_manager.get("app.port") == 8001
                assert config_manager.get("app.debug") is True
                assert config_manager.get("llm_providers.qwen.enabled") is True
    
    def test_load_config_file_not_found(self):
        """测试配置文件不存在"""
        with patch("os.path.exists", return_value=False):
            with pytest.raises(FileNotFoundError):
                ConfigManager("nonexistent.yaml")
    
    def test_get_nested_key(self):
        """测试获取嵌套键值"""
        config_content = """
app:
  database:
    host: "localhost"
    port: 5432
    credentials:
      username: "user"
      password: "pass"
"""
        
        with patch("builtins.open", mock_open(read_data=config_content)):
            with patch("os.path.exists", return_value=True):
                config_manager = ConfigManager("test_config.yaml")
                
                assert config_manager.get("app.database.host") == "localhost"
                assert config_manager.get("app.database.port") == 5432
                assert config_manager.get("app.database.credentials.username") == "user"
    
    def test_get_with_default(self):
        """测试使用默认值获取配置"""
        config_content = "app:\n  host: '0.0.0.0'"
        
        with patch("builtins.open", mock_open(read_data=config_content)):
            with patch("os.path.exists", return_value=True):
                config_manager = ConfigManager("test_config.yaml")
                
                # 存在的键
                assert config_manager.get("app.host", "default") == "0.0.0.0"
                
                # 不存在的键，返回默认值
                assert config_manager.get("app.port", 8080) == 8080
                assert config_manager.get("nonexistent.key", "default") == "default"
    
    def test_environment_variable_substitution(self):
        """测试环境变量替换"""
        config_content = """
app:
  host: "${HOST:0.0.0.0}"
  port: "${PORT:8001}"
  debug: "${DEBUG:false}"

llm_providers:
  qwen:
    api_key: "${QWEN_API_KEY}"
"""
        
        with patch("builtins.open", mock_open(read_data=config_content)):
            with patch("os.path.exists", return_value=True):
                with patch.dict(os.environ, {
                    "HOST": "127.0.0.1",
                    "PORT": "9000",
                    "QWEN_API_KEY": "real_api_key"
                }):
                    config_manager = ConfigManager("test_config.yaml")
                    
                    assert config_manager.get("app.host") == "127.0.0.1"
                    assert config_manager.get("app.port") == "9000"
                    assert config_manager.get("app.debug") == "false"  # 使用默认值
                    assert config_manager.get("llm_providers.qwen.api_key") == "real_api_key"
    
    def test_get_llm_provider_config(self):
        """测试获取LLM提供商配置"""
        config_content = """
llm_providers:
  qwen:
    enabled: true
    api_key: "qwen_key"
    base_url: "https://api.qwen.com"
    model: "qwen-max"
    max_tokens: 2000
    temperature: 0.7
  
  gemini:
    enabled: false
    api_key: "gemini_key"
    model: "gemini-pro"
"""
        
        with patch("builtins.open", mock_open(read_data=config_content)):
            with patch("os.path.exists", return_value=True):
                config_manager = ConfigManager("test_config.yaml")
                
                qwen_config = config_manager.get_llm_provider_config("qwen")
                assert qwen_config["enabled"] is True
                assert qwen_config["api_key"] == "qwen_key"
                assert qwen_config["model"] == "qwen-max"
                assert qwen_config["max_tokens"] == 2000
                
                gemini_config = config_manager.get_llm_provider_config("gemini")
                assert gemini_config["enabled"] is False
                
                # 不存在的提供商
                unknown_config = config_manager.get_llm_provider_config("unknown")
                assert unknown_config == {}
    
    def test_get_app_config(self):
        """测试获取应用配置"""
        config_content = """
app:
  host: "0.0.0.0"
  port: 8001
  debug: true
  workers: 4
"""
        
        with patch("builtins.open", mock_open(read_data=config_content)):
            with patch("os.path.exists", return_value=True):
                config_manager = ConfigManager("test_config.yaml")
                
                app_config = config_manager.get_app_config()
                assert app_config["host"] == "0.0.0.0"
                assert app_config["port"] == 8001
                assert app_config["debug"] is True
                assert app_config["workers"] == 4
    
    def test_validate_config(self):
        """测试配置验证"""
        # 有效配置
        valid_config_content = """
app:
  host: "0.0.0.0"
  port: 8001

llm_providers:
  qwen:
    enabled: true
    api_key: "test_key"
    model: "qwen-max"

logging:
  level: "INFO"
"""
        
        with patch("builtins.open", mock_open(read_data=valid_config_content)):
            with patch("os.path.exists", return_value=True):
                config_manager = ConfigManager("test_config.yaml")
                
                is_valid, errors = config_manager.validate_config()
                assert is_valid is True
                assert len(errors) == 0
        
        # 无效配置（缺少必需字段）
        invalid_config_content = """
app:
  host: "0.0.0.0"
  # 缺少port

# 缺少llm_providers
"""
        
        with patch("builtins.open", mock_open(read_data=invalid_config_content)):
            with patch("os.path.exists", return_value=True):
                config_manager = ConfigManager("test_config.yaml")
                
                is_valid, errors = config_manager.validate_config()
                assert is_valid is False
                assert len(errors) > 0
    
    def test_reload_config(self):
        """测试重新加载配置"""
        initial_config = "app:\n  port: 8001"
        updated_config = "app:\n  port: 9001"
        
        with patch("builtins.open", mock_open(read_data=initial_config)):
            with patch("os.path.exists", return_value=True):
                config_manager = ConfigManager("test_config.yaml")
                assert config_manager.get("app.port") == 8001
        
        # 模拟配置文件更新
        with patch("builtins.open", mock_open(read_data=updated_config)):
            with patch("os.path.exists", return_value=True):
                config_manager.reload()
                assert config_manager.get("app.port") == 9001

class TestGlobalConfig:
    """全局配置测试类"""
    
    def test_get_config_singleton(self):
        """测试全局配置单例"""
        config_content = "app:\n  host: '0.0.0.0'"
        
        with patch("builtins.open", mock_open(read_data=config_content)):
            with patch("os.path.exists", return_value=True):
                config1 = get_config()
                config2 = get_config()
                
                # 应该是同一个实例
                assert config1 is config2
    
    def test_get_config_initialization(self):
        """测试全局配置初始化"""
        config_content = "app:\n  port: 8001"
        
        with patch("builtins.open", mock_open(read_data=config_content)):
            with patch("os.path.exists", return_value=True):
                config = get_config()
                
                assert config is not None
                assert config.get("app.port") == 8001

if __name__ == "__main__":
    pytest.main([__file__])