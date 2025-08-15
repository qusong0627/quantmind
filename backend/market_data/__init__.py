#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大盘数据服务包
提供大盘指数数据服务

主要功能:
- 实时获取大盘指数数据
- 提供市场概览信息
- 支持多个主要指数查询
- RESTful API接口

使用示例:
    # 直接使用服务
    from market_data import MarketDataService
    
    service = MarketDataService()
    data = await service.get_realtime_market_data()
    
    # 启动Flask应用
    from market_data import create_app
    
    app = create_app()
    app.run()
"""

__version__ = '1.0.0'
__author__ = 'QuantMind Team'
__description__ = '大盘指数数据服务'

# 导入主要类和函数
from .app import create_app
from .models import (
    IndexData, MarketOverview, MarketDataRequest, MarketDataResponse,
    MarketType, TrendStatus
)
from .config import get_config, Config

# 导出的公共接口
__all__ = [
    # 应用
    'create_app',
    
    # 数据模型
    'IndexData',
    'MarketOverview', 
    'MarketDataRequest',
    'MarketDataResponse',
    'MarketType',
    'TrendStatus',
    
    # 配置
    'get_config',
    'Config',
    
    # 版本信息
    '__version__',
    '__author__',
    '__description__'
]