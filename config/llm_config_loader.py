#!/usr/bin/env python3
"""
LLM配置加载器
负责从环境变量、配置文件等多种来源加载LLM API配置
"""

import os
import yaml
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

from .llm_api_config import LLMAPIConfig, LLMAPIManager, LLMProvider


class LLMConfigLoader:
    """LLM配置加载器"""
    
    def __init__(self, config_dir: Optional[str] = None):
        self.config_dir = Path(config_dir) if config_dir else Path(__file__).parent
        self.project_root = self.config_dir.parent
        self.api_manager = LLMAPIManager()
        
        # 加载环境变量
        self._load_env_files()
    
    def _load_env_files(self):
        """加载环境变量文件"""
        env_files = [
            self.config_dir / '.env.llm',
            self.config_dir / '.env',
            self.project_root / '.env.llm',
            self.project_root / '.env'
        ]
        
        for env_file in env_files:
            if env_file.exists():
                load_dotenv(env_file)
                print(f"已加载环境变量文件: {env_file}")
    
    def load_from_yaml(self, yaml_file: str) -> Dict[str, Any]:
        """从YAML文件加载配置"""
        yaml_path = self.config_dir / yaml_file
        if not yaml_path.exists():
            yaml_path = self.project_root / "backend" / "ai-strategy" / yaml_file
        
        if yaml_path.exists():
            with open(yaml_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        return {}
    
    def load_from_json(self, json_file: str) -> Dict[str, Any]:
        """从JSON文件加载配置"""
        json_path = self.config_dir / json_file
        if json_path.exists():
            with open(json_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def create_config_from_env(self, provider: str) -> Optional[LLMAPIConfig]:
        """从环境变量创建配置"""
        provider_upper = provider.upper()
        api_key = os.getenv(f'{provider_upper}_API_KEY')
        
        if not api_key:
            return None
        
        # 预定义的配置映射
        config_mapping = {
            'qwen': {
                'api_url': 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                'model': 'qwen-plus',
                'description': '阿里云通义千问大模型',
                'tags': ['中文优化', '推荐']
            },
            'gemini': {
                'api_url': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
                'model': 'gemini-2.0-flash',
                'description': 'Google Gemini多模态模型',
                'tags': ['多模态', '新锐']
            },
            'openai': {
                'api_url': 'https://api.openai.com/v1/chat/completions',
                'model': 'gpt-4',
                'description': 'OpenAI GPT-4模型',
                'tags': ['通用', '备选']
            },
            'claude': {
                'api_url': 'https://api.anthropic.com/v1/messages',
                'model': 'claude-3-sonnet-20240229',
                'description': 'Anthropic Claude模型',
                'tags': ['安全', '预留']
            },
            'baidu': {
                'api_url': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                'model': 'ernie-bot-turbo',
                'description': '百度文心一言模型',
                'tags': ['中文', '本土']
            },
            'zhipu': {
                'api_url': 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                'model': 'glm-4',
                'description': '智谱AI GLM-4模型',
                'tags': ['中文', '预留']
            }
        }
        
        if provider not in config_mapping:
            return None
        
        base_config = config_mapping[provider]
        
        # 从环境变量获取自定义配置
        api_url = os.getenv(f'{provider_upper}_API_URL', base_config['api_url'])
        model = os.getenv(f'{provider_upper}_MODEL', base_config['model'])
        enabled = os.getenv(f'{provider_upper}_ENABLED', 'true').lower() == 'true'
        priority = int(os.getenv(f'{provider_upper}_PRIORITY', '1'))
        max_tokens = int(os.getenv(f'{provider_upper}_MAX_TOKENS', '2000'))
        temperature = float(os.getenv(f'{provider_upper}_TEMPERATURE', '0.7'))
        timeout = int(os.getenv(f'{provider_upper}_TIMEOUT', '30'))
        
        return LLMAPIConfig(
            provider=provider,
            api_key=api_key,
            api_url=api_url,
            model=model,
            enabled=enabled,
            priority=priority,
            max_tokens=max_tokens,
            temperature=temperature,
            timeout=timeout,
            description=base_config['description'],
            tags=base_config['tags']
        )
    
    def load_all_configs(self) -> LLMAPIManager:
        """加载所有配置"""
        # 1. 从环境变量加载
        for provider in LLMProvider:
            config = self.create_config_from_env(provider.value)
            if config:
                self.api_manager.add_config(config)
        
        # 2. 从YAML配置文件加载（如果存在）
        yaml_config = self.load_from_yaml('config.yaml')
        if 'llm_providers' in yaml_config:
            self._merge_yaml_config(yaml_config['llm_providers'])
        
        # 3. 应用全局配置
        self._apply_global_config()
        
        return self.api_manager
    
    def _merge_yaml_config(self, yaml_providers: Dict[str, Any]):
        """合并YAML配置"""
        for provider_name, provider_config in yaml_providers.items():
            existing_config = self.api_manager.get_config(provider_name)
            if existing_config:
                # 更新现有配置
                if 'enabled' in provider_config:
                    existing_config.enabled = provider_config['enabled']
                if 'priority' in provider_config:
                    existing_config.priority = provider_config['priority']
                if 'model' in provider_config:
                    existing_config.model = provider_config['model']
                if 'api_url' in provider_config:
                    existing_config.api_url = provider_config['api_url']
                if 'description' in provider_config:
                    existing_config.description = provider_config['description']
    
    def _apply_global_config(self):
        """应用全局配置"""
        # 默认提供商
        default_provider = os.getenv('DEFAULT_LLM_PROVIDER', 'qwen')
        if default_provider in self.api_manager._configs:
            self.api_manager._configs[default_provider].priority = 1
        
        # 自动回退
        enable_fallback = os.getenv('ENABLE_AUTO_FALLBACK', 'true').lower() == 'true'
        if enable_fallback:
            # 为启用的配置设置递增优先级
            enabled_configs = list(self.api_manager.get_enabled_configs().values())
            enabled_configs.sort(key=lambda x: x.priority)
            for i, config in enumerate(enabled_configs):
                config.priority = i + 1
    
    def save_config_to_yaml(self, output_file: str = 'llm_config_generated.yaml'):
        """将当前配置保存到YAML文件"""
        config_data = {
            'llm_providers': {}
        }
        
        for provider, config in self.api_manager.get_all_configs().items():
            config_data['llm_providers'][provider] = {
                'enabled': config.enabled,
                'priority': config.priority,
                'api_url': config.api_url,
                'model': config.model,
                'max_tokens': config.max_tokens,
                'temperature': config.temperature,
                'timeout': config.timeout,
                'description': config.description,
                'tags': config.tags,
                'rate_limit': config.rate_limit
            }
        
        output_path = self.config_dir / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(config_data, f, default_flow_style=False, allow_unicode=True, indent=2)
        
        print(f"配置已保存到: {output_path}")
    
    def validate_all_configs(self) -> Dict[str, bool]:
        """验证所有配置"""
        results = {}
        for provider in self.api_manager.get_all_configs().keys():
            results[provider] = self.api_manager.validate_config(provider)
        return results
    
    def get_config_status(self) -> Dict[str, Dict[str, Any]]:
        """获取配置状态报告"""
        status = {}
        validation_results = self.validate_all_configs()
        
        for provider, config in self.api_manager.get_all_configs().items():
            status[provider] = {
                'enabled': config.enabled,
                'valid': validation_results[provider],
                'has_api_key': bool(config.api_key),
                'priority': config.priority,
                'model': config.model,
                'description': config.description,
                'tags': config.tags
            }
        
        return status


def create_sample_env_file():
    """创建示例环境变量文件"""
    config_dir = Path(__file__).parent
    env_file = config_dir / '.env.llm'
    
    if env_file.exists():
        print(f"环境变量文件已存在: {env_file}")
        return
    
    # 复制模板文件
    template_file = config_dir / '.env.llm.template'
    if template_file.exists():
        import shutil
        shutil.copy(template_file, env_file)
        print(f"已创建环境变量文件: {env_file}")
        print("请编辑此文件并填入您的API密钥")
    else:
        print(f"模板文件不存在: {template_file}")


if __name__ == "__main__":
    print("=== LLM配置加载器测试 ===")
    
    # 创建配置加载器
    loader = LLMConfigLoader()
    
    # 加载所有配置
    api_manager = loader.load_all_configs()
    
    # 显示配置状态
    status = loader.get_config_status()
    print("\n配置状态报告:")
    print("-" * 60)
    for provider, info in status.items():
        status_icon = "✅" if info['valid'] and info['enabled'] else "❌"
        key_status = "🔑" if info['has_api_key'] else "🚫"
        print(f"{status_icon} {key_status} {provider.upper()}:")
        print(f"   模型: {info['model']}")
        print(f"   描述: {info['description']}")
        print(f"   优先级: {info['priority']}")
        print(f"   标签: {', '.join(info['tags'])}")
        print(f"   状态: {'启用' if info['enabled'] else '禁用'} | {'有效' if info['valid'] else '无效'}")
        print()
    
    # 显示启用的配置
    enabled_configs = api_manager.get_enabled_configs()
    print(f"启用的模型数量: {len(enabled_configs)}")
    
    if enabled_configs:
        print("\n按优先级排序的启用模型:")
        sorted_configs = api_manager.get_configs_by_priority()
        for i, config in enumerate(sorted_configs, 1):
            print(f"{i}. {config.provider} ({config.model}) - 优先级: {config.priority}")
    
    # 保存配置到YAML
    loader.save_config_to_yaml()
    
    print("\n💡 提示:")
    print("1. 请确保在 .env.llm 文件中配置了正确的API密钥")
    print("2. 使用 python -c 'from config.llm_config_loader import create_sample_env_file; create_sample_env_file()' 创建示例配置文件")
    print("3. 重启应用程序以加载新配置")