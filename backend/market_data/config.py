#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大盘数据服务配置文件
定义服务的各种配置选项
"""

import os
from typing import Dict, Any


class Config:
    """基础配置类"""
    
    # Flask配置
    SECRET_KEY = os.environ.get('SECRET_KEY', 'market-data-secret-key-2024')
    DEBUG = False
    TESTING = False
    JSON_AS_ASCII = False
    JSONIFY_PRETTYPRINT_REGULAR = True
    
    # 服务配置
    SERVICE_NAME = 'QuantMind Market Data Service'
    SERVICE_VERSION = '1.0.0'
    SERVICE_DESCRIPTION = '大盘指数数据服务'
    
    # 服务器配置
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5002))
    
    # API配置
    TENCENT_API_BASE_URL = 'https://qt.gtimg.cn/q='
    TENCENT_API_TIMEOUT = int(os.environ.get('TENCENT_API_TIMEOUT', 10))
    TENCENT_API_RETRY_COUNT = int(os.environ.get('TENCENT_API_RETRY_COUNT', 3))
    TENCENT_API_RETRY_DELAY = float(os.environ.get('TENCENT_API_RETRY_DELAY', 1.0))
    
    # 缓存配置
    CACHE_ENABLED = os.environ.get('CACHE_ENABLED', 'true').lower() == 'true'
    CACHE_TTL = int(os.environ.get('CACHE_TTL', 60))  # 缓存时间(秒)
    CACHE_MAX_SIZE = int(os.environ.get('CACHE_MAX_SIZE', 1000))  # 最大缓存条目数
    
    # 日志配置
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE', 'market_data.log')
    LOG_MAX_BYTES = int(os.environ.get('LOG_MAX_BYTES', 10 * 1024 * 1024))  # 10MB
    LOG_BACKUP_COUNT = int(os.environ.get('LOG_BACKUP_COUNT', 5))
    
    # CORS配置
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_HEADERS = ['Content-Type', 'Authorization']
    
    # 监控配置
    HEALTH_CHECK_ENABLED = True
    METRICS_ENABLED = os.environ.get('METRICS_ENABLED', 'false').lower() == 'true'
    
    # 限流配置
    RATE_LIMIT_ENABLED = os.environ.get('RATE_LIMIT_ENABLED', 'false').lower() == 'true'
    RATE_LIMIT_REQUESTS = int(os.environ.get('RATE_LIMIT_REQUESTS', 100))  # 每分钟请求数
    RATE_LIMIT_WINDOW = int(os.environ.get('RATE_LIMIT_WINDOW', 60))  # 时间窗口(秒)
    
    @classmethod
    def get_config_dict(cls) -> Dict[str, Any]:
        """获取配置字典
        
        Returns:
            Dict[str, Any]: 配置字典
        """
        config = {}
        for key in dir(cls):
            if not key.startswith('_') and not callable(getattr(cls, key)):
                config[key] = getattr(cls, key)
        return config


class DevelopmentConfig(Config):
    """开发环境配置"""
    
    DEBUG = True
    LOG_LEVEL = 'DEBUG'
    CACHE_TTL = 30  # 开发环境缓存时间更短
    TENCENT_API_TIMEOUT = 15  # 开发环境超时时间更长


class ProductionConfig(Config):
    """生产环境配置"""
    
    DEBUG = False
    LOG_LEVEL = 'INFO'
    CACHE_ENABLED = True
    RATE_LIMIT_ENABLED = True
    METRICS_ENABLED = True
    
    # 生产环境使用更严格的CORS设置
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')


class TestingConfig(Config):
    """测试环境配置"""
    
    TESTING = True
    DEBUG = True
    LOG_LEVEL = 'DEBUG'
    CACHE_ENABLED = False  # 测试时禁用缓存
    TENCENT_API_TIMEOUT = 5  # 测试环境超时时间更短


# 配置映射
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config(env: str = None) -> Config:
    """获取配置对象
    
    Args:
        env: 环境名称
        
    Returns:
        Config: 配置对象
    """
    if env is None:
        env = os.environ.get('FLASK_ENV', 'default')
    
    config_class = config_map.get(env, DevelopmentConfig)
    return config_class()


# 主要指数配置（从models.py移动到这里以便配置管理）
MAJOR_INDICES_CONFIG = {
    # 上海证券交易所
    'sh000001': {'name': '上证指数', 'market': 'SHANGHAI', 'type': 'index'},
    'sh000016': {'name': '上证50', 'market': 'SHANGHAI', 'type': 'index'},
    'sh000300': {'name': '沪深300', 'market': 'SHANGHAI', 'type': 'index'},
    'sh000688': {'name': '科创50', 'market': 'SHANGHAI', 'type': 'index'},
    
    # 深圳证券交易所
    'sz399001': {'name': '深证成指', 'market': 'SHENZHEN', 'type': 'index'},
    'sz399006': {'name': '创业板指', 'market': 'SHENZHEN', 'type': 'index'},
    'sz399905': {'name': '中证500', 'market': 'SHENZHEN', 'type': 'index'},
    'sz399102': {'name': '创业板综', 'market': 'SHENZHEN', 'type': 'index'},
    
    # 其他重要指数
    'sz399303': {'name': '国证2000', 'market': 'SHENZHEN', 'type': 'index'},
    'sz399324': {'name': '深证红利', 'market': 'SHENZHEN', 'type': 'index'}
}


# API端点配置
API_ENDPOINTS = {
    'health': '/api/v1/market/health',
    'indices': '/api/v1/market/indices',
    'overview': '/api/v1/market/overview',
    'single_index': '/api/v1/market/indices/<symbol>',
    'supported': '/api/v1/market/supported',
    'realtime': '/api/v1/market/realtime'
}


# 错误消息配置
ERROR_MESSAGES = {
    'API_TIMEOUT': 'API请求超时',
    'API_ERROR': 'API请求失败',
    'DATA_PARSE_ERROR': '数据解析失败',
    'SYMBOL_NOT_FOUND': '指数代码不存在',
    'SERVICE_UNAVAILABLE': '服务暂时不可用',
    'INTERNAL_ERROR': '内部服务器错误',
    'INVALID_REQUEST': '请求参数无效'
}


# 成功消息配置
SUCCESS_MESSAGES = {
    'DATA_RETRIEVED': '数据获取成功',
    'HEALTH_CHECK_OK': '健康检查通过',
    'SERVICE_READY': '服务就绪'
}