#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
QuantMind 统一配置管理命令行工具
提供配置文件管理、验证、状态检查等功能
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from config.unified_config_manager import (
    UnifiedConfigManager, 
    ConfigType, 
    ServiceStatus,
    get_service_config,
    get_data_sources,
    get_ai_services,
    get_databases,
    validate_config
)

class UnifiedConfigCLI:
    """统一配置管理CLI"""
    
    def __init__(self):
        self.config_manager = UnifiedConfigManager()
    
    def create_local_config(self):
        """创建本地配置文件"""
        print("🔧 创建本地配置文件...")
        
        if self.config_manager.create_local_config():
            local_file = self.config_manager.config_file
            print(f"✅ 本地配置文件已创建: {local_file}")
            print(f"📝 请编辑 {local_file} 文件，填入您的API密钥")
            print()
            print("📋 配置步骤:")
            print("1. 编辑本地配置文件，将 'your_xxx_api_key_here' 替换为真实的API密钥")
            print("2. 或者设置对应的环境变量（优先级更高）")
            print("3. 运行 'python scripts/unified_config_cli.py validate' 验证配置")
            print("4. 确保本地配置文件已添加到 .gitignore")
        else:
            print("❌ 创建本地配置文件失败")
            return False
        
        return True
    
    def validate_config(self):
        """验证配置"""
        print("🔍 验证配置...")
        
        # 验证必需配置
        validation_results = validate_config()
        
        print("\n=== 必需配置验证 ===")
        all_valid = True
        for config_path, is_valid in validation_results.items():
            status = "✅" if is_valid else "❌"
            print(f"  {status} {config_path}")
            if not is_valid:
                all_valid = False
        
        if all_valid:
            print("✅ 所有必需配置都已正确设置")
        else:
            print("⚠️  部分必需配置未设置，请检查配置文件")
        
        return all_valid
    
    def list_services(self, service_type: str = None):
        """列出服务"""
        print("📋 服务列表")
        
        if not service_type or service_type == 'data_sources':
            print("\n=== 数据源 ===")
            data_sources = get_data_sources([ServiceStatus.ACTIVE, ServiceStatus.INACTIVE, ServiceStatus.OPTIONAL])
            for ds in data_sources:
                configured = "✅" if self.config_manager._is_service_configured(ds) else "❌"
                status_icon = "🟢" if ds.status == ServiceStatus.ACTIVE else "🔴"
                print(f"  {configured} {status_icon} {ds.name} (优先级: {ds.priority})")
                print(f"      类型: {ds.type} | 质量: {ds.data_quality} | 成本: {ds.cost_level}")
                if ds.connection.env_var:
                    env_status = "✅" if os.getenv(ds.connection.env_var) else "❌"
                    print(f"      环境变量: {env_status} {ds.connection.env_var}")
                print()
        
        if not service_type or service_type == 'ai_services':
            print("=== AI服务 ===")
            ai_services = get_ai_services([ServiceStatus.ACTIVE, ServiceStatus.INACTIVE, ServiceStatus.OPTIONAL])
            for ai in ai_services:
                configured = "✅" if self.config_manager._is_service_configured(ai) else "❌"
                status_icon = "🟢" if ai.status == ServiceStatus.ACTIVE else "🔴"
                print(f"  {configured} {status_icon} {ai.name} (优先级: {ai.priority})")
                print(f"      类型: {ai.type} | 成本: {ai.cost_level}")
                if ai.connection.env_var:
                    env_status = "✅" if os.getenv(ai.connection.env_var) else "❌"
                    print(f"      环境变量: {env_status} {ai.connection.env_var}")
                print()
        
        if not service_type or service_type == 'databases':
            print("=== 数据库 ===")
            databases = get_databases([ServiceStatus.ACTIVE, ServiceStatus.INACTIVE, ServiceStatus.OPTIONAL])
            for db in databases:
                configured = "✅" if self.config_manager._is_service_configured(db) else "❌"
                status_icon = "🟢" if db.status in [ServiceStatus.ACTIVE, ServiceStatus.OPTIONAL] else "🔴"
                print(f"  {configured} {status_icon} {db.name} (优先级: {db.priority})")
                print(f"      类型: {db.type}")
                if db.connection.env_vars:
                    for key, env_var in db.connection.env_vars.items():
                        env_status = "✅" if os.getenv(env_var) else "❌"
                        print(f"      环境变量: {env_status} {env_var} ({key})")
                print()
    
    def show_status(self):
        """显示状态摘要"""
        print("📊 系统状态摘要")
        
        status_summary = self.config_manager.get_service_status_summary()
        
        print(f"\n=== 数据源 ===")
        ds_summary = status_summary['data_sources']
        print(f"  总数: {ds_summary['total']}")
        print(f"  活跃: {ds_summary['active']}")
        print(f"  已配置: {ds_summary['configured']}")
        print(f"  配置率: {ds_summary['configured']/ds_summary['total']*100:.1f}%" if ds_summary['total'] > 0 else "  配置率: 0%")
        
        print(f"\n=== AI服务 ===")
        ai_summary = status_summary['ai_services']
        print(f"  总数: {ai_summary['total']}")
        print(f"  活跃: {ai_summary['active']}")
        print(f"  已配置: {ai_summary['configured']}")
        print(f"  配置率: {ai_summary['configured']/ai_summary['total']*100:.1f}%" if ai_summary['total'] > 0 else "  配置率: 0%")
        
        print(f"\n=== 数据库 ===")
        db_summary = status_summary['databases']
        print(f"  总数: {db_summary['total']}")
        print(f"  活跃: {db_summary['active']}")
        print(f"  已配置: {db_summary['configured']}")
        print(f"  配置率: {db_summary['configured']/db_summary['total']*100:.1f}%" if db_summary['total'] > 0 else "  配置率: 0%")
        
        # 显示推荐配置
        print(f"\n=== 配置建议 ===")
        if ds_summary['configured'] == 0:
            print("  ⚠️  建议至少配置一个数据源（推荐：tsanghi 或 yahoo_finance）")
        if ai_summary['configured'] == 0:
            print("  💡 建议配置至少一个AI服务以使用AI策略功能")
        if db_summary['configured'] == 0:
            print("  📝 当前使用SQLite数据库，生产环境建议配置MySQL")
    
    def show_config(self, service_name: str):
        """显示特定服务的配置"""
        print(f"🔧 服务配置: {service_name}")
        
        service_config = get_service_config(service_name)
        if not service_config:
            print(f"❌ 未找到服务: {service_name}")
            return False
        
        print(f"\n=== 基本信息 ===")
        print(f"  名称: {service_config.name}")
        print(f"  描述: {service_config.description}")
        print(f"  类型: {service_config.type}")
        print(f"  优先级: {service_config.priority}")
        print(f"  状态: {service_config.status.value}")
        print(f"  必需: {'是' if service_config.required else '否'}")
        
        print(f"\n=== 连接配置 ===")
        conn = service_config.connection
        if conn.base_url:
            print(f"  基础URL: {conn.base_url}")
        if conn.host:
            print(f"  主机: {conn.host}")
        if conn.port:
            print(f"  端口: {conn.port}")
        if conn.database:
            print(f"  数据库: {conn.database}")
        print(f"  超时: {conn.timeout}秒")
        print(f"  SSL验证: {'是' if conn.verify_ssl else '否'}")
        
        print(f"\n=== 认证配置 ===")
        if conn.env_var:
            env_status = "✅ 已设置" if os.getenv(conn.env_var) else "❌ 未设置"
            print(f"  环境变量: {env_status} {conn.env_var}")
        if conn.env_vars:
            for key, env_var in conn.env_vars.items():
                env_status = "✅ 已设置" if os.getenv(env_var) else "❌ 未设置"
                print(f"  环境变量 ({key}): {env_status} {env_var}")
        
        # 显示配置状态
        is_configured = self.config_manager._is_service_configured(service_config)
        config_status = "✅ 已配置" if is_configured else "❌ 未配置"
        print(f"\n=== 配置状态 ===")
        print(f"  状态: {config_status}")
        
        if not is_configured:
            print(f"\n=== 配置建议 ===")
            if conn.env_var:
                print(f"  1. 设置环境变量: export {conn.env_var}=your_api_key")
            if conn.env_vars:
                for key, env_var in conn.env_vars.items():
                    print(f"  1. 设置环境变量: export {env_var}=your_{key}")
            print(f"  2. 或编辑本地配置文件填入相应的密钥")
        
        return True
    
    def test_connection(self, service_name: str):
        """测试服务连接"""
        print(f"🔗 测试连接: {service_name}")
        
        service_config = get_service_config(service_name)
        if not service_config:
            print(f"❌ 未找到服务: {service_name}")
            return False
        
        if not self.config_manager._is_service_configured(service_config):
            print(f"❌ 服务未配置，请先配置相关参数")
            return False
        
        print(f"✅ 服务配置正确")
        print(f"💡 实际连接测试需要在相应的服务类中实现")
        
        return True
    
    def export_config(self, output_file: str):
        """导出配置"""
        print(f"📤 导出配置到: {output_file}")
        
        try:
            status_summary = self.config_manager.get_service_status_summary()
            
            export_data = {
                'export_time': str(Path.cwd()),
                'summary': status_summary,
                'environment_variables': {},
                'recommendations': []
            }
            
            # 收集环境变量信息
            for service_type in ['data_sources', 'ai_services', 'databases']:
                if service_type in self.config_manager._config:
                    for service_name, service_data in self.config_manager._config[service_type].items():
                        connection = service_data.get('connection', {})
                        if 'env_var' in connection:
                            env_var = connection['env_var']
                            export_data['environment_variables'][env_var] = {
                                'service': service_name,
                                'set': bool(os.getenv(env_var)),
                                'value_preview': (os.getenv(env_var, '')[:10] + '...' if os.getenv(env_var) else '')
                            }
                        if 'env_vars' in connection:
                            for key, env_var in connection['env_vars'].items():
                                export_data['environment_variables'][env_var] = {
                                    'service': f"{service_name}.{key}",
                                    'set': bool(os.getenv(env_var)),
                                    'value_preview': (os.getenv(env_var, '')[:10] + '...' if os.getenv(env_var) else '')
                                }
            
            # 生成建议
            ds_summary = status_summary['data_sources']
            ai_summary = status_summary['ai_services']
            
            if ds_summary['configured'] == 0:
                export_data['recommendations'].append("建议至少配置一个数据源")
            if ai_summary['configured'] == 0:
                export_data['recommendations'].append("建议配置AI服务以使用AI策略功能")
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ 配置已导出到: {output_file}")
            return True
            
        except Exception as e:
            print(f"❌ 导出失败: {e}")
            return False

def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="QuantMind 统一配置管理工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python scripts/unified_config_cli.py create-local          # 创建本地配置文件
  python scripts/unified_config_cli.py validate              # 验证配置
  python scripts/unified_config_cli.py status                # 显示状态摘要
  python scripts/unified_config_cli.py list                  # 列出所有服务
  python scripts/unified_config_cli.py list data_sources     # 列出数据源
  python scripts/unified_config_cli.py show tsanghi          # 显示特定服务配置
  python scripts/unified_config_cli.py test tsanghi          # 测试服务连接
  python scripts/unified_config_cli.py export config.json   # 导出配置
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # 创建本地配置文件
    subparsers.add_parser('create-local', help='创建本地配置文件')
    
    # 验证配置
    subparsers.add_parser('validate', help='验证配置')
    
    # 显示状态
    subparsers.add_parser('status', help='显示状态摘要')
    
    # 列出服务
    list_parser = subparsers.add_parser('list', help='列出服务')
    list_parser.add_argument('type', nargs='?', choices=['data_sources', 'ai_services', 'databases'], 
                           help='服务类型')
    
    # 显示配置
    show_parser = subparsers.add_parser('show', help='显示特定服务配置')
    show_parser.add_argument('service', help='服务名称')
    
    # 测试连接
    test_parser = subparsers.add_parser('test', help='测试服务连接')
    test_parser.add_argument('service', help='服务名称')
    
    # 导出配置
    export_parser = subparsers.add_parser('export', help='导出配置')
    export_parser.add_argument('output', help='输出文件路径')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    cli = UnifiedConfigCLI()
    
    try:
        if args.command == 'create-local':
            cli.create_local_config()
        elif args.command == 'validate':
            cli.validate_config()
        elif args.command == 'status':
            cli.show_status()
        elif args.command == 'list':
            cli.list_services(getattr(args, 'type', None))
        elif args.command == 'show':
            cli.show_config(args.service)
        elif args.command == 'test':
            cli.test_connection(args.service)
        elif args.command == 'export':
            cli.export_config(args.output)
    except KeyboardInterrupt:
        print("\n\n👋 操作已取消")
    except Exception as e:
        print(f"\n❌ 执行失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()