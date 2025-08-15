"""日志配置模块"""

import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Optional

from .config import config

def setup_logger(name: str, level: Optional[str] = None) -> logging.Logger:
    """设置日志记录器
    
    Args:
        name: 日志记录器名称
        level: 日志级别，如果不指定则使用配置文件中的级别
    
    Returns:
        配置好的日志记录器
    """
    logger = logging.getLogger(name)
    
    # 如果已经配置过，直接返回
    if logger.handlers:
        return logger
    
    # 获取日志配置
    log_config = config.get_logging_config()
    log_level = level or log_config.get('level', 'INFO')
    log_format = log_config.get('format', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    log_file = log_config.get('file')
    max_file_size = log_config.get('max_file_size', '10MB')
    backup_count = log_config.get('backup_count', 5)
    
    # 设置日志级别
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # 创建格式化器
    formatter = logging.Formatter(log_format)
    
    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # 文件处理器（如果配置了文件路径）
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 解析文件大小
        max_bytes = _parse_file_size(max_file_size)
        
        file_handler = logging.handlers.RotatingFileHandler(
            log_path,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger

def _parse_file_size(size_str: str) -> int:
    """解析文件大小字符串
    
    Args:
        size_str: 大小字符串，如 '10MB', '1GB'
    
    Returns:
        字节数
    """
    size_str = size_str.upper().strip()
    
    if size_str.endswith('KB'):
        return int(size_str[:-2]) * 1024
    elif size_str.endswith('MB'):
        return int(size_str[:-2]) * 1024 * 1024
    elif size_str.endswith('GB'):
        return int(size_str[:-2]) * 1024 * 1024 * 1024
    else:
        # 默认为字节
        return int(size_str)

def get_logger(name: str) -> logging.Logger:
    """获取日志记录器的便捷函数
    
    Args:
        name: 日志记录器名称
    
    Returns:
        日志记录器
    """
    return setup_logger(name)

# 创建默认日志记录器
default_logger = setup_logger('ai_strategy')

class LoggerMixin:
    """日志记录器混入类"""
    
    @property
    def logger(self) -> logging.Logger:
        """获取当前类的日志记录器"""
        if not hasattr(self, '_logger'):
            self._logger = get_logger(self.__class__.__name__)
        return self._logger

def log_execution_time(func):
    """记录函数执行时间的装饰器"""
    import time
    import functools
    
    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        start_time = time.time()
        logger = get_logger(func.__module__)
        
        try:
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.info(f"{func.__name__} 执行完成，耗时: {execution_time:.2f}秒")
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"{func.__name__} 执行失败，耗时: {execution_time:.2f}秒，错误: {e}")
            raise
    
    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        start_time = time.time()
        logger = get_logger(func.__module__)
        
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.info(f"{func.__name__} 执行完成，耗时: {execution_time:.2f}秒")
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"{func.__name__} 执行失败，耗时: {execution_time:.2f}秒，错误: {e}")
            raise
    
    # 检查是否为异步函数
    import asyncio
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper