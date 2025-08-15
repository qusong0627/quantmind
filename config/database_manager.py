#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库统一管理器
基于统一配置文件管理所有数据库连接
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from dataclasses import dataclass
from pathlib import Path
import asyncio
from contextlib import contextmanager, asynccontextmanager

# 配置日志
logger = logging.getLogger(__name__)

# SQLAlchemy
from sqlalchemy import create_engine, MetaData, text, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, StaticPool
from sqlalchemy.exc import SQLAlchemyError

# Redis
import redis
from redis.sentinel import Sentinel

# InfluxDB (可选)
try:
    from influxdb_client import InfluxDBClient
    from influxdb_client.client.write_api import SYNCHRONOUS
    INFLUXDB_AVAILABLE = True
except ImportError:
    INFLUXDB_AVAILABLE = False
    logger.warning("InfluxDB客户端不可用，相关功能将被禁用")

# PostgreSQL (可选)
try:
    import psycopg2
    from psycopg2.pool import ThreadedConnectionPool
    POSTGRESQL_AVAILABLE = True
except ImportError:
    POSTGRESQL_AVAILABLE = False
    logger.warning("PostgreSQL客户端不可用，相关功能将被禁用")

class DatabaseType(Enum):
    """数据库类型枚举"""
    MYSQL = "mysql"
    POSTGRESQL = "postgresql"
    REDIS = "redis"
    INFLUXDB = "influxdb"
    SQLITE = "sqlite"

class DatabaseRole(Enum):
    """数据库角色枚举"""
    PRIMARY = "primary"
    REPLICA = "replica"
    SESSION = "session"
    BACKUP = "backup"
    LOCAL = "local"

class ConnectionStatus(Enum):
    """连接状态枚举"""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    CONNECTING = "connecting"

@dataclass
class DatabaseInfo:
    """数据库信息"""
    name: str
    type: DatabaseType
    role: DatabaseRole
    priority: int
    status: str
    required: bool
    connection_config: Dict[str, Any]
    pool_config: Dict[str, Any]
    features: Dict[str, Any]

class DatabaseManager:
    """数据库统一管理器"""
    
    def __init__(self, config_file: Optional[str] = None):
        """初始化数据库管理器
        
        Args:
            config_file: 配置文件路径
        """
        self.config_dir = Path(__file__).parent
        self.config_file = config_file or self._find_config_file()
        self.config = None
        self.connections = {}
        self.connection_status = {}
        self.engines = {}
        self.session_factories = {}
        
        self._load_config()
        self._initialize_connections()
    
    def _find_config_file(self) -> Path:
        """查找配置文件"""
        local_config = self.config_dir / "database_config.local.json"
        default_config = self.config_dir / "database_config.json"
        
        if local_config.exists():
            logger.info(f"使用本地配置文件: {local_config}")
            return local_config
        elif default_config.exists():
            logger.info(f"使用默认配置文件: {default_config}")
            return default_config
        else:
            raise FileNotFoundError("未找到数据库配置文件")
    
    def _load_config(self):
        """加载配置文件"""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
            logger.info(f"已加载数据库配置: {self.config_file}")
        except Exception as e:
            logger.error(f"加载配置文件失败: {e}")
            raise
    
    def _get_env_value(self, env_var: str, default: Any = None) -> Any:
        """获取环境变量值"""
        return os.getenv(env_var, default)
    
    def _resolve_connection_config(self, db_name: str) -> Dict[str, Any]:
        """解析数据库连接配置，支持环境变量覆盖"""
        db_config = self.config['databases'][db_name]
        connection_config = db_config['connection'].copy()
        env_vars = db_config.get('env_vars', {})
        
        # 使用环境变量覆盖配置
        for config_key, env_var in env_vars.items():
            env_value = self._get_env_value(env_var)
            if env_value is not None:
                # 处理数据类型转换
                if config_key in ['port', 'database', 'timeout']:
                    try:
                        connection_config[config_key] = int(env_value)
                    except ValueError:
                        logger.warning(f"环境变量 {env_var} 值无效: {env_value}")
                elif config_key in ['ssl', 'verify_ssl', 'decode_responses']:
                    connection_config[config_key] = env_value.lower() in ('true', '1', 'yes', 'on')
                else:
                    connection_config[config_key] = env_value
                logger.debug(f"使用环境变量 {env_var} 覆盖 {config_key}")
        
        return connection_config
    
    def _initialize_connections(self):
        """初始化所有数据库连接"""
        databases = self.config.get('databases', {})
        
        for db_name, db_config in databases.items():
            if db_config.get('status') == 'active':
                try:
                    self._initialize_single_connection(db_name, db_config)
                except Exception as e:
                    logger.error(f"初始化数据库连接失败 {db_name}: {e}")
                    self.connection_status[db_name] = ConnectionStatus.ERROR
    
    def _initialize_single_connection(self, db_name: str, db_config: Dict[str, Any]):
        """初始化单个数据库连接"""
        db_type = DatabaseType(db_config['type'])
        connection_config = self._resolve_connection_config(db_name)
        
        if db_type == DatabaseType.MYSQL:
            self._init_mysql_connection(db_name, connection_config, db_config.get('pool_config', {}))
        elif db_type == DatabaseType.POSTGRESQL:
            self._init_postgresql_connection(db_name, connection_config, db_config.get('pool_config', {}))
        elif db_type == DatabaseType.REDIS:
            self._init_redis_connection(db_name, connection_config, db_config.get('pool_config', {}))
        elif db_type == DatabaseType.INFLUXDB:
            self._init_influxdb_connection(db_name, connection_config)
        elif db_type == DatabaseType.SQLITE:
            self._init_sqlite_connection(db_name, connection_config, db_config.get('pragmas', {}))
        
        self.connection_status[db_name] = ConnectionStatus.CONNECTED
        logger.info(f"数据库连接初始化成功: {db_name} ({db_type.value})")
    
    def _init_mysql_connection(self, db_name: str, connection_config: Dict[str, Any], pool_config: Dict[str, Any]):
        """初始化MySQL连接"""
        # 构建连接URL
        url = (f"mysql+pymysql://{connection_config['username']}:"
               f"{connection_config['password']}@{connection_config['host']}:"
               f"{connection_config['port']}/{connection_config['database']}")
        
        # 添加连接参数
        url_params = []
        if connection_config.get('charset'):
            url_params.append(f"charset={connection_config['charset']}")
        
        if url_params:
            url += "?" + "&".join(url_params)
        
        # 创建引擎
        engine = create_engine(
            url,
            poolclass=QueuePool,
            pool_size=pool_config.get('pool_size', 10),
            max_overflow=pool_config.get('max_overflow', 20),
            pool_timeout=pool_config.get('pool_timeout', 30),
            pool_recycle=pool_config.get('pool_recycle', 3600),
            pool_pre_ping=pool_config.get('pool_pre_ping', True),
            echo=pool_config.get('echo', False)
        )
        
        # 创建会话工厂
        session_factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
        
        self.engines[db_name] = engine
        self.session_factories[db_name] = session_factory
    
    def _init_postgresql_connection(self, db_name: str, connection_config: Dict[str, Any], pool_config: Dict[str, Any]):
        """初始化PostgreSQL连接"""
        if not POSTGRESQL_AVAILABLE:
            raise ImportError("PostgreSQL客户端不可用，请安装 psycopg2-binary")
        
        url = (f"postgresql+psycopg2://{connection_config['username']}:"
               f"{connection_config['password']}@{connection_config['host']}:"
               f"{connection_config['port']}/{connection_config['database']}")
        
        engine = create_engine(
            url,
            poolclass=QueuePool,
            pool_size=pool_config.get('pool_size', 5),
            max_overflow=pool_config.get('max_overflow', 10),
            pool_timeout=pool_config.get('pool_timeout', 30),
            pool_recycle=pool_config.get('pool_recycle', 3600),
            pool_pre_ping=pool_config.get('pool_pre_ping', True)
        )
        
        session_factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
        
        self.engines[db_name] = engine
        self.session_factories[db_name] = session_factory
    
    def _init_redis_connection(self, db_name: str, connection_config: Dict[str, Any], pool_config: Dict[str, Any]):
        """初始化Redis连接"""
        connection_pool = redis.ConnectionPool(
            host=connection_config['host'],
            port=connection_config['port'],
            db=connection_config.get('database', 0),
            password=connection_config.get('password'),
            username=connection_config.get('username'),
            ssl=connection_config.get('ssl', False),
            socket_connect_timeout=connection_config.get('connect_timeout', 5),
            socket_timeout=connection_config.get('socket_timeout', 5),
            socket_keepalive=connection_config.get('socket_keepalive', True),
            decode_responses=connection_config.get('decode_responses', True),
            encoding=connection_config.get('encoding', 'utf-8'),
            max_connections=pool_config.get('max_connections', 50),
            retry_on_timeout=pool_config.get('retry_on_timeout', True)
        )
        
        redis_client = redis.Redis(connection_pool=connection_pool)
        self.connections[db_name] = redis_client
    
    def _init_influxdb_connection(self, db_name: str, connection_config: Dict[str, Any]):
        """初始化InfluxDB连接"""
        if not INFLUXDB_AVAILABLE:
            raise ImportError("InfluxDB客户端不可用，请安装 influxdb-client")
        
        client = InfluxDBClient(
            url=connection_config['url'],
            token=connection_config['token'],
            org=connection_config['org'],
            timeout=connection_config.get('timeout', 30000),
            verify_ssl=connection_config.get('verify_ssl', True),
            ssl_ca_cert=connection_config.get('ssl_ca_cert'),
            debug=connection_config.get('debug', False)
        )
        
        self.connections[db_name] = client
    
    def _init_sqlite_connection(self, db_name: str, connection_config: Dict[str, Any], pragmas: Dict[str, Any]):
        """初始化SQLite连接"""
        db_path = connection_config['path']
        
        # 确保目录存在
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        
        url = f"sqlite:///{db_path}"
        
        engine = create_engine(
            url,
            poolclass=StaticPool,
            connect_args={
                'timeout': connection_config.get('timeout', 30),
                'check_same_thread': connection_config.get('check_same_thread', False),
                'isolation_level': connection_config.get('isolation_level'),
                'detect_types': connection_config.get('detect_types', 0),
                'cached_statements': connection_config.get('cached_statements', 100)
            },
            echo=False
        )
        
        # 设置SQLite Pragmas
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            for pragma, value in pragmas.items():
                cursor = dbapi_connection.cursor()
                cursor.execute(f"PRAGMA {pragma} = {value}")
                cursor.close()
        
        session_factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
        
        self.engines[db_name] = engine
        self.session_factories[db_name] = session_factory
    
    def get_database_info(self, db_name: str) -> Optional[DatabaseInfo]:
        """获取数据库信息"""
        if db_name not in self.config['databases']:
            return None
        
        db_config = self.config['databases'][db_name]
        return DatabaseInfo(
            name=db_config['name'],
            type=DatabaseType(db_config['type']),
            role=DatabaseRole(db_config['role']),
            priority=db_config['priority'],
            status=db_config['status'],
            required=db_config['required'],
            connection_config=self._resolve_connection_config(db_name),
            pool_config=db_config.get('pool_config', {}),
            features=db_config.get('features', {})
        )
    
    def list_databases(self, db_type: Optional[DatabaseType] = None, role: Optional[DatabaseRole] = None) -> List[str]:
        """列出数据库"""
        databases = []
        for db_name, db_config in self.config['databases'].items():
            if db_type and DatabaseType(db_config['type']) != db_type:
                continue
            if role and DatabaseRole(db_config['role']) != role:
                continue
            databases.append(db_name)
        
        return sorted(databases, key=lambda x: self.config['databases'][x]['priority'])
    
    @contextmanager
    def get_session(self, db_name: str = None, read_only: bool = False):
        """获取数据库会话（上下文管理器）"""
        if db_name is None:
            # 自动选择主数据库
            db_name = self._get_primary_database()
        
        if read_only:
            # 选择读副本
            db_name = self._get_read_database(db_name)
        
        if db_name not in self.session_factories:
            raise ValueError(f"数据库连接不存在: {db_name}")
        
        session = self.session_factories[db_name]()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    
    def get_redis_client(self, db_name: str = None) -> redis.Redis:
        """获取Redis客户端"""
        if db_name is None:
            # 自动选择主Redis
            redis_dbs = self.list_databases(DatabaseType.REDIS, DatabaseRole.PRIMARY)
            if not redis_dbs:
                redis_dbs = self.list_databases(DatabaseType.REDIS)
            if not redis_dbs:
                raise ValueError("未找到可用的Redis数据库")
            db_name = redis_dbs[0]
        
        if db_name not in self.connections:
            raise ValueError(f"Redis连接不存在: {db_name}")
        
        return self.connections[db_name]
    
    def get_influxdb_client(self, db_name: str = None):
        """获取InfluxDB客户端"""
        if db_name is None:
            # 自动选择主InfluxDB
            influx_dbs = self.list_databases(DatabaseType.INFLUXDB, DatabaseRole.PRIMARY)
            if not influx_dbs:
                influx_dbs = self.list_databases(DatabaseType.INFLUXDB)
            if not influx_dbs:
                raise ValueError("未找到可用的InfluxDB数据库")
            db_name = influx_dbs[0]
        
        if db_name not in self.connections:
            raise ValueError(f"InfluxDB连接不存在: {db_name}")
        
        return self.connections[db_name]
    
    def _get_primary_database(self) -> str:
        """获取主数据库"""
        primary_dbs = self.list_databases(role=DatabaseRole.PRIMARY)
        if not primary_dbs:
            # 如果没有主数据库，选择优先级最高的
            all_dbs = self.list_databases()
            if not all_dbs:
                raise ValueError("未找到可用的数据库")
            return all_dbs[0]
        return primary_dbs[0]
    
    def _get_read_database(self, fallback_db: str) -> str:
        """获取读数据库"""
        # 首先尝试找读副本
        replica_dbs = self.list_databases(role=DatabaseRole.REPLICA)
        if replica_dbs:
            return replica_dbs[0]
        
        # 如果没有读副本，返回原数据库
        return fallback_db
    
    def health_check(self, db_name: str = None) -> Dict[str, bool]:
        """健康检查"""
        if db_name:
            databases = [db_name]
        else:
            databases = list(self.config['databases'].keys())
        
        results = {}
        for db in databases:
            try:
                results[db] = self._check_single_database(db)
            except Exception as e:
                logger.error(f"健康检查失败 {db}: {e}")
                results[db] = False
        
        return results
    
    def _check_single_database(self, db_name: str) -> bool:
        """检查单个数据库健康状态"""
        if db_name not in self.config['databases']:
            return False
        
        db_config = self.config['databases'][db_name]
        db_type = DatabaseType(db_config['type'])
        
        try:
            if db_type in [DatabaseType.MYSQL, DatabaseType.POSTGRESQL, DatabaseType.SQLITE]:
                if db_name in self.engines:
                    with self.engines[db_name].connect() as conn:
                        conn.execute(text("SELECT 1"))
                    return True
            elif db_type == DatabaseType.REDIS:
                if db_name in self.connections:
                    self.connections[db_name].ping()
                    return True
            elif db_type == DatabaseType.INFLUXDB:
                if db_name in self.connections:
                    self.connections[db_name].ping()
                    return True
        except Exception as e:
            logger.error(f"数据库健康检查失败 {db_name}: {e}")
            return False
        
        return False
    
    def get_connection_status(self) -> Dict[str, str]:
        """获取所有连接状态"""
        return {db: status.value for db, status in self.connection_status.items()}
    
    def close_all_connections(self):
        """关闭所有连接"""
        # 关闭SQLAlchemy引擎
        for db_name, engine in self.engines.items():
            try:
                engine.dispose()
                logger.info(f"已关闭数据库连接: {db_name}")
            except Exception as e:
                logger.error(f"关闭数据库连接失败 {db_name}: {e}")
        
        # 关闭Redis连接
        for db_name, client in self.connections.items():
            try:
                if hasattr(client, 'close'):
                    client.close()
                elif hasattr(client, 'connection_pool'):
                    client.connection_pool.disconnect()
                logger.info(f"已关闭连接: {db_name}")
            except Exception as e:
                logger.error(f"关闭连接失败 {db_name}: {e}")
        
        self.engines.clear()
        self.session_factories.clear()
        self.connections.clear()
        self.connection_status.clear()
    
    def __enter__(self):
        """上下文管理器入口"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器出口"""
        self.close_all_connections()


# 全局数据库管理器实例
_db_manager = None

def get_database_manager() -> DatabaseManager:
    """获取全局数据库管理器实例"""
    global _db_manager
    if _db_manager is None:
        _db_manager = DatabaseManager()
    return _db_manager

def get_session(db_name: str = None, read_only: bool = False):
    """快捷方式：获取数据库会话"""
    return get_database_manager().get_session(db_name, read_only)

def get_redis_client(db_name: str = None) -> redis.Redis:
    """快捷方式：获取Redis客户端"""
    return get_database_manager().get_redis_client(db_name)

def get_influxdb_client(db_name: str = None):
    """快捷方式：获取InfluxDB客户端"""
    return get_database_manager().get_influxdb_client(db_name)


if __name__ == "__main__":
    # 测试数据库管理器
    with DatabaseManager() as db_manager:
        print("=== 数据库管理器测试 ===")
        
        # 列出所有数据库
        print("\n所有数据库:")
        for db_name in db_manager.list_databases():
            info = db_manager.get_database_info(db_name)
            print(f"  {db_name}: {info.name} ({info.type.value}, {info.role.value})")
        
        # 健康检查
        print("\n健康检查:")
        health_status = db_manager.health_check()
        for db_name, status in health_status.items():
            print(f"  {db_name}: {'✅ 正常' if status else '❌ 异常'}")
        
        # 连接状态
        print("\n连接状态:")
        connection_status = db_manager.get_connection_status()
        for db_name, status in connection_status.items():
            print(f"  {db_name}: {status}")