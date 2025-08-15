#!/usr/bin/env python3
"""
大语言模型API配置管理模块
统一管理所有LLM提供商的API配置信息
"""

import os
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class LLMProvider(Enum):
    """支持的LLM提供商枚举"""
    QWEN = "qwen"
    GEMINI = "gemini"
    OPENAI = "openai"
    CLAUDE = "claude"
    BAIDU = "baidu"
    ZHIPU = "zhipu"


@dataclass
class LLMAPIConfig:
    """LLM API配置数据类"""
    provider: str
    api_key: str
    api_url: str
    model: str
    enabled: bool = True
    priority: int = 1
    max_tokens: int = 2000
    temperature: float = 0.7
    timeout: int = 30
    description: str = ""
    tags: list = field(default_factory=list)
    rate_limit: Optional[str] = None
    extra_params: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """初始化后验证"""
        # 允许在没有API密钥时初始化配置，但标记为禁用状态
        if not self.api_key:
            self.enabled = False
        if not self.api_url:
            raise ValueError(f"API URL is required for {self.provider}")


class LLMAPIManager:
    """LLM API配置管理器"""
    
    def __init__(self):
        self._configs: Dict[str, LLMAPIConfig] = {}
        self._load_default_configs()
    
    def _load_default_configs(self):
        """加载默认配置"""
        # 通义千问配置
        qwen_config = LLMAPIConfig(
            provider=LLMProvider.QWEN.value,
            api_key=os.getenv('QWEN_API_KEY', ''),
            api_url="https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
            model="qwen-plus",
            enabled=True,
            priority=1,
            max_tokens=2000,
            temperature=0.7,
            timeout=30,
            description="阿里云通义千问大模型，中文理解能力强",
            tags=["中文优化", "推荐", "高质量"],
            rate_limit="100 requests/minute",
            extra_params={
                "top_p": 0.8,
                "repetition_penalty": 1.1,
                "enable_search": False
            }
        )
        
        # Google Gemini配置
        gemini_config = LLMAPIConfig(
            provider=LLMProvider.GEMINI.value,
            api_key=os.getenv('GEMINI_API_KEY', ''),
            api_url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            model="gemini-2.0-flash",
            enabled=True,
            priority=2,
            max_tokens=1000,
            temperature=0.7,
            timeout=30,
            description="Google最新多模态模型，支持中英文策略生成",
            tags=["多模态", "新锐", "快速"],
            rate_limit="60 requests/minute",
            extra_params={
                "safety_settings": {
                    "harassment": "BLOCK_MEDIUM_AND_ABOVE",
                    "hate_speech": "BLOCK_MEDIUM_AND_ABOVE",
                    "sexually_explicit": "BLOCK_MEDIUM_AND_ABOVE",
                    "dangerous_content": "BLOCK_MEDIUM_AND_ABOVE"
                }
            }
        )
        
        # OpenAI GPT配置
        openai_config = LLMAPIConfig(
            provider=LLMProvider.OPENAI.value,
            api_key=os.getenv('OPENAI_API_KEY', ''),
            api_url="https://api.openai.com/v1/chat/completions",
            model="gpt-4",
            enabled=False,  # 默认禁用
            priority=3,
            max_tokens=2000,
            temperature=0.7,
            timeout=30,
            description="OpenAI GPT-4模型，通用AI能力强",
            tags=["通用", "备选"],
            rate_limit="40 requests/minute",
            extra_params={
                "top_p": 1.0,
                "frequency_penalty": 0,
                "presence_penalty": 0
            }
        )
        
        # Claude配置（预留）
        claude_config = LLMAPIConfig(
            provider=LLMProvider.CLAUDE.value,
            api_key=os.getenv('CLAUDE_API_KEY', ''),
            api_url="https://api.anthropic.com/v1/messages",
            model="claude-3-sonnet-20240229",
            enabled=False,
            priority=4,
            max_tokens=2000,
            temperature=0.7,
            timeout=30,
            description="Anthropic Claude模型，安全性高",
            tags=["安全", "预留"],
            rate_limit="50 requests/minute"
        )
        
        # 百度文心一言配置（预留）
        baidu_config = LLMAPIConfig(
            provider=LLMProvider.BAIDU.value,
            api_key=os.getenv('BAIDU_API_KEY', ''),
            api_url="https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions",
            model="ernie-bot-turbo",
            enabled=False,
            priority=5,
            max_tokens=2000,
            temperature=0.7,
            timeout=30,
            description="百度文心一言，中文本土化模型",
            tags=["中文", "本土", "预留"],
            rate_limit="100 requests/minute"
        )
        
        # 智谱AI配置（预留）
        zhipu_config = LLMAPIConfig(
            provider=LLMProvider.ZHIPU.value,
            api_key=os.getenv('ZHIPU_API_KEY', ''),
            api_url="https://open.bigmodel.cn/api/paas/v4/chat/completions",
            model="glm-4",
            enabled=False,
            priority=6,
            max_tokens=2000,
            temperature=0.7,
            timeout=30,
            description="智谱AI GLM-4模型，中文理解优秀",
            tags=["中文", "预留"],
            rate_limit="100 requests/minute"
        )
        
        # 只添加有API密钥的配置
        configs = [qwen_config, gemini_config, openai_config, claude_config, baidu_config, zhipu_config]
        for config in configs:
            if config.api_key:  # 只有配置了API密钥的才添加
                self._configs[config.provider] = config
            elif config.provider in [LLMProvider.QWEN.value, LLMProvider.GEMINI.value]:
                # 对于主要模型，即使没有API密钥也添加（用于配置展示）
                self._configs[config.provider] = config
    
    def get_config(self, provider: str) -> Optional[LLMAPIConfig]:
        """获取指定提供商的配置"""
        return self._configs.get(provider)
    
    def get_all_configs(self) -> Dict[str, LLMAPIConfig]:
        """获取所有配置"""
        return self._configs.copy()
    
    def get_enabled_configs(self) -> Dict[str, LLMAPIConfig]:
        """获取所有启用的配置"""
        return {k: v for k, v in self._configs.items() if v.enabled and v.api_key}
    
    def get_configs_by_priority(self) -> list[LLMAPIConfig]:
        """按优先级排序获取启用的配置"""
        enabled_configs = list(self.get_enabled_configs().values())
        return sorted(enabled_configs, key=lambda x: x.priority)
    
    def add_config(self, config: LLMAPIConfig):
        """添加新配置"""
        self._configs[config.provider] = config
    
    def update_config(self, provider: str, **kwargs):
        """更新配置"""
        if provider in self._configs:
            config = self._configs[provider]
            for key, value in kwargs.items():
                if hasattr(config, key):
                    setattr(config, key, value)
    
    def enable_provider(self, provider: str):
        """启用提供商"""
        if provider in self._configs:
            self._configs[provider].enabled = True
    
    def disable_provider(self, provider: str):
        """禁用提供商"""
        if provider in self._configs:
            self._configs[provider].enabled = False
    
    def set_api_key(self, provider: str, api_key: str):
        """设置API密钥"""
        if provider in self._configs:
            self._configs[provider].api_key = api_key
    
    def validate_config(self, provider: str) -> bool:
        """验证配置是否有效"""
        config = self.get_config(provider)
        if not config:
            return False
        return bool(config.api_key and config.api_url and config.model)
    
    def get_config_summary(self) -> Dict[str, Dict[str, Any]]:
        """获取配置摘要信息"""
        summary = {}
        for provider, config in self._configs.items():
            summary[provider] = {
                "enabled": config.enabled,
                "priority": config.priority,
                "model": config.model,
                "description": config.description,
                "tags": config.tags,
                "has_api_key": bool(config.api_key),
                "rate_limit": config.rate_limit
            }
        return summary


# 全局配置管理器实例
llm_api_manager = LLMAPIManager()


def get_llm_config(provider: str) -> Optional[LLMAPIConfig]:
    """获取LLM配置的便捷函数"""
    return llm_api_manager.get_config(provider)


def get_enabled_llm_configs() -> Dict[str, LLMAPIConfig]:
    """获取所有启用的LLM配置的便捷函数"""
    return llm_api_manager.get_enabled_configs()


def get_primary_llm_config() -> Optional[LLMAPIConfig]:
    """获取主要（优先级最高）的LLM配置"""
    configs = llm_api_manager.get_configs_by_priority()
    return configs[0] if configs else None


if __name__ == "__main__":
    # 测试代码
    print("=== LLM API配置管理器测试 ===")
    
    # 显示配置摘要
    summary = llm_api_manager.get_config_summary()
    print("\n配置摘要:")
    for provider, info in summary.items():
        status = "✅" if info["enabled"] and info["has_api_key"] else "❌"
        print(f"{status} {provider}: {info['model']} - {info['description']}")
        print(f"   优先级: {info['priority']}, 标签: {', '.join(info['tags'])}")
        print(f"   API密钥: {'已配置' if info['has_api_key'] else '未配置'}")
        print()
    
    # 显示启用的配置
    enabled_configs = get_enabled_llm_configs()
    print(f"\n启用的模型数量: {len(enabled_configs)}")
    for provider, config in enabled_configs.items():
        print(f"- {provider}: {config.model}")
    
    # 显示主要配置
    primary_config = get_primary_llm_config()
    if primary_config:
        print(f"\n主要模型: {primary_config.provider} ({primary_config.model})")
    else:
        print("\n未找到可用的主要模型")