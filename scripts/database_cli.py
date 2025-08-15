#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库统一管理CLI工具
提供数据库配置、连接测试、健康检查等功能
"""

import sys
import os
import argparse
import json
from pathlib import Path
from typing import Dict, List, Optional
import logging

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database_manager import DatabaseManager, DatabaseType, DatabaseRole

# 配置日志
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

class DatabaseCLI:
    """数据库管理CLI"""
    
    def __init__(self):
        self.db_manager = None
    
    def _get_manager(self) -> DatabaseManager:
        """获取数据库管理器"""
        if self.db_manager is None:
            try:
                self.db_manager = DatabaseManager()
            except Exception as e:
                print(f"❌ 初始化数据库管理器失败: {e}")
                sys.exit(1)
        return self.db_manager
    
    def list_databases(self, db_type: Optional[str] = None, role: Optional[str] = None, 
                      status: Optional[str] = None):
        """列出数据库"""
        manager = self._get_manager()
        
        print("📋 数据库列表\n")
        
        # 过滤条件
        type_filter = DatabaseType(db_type) if db_type else None
        role_filter = DatabaseRole(role) if role else None
        
        databases = manager.list_databases(type_filter, role_filter)
        
        if not databases:
            print("未找到符合条件的数据库")
            return
        
        # 按类型分组显示
        type_groups = {}
        for db_name in databases:
            info = manager.get_database_info(db_name)
            if status and info.status != status:
                continue
            
            type_name = info.type.value
            if type_name not in type_groups:
                type_groups[type_name] = []
            type_groups[type_name].append((db_name, info))
        
        for db_type, db_list in type_groups.items():
            print(f"=== {db_type.upper()} 数据库 ===")
            for db_name, info in db_list:
                status_icon = "✅" if info.status == "active" else "❌"
                required_icon = "🔴" if info.required else "🟡"
                
                print(f"  {status_icon} {required_icon} {info.name} ({db_name})")
                print(f"      角色: {info.role.value} | 优先级: {info.priority}")
                print(f"      状态: {info.status} | 必需: {'是' if info.required else '否'}")
                
                # 显示连接信息
                conn_config = info.connection_config
                if info.type == DatabaseType.MYSQL:
                    print(f"      连接: {conn_config.get('host')}:{conn_config.get('port')}/{conn_config.get('database')}")
                elif info.type == DatabaseType.REDIS:
                    print(f"      连接: {conn_config.get('host')}:{conn_config.get('port')}/{conn_config.get('database', 0)}")
                elif info.type == DatabaseType.INFLUXDB:
                    print(f"      连接: {conn_config.get('url')}/{conn_config.get('bucket')}")
                elif info.type == DatabaseType.SQLITE:
                    print(f"      路径: {conn_config.get('path')}")
                
                print()
    
    def show_database(self, db_name: str):
        """显示数据库详细信息"""
        manager = self._get_manager()
        info = manager.get_database_info(db_name)
        
        if not info:
            print(f"❌ 未找到数据库: {db_name}")
            return
        
        print(f"🔧 数据库详情: {db_name}\n")
        
        print("=== 基本信息 ===")
        print(f"  名称: {info.name}")
        print(f"  类型: {info.type.value}")
        print(f"  角色: {info.role.value}")
        print(f"  优先级: {info.priority}")
        print(f"  状态: {info.status}")
        print(f"  必需: {'是' if info.required else '否'}")
        
        print("\n=== 连接配置 ===")
        conn_config = info.connection_config
        sensitive_keys = ['password', 'token', 'secret']
        
        for key, value in conn_config.items():
            if any(sk in key.lower() for sk in sensitive_keys):
                display_value = "***" if value else "未设置"
            else:
                display_value = value
            print(f"  {key}: {display_value}")
        
        if info.pool_config:
            print("\n=== 连接池配置 ===")
            for key, value in info.pool_config.items():
                print(f"  {key}: {value}")
        
        if info.features:
            print("\n=== 功能特性 ===")
            for key, value in info.features.items():
                print(f"  {key}: {value}")
    
    def health_check(self, db_name: Optional[str] = None):
        """健康检查"""
        manager = self._get_manager()
        
        if db_name:
            print(f"🏥 数据库健康检查: {db_name}\n")
            databases = [db_name]
        else:
            print("🏥 全部数据库健康检查\n")
            databases = manager.list_databases()
        
        results = manager.health_check(db_name)
        
        healthy_count = 0
        total_count = len(results)
        
        for db, status in results.items():
            info = manager.get_database_info(db)
            status_icon = "🟢" if status else "🔴"
            type_info = f"({info.type.value})" if info else ""
            
            print(f"  {status_icon} {db} {type_info}: {'正常' if status else '异常'}")
            
            if status:
                healthy_count += 1
        
        print(f"\n📊 总体状态: {healthy_count}/{total_count} 正常 ({healthy_count/total_count*100:.1f}%)")
        
        if healthy_count == total_count:
            print("✅ 所有数据库连接正常")
        elif healthy_count > 0:
            print("⚠️ 部分数据库连接异常")
        else:
            print("❌ 所有数据库连接异常")
    
    def test_connection(self, db_name: str):
        """测试数据库连接"""
        manager = self._get_manager()
        info = manager.get_database_info(db_name)
        
        if not info:
            print(f"❌ 未找到数据库: {db_name}")
            return
        
        print(f"🔌 测试数据库连接: {db_name}\n")
        
        try:
            result = manager.health_check(db_name)
            status = result.get(db_name, False)
            
            if status:
                print("✅ 连接测试成功")
                
                # 显示连接详情
                conn_config = info.connection_config
                print("\n连接详情:")
                
                if info.type == DatabaseType.MYSQL:
                    print(f"  主机: {conn_config.get('host')}")
                    print(f"  端口: {conn_config.get('port')}")
                    print(f"  数据库: {conn_config.get('database')}")
                    print(f"  用户: {conn_config.get('username')}")
                elif info.type == DatabaseType.REDIS:
                    print(f"  主机: {conn_config.get('host')}")
                    print(f"  端口: {conn_config.get('port')}")
                    print(f"  数据库: {conn_config.get('database', 0)}")
                elif info.type == DatabaseType.INFLUXDB:
                    print(f"  URL: {conn_config.get('url')}")
                    print(f"  组织: {conn_config.get('org')}")
                    print(f"  存储桶: {conn_config.get('bucket')}")
                elif info.type == DatabaseType.SQLITE:
                    print(f"  路径: {conn_config.get('path')}")
                    
                    # 检查文件是否存在
                    db_path = Path(conn_config.get('path'))
                    if db_path.exists():
                        print(f"  文件大小: {db_path.stat().st_size} 字节")
                    else:
                        print("  文件不存在（将在首次使用时创建）")
            else:
                print("❌ 连接测试失败")
                print("\n可能的原因:")
                print("  - 数据库服务未启动")
                print("  - 连接配置错误")
                print("  - 网络连接问题")
                print("  - 认证信息无效")
                
        except Exception as e:
            print(f"❌ 连接测试异常: {e}")
    
    def create_local_config(self):
        """创建本地配置文件"""
        config_dir = Path(__file__).parent.parent / "config"
        source_file = config_dir / "database_config.json"
        target_file = config_dir / "database_config.local.json"
        
        if not source_file.exists():
            print(f"❌ 源配置文件不存在: {source_file}")
            return
        
        if target_file.exists():
            response = input(f"本地配置文件已存在: {target_file}\n是否覆盖? (y/N): ")
            if response.lower() != 'y':
                print("操作已取消")
                return
        
        try:
            # 复制配置文件
            with open(source_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            with open(target_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            print(f"✅ 已创建本地配置文件: {target_file}")
            print("\n📝 后续步骤:")
            print("1. 编辑本地配置文件，填入真实的数据库连接信息")
            print("2. 或者设置相应的环境变量")
            print("3. 运行健康检查验证连接: python3 scripts/database_cli.py health")
            
        except Exception as e:
            print(f"❌ 创建本地配置文件失败: {e}")
    
    def show_env_vars(self, db_name: Optional[str] = None):
        """显示环境变量"""
        manager = self._get_manager()
        
        if db_name:
            databases = [db_name]
            print(f"🌍 环境变量: {db_name}\n")
        else:
            databases = manager.list_databases()
            print("🌍 所有数据库环境变量\n")
        
        for db in databases:
            config = manager.config['databases'].get(db)
            if not config:
                continue
            
            env_vars = config.get('env_vars', {})
            if not env_vars:
                continue
            
            info = manager.get_database_info(db)
            print(f"=== {info.name} ({db}) ===")
            
            for config_key, env_var in env_vars.items():
                current_value = os.getenv(env_var)
                status_icon = "✅" if current_value else "❌"
                
                print(f"  {status_icon} {env_var} ({config_key})")
                if current_value:
                    # 隐藏敏感信息
                    if any(word in config_key.lower() for word in ['password', 'token', 'secret']):
                        print(f"      当前值: ***")
                    else:
                        print(f"      当前值: {current_value}")
                else:
                    print(f"      当前值: 未设置")
            
            print()
    
    def validate_config(self):
        """验证配置"""
        manager = self._get_manager()
        
        print("🔍 配置验证\n")
        
        # 检查必需数据库
        required_dbs = []
        optional_dbs = []
        
        for db_name in manager.list_databases():
            info = manager.get_database_info(db_name)
            if info.required:
                required_dbs.append(db_name)
            else:
                optional_dbs.append(db_name)
        
        print("=== 必需数据库 ===")
        if required_dbs:
            health_results = manager.health_check()
            for db_name in required_dbs:
                status = health_results.get(db_name, False)
                status_icon = "✅" if status else "❌"
                info = manager.get_database_info(db_name)
                print(f"  {status_icon} {info.name} ({db_name})")
        else:
            print("  无必需数据库")
        
        print("\n=== 可选数据库 ===")
        if optional_dbs:
            health_results = manager.health_check()
            for db_name in optional_dbs:
                status = health_results.get(db_name, False)
                status_icon = "✅" if status else "⚠️"
                info = manager.get_database_info(db_name)
                print(f"  {status_icon} {info.name} ({db_name})")
        else:
            print("  无可选数据库")
        
        # 检查配置规则
        print("\n=== 配置规则检查 ===")
        validation_rules = manager.config.get('validation_rules', {})
        
        required_for_prod = validation_rules.get('required_for_production', [])
        if required_for_prod:
            print("生产环境必需配置:")
            for rule in required_for_prod:
                print(f"  - {rule}")
        
        recommended_for_prod = validation_rules.get('recommended_for_production', [])
        if recommended_for_prod:
            print("\n生产环境推荐配置:")
            for rule in recommended_for_prod:
                print(f"  - {rule}")
        
        security_requirements = validation_rules.get('security_requirements', [])
        if security_requirements:
            print("\n安全要求:")
            for rule in security_requirements:
                print(f"  - {rule}")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="数据库统一管理CLI工具")
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # list 命令
    list_parser = subparsers.add_parser('list', help='列出数据库')
    list_parser.add_argument('--type', choices=['mysql', 'postgresql', 'redis', 'influxdb', 'sqlite'], 
                           help='按类型过滤')
    list_parser.add_argument('--role', choices=['primary', 'replica', 'session', 'backup', 'local'], 
                           help='按角色过滤')
    list_parser.add_argument('--status', choices=['active', 'optional'], help='按状态过滤')
    
    # show 命令
    show_parser = subparsers.add_parser('show', help='显示数据库详细信息')
    show_parser.add_argument('database', help='数据库名称')
    
    # health 命令
    health_parser = subparsers.add_parser('health', help='健康检查')
    health_parser.add_argument('database', nargs='?', help='数据库名称（可选）')
    
    # test 命令
    test_parser = subparsers.add_parser('test', help='测试数据库连接')
    test_parser.add_argument('database', help='数据库名称')
    
    # create-local 命令
    subparsers.add_parser('create-local', help='创建本地配置文件')
    
    # env 命令
    env_parser = subparsers.add_parser('env', help='显示环境变量')
    env_parser.add_argument('database', nargs='?', help='数据库名称（可选）')
    
    # validate 命令
    subparsers.add_parser('validate', help='验证配置')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    cli = DatabaseCLI()
    
    try:
        if args.command == 'list':
            cli.list_databases(args.type, args.role, args.status)
        elif args.command == 'show':
            cli.show_database(args.database)
        elif args.command == 'health':
            cli.health_check(args.database)
        elif args.command == 'test':
            cli.test_connection(args.database)
        elif args.command == 'create-local':
            cli.create_local_config()
        elif args.command == 'env':
            cli.show_env_vars(args.database)
        elif args.command == 'validate':
            cli.validate_config()
    except KeyboardInterrupt:
        print("\n操作已取消")
    except Exception as e:
        print(f"❌ 执行失败: {e}")
        sys.exit(1)
    finally:
        if cli.db_manager:
            cli.db_manager.close_all_connections()

if __name__ == "__main__":
    main()