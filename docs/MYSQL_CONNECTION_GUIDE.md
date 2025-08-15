# 🐬 MySQL数据库连接指南

## 📋 概述

QuantMind项目支持多种MySQL连接方式，包括统一配置管理、环境变量配置和直接连接等方法。本指南将详细介绍如何连接MySQL数据库。

## 🚀 快速开始

### 方法一：使用统一配置管理器（推荐）

#### 1. 环境变量配置

创建 `.env` 文件或设置环境变量：

```bash
# MySQL主数据库配置
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_DATABASE=quantmind
export MYSQL_USERNAME=quantmind_user
export MYSQL_PASSWORD=your_secure_password
export MYSQL_SSL_MODE=PREFERRED

# MySQL读副本配置（可选）
export MYSQL_REPLICA_HOST=localhost
export MYSQL_REPLICA_PORT=3307
export MYSQL_REPLICA_DATABASE=quantmind
export MYSQL_REPLICA_USERNAME=quantmind_readonly
export MYSQL_REPLICA_PASSWORD=your_readonly_password
```

#### 2. 使用数据库管理器

```python
#!/usr/bin/env python3
from config.database_manager import DatabaseManager, get_session
from sqlalchemy import text

# 方式1：使用上下文管理器
with get_session("mysql_primary") as session:
    result = session.execute(text("SELECT 'Hello MySQL' as message, NOW() as current_time"))
    row = result.fetchone()
    print(f"连接成功: {row.message} at {row.current_time}")

# 方式2：使用数据库管理器
with DatabaseManager() as db_manager:
    # 健康检查
    health_status = db_manager.health_check()
    print(f"MySQL状态: {'正常' if health_status.get('mysql_primary') else '异常'}")
    
    # 获取会话
    session = db_manager.get_session("mysql_primary")
    try:
        result = session.execute(text("SELECT VERSION() as version"))
        version = result.scalar()
        print(f"MySQL版本: {version}")
    finally:
        session.close()
```

### 方法二：使用专用MySQL管理器

```python
#!/usr/bin/env python3
from backend.data_service.database_mysql import MySQLDatabaseManager

# 初始化MySQL管理器
mysql_manager = MySQLDatabaseManager('aliyun_mysql')

# 测试连接
if mysql_manager.test_connection():
    print("✅ MySQL连接成功")
    
    # 获取数据库信息
    db_info = mysql_manager.get_database_info()
    print(f"数据库版本: {db_info['version']}")
    print(f"数据库名称: {db_info['database']}")
    
    # 使用会话
    with mysql_manager.get_session() as session:
        result = session.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()"))
        table_count = result.scalar()
        print(f"数据库表数量: {table_count}")
else:
    print("❌ MySQL连接失败")
```

### 方法三：直接使用SQLAlchemy

```python
#!/usr/bin/env python3
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

# 构建连接URL
DATABASE_URL = "mysql+pymysql://username:password@host:port/database"

# 创建引擎
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False  # 设置为True可以看到SQL语句
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 使用连接
def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            print(f"连接测试成功: {test_value}")
            return True
    except Exception as e:
        print(f"连接测试失败: {e}")
        return False

# 使用会话
def use_session():
    session = SessionLocal()
    try:
        result = session.execute(text("SELECT VERSION() as version"))
        version = result.scalar()
        print(f"MySQL版本: {version}")
    finally:
        session.close()

if __name__ == "__main__":
    if test_connection():
        use_session()
```

## 🔧 配置详解

### 1. 数据库配置文件

项目使用 `config/database_config.json` 作为配置模板：

```json
{
  "databases": {
    "mysql_primary": {
      "name": "MySQL主数据库",
      "type": "mysql",
      "role": "primary",
      "connection": {
        "host": "localhost",
        "port": 3306,
        "database": "quantmind",
        "username": "quantmind_user",
        "password": "your_mysql_password_here",
        "charset": "utf8mb4",
        "ssl_mode": "PREFERRED",
        "connect_timeout": 30
      },
      "pool_config": {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "pool_recycle": 3600,
        "pool_pre_ping": true
      }
    }
  }
}
```

### 2. 环境变量优先级

环境变量的优先级高于配置文件：

```bash
# 基础连接配置
MYSQL_HOST=your-mysql-host
MYSQL_PORT=3306
MYSQL_DATABASE=quantmind
MYSQL_USERNAME=your-username
MYSQL_PASSWORD=your-password

# 高级配置
MYSQL_SSL_MODE=REQUIRED
MYSQL_CHARSET=utf8mb4
MYSQL_CONNECT_TIMEOUT=30
```

### 3. 连接池配置

```python
# 连接池参数说明
pool_config = {
    "pool_size": 10,        # 连接池大小
    "max_overflow": 20,     # 最大溢出连接数
    "pool_timeout": 30,     # 获取连接超时时间
    "pool_recycle": 3600,   # 连接回收时间（秒）
    "pool_pre_ping": True,  # 连接前测试
    "echo": False           # 是否显示SQL语句
}
```

## 🛠️ 实用工具

### 1. 命令行工具

```bash
# 查看所有数据库
python3 scripts/database_cli.py list

# 健康检查
python3 scripts/database_cli.py health

# 测试MySQL连接
python3 scripts/database_cli.py test mysql_primary

# 查看环境变量
python3 scripts/database_cli.py env mysql_primary
```

### 2. 测试脚本

```bash
# 测试MySQL连接
python3 backend/data-service/database_mysql.py

# 运行使用示例
python3 examples/database_usage_examples.py
```

## 📊 数据库操作示例

### 1. 基础CRUD操作

```python
from config.database_manager import get_session
from sqlalchemy import text

# 创建表
with get_session("mysql_primary") as session:
    session.execute(text("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    
    # 插入数据
    session.execute(text("""
        INSERT INTO users (username, email) 
        VALUES (:username, :email)
    """), {"username": "test_user", "email": "test@example.com"})
    
    # 查询数据
    result = session.execute(text("SELECT * FROM users WHERE username = :username"), 
                           {"username": "test_user"})
    user = result.fetchone()
    print(f"用户信息: {user.username}, {user.email}")
    
    # 提交事务
    session.commit()
```

### 2. 事务处理

```python
with get_session("mysql_primary") as session:
    try:
        # 开始事务
        session.execute(text("INSERT INTO users (username, email) VALUES ('user1', 'user1@example.com')"))
        session.execute(text("INSERT INTO users (username, email) VALUES ('user2', 'user2@example.com')"))
        
        # 提交事务
        session.commit()
        print("✅ 事务提交成功")
    except Exception as e:
        # 回滚事务
        session.rollback()
        print(f"❌ 事务回滚: {e}")
```

### 3. 批量操作

```python
with get_session("mysql_primary") as session:
    # 批量插入
    users_data = [
        {"username": "user1", "email": "user1@example.com"},
        {"username": "user2", "email": "user2@example.com"},
        {"username": "user3", "email": "user3@example.com"}
    ]
    
    session.execute(text("""
        INSERT INTO users (username, email) 
        VALUES (:username, :email)
    """), users_data)
    
    session.commit()
    print(f"✅ 批量插入 {len(users_data)} 条记录")
```

## 🔍 故障排除

### 常见问题

1. **连接被拒绝**
   ```bash
   # 检查MySQL服务状态
   brew services list | grep mysql
   # 或
   sudo systemctl status mysql
   ```

2. **认证失败**
   ```sql
   -- 创建用户和授权
   CREATE USER 'quantmind_user'@'%' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON quantmind.* TO 'quantmind_user'@'%';
   FLUSH PRIVILEGES;
   ```

3. **字符集问题**
   ```sql
   -- 设置数据库字符集
   ALTER DATABASE quantmind CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **连接池耗尽**
   ```python
   # 检查连接池状态
   with DatabaseManager() as db_manager:
       engine = db_manager.get_engine("mysql_primary")
       print(f"连接池大小: {engine.pool.size()}")
       print(f"已用连接: {engine.pool.checkedin()}")
   ```

### 调试技巧

1. **启用SQL日志**
   ```python
   # 在配置中设置 echo=True
   engine = create_engine(DATABASE_URL, echo=True)
   ```

2. **连接测试**
   ```python
   # 使用内置测试函数
   from backend.data_service.database_mysql import test_mysql_connection
   if test_mysql_connection():
       print("✅ 连接正常")
   ```

3. **性能监控**
   ```python
   import time
   start_time = time.time()
   
   with get_session("mysql_primary") as session:
       result = session.execute(text("SELECT COUNT(*) FROM users"))
       count = result.scalar()
   
   end_time = time.time()
   print(f"查询耗时: {end_time - start_time:.3f}秒")
   ```

## 📚 相关文档

- [数据库统一配置指南](DATABASE_UNIFIED_CONFIG_GUIDE.md)
- [API配置指南](API_CONFIG_GUIDE.md)
- [项目快速开始](../README.md)

## 🔗 有用链接

- [SQLAlchemy官方文档](https://docs.sqlalchemy.org/)
- [PyMySQL文档](https://pymysql.readthedocs.io/)
- [MySQL官方文档](https://dev.mysql.com/doc/)

---

💡 **提示**: 建议在生产环境中使用环境变量配置数据库连接信息，避免在代码中硬编码敏感信息。