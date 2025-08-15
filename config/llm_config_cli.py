#!/usr/bin/env python3
"""
LLM配置管理命令行工具
提供便捷的命令行界面来管理大语言模型API配置
"""

import os
import sys
import argparse
import json
from pathlib import Path
from typing import Dict, Any

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from config.llm_api_config import LLMAPIManager, LLMProvider
from config.llm_config_loader import LLMConfigLoader, create_sample_env_file


class LLMConfigCLI:
    """LLM配置管理CLI"""
    
    def __init__(self):
        self.loader = LLMConfigLoader()
        self.api_manager = self.loader.load_all_configs()
    
    def list_providers(self):
        """列出所有提供商"""
        print("\n=== 可用的LLM提供商 ===")
        print("-" * 60)
        
        status = self.loader.get_config_status()
        for provider, info in status.items():
            # 状态图标
            if info['valid'] and info['enabled']:
                status_icon = "✅ 可用"
            elif info['enabled'] and not info['has_api_key']:
                status_icon = "🔑 需要API密钥"
            elif not info['enabled']:
                status_icon = "❌ 已禁用"
            else:
                status_icon = "⚠️  配置错误"
            
            print(f"{provider.upper():10} | {status_icon:12} | {info['model']:20} | 优先级: {info['priority']}")
            print(f"{'':10} | {'':12} | {info['description']}")
            print(f"{'':10} | {'':12} | 标签: {', '.join(info['tags'])}")
            print("-" * 60)
    
    def show_config(self, provider: str = None):
        """显示配置详情"""
        if provider:
            config = self.api_manager.get_config(provider)
            if not config:
                print(f"❌ 未找到提供商: {provider}")
                return
            
            print(f"\n=== {provider.upper()} 配置详情 ===")
            print(f"提供商: {config.provider}")
            print(f"模型: {config.model}")
            print(f"API URL: {config.api_url}")
            print(f"API密钥: {'已配置' if config.api_key else '未配置'}")
            print(f"启用状态: {'启用' if config.enabled else '禁用'}")
            print(f"优先级: {config.priority}")
            print(f"最大令牌: {config.max_tokens}")
            print(f"温度: {config.temperature}")
            print(f"超时: {config.timeout}秒")
            print(f"描述: {config.description}")
            print(f"标签: {', '.join(config.tags)}")
            if config.rate_limit:
                print(f"速率限制: {config.rate_limit}")
            if config.extra_params:
                print(f"额外参数: {json.dumps(config.extra_params, indent=2, ensure_ascii=False)}")
        else:
            # 显示所有配置摘要
            summary = self.api_manager.get_config_summary()
            print("\n=== 所有配置摘要 ===")
            print(json.dumps(summary, indent=2, ensure_ascii=False))
    
    def enable_provider(self, provider: str):
        """启用提供商"""
        if provider not in self.api_manager._configs:
            print(f"❌ 未找到提供商: {provider}")
            return
        
        self.api_manager.enable_provider(provider)
        print(f"✅ 已启用提供商: {provider}")
    
    def disable_provider(self, provider: str):
        """禁用提供商"""
        if provider not in self.api_manager._configs:
            print(f"❌ 未找到提供商: {provider}")
            return
        
        self.api_manager.disable_provider(provider)
        print(f"❌ 已禁用提供商: {provider}")
    
    def set_api_key(self, provider: str, api_key: str):
        """设置API密钥"""
        if provider not in self.api_manager._configs:
            print(f"❌ 未找到提供商: {provider}")
            return
        
        self.api_manager.set_api_key(provider, api_key)
        print(f"✅ 已设置 {provider} 的API密钥")
        
        # 验证配置
        if self.api_manager.validate_config(provider):
            print(f"✅ {provider} 配置验证通过")
        else:
            print(f"⚠️  {provider} 配置验证失败，请检查API密钥和其他配置")
    
    def set_priority(self, provider: str, priority: int):
        """设置优先级"""
        if provider not in self.api_manager._configs:
            print(f"❌ 未找到提供商: {provider}")
            return
        
        self.api_manager.update_config(provider, priority=priority)
        print(f"✅ 已设置 {provider} 的优先级为: {priority}")
    
    def test_connection(self, provider: str = None):
        """测试连接"""
        if provider:
            providers_to_test = [provider]
        else:
            providers_to_test = list(self.api_manager.get_enabled_configs().keys())
        
        if not providers_to_test:
            print("❌ 没有可测试的提供商")
            return
        
        print("\n=== 连接测试 ===")
        for provider_name in providers_to_test:
            config = self.api_manager.get_config(provider_name)
            if not config:
                print(f"❌ {provider_name}: 配置不存在")
                continue
            
            if not config.api_key:
                print(f"🔑 {provider_name}: 需要API密钥")
                continue
            
            print(f"🔄 测试 {provider_name} 连接...")
            
            # 这里可以添加实际的连接测试逻辑
            # 目前只是验证配置完整性
            if self.api_manager.validate_config(provider_name):
                print(f"✅ {provider_name}: 配置有效")
            else:
                print(f"❌ {provider_name}: 配置无效")
    
    def export_config(self, output_file: str):
        """导出配置"""
        self.loader.save_config_to_yaml(output_file)
        print(f"✅ 配置已导出到: {output_file}")
    
    def create_env_template(self):
        """创建环境变量模板"""
        create_sample_env_file()
    
    def show_usage_examples(self):
        """显示使用示例"""
        print("\n=== 使用示例 ===")
        print("\n1. 查看所有提供商:")
        print("   python config/llm_config_cli.py list")
        
        print("\n2. 查看特定提供商配置:")
        print("   python config/llm_config_cli.py show qwen")
        
        print("\n3. 设置API密钥:")
        print("   python config/llm_config_cli.py set-key qwen your_api_key_here")
        
        print("\n4. 启用/禁用提供商:")
        print("   python config/llm_config_cli.py enable qwen")
        print("   python config/llm_config_cli.py disable openai")
        
        print("\n5. 设置优先级:")
        print("   python config/llm_config_cli.py set-priority qwen 1")
        
        print("\n6. 测试连接:")
        print("   python config/llm_config_cli.py test")
        print("   python config/llm_config_cli.py test qwen")
        
        print("\n7. 导出配置:")
        print("   python config/llm_config_cli.py export my_config.yaml")
        
        print("\n8. 创建环境变量模板:")
        print("   python config/llm_config_cli.py create-env")
        
        print("\n💡 提示:")
        print("- 支持的提供商: qwen, gemini, openai, claude, baidu, zhipu")
        print("- 优先级数字越小优先级越高")
        print("- 请确保API密钥的安全性，不要在命令行历史中暴露")


def main():
    parser = argparse.ArgumentParser(
        description="LLM配置管理工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s list                    # 列出所有提供商
  %(prog)s show qwen              # 显示qwen配置
  %(prog)s set-key qwen API_KEY   # 设置API密钥
  %(prog)s enable qwen            # 启用qwen
  %(prog)s test                   # 测试所有连接
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # list命令
    subparsers.add_parser('list', help='列出所有提供商')
    
    # show命令
    show_parser = subparsers.add_parser('show', help='显示配置详情')
    show_parser.add_argument('provider', nargs='?', help='提供商名称')
    
    # enable命令
    enable_parser = subparsers.add_parser('enable', help='启用提供商')
    enable_parser.add_argument('provider', help='提供商名称')
    
    # disable命令
    disable_parser = subparsers.add_parser('disable', help='禁用提供商')
    disable_parser.add_argument('provider', help='提供商名称')
    
    # set-key命令
    setkey_parser = subparsers.add_parser('set-key', help='设置API密钥')
    setkey_parser.add_argument('provider', help='提供商名称')
    setkey_parser.add_argument('api_key', help='API密钥')
    
    # set-priority命令
    priority_parser = subparsers.add_parser('set-priority', help='设置优先级')
    priority_parser.add_argument('provider', help='提供商名称')
    priority_parser.add_argument('priority', type=int, help='优先级（数字越小优先级越高）')
    
    # test命令
    test_parser = subparsers.add_parser('test', help='测试连接')
    test_parser.add_argument('provider', nargs='?', help='提供商名称（可选）')
    
    # export命令
    export_parser = subparsers.add_parser('export', help='导出配置')
    export_parser.add_argument('output', help='输出文件名')
    
    # create-env命令
    subparsers.add_parser('create-env', help='创建环境变量模板')
    
    # examples命令
    subparsers.add_parser('examples', help='显示使用示例')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    cli = LLMConfigCLI()
    
    try:
        if args.command == 'list':
            cli.list_providers()
        elif args.command == 'show':
            cli.show_config(args.provider)
        elif args.command == 'enable':
            cli.enable_provider(args.provider)
        elif args.command == 'disable':
            cli.disable_provider(args.provider)
        elif args.command == 'set-key':
            cli.set_api_key(args.provider, args.api_key)
        elif args.command == 'set-priority':
            cli.set_priority(args.provider, args.priority)
        elif args.command == 'test':
            cli.test_connection(args.provider)
        elif args.command == 'export':
            cli.export_config(args.output)
        elif args.command == 'create-env':
            cli.create_env_template()
        elif args.command == 'examples':
            cli.show_usage_examples()
    except KeyboardInterrupt:
        print("\n操作已取消")
    except Exception as e:
        print(f"❌ 错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()