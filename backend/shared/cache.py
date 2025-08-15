#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
缓存管理器
提供多级缓存支持，包括内存缓存和Redis缓存
"""

import json
import time
import logging
from typing import Any, Optional, Dict, Union
from datetime import datetime, timedelta
from threading import Lock
from dataclasses import dataclass
from functools import lru_cache, wraps
from typing import Callable

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

logger = logging.getLogger(__name__)

@dataclass
class CacheItem:
    """缓存项"""
    value: Any
    expires_at: float
    created_at: float
    hit_count: int = 0
    
    def is_expired(self) -> bool:
        """检查是否过期"""
        return time.time() > self.expires_at
    
    def hit(self):
        """记录命中"""
        self.hit_count += 1


class MemoryCache:
    """内存缓存"""
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        """初始化内存缓存
        
        Args:
            max_size: 最大缓存项数量
            default_ttl: 默认TTL（秒）
        """
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: Dict[str, CacheItem] = {}
        self._lock = Lock()
        self._stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'deletes': 0,
            'evictions': 0
        }
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        with self._lock:
            if key not in self._cache:
                self._stats['misses'] += 1
                return None
            
            item = self._cache[key]
            
            # 检查是否过期
            if item.is_expired():
                del self._cache[key]
                self._stats['misses'] += 1
                return None
            
            # 记录命中
            item.hit()
            self._stats['hits'] += 1
            return item.value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """设置缓存值"""
        with self._lock:
            ttl = ttl or self.default_ttl
            expires_at = time.time() + ttl
            
            # 如果缓存已满，执行LRU淘汰
            if len(self._cache) >= self.max_size and key not in self._cache:
                self._evict_lru()
            
            self._cache[key] = CacheItem(
                value=value,
                expires_at=expires_at,
                created_at=time.time()
            )
            
            self._stats['sets'] += 1
            return True
    
    def delete(self, key: str) -> bool:
        """删除缓存项"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                self._stats['deletes'] += 1
                return True
            return False
    
    def clear(self):
        """清空缓存"""
        with self._lock:
            self._cache.clear()
    
    def cleanup_expired(self) -> int:
        """清理过期项"""
        with self._lock:
            expired_keys = []
            current_time = time.time()
            
            for key, item in self._cache.items():
                if current_time > item.expires_at:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self._cache[key]
            
            return len(expired_keys)
    
    def _evict_lru(self):
        """LRU淘汰策略"""
        if not self._cache:
            return
        
        # 找到最少使用的项
        lru_key = min(self._cache.keys(), 
                     key=lambda k: (self._cache[k].hit_count, self._cache[k].created_at))
        
        del self._cache[lru_key]
        self._stats['evictions'] += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        with self._lock:
            total_requests = self._stats['hits'] + self._stats['misses']
            hit_rate = self._stats['hits'] / total_requests if total_requests > 0 else 0
            
            return {
                **self._stats,
                'size': len(self._cache),
                'max_size': self.max_size,
                'hit_rate': hit_rate,
                'memory_usage': sum(len(str(item.value)) for item in self._cache.values())
            }


class CacheManager:
    """缓存管理器 - 支持多级缓存"""
    
    def __init__(self, 
                 use_memory: bool = True,
                 use_redis: bool = False,
                 memory_config: Optional[Dict] = None,
                 redis_config: Optional[Dict] = None):
        """初始化缓存管理器
        
        Args:
            use_memory: 是否使用内存缓存
            use_redis: 是否使用Redis缓存
            memory_config: 内存缓存配置
            redis_config: Redis缓存配置
        """
        self.use_memory = use_memory
        self.use_redis = use_redis
        
        # 初始化内存缓存
        if use_memory:
            memory_config = memory_config or {}
            self.memory_cache = MemoryCache(**memory_config)
        else:
            self.memory_cache = None
        
        # 保持Redis缓存的兼容性
        self.redis_cache = None
        self.redis_client = None  # 确保属性始终存在
        
        if use_redis and REDIS_AVAILABLE:
            try:
                redis_config = redis_config or {}
                host = redis_config.get('host', 'localhost')
                port = redis_config.get('port', 6379)
                db = redis_config.get('db', 0)
                
                self.redis_client = redis.Redis(
                    host=host,
                    port=port,
                    db=db,
                    decode_responses=True
                )
                # 测试连接
                self.redis_client.ping()
                logger.info(f"Redis缓存初始化成功: {host}:{port}/{db}")
            except Exception as e:
                logger.warning(f"Redis缓存初始化失败，将禁用Redis缓存: {e}")
                self.redis_client = None
                self.use_redis = False
        else:
            self.redis_client = None
        
        logger.info(f"缓存管理器初始化完成 - 内存缓存: {use_memory}, Redis缓存: {self.use_redis}")
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存值（多级缓存）"""
        # 先尝试内存缓存
        if self.memory_cache:
            value = self.memory_cache.get(key)
            if value is not None:
                return value
        
        # 再尝试Redis缓存（保持兼容性）
        if self.redis_client:
            try:
                value = self.redis_client.get(key)
                if value is not None:
                    try:
                        value = json.loads(value)
                    except json.JSONDecodeError:
                        pass
                    
                    # 回写到内存缓存
                    if self.memory_cache:
                        self.memory_cache.set(key, value, ttl=300)
                    return value
            except Exception as e:
                logger.error(f"Redis获取缓存失败: {e}")
        
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """设置缓存值（多级缓存）"""
        success = True
        
        # 设置内存缓存
        if self.memory_cache:
            memory_ttl = min(ttl or 300, 300) if ttl else 300
            success &= self.memory_cache.set(key, value, memory_ttl)
        
        # 设置Redis缓存（保持兼容性）
        if self.redis_client:
            try:
                ttl = ttl or 3600
                if isinstance(value, (dict, list, tuple)):
                    serialized_value = json.dumps(value, ensure_ascii=False)
                else:
                    serialized_value = str(value)
                
                success &= bool(self.redis_client.setex(key, ttl, serialized_value))
            except Exception as e:
                logger.error(f"Redis设置缓存失败: {e}")
                success = False
        
        return success
    
    def delete(self, key: str) -> bool:
        """删除缓存项"""
        success = True
        
        if self.memory_cache:
            success &= self.memory_cache.delete(key)
        
        if self.redis_client:
            try:
                success &= bool(self.redis_client.delete(key))
            except Exception as e:
                logger.error(f"Redis删除缓存失败: {e}")
                success = False
        
        return success
    
    def clear(self):
        """清空缓存"""
        if self.memory_cache:
            self.memory_cache.clear()
        
        if self.redis_client:
            try:
                self.redis_client.flushdb()
            except Exception as e:
                logger.error(f"Redis清空缓存失败: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        stats = {
            'memory_enabled': self.use_memory,
            'redis_enabled': self.use_redis
        }
        
        if self.memory_cache:
            stats['memory'] = self.memory_cache.get_stats()
        
        if self.redis_client:
            try:
                info = self.redis_client.info()
                stats['redis'] = {
                    'connected_clients': info.get('connected_clients', 0),
                    'used_memory': info.get('used_memory', 0),
                    'keyspace_hits': info.get('keyspace_hits', 0),
                    'keyspace_misses': info.get('keyspace_misses', 0)
                }
            except Exception as e:
                logger.error(f"获取Redis统计信息失败: {e}")
                stats['redis'] = {}
        
        return stats


# 保持向后兼容性
class MultiLevelCache(CacheManager):
    """多级缓存实现（向后兼容）"""
    
    def __init__(self, redis_host: str = 'localhost', redis_port: int = 6379):
        redis_config = {'host': redis_host, 'port': redis_port}
        super().__init__(use_memory=True, use_redis=True, redis_config=redis_config)
        
        # 兼容旧接口
        self.local_cache = {}
        self.cache_stats = {
            'local_hits': 0,
            'redis_hits': 0,
            'misses': 0
        }
    
    def get_from_local_cache(self, key: str) -> Optional[Any]:
        """从本地缓存获取数据"""
        if key in self.local_cache:
            data, expiry = self.local_cache[key]
            if expiry > time.time():
                self.cache_stats['local_hits'] += 1
                return data
            else:
                del self.local_cache[key]
        return None
    
    def set_local_cache(self, key: str, data: Any, ttl: int = 300):
        """设置本地缓存"""
        expiry = time.time() + ttl
        self.local_cache[key] = (data, expiry)
        
        # 清理过期缓存
        self._cleanup_local_cache()
    
    def _cleanup_local_cache(self):
        """清理过期的本地缓存"""
        current_time = time.time()
        expired_keys = [
            key for key, (_, expiry) in self.local_cache.items()
            if expiry <= current_time
        ]
        for key in expired_keys:
            del self.local_cache[key]
    
    def get_from_redis_cache(self, key: str) -> Optional[Any]:
        """从Redis缓存获取数据"""
        try:
            data = self.redis_client.get(key)
            if data:
                self.cache_stats['redis_hits'] += 1
                return json.loads(data)
        except Exception as e:
            logger.error(f"Redis cache error: {e}")
        return None
    
    def set_redis_cache(self, key: str, data: Any, ttl: int = 3600):
        """设置Redis缓存"""
        try:
            self.redis_client.setex(key, ttl, json.dumps(data))
        except Exception as e:
            logger.error(f"Redis cache set error: {e}")
    
    def get_data(self, key: str, fetch_func: Callable, 
                 local_ttl: int = 300, redis_ttl: int = 3600) -> Any:
        """多级缓存获取数据"""
        # 1. 检查本地缓存
        data = self.get_from_local_cache(key)
        if data:
            return data
        
        # 2. 检查Redis缓存
        data = self.get_from_redis_cache(key)
        if data:
            self.set_local_cache(key, data, local_ttl)
            return data
        
        # 3. 从数据源获取
        try:
            data = fetch_func()
            if data is not None:
                self.set_redis_cache(key, data, redis_ttl)
                self.set_local_cache(key, data, local_ttl)
                return data
        except Exception as e:
            logger.error(f"Fetch data error: {e}")
        
        self.cache_stats['misses'] += 1
        return None
    
    def invalidate_cache(self, key: str):
        """清除缓存"""
        # 清除本地缓存
        if key in self.local_cache:
            del self.local_cache[key]
        
        # 清除Redis缓存
        try:
            self.redis_client.delete(key)
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
    
    def get_cache_stats(self) -> dict:
        """获取缓存统计信息"""
        total_requests = (
            self.cache_stats['local_hits'] + 
            self.cache_stats['redis_hits'] + 
            self.cache_stats['misses']
        )
        
        if total_requests == 0:
            return self.cache_stats
        
        return {
            **self.cache_stats,
            'local_hit_rate': self.cache_stats['local_hits'] / total_requests,
            'redis_hit_rate': self.cache_stats['redis_hits'] / total_requests,
            'miss_rate': self.cache_stats['misses'] / total_requests,
            'total_requests': total_requests
        }

class CacheDecorator:
    """缓存装饰器"""
    
    def __init__(self, cache_service: MultiLevelCache, ttl: int = 3600):
        self.cache_service = cache_service
        self.ttl = ttl
    
    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存键
            cache_key = f"{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
            
            # 尝试从缓存获取
            cached_result = self.cache_service.get_from_local_cache(cache_key)
            if cached_result is not None:
                return cached_result
            
            cached_result = self.cache_service.get_from_redis_cache(cache_key)
            if cached_result is not None:
                self.cache_service.set_local_cache(cache_key, cached_result, 300)
                return cached_result
            
            # 执行函数并缓存结果
            result = func(*args, **kwargs)
            if result is not None:
                self.cache_service.set_redis_cache(cache_key, result, self.ttl)
                self.cache_service.set_local_cache(cache_key, result, 300)
            
            return result
        
        return wrapper

class CacheWarmup:
    """缓存预热"""
    
    def __init__(self, cache_service: MultiLevelCache):
        self.cache_service = cache_service
    
    def warmup_popular_stocks(self):
        """预热热门股票数据"""
        popular_stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META']
        
        for symbol in popular_stocks:
            cache_key = f"stock_data_{symbol}"
            if not self.cache_service.get_from_redis_cache(cache_key):
                # 这里应该调用实际的股票数据获取函数
                logger.info(f"Warming up cache for {symbol}")
    
    def warmup_strategy_templates(self):
        """预热策略模板"""
        templates = [
            {"id": "ma_cross", "name": "双均线策略", "description": "简单移动平均线交叉策略"},
            {"id": "rsi_strategy", "name": "RSI策略", "description": "相对强弱指数策略"},
            {"id": "macd_strategy", "name": "MACD策略", "description": "MACD指标策略"}
        ]
        
        for template in templates:
            cache_key = f"template_{template['id']}"
            self.cache_service.set_redis_cache(cache_key, template, 86400)
    
    def warmup_market_data(self):
        """预热市场数据"""
        market_indicators = ['SPY', 'QQQ', 'IWM', 'GLD', 'TLT']
        
        for indicator in market_indicators:
            cache_key = f"market_data_{indicator}"
            if not self.cache_service.get_from_redis_cache(cache_key):
                logger.info(f"Warming up market data for {indicator}")

# 全局缓存实例
cache_service = MultiLevelCache()

def cached(ttl: int = 3600):
    """缓存装饰器"""
    return CacheDecorator(cache_service, ttl)