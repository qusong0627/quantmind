#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阿里云数据库配置集成脚本
将阿里云MySQL数据库配置集成到系统中，并设置为优先使用的在线数据库
"""

import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def setup_aliyun_database_config():
    """
    设置阿里云数据库配置为系统默认配置
    """
    print("=" * 60)
    print("🚀 阿里云数据库配置集成")
    print("=" * 60)
    
    config_dir = Path(__file__).parent.parent / "config"
    
    # 阿里云MySQL配置
    aliyun_config = {
        "_metadata": {
            "name": "QuantMind 阿里云生产环境配置",
            "version": "2.0.0",
            "description": "阿里云RDS MySQL数据库生产环境配置",
            "last_updated": datetime.now().strftime("%Y-%m-%d"),
            "author": "QuantMind Team",
            "environment": "production",
            "source": "阿里云RDS MySQL 8.0.36"
        },
        
        "_instructions": {
            "setup": [
                "1. 阿里云MySQL已配置为主数据库",
                "2. 本地SQLite作为备用数据库",
                "3. 环境变量优先级高于配置文件",
                "4. 支持读写分离和故障转移"
            ],
            "priority": "数据库按priority字段排序，数字越小优先级越高",
            "fallback": "当阿里云数据库失败时，自动切换到本地SQLite",
            "environment_variables": "支持通过环境变量覆盖配置"
        },
        
        "databases": {
            "aliyun_mysql_primary": {
                "name": "阿里云MySQL主数据库",
                "description": "阿里云RDS MySQL 8.0数据库，存储量化交易系统核心数据",
                "type": "mysql",
                "role": "primary",
                "priority": 1,
                "status": "active",
                "required": True,
                
                "connection": {
                    "host": "rm-cn-zqb4dou81000440o.rwlb.rds.aliyuncs.com",
                    "port": 3306,
                    "database": "quantmind",
                    "username": "qusong",
                    "password": "Js897459835@",
                    "charset": "utf8mb4",
                    "collation": "utf8mb4_0900_ai_ci",
                    "timezone": "+08:00",
                    "ssl_mode": "PREFERRED",
                    "connect_timeout": 30,
                    "read_timeout": 30,
                    "write_timeout": 30
                },
                
                "pool_config": {
                    "pool_size": 15,
                    "max_overflow": 30,
                    "pool_timeout": 30,
                    "pool_recycle": 3600,
                    "pool_pre_ping": True,
                    "echo": False
                },
                
                "env_vars": {
                    "host": "ALIYUN_MYSQL_HOST",
                    "port": "ALIYUN_MYSQL_PORT",
                    "database": "ALIYUN_MYSQL_DATABASE",
                    "username": "ALIYUN_MYSQL_USERNAME",
                    "password": "ALIYUN_MYSQL_PASSWORD",
                    "ssl_mode": "ALIYUN_MYSQL_SSL_MODE"
                },
                
                "features": {
                    "transactions": True,
                    "foreign_keys": True,
                    "full_text_search": True,
                    "json_support": True,
                    "partitioning": True,
                    "replication": False,
                    "backup": True,
                    "monitoring": True
                },
                
                "performance": {
                    "connection_time_ms": 130,
                    "query_time_ms": 27,
                    "throughput_qps": 1000,
                    "concurrent_connections": 50
                },
                
                "backup": {
                    "enabled": True,
                    "schedule": "0 2 * * *",
                    "retention_days": 30,
                    "backup_path": "backups/aliyun_mysql",
                    "compression": True,
                    "encryption": True
                }
            },
            
            "sqlite_local": {
                "name": "本地SQLite数据库",
                "description": "本地SQLite数据库，作为备用和开发环境使用",
                "type": "sqlite",
                "role": "backup",
                "priority": 10,
                "status": "active",
                "required": False,
                
                "connection": {
                    "database": "data/quantmind.db",
                    "timeout": 30,
                    "check_same_thread": False,
                    "isolation_level": None
                },
                
                "pool_config": {
                    "pool_size": 1,
                    "max_overflow": 0,
                    "pool_timeout": 30,
                    "pool_recycle": -1,
                    "echo": False
                },
                
                "features": {
                    "transactions": True,
                    "foreign_keys": True,
                    "full_text_search": True,
                    "json_support": True,
                    "backup": True
                }
            },
            
            "redis_cache": {
                "name": "Redis缓存",
                "description": "Redis内存缓存，存储热点数据和会话信息",
                "type": "redis",
                "role": "session",
                "priority": 1,
                "status": "optional",
                "required": False,
                
                "connection": {
                    "host": "localhost",
                    "port": 6379,
                    "database": 0,
                    "password": None,
                    "decode_responses": True,
                    "connect_timeout": 5,
                    "socket_timeout": 5
                },
                
                "env_vars": {
                    "host": "REDIS_HOST",
                    "port": "REDIS_PORT",
                    "password": "REDIS_PASSWORD"
                }
            }
        },
        
        "connection_strategies": {
            "read_write_split": {
                "enabled": True,
                "write_db": "aliyun_mysql_primary",
                "read_dbs": ["aliyun_mysql_primary"],
                "read_weight": {
                    "aliyun_mysql_primary": 100
                }
            },
            
            "failover": {
                "enabled": True,
                "primary": "aliyun_mysql_primary",
                "fallback": ["sqlite_local"],
                "health_check_interval": 30,
                "max_retry_attempts": 3,
                "retry_delay": 5,
                "auto_recovery": True
            },
            
            "load_balancing": {
                "enabled": False,
                "algorithm": "round_robin",
                "health_check": True
            }
        },
        
        "monitoring": {
            "enabled": True,
            "metrics": {
                "connection_pool": True,
                "query_performance": True,
                "error_rates": True,
                "connection_count": True,
                "slow_queries": True
            },
            "alerts": {
                "connection_failure": True,
                "slow_queries": True,
                "high_cpu": True,
                "low_disk_space": True,
                "pool_exhaustion": True
            },
            "thresholds": {
                "slow_query_time": 1.0,
                "connection_pool_usage": 0.8,
                "error_rate": 0.05,
                "response_time": 0.5
            }
        },
        
        "security": {
            "encryption": {
                "at_rest": True,
                "in_transit": True,
                "key_rotation": True
            },
            "access_control": {
                "role_based": True,
                "ip_whitelist": [],
                "audit_logging": True,
                "password_policy": True
            },
            "ssl": {
                "enabled": True,
                "verify_cert": True,
                "ca_cert_path": None
            }
        },
        
        "performance_tuning": {
            "connection_pooling": {
                "enabled": True,
                "min_pool_size": 5,
                "max_pool_size": 50,
                "idle_timeout": 300,
                "max_lifetime": 3600
            },
            "query_optimization": {
                "enabled": True,
                "slow_query_log": True,
                "explain_analyze": True,
                "index_suggestions": True
            },
            "caching": {
                "query_cache": True,
                "result_cache": True,
                "metadata_cache": True,
                "cache_ttl": 3600
            }
        }
    }
    
    # 1. 备份现有配置
    print("\n📋 备份现有配置...")
    backup_configs(config_dir)
    
    # 2. 创建新的数据库配置文件
    print("\n🔧 创建阿里云数据库配置...")
    config_file = config_dir / "database_config.local.json"
    
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(aliyun_config, f, indent=2, ensure_ascii=False)
    
    print(f"  ✅ 已创建配置文件: {config_file}")
    
    # 3. 设置环境变量
    print("\n🌍 设置环境变量...")
    setup_environment_variables()
    
    # 4. 测试数据库连接
    print("\n🔍 测试数据库连接...")
    test_database_connection()
    
    # 5. 创建使用示例
    print("\n📝 创建使用示例...")
    create_usage_examples()
    
    print("\n" + "=" * 60)
    print("🎉 阿里云数据库配置集成完成！")
    print("=" * 60)
    
    print("\n📋 配置摘要:")
    print("  ✅ 主数据库: 阿里云MySQL (优先级: 1)")
    print("  ✅ 备用数据库: 本地SQLite (优先级: 10)")
    print("  ✅ 缓存数据库: Redis (可选)")
    print("  ✅ 故障转移: 已启用")
    print("  ✅ 连接池: 已优化")
    print("  ✅ 监控告警: 已启用")
    
    print("\n🚀 快速开始:")
    print("  1. 运行测试: python3 scripts/test_aliyun_mysql.py")
    print("  2. 查看示例: python3 examples/database_usage_examples.py")
    print("  3. 启动服务: python3 backend/data-service/app/main.py")
    
    return True

def backup_configs(config_dir):
    """
    备份现有配置文件
    """
    backup_dir = config_dir / "backups" / datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    config_files = [
        "database_config.json",
        "database_config.local.json",
        "unified_data_sources.json",
        "unified_data_sources.local.json"
    ]
    
    for config_file in config_files:
        source_file = config_dir / config_file
        if source_file.exists():
            backup_file = backup_dir / config_file
            shutil.copy2(source_file, backup_file)
            print(f"  ✅ 已备份: {config_file} -> {backup_file}")

def setup_environment_variables():
    """
    设置环境变量
    """
    env_vars = {
        "ALIYUN_MYSQL_HOST": "rm-cn-zqb4dou81000440o.rwlb.rds.aliyuncs.com",
        "ALIYUN_MYSQL_PORT": "3306",
        "ALIYUN_MYSQL_DATABASE": "quantmind",
        "ALIYUN_MYSQL_USERNAME": "qusong",
        "ALIYUN_MYSQL_PASSWORD": "Js897459835@",
        "DATABASE_PRIORITY": "aliyun_mysql_primary"
    }
    
    # 创建环境变量文件
    env_file = Path(__file__).parent.parent / ".env.production"
    
    with open(env_file, 'w', encoding='utf-8') as f:
        f.write("# 阿里云数据库生产环境配置\n")
        f.write(f"# 生成时间: {datetime.now()}\n\n")
        
        for key, value in env_vars.items():
            f.write(f"{key}={value}\n")
            # 同时设置到当前环境
            os.environ[key] = str(value)
    
    print(f"  ✅ 已创建环境变量文件: {env_file}")
    print("  ✅ 已设置当前会话环境变量")

def test_database_connection():
    """
    测试数据库连接
    """
    try:
        # 运行阿里云MySQL连接测试
        test_script = Path(__file__).parent / "test_aliyun_mysql.py"
        if test_script.exists():
            import subprocess
            result = subprocess.run(
                [sys.executable, str(test_script)],
                capture_output=True,
                text=True,
                cwd=Path(__file__).parent.parent
            )
            
            if result.returncode == 0:
                print("  ✅ 阿里云MySQL连接测试通过")
            else:
                print("  ⚠️  阿里云MySQL连接测试失败")
                print(f"     错误信息: {result.stderr}")
        else:
            print("  ⚠️  未找到测试脚本")
            
    except Exception as e:
        print(f"  ❌ 连接测试失败: {e}")

def create_usage_examples():
    """
    创建使用示例
    """
    examples_dir = Path(__file__).parent.parent / "examples"
    examples_dir.mkdir(exist_ok=True)
    
    example_code = '''
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阿里云数据库使用示例
演示如何使用配置好的阿里云MySQL数据库
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent.parent))

from config.database_manager import DatabaseManager
from sqlalchemy import text

def main():
    """主函数"""
    print("=" * 50)
    print("🚀 阿里云数据库使用示例")
    print("=" * 50)
    
    # 1. 初始化数据库管理器
    print("\n📋 初始化数据库管理器...")
    db_manager = DatabaseManager()
    
    try:
        # 2. 连接到阿里云MySQL
        print("\n🔗 连接阿里云MySQL数据库...")
        db_manager.connect_database("aliyun_mysql_primary")
        
        # 3. 获取数据库信息
        print("\n📊 获取数据库信息...")
        with db_manager.get_session("aliyun_mysql_primary") as session:
            # 获取MySQL版本
            result = session.execute(text("SELECT VERSION()"))
            version = result.scalar()
            print(f"  MySQL版本: {version}")
            
            # 获取表列表
            result = session.execute(text("SHOW TABLES"))
            tables = result.fetchall()
            print(f"  数据库表数量: {len(tables)}")
            
            for table in tables:
                # 获取每个表的记录数
                count_result = session.execute(text(f"SELECT COUNT(*) FROM {table[0]}"))
                count = count_result.scalar()
                print(f"    - {table[0]}: {count} 条记录")
        
        # 4. 演示故障转移
        print("\n🔄 演示故障转移功能...")
        # 这里可以添加故障转移的演示代码
        
        print("\n✅ 示例执行完成！")
        
    except Exception as e:
        print(f"\n❌ 执行失败: {e}")
        
        # 尝试使用备用数据库
        print("\n🔄 尝试使用备用数据库...")
        try:
            db_manager.connect_database("sqlite_local")
            print("  ✅ 已切换到SQLite备用数据库")
        except Exception as fallback_error:
            print(f"  ❌ 备用数据库也无法连接: {fallback_error}")
    
    finally:
        # 5. 关闭连接
        print("\n🔒 关闭数据库连接...")
        db_manager.close_all_connections()
        print("  ✅ 所有连接已关闭")

if __name__ == "__main__":
    main()
'''
    
    example_file = examples_dir / "aliyun_database_usage.py"
    with open(example_file, 'w', encoding='utf-8') as f:
        f.write(example_code.strip())
    
    print(f"  ✅ 已创建使用示例: {example_file}")

if __name__ == "__main__":
    try:
        success = setup_aliyun_database_config()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  配置过程被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 配置过程中发生错误: {e}")
        sys.exit(1)