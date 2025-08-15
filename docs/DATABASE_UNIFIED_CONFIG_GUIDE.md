# 📊 数据库统一配置使用指南

## 🎯 概述

数据库统一配置系统为QuantMind项目提供了集中化的数据库连接管理方案，支持多种数据库类型，具有自动故障转移、连接池管理、健康检查等企业级功能。

## 🗂️ 系统架构

### 核心组件

1. **配置文件** (`config/database_config.json`)
   - 统一的数据库配置模板
   - 支持多种数据库类型和角色
   - 环境变量覆盖机制

2. **管理器** (`config/database_manager.py`)
   - 数据库连接管理
   - 连接池管理
   - 健康检查和故障转移

3. **CLI工具** (`scripts/database_cli.py`)
   - 命令行管理工具
   - 配置验证和测试
   - 健康检查和监控

4. **使用示例** (`examples/database_usage_examples.py`)
   - 完整的使用示例
   - 最佳实践演示
   - 性能优化技巧

## 🚀 快速开始

### 1. 创建本地配置

```bash
# 创建本地配置文件
python3 scripts/database_cli.py create-local

# 编辑本地配置文件
vim config/database_config.local.json
```

### 2. 配置数据库连接

编辑 `config/database_config.local.json`，填入真实的数据库连接信息：

```json
{
  "databases": {
    "mysql_primary": {
      "connection": {
        "host": "your-mysql-host",
        "port": 3306,
        "database": "quantmind",
        "username": "your-username",
        "password": "your-secure-password"
      }
    },
    "redis_primary": {
      "connection": {
        "host": "your-redis-host",
        "port": 6379,
        "password": "your-redis-password"
      }
    }
  }
}
```

### 3. 环境变量配置（推荐）

```bash
# MySQL配置
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_DATABASE=quantmind
export MYSQL_USERNAME=quantmind_user
export MYSQL_PASSWORD=your_secure_password

# Redis配置
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=your_redis_password

# InfluxDB配置（可选）
export INFLUXDB_URL=http://localhost:8086
export INFLUXDB_TOKEN=your_influxdb_token
export INFLUXDB_ORG=quantmind
export INFLUXDB_BUCKET=market_data
```

### 4. 验证配置

```bash
# 查看所有数据库
python3 scripts/database_cli.py list

# 健康检查
python3 scripts/database_cli.py health

# 测试特定数据库连接
python3 scripts/database_cli.py test mysql_primary
```

## 📋 支持的数据库类型

### 1. MySQL
- **类型**: `mysql`
- **用途**: 主要关系型数据库
- **角色**: `primary`（主库）, `replica`（读副本）
- **特性**: 事务支持、外键、全文搜索、JSON支持

### 2. Redis
- **类型**: `redis`
- **用途**: 内存缓存数据库
- **角色**: `primary`（主缓存）, `session`（会话存储）
- **特性**: 持久化、发布订阅、流处理

### 3. InfluxDB
- **类型**: `influxdb`
- **用途**: 时序数据库
- **角色**: `primary`（主时序库）
- **特性**: 时序查询、连续查询、数据保留策略

### 4. SQLite
- **类型**: `sqlite`
- **用途**: 本地轻量级数据库
- **角色**: `local`（本地存储）
- **特性**: WAL模式、外键、全文搜索

### 5. PostgreSQL
- **类型**: `postgresql`
- **用途**: 高级关系型数据库
- **角色**: `backup`（备份库）
- **特性**: JSON支持、物化视图、分区

## 🔧 CLI工具使用

### 基本命令

```bash
# 列出所有数据库
python3 scripts/database_cli.py list

# 按类型过滤
python3 scripts/database_cli.py list --type mysql

# 按角色过滤
python3 scripts/database_cli.py list --role primary

# 显示数据库详情
python3 scripts/database_cli.py show mysql_primary

# 健康检查
python3 scripts/database_cli.py health

# 测试连接
python3 scripts/database_cli.py test redis_primary

# 显示环境变量
python3 scripts/database_cli.py env

# 验证配置
python3 scripts/database_cli.py validate
```

### 高级功能

```bash
# 创建本地配置文件
python3 scripts/database_cli.py create-local

# 检查特定数据库的环境变量
python3 scripts/database_cli.py env mysql_primary

# 验证生产环境配置
python3 scripts/database_cli.py validate
```

## 💻 编程接口使用

### 基础使用

```python
from config.database_manager import DatabaseManager, get_session, get_redis_client

# 方式1：使用上下文管理器
with DatabaseManager() as db_manager:
    # 获取数据库会话
    with db_manager.get_session() as session:
        result = session.execute(text("SELECT 1"))
        print(result.fetchone())

# 方式2：使用便捷函数
with get_session() as session:
    result = session.execute(text("SELECT NOW()"))
    print(result.fetchone())

# Redis操作
redis_client = get_redis_client()
redis_client.set("key", "value", ex=300)
value = redis_client.get("key")
```

### 高级功能

```python
from config.database_manager import DatabaseManager, DatabaseType, DatabaseRole

with DatabaseManager() as db_manager:
    # 读写分离
    with db_manager.get_session(read_only=False) as write_session:
        # 写操作
        write_session.execute(text("INSERT INTO ..."))
    
    with db_manager.get_session(read_only=True) as read_session:
        # 读操作
        result = read_session.execute(text("SELECT ..."))
    
    # 指定数据库
    with db_manager.get_session("mysql_primary") as session:
        # 使用特定数据库
        pass
    
    # 健康检查
    health_status = db_manager.health_check()
    
    # 列出数据库
    mysql_dbs = db_manager.list_databases(DatabaseType.MYSQL)
    primary_dbs = db_manager.list_databases(role=DatabaseRole.PRIMARY)
```

### 事务管理

```python
with get_session() as session:
    try:
        # 事务会自动开始
        session.execute(text("UPDATE accounts SET balance = balance - 100 WHERE id = 1"))
        session.execute(text("UPDATE accounts SET balance = balance + 100 WHERE id = 2"))
        # 事务会在上下文退出时自动提交
    except Exception:
        # 发生异常时会自动回滚
        raise
```

## ⚙️ 配置详解

### 数据库配置结构

```json
{
  "databases": {
    "database_name": {
      "name": "显示名称",
      "description": "数据库描述",
      "type": "数据库类型",
      "role": "数据库角色",
      "priority": 1,
      "status": "active|optional",
      "required": true|false,
      
      "connection": {
        "host": "主机地址",
        "port": 端口号,
        "database": "数据库名",
        "username": "用户名",
        "password": "密码"
      },
      
      "pool_config": {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30
      },
      
      "env_vars": {
        "host": "MYSQL_HOST",
        "password": "MYSQL_PASSWORD"
      },
      
      "features": {
        "transactions": true,
        "foreign_keys": true
      }
    }
  }
}
```

### 连接策略配置

```json
{
  "connection_strategies": {
    "read_write_split": {
      "enabled": true,
      "write_db": "mysql_primary",
      "read_dbs": ["mysql_replica", "mysql_primary"],
      "read_weight": {
        "mysql_replica": 70,
        "mysql_primary": 30
      }
    },
    
    "failover": {
      "enabled": true,
      "primary": "mysql_primary",
      "fallback": ["mysql_replica", "sqlite_local"],
      "health_check_interval": 30,
      "max_retry_attempts": 3
    }
  }
}
```

### 监控和安全配置

```json
{
  "monitoring": {
    "enabled": true,
    "metrics": {
      "connection_pool": true,
      "query_performance": true,
      "error_rates": true
    },
    "thresholds": {
      "slow_query_time": 1.0,
      "connection_pool_usage": 0.8
    }
  },
  
  "security": {
    "encryption": {
      "at_rest": true,
      "in_transit": true
    },
    "access_control": {
      "role_based": true,
      "audit_logging": true
    }
  }
}
```

## 🛠️ 故障排除

### 常见问题

1. **连接失败**
   ```bash
   # 检查服务状态
   python3 scripts/database_cli.py health
   
   # 测试特定连接
   python3 scripts/database_cli.py test mysql_primary
   
   # 检查环境变量
   python3 scripts/database_cli.py env mysql_primary
   ```

2. **依赖包缺失**
   ```bash
   # 安装MySQL依赖
   pip install pymysql
   
   # 安装Redis依赖
   pip install redis
   
   # 安装InfluxDB依赖
   pip install influxdb-client
   
   # 安装PostgreSQL依赖
   pip install psycopg2-binary
   ```

3. **配置错误**
   ```bash
   # 验证配置
   python3 scripts/database_cli.py validate
   
   # 检查配置文件语法
   python3 -m json.tool config/database_config.local.json
   ```

### 调试技巧

```python
# 启用SQL日志
with DatabaseManager() as db_manager:
    # 在pool_config中设置echo: true
    pass

# 手动测试连接
from sqlalchemy import create_engine, text

engine = create_engine("mysql+pymysql://user:pass@host:port/db")
with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print(result.fetchone())
```

## 📊 性能优化

### 连接池优化

```json
{
  "pool_config": {
    "pool_size": 20,        // 基础连接池大小
    "max_overflow": 30,     // 最大溢出连接数
    "pool_timeout": 30,     // 获取连接超时时间
    "pool_recycle": 3600,   // 连接回收时间（秒）
    "pool_pre_ping": true   // 连接前测试
  }
}
```

### 查询优化

```python
# 使用读写分离
with get_session(read_only=True) as session:
    # 读操作使用读副本
    result = session.execute(text("SELECT ..."))

with get_session(read_only=False) as session:
    # 写操作使用主库
    session.execute(text("INSERT ..."))

# 批量操作
with get_session() as session:
    # 使用批量插入
    session.execute(text("INSERT INTO table VALUES ..."), [
        {"col1": "val1", "col2": "val2"},
        {"col1": "val3", "col2": "val4"}
    ])
```

### 缓存策略

```python
# Redis缓存
redis_client = get_redis_client()

# 缓存查询结果
def get_stock_data(symbol):
    cache_key = f"stock:{symbol}"
    
    # 尝试从缓存获取
    cached_data = redis_client.get(cache_key)
    if cached_data:
        return json.loads(cached_data)
    
    # 从数据库查询
    with get_session(read_only=True) as session:
        result = session.execute(text("SELECT ..."))
        data = result.fetchone()
    
    # 存入缓存
    redis_client.setex(cache_key, 300, json.dumps(data))
    return data
```

## 🔒 安全最佳实践

### 1. 密码管理
- 使用强密码（至少12位，包含特殊字符）
- 定期更换密码
- 使用环境变量存储敏感信息

### 2. 网络安全
- 启用SSL/TLS加密
- 配置IP白名单
- 使用VPN或专用网络

### 3. 访问控制
- 实施最小权限原则
- 使用专用数据库用户
- 启用审计日志

### 4. 备份策略
- 定期自动备份
- 测试备份恢复
- 异地备份存储

## 📈 监控和告警

### 监控指标

```python
# 获取连接池状态
with DatabaseManager() as db_manager:
    for db_name in db_manager.list_databases():
        if db_name in db_manager.engines:
            engine = db_manager.engines[db_name]
            pool = engine.pool
            print(f"{db_name}:")
            print(f"  连接池大小: {pool.size()}")
            print(f"  使用中连接: {pool.checkedout()}")
            print(f"  空闲连接: {pool.checkedin()}")
```

### 健康检查

```python
# 定期健康检查
import schedule
import time

def health_check_job():
    with DatabaseManager() as db_manager:
        results = db_manager.health_check()
        for db_name, status in results.items():
            if not status:
                # 发送告警
                print(f"数据库异常: {db_name}")

schedule.every(5).minutes.do(health_check_job)

while True:
    schedule.run_pending()
    time.sleep(1)
```

## 🚀 部署建议

### 开发环境
- 使用SQLite进行快速开发
- 启用SQL日志调试
- 使用Docker Compose启动依赖服务

### 测试环境
- 使用与生产环境相同的数据库类型
- 配置读写分离测试
- 进行故障转移测试

### 生产环境
- 使用高可用数据库集群
- 配置监控和告警
- 实施备份和恢复策略
- 启用安全审计

---

**文档版本**: v1.0.0  
**最后更新**: 2025年1月15日  
**维护者**: QuantMind团队