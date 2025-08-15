#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
股票查询API控制器
提供RESTful API接口
"""

import logging
from datetime import datetime, date
from typing import List, Dict, Optional, Any
from flask import Blueprint, request, jsonify, current_app
from marshmallow import Schema, fields, ValidationError, validate

from .services import StockQueryService, StockSearchService
from .models import (
    MarketType, DataFrequency, AdjustType,
    SearchRequest, RealtimeQueryRequest, HistoricalQueryRequest,
    TechnicalIndicatorRequest, QueryResponse
)
# 添加项目根目录到Python路径
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from ..shared.cache import CacheManager
from config.ifind_token_manager import IFindTokenManager

logger = logging.getLogger(__name__)

# 创建蓝图
stock_query_bp = Blueprint('stock_query', __name__, url_prefix='/api/v1/stocks')

# 全局服务实例
_query_service = None
_search_service = None


def get_query_service() -> StockQueryService:
    """获取股票查询服务实例"""
    global _query_service
    if _query_service is None:
        token_manager = IFindTokenManager()
        cache_manager = CacheManager()
        _query_service = StockQueryService(token_manager, cache_manager)
    return _query_service


def get_search_service() -> StockSearchService:
    """获取股票搜索服务实例"""
    global _search_service
    if _search_service is None:
        _search_service = StockSearchService(get_query_service())
    return _search_service


# 请求验证Schema
class SearchRequestSchema(Schema):
    """搜索请求验证"""
    keyword = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    search_type = fields.Str(load_default='all', validate=validate.OneOf(['code', 'name', 'all', 'industry']))
    market = fields.Str(load_default=None, validate=validate.OneOf(['A', 'HK', 'US']))
    limit = fields.Int(load_default=20, validate=validate.Range(min=1, max=100))


class RealtimeQuerySchema(Schema):
    """实时行情查询验证"""
    codes = fields.List(fields.Str(), required=True, validate=validate.Length(min=1, max=50))
    indicators = fields.List(fields.Str(), load_default=['latest', 'open', 'high', 'low', 'volume', 'amount', 'chg', 'chg_pct'])


class HistoricalQuerySchema(Schema):
    """历史数据查询验证"""
    codes = fields.List(fields.Str(), required=True, validate=validate.Length(min=1, max=20))
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    frequency = fields.Str(load_default='daily', validate=validate.OneOf(['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly']))
    adjust_type = fields.Str(load_default='none', validate=validate.OneOf(['none', 'forward', 'backward']))
    indicators = fields.List(fields.Str(), load_default=['open', 'high', 'low', 'close', 'volume', 'amount'])


# 频率映射函数
def map_frequency_to_enum(frequency_str: str) -> DataFrequency:
    """将API频率字符串映射到DataFrequency枚举"""
    frequency_mapping = {
        '1min': DataFrequency.MINUTE_1,
        '5min': DataFrequency.MINUTE_5,
        '15min': DataFrequency.MINUTE_15,
        '30min': DataFrequency.MINUTE_30,
        '60min': DataFrequency.HOUR_1,
        'daily': DataFrequency.DAILY,
        'weekly': DataFrequency.WEEKLY,
        'monthly': DataFrequency.MONTHLY
    }
    return frequency_mapping.get(frequency_str, DataFrequency.DAILY)


# 复权类型映射函数
def map_adjust_type_to_enum(adjust_type_str: str) -> AdjustType:
    """将API复权类型字符串映射到AdjustType枚举"""
    adjust_mapping = {
        'none': AdjustType.NONE,
        'forward': AdjustType.FORWARD,
        'backward': AdjustType.BACKWARD
    }
    return adjust_mapping.get(adjust_type_str, AdjustType.NONE)


class TechnicalIndicatorSchema(Schema):
    """技术指标查询验证"""
    codes = fields.List(fields.Str(), required=True, validate=validate.Length(min=1, max=20))
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    frequency = fields.Str(load_default='daily', validate=validate.OneOf(['daily', 'weekly', 'monthly']))
    indicators = fields.List(fields.Str(), required=True, validate=validate.Length(min=1))


def handle_validation_error(error: ValidationError):
    """处理验证错误"""
    return jsonify({
        'success': False,
        'message': '请求参数验证失败',
        'errors': error.messages
    }), 400


def handle_service_error(error: Exception):
    """处理服务错误"""
    logger.error(f"服务错误: {error}")
    return jsonify({
        'success': False,
        'message': '服务内部错误',
        'error': str(error)
    }), 500


@stock_query_bp.route('/search', methods=['GET', 'POST'])
def search_stocks():
    """搜索股票
    
    GET /api/v1/stocks/search?keyword=平安&search_type=name&limit=10
    POST /api/v1/stocks/search
    {
        "keyword": "平安",
        "search_type": "name",
        "limit": 10
    }
    """
    try:
        # 获取请求参数
        if request.method == 'GET':
            data = request.args.to_dict()
            # 处理数组参数
            if 'limit' in data:
                data['limit'] = int(data['limit'])
        else:
            data = request.get_json() or {}
        
        # 验证请求参数
        schema = SearchRequestSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as e:
            return handle_validation_error(e)
        
        # 创建搜索请求
        search_request = SearchRequest(
            keyword=validated_data['keyword'],
            search_type=validated_data['search_type'],
            market=MarketType(validated_data['market']) if validated_data['market'] else None,
            limit=validated_data['limit']
        )
        
        # 执行搜索
        search_service = get_search_service()
        result = search_service.query_service.search_stocks(search_request)
        
        return jsonify(result.to_dict())
        
    except Exception as e:
        return handle_service_error(e)


@stock_query_bp.route('/info/<code>', methods=['GET'])
def get_stock_info(code: str):
    """获取股票基础信息
    
    GET /api/v1/stocks/info/000001.SZ
    """
    try:
        query_service = get_query_service()
        result = query_service.get_stock_info(code)
        
        return jsonify(result.to_dict())
        
    except Exception as e:
        return handle_service_error(e)


@stock_query_bp.route('/realtime', methods=['POST'])
def get_realtime_quotes():
    """获取实时行情
    
    POST /api/v1/stocks/realtime
    {
        "codes": ["000001.SZ", "000002.SZ"],
        "indicators": ["latest", "open", "high", "low", "volume"]
    }
    """
    try:
        data = request.get_json() or {}
        
        # 验证请求参数
        schema = RealtimeQuerySchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as e:
            return handle_validation_error(e)
        
        # 创建查询请求
        query_request = RealtimeQueryRequest(
            codes=validated_data['codes'],
            indicators=validated_data['indicators']
        )
        
        # 执行查询
        query_service = get_query_service()
        result = query_service.get_realtime_quotes(query_request)
        
        return jsonify(result.to_dict())
        
    except Exception as e:
        return handle_service_error(e)


@stock_query_bp.route('/historical', methods=['POST'])
def get_historical_data():
    """获取历史数据
    
    POST /api/v1/stocks/historical
    {
        "codes": ["000001.SZ"],
        "start_date": "2024-01-01",
        "end_date": "2024-01-31",
        "frequency": "daily",
        "adjust_type": "forward",
        "indicators": ["open", "high", "low", "close", "volume"]
    }
    """
    try:
        data = request.get_json() or {}
        
        # 验证请求参数
        schema = HistoricalQuerySchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as e:
            return handle_validation_error(e)
        
        # 创建查询请求
        query_request = HistoricalQueryRequest(
            codes=validated_data['codes'],
            start_date=validated_data['start_date'],
            end_date=validated_data['end_date'],
            frequency=map_frequency_to_enum(validated_data['frequency']),
            adjust_type=map_adjust_type_to_enum(validated_data['adjust_type']),
            indicators=validated_data['indicators']
        )
        
        # 执行查询
        query_service = get_query_service()
        result = query_service.get_historical_data(query_request)
        
        return jsonify(result.to_dict())
        
    except Exception as e:
        return handle_service_error(e)


@stock_query_bp.route('/indicators', methods=['POST'])
def get_technical_indicators():
    """获取技术指标
    
    POST /api/v1/stocks/indicators
    {
        "codes": ["000001.SZ"],
        "start_date": "2024-01-01",
        "end_date": "2024-01-31",
        "frequency": "daily",
        "indicators": ["ma5", "ma10", "ma20", "rsi", "macd"]
    }
    """
    try:
        data = request.get_json() or {}
        
        # 验证请求参数
        schema = TechnicalIndicatorSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as e:
            return handle_validation_error(e)
        
        # 创建查询请求
        query_request = TechnicalIndicatorRequest(
            codes=validated_data['codes'],
            start_date=validated_data['start_date'],
            end_date=validated_data['end_date'],
            frequency=map_frequency_to_enum(validated_data['frequency']),
            indicators=validated_data['indicators']
        )
        
        # 执行查询
        query_service = get_query_service()
        result = query_service.get_technical_indicators(query_request)
        
        return jsonify(result.to_dict())
        
    except Exception as e:
        return handle_service_error(e)


@stock_query_bp.route('/hot', methods=['GET'])
def get_hot_stocks():
    """获取热门股票
    
    GET /api/v1/stocks/hot?market=A&limit=20
    """
    try:
        # 获取请求参数
        market_str = request.args.get('market')
        limit = int(request.args.get('limit', 20))
        
        # 验证参数
        if limit < 1 or limit > 100:
            return jsonify({
                'success': False,
                'message': 'limit参数必须在1-100之间'
            }), 400
        
        market = MarketType(market_str) if market_str else None
        
        # 执行查询
        query_service = get_query_service()
        result = query_service.get_hot_stocks(market, limit)
        
        return jsonify(result.to_dict())
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': f'参数错误: {str(e)}'
        }), 400
    except Exception as e:
        return handle_service_error(e)


@stock_query_bp.route('/quick-search/<keyword>', methods=['GET'])
def quick_search(keyword: str):
    """快速搜索（按代码或名称）
    
    GET /api/v1/stocks/quick-search/平安银行
    GET /api/v1/stocks/quick-search/000001
    """
    try:
        search_service = get_search_service()
        
        # 判断是代码搜索还是名称搜索
        if keyword.isdigit() or '.' in keyword:
            result = search_service.search_by_code(keyword)
        else:
            result = search_service.search_by_name(keyword, limit=10)
        
        return jsonify(result.to_dict())
        
    except Exception as e:
        return handle_service_error(e)


@stock_query_bp.route('/batch-info', methods=['POST'])
def get_batch_stock_info():
    """批量获取股票基础信息
    
    POST /api/v1/stocks/batch-info
    {
        "codes": ["000001.SZ", "000002.SZ", "600000.SH"]
    }
    """
    try:
        data = request.get_json() or {}
        codes = data.get('codes', [])
        
        if not codes or len(codes) > 50:
            return jsonify({
                'success': False,
                'message': 'codes参数必须提供且不超过50个股票代码'
            }), 400
        
        # 批量查询股票信息
        query_service = get_query_service()
        results = []
        
        for code in codes:
            result = query_service.get_stock_info(code)
            if result.success and result.data:
                results.append(result.data)
        
        return jsonify({
            'success': True,
            'message': f'成功获取{len(results)}只股票信息',
            'data': results,
            'total': len(results)
        })
        
    except Exception as e:
        return handle_service_error(e)


@stock_query_bp.route('/health', methods=['GET'])
def health_check():
    """健康检查
    
    GET /api/v1/stocks/health
    """
    try:
        query_service = get_query_service()
        
        # 检查服务状态
        health_status = {
            'service': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'cache_stats': query_service.cache_manager.get_stats() if query_service.cache_manager else None,
            'token_status': {
                'has_refresh_token': query_service.token_manager.has_refresh_token(),
                'has_access_token': query_service.token_manager.has_access_token(),
                'access_token_valid': query_service.token_manager.is_access_token_valid()
            }
        }
        
        return jsonify({
            'success': True,
            'message': '服务健康',
            'data': health_status
        })
        
    except Exception as e:
        return handle_service_error(e)


@stock_query_bp.route('/stats', methods=['GET'])
def get_service_stats():
    """获取服务统计信息
    
    GET /api/v1/stocks/stats
    """
    try:
        query_service = get_query_service()
        
        stats = {
            'timestamp': datetime.now().isoformat(),
            'cache_stats': query_service.cache_manager.get_stats() if query_service.cache_manager else None,
            'service_info': {
                'name': 'StockQueryService',
                'version': '1.0.0',
                'data_source': 'iFinD API'
            }
        }
        
        return jsonify({
            'success': True,
            'message': '获取统计信息成功',
            'data': stats
        })
        
    except Exception as e:
        return handle_service_error(e)


# 错误处理
@stock_query_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': '接口不存在'
    }), 404


@stock_query_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'success': False,
        'message': '请求方法不允许'
    }), 405


@stock_query_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': '服务器内部错误'
    }), 500