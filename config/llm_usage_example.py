#!/usr/bin/env python3
"""
LLM API配置系统使用示例

这个文件展示了如何使用新的LLM配置管理系统来：
1. 加载和管理多个LLM提供商的配置
2. 动态切换和选择最佳提供商
3. 验证API连接状态
4. 获取配置信息和状态
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from config.llm_config_loader import LLMConfigLoader
from config.llm_api_config import LLMAPIManager
from config.api_config import (
    get_api_key, 
    set_api_key, 
    get_llm_configs, 
    get_enabled_llm_providers,
    get_primary_llm_provider
)

def demo_basic_usage():
    """演示基本使用方法"""
    print("=== LLM配置系统基本使用演示 ===")
    
    # 1. 使用统一的API接口获取密钥
    print("\n1. 获取API密钥:")
    providers = ['qwen', 'gemini', 'openai', 'claude']
    for provider in providers:
        key = get_api_key(provider)
        status = "✓ 已配置" if key else "✗ 未配置"
        print(f"  {provider}: {status}")
    
    # 2. 获取启用的提供商
    print("\n2. 启用的LLM提供商:")
    enabled = get_enabled_llm_providers()
    if enabled:
        for provider in enabled:
            print(f"  ✓ {provider}")
    else:
        print("  暂无启用的提供商")
    
    # 3. 获取主要提供商
    print("\n3. 主要提供商:")
    primary = get_primary_llm_provider()
    if primary:
        print(f"  🎯 {primary}")
    else:
        print("  暂无主要提供商")
    
    # 4. 获取详细配置信息
    print("\n4. 详细配置信息:")
    configs = get_llm_configs()
    for provider, config in configs.items():
        print(f"  {provider}:")
        print(f"    状态: {config.get('status', 'unknown')}")
        print(f"    模型: {config.get('model', 'N/A')}")
        print(f"    优先级: {config.get('priority', 'N/A')}")

def demo_advanced_usage():
    """演示高级使用方法"""
    print("\n=== LLM配置系统高级使用演示 ===")
    
    try:
        # 直接使用配置加载器
        loader = LLMConfigLoader()
        loader.load_all_configs()
        
        print("\n1. 配置验证:")
        validation_results = loader.validate_all_configs()
        for provider, is_valid in validation_results.items():
            status = "✓ 有效" if is_valid else "✗ 无效"
            print(f"  {provider}: {status}")
        
        print("\n2. 按优先级排序的配置:")
        sorted_configs = loader.api_manager.get_configs_by_priority()
        for i, config in enumerate(sorted_configs, 1):
            print(f"  {i}. {config.provider} (优先级: {config.priority})")
        
        print("\n3. 可用模型列表:")
        all_configs = loader.api_manager.get_all_configs()
        for provider, config in all_configs.items():
            if config.enabled and config.api_key:
                models = config.model if hasattr(config, 'model') else '默认模型'
                print(f"  {provider}: {models}")
        
        print("\n4. 配置统计:")
        all_configs = loader.api_manager.get_all_configs()
        total = len(all_configs)
        enabled = len([c for c in all_configs.values() if c.enabled])
        with_keys = len([c for c in all_configs.values() if c.api_key])
        print(f"  总配置数: {total}")
        print(f"  启用配置: {enabled}")
        print(f"  已配置密钥: {with_keys}")
        
    except Exception as e:
        print(f"高级功能演示失败: {e}")

def demo_dynamic_switching():
    """演示动态切换功能"""
    print("\n=== 动态提供商切换演示 ===")
    
    try:
        loader = LLMConfigLoader()
        loader.load_all_configs()
        
        # 获取可用的提供商
        available_providers = []
        all_configs = loader.api_manager.get_all_configs()
        for provider, config in all_configs.items():
            if config.enabled and config.api_key:
                available_providers.append(provider)
        
        if not available_providers:
            print("  暂无可用的提供商进行切换演示")
            return
        
        print(f"  可用提供商: {', '.join(available_providers)}")
        
        # 模拟根据不同场景选择提供商
        scenarios = {
            "快速响应": "qwen",  # 假设qwen响应最快
            "高质量生成": "openai",  # 假设openai质量最高
            "多模态处理": "gemini",  # 假设gemini多模态能力最强
            "成本优化": "claude"  # 假设claude成本最低
        }
        
        print("\n  场景化提供商选择:")
        for scenario, preferred in scenarios.items():
            if preferred in available_providers:
                print(f"    {scenario}: 推荐使用 {preferred}")
            else:
                fallback = available_providers[0] if available_providers else None
                print(f"    {scenario}: {preferred} 不可用，回退到 {fallback}")
        
    except Exception as e:
        print(f"动态切换演示失败: {e}")

def demo_configuration_management():
    """演示配置管理功能"""
    print("\n=== 配置管理演示 ===")
    
    try:
        # 演示如何动态更新配置
        print("\n1. 动态更新API密钥:")
        test_key = "test_key_12345"
        original_key = get_api_key('qwen')
        
        # 设置测试密钥
        set_api_key('qwen', test_key)
        updated_key = get_api_key('qwen')
        print(f"  更新前: {original_key[:10] + '...' if original_key else 'None'}")
        print(f"  更新后: {updated_key[:10] + '...' if updated_key else 'None'}")
        
        # 恢复原始密钥
        if original_key:
            set_api_key('qwen', original_key)
        
        print("\n2. 环境变量检查:")
        env_vars = [
            'QWEN_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 
            'CLAUDE_API_KEY', 'BAIDU_API_KEY', 'ZHIPU_API_KEY'
        ]
        for var in env_vars:
            value = os.getenv(var)
            status = "✓ 已设置" if value else "✗ 未设置"
            print(f"  {var}: {status}")
        
    except Exception as e:
        print(f"配置管理演示失败: {e}")

def main():
    """主函数"""
    print("LLM API配置系统使用示例")
    print("=" * 50)
    
    # 检查环境变量文件
    env_file = project_root / 'config' / '.env.llm'
    if not env_file.exists():
        print(f"\n⚠️  注意: 环境变量文件不存在: {env_file}")
        print("请复制 .env.llm.template 为 .env.llm 并配置相应的API密钥")
        print("\n继续使用系统环境变量进行演示...\n")
    
    # 运行各种演示
    demo_basic_usage()
    demo_advanced_usage()
    demo_dynamic_switching()
    demo_configuration_management()
    
    print("\n=== 演示完成 ===")
    print("\n💡 提示:")
    print("1. 配置API密钥到环境变量或 .env.llm 文件中")
    print("2. 使用 get_api_key() 获取密钥")
    print("3. 使用 get_enabled_llm_providers() 获取可用提供商")
    print("4. 使用 get_primary_llm_provider() 获取主要提供商")
    print("5. 查看 llm_api_config.py 了解更多配置选项")

if __name__ == "__main__":
    main()