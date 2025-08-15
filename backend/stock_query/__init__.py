#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
股票查询模块
基于同花顺iFinD API的股票数据查询功能
"""

from .models import (
    StockInfo, RealtimeQuote, HistoricalQuote, TechnicalIndicator,
    SearchRequest, RealtimeQueryRequest, HistoricalQueryRequest,
    TechnicalIndicatorRequest, QueryResponse,
    MarketType, TradeStatus, AdjustType, DataFrequency
)
from .services import StockQueryService, StockSearchService
from .controllers import stock_query_bp

__version__ = '1.0.0'
__author__ = 'QuantMind Team'
__description__ = '基于同花顺iFinD API的股票查询模块'

__all__ = [
    # 数据模型
    'StockInfo',
    'RealtimeQuote', 
    'HistoricalQuote',
    'TechnicalIndicator',
    'SearchRequest',
    'RealtimeQueryRequest',
    'HistoricalQueryRequest', 
    'TechnicalIndicatorRequest',
    'QueryResponse',
    
    # 枚举类型
    'MarketType',
    'TradeStatus',
    'AdjustType',
    'DataFrequency',
    
    # 服务类
    'StockQueryService',
    'StockSearchService',
    
    # Flask蓝图
    'stock_query_bp'
]