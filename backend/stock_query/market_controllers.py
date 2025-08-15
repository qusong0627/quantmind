#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
市场数据API控制器
提供大盘指数和市场概览接口
"""

import logging
from datetime import datetime
from typing import List, Dict, Optional, Any
from flask import Blueprint, request, jsonify
from marshmallow import Schema, fields, ValidationError, validate

from .services import StockQueryService
from .models import MarketType, QueryResponse

# 添加项目根目录到Python路径
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from ..shared.cache import CacheManager
from config.ifind_token_manager import IFindTokenManager

logger = logging.getLogger(__name__)

# 创建蓝图
market_bp = Blueprint('market', __name__, url_prefix='/api/v1/market')

# 全局服务实例
_query_service = None


def get_query_service() -> StockQueryService:
    """获取股票查询服务实例"""
    global _query_service
    if _query_service is None:
        token_manager = IFindTokenManager()
        cache_manager = CacheManager()
        _query_service = StockQueryService(token_manager, cache_manager)
    return _query_service


# 请求验证Schema
class IndicesRequestSchema(Schema):
    """指数查询请求验证"""
    symbols = fields.Str(load_default=None, validate=validate.Length(min=1, max=200))


def handle_validation_error(error: ValidationError):
    """处理验证错误"""
    return jsonify({
        'success': False,
        'message': '请求参数验证失败',
        'errors': error.messages
    }), 400


def handle_service_error(error: Exception):
    """处理服务错误"""
    logger.error(f"服务错误: {str(error)}", exc_info=True)
    return jsonify({
        'success': False,
        'message': f'服务错误: {str(error)}'
    }), 500


@market_bp.route('/indices', methods=['GET'])
def get_indices():
    """获取大盘指数数据
    
    GET /api/v1/market/indices?symbols=000001.SH,399001.SZ
    """
    try:
        # 获取请求参数
        symbols = request.args.get('symbols')
        
        # 验证请求参数
        schema = IndicesRequestSchema()
        try:
            validated_data = schema.load({'symbols': symbols})
        except ValidationError as e:
            return handle_validation_error(e)
        
        # 默认大盘指数代码
        if not symbols:
            symbols = '000001.SH,399001.SZ,399006.SZ'  # 上证指数、深证成指、创业板指
        
        # 解析股票代码列表并转换格式
        raw_symbols = [s.strip() for s in symbols.split(',') if s.strip()]
        
        if not raw_symbols:
            return jsonify({
                'success': False,
                'message': '请提供有效的指数代码'
            }), 400
        
        # 转换数据格式到标准格式
        symbol_list = []
        for symbol in raw_symbols:
            if symbol.startswith('sh'):
                # sh000001 -> 000001.SH
                symbol_list.append(symbol[2:] + '.SH')
            elif symbol.startswith('sz'):
                # sz399001 -> 399001.SZ
                symbol_list.append(symbol[2:] + '.SZ')
            else:
                # 已经是标准格式或其他格式，直接使用
                symbol_list.append(symbol)
        
        # 获取指数数据
        query_service = get_query_service()
        
        # 构建实时查询请求
        from .models import RealtimeQueryRequest
        realtime_request = RealtimeQueryRequest(
            codes=symbol_list,
            indicators=['latest', 'chg', 'chg_pct', 'volume', 'amount', 'open', 'high', 'low']
        )
        
        result = query_service.get_realtime_quotes(realtime_request)
        
        # 格式化返回数据
        if result.success and result.data:
            formatted_data = []
            for item in result.data:
                formatted_item = {
                    'symbol': item.get('code', ''),
                    'name': item.get('name', ''),
                    'current': item.get('latest', 0),
                    'change': item.get('chg', 0),
                    'change_percent': item.get('chg_pct', 0),
                    'volume': item.get('volume', 0),
                    'amount': item.get('amount', 0),
                    'open': item.get('open', 0),
                    'high': item.get('high', 0),
                    'low': item.get('low', 0),
                    'timestamp': datetime.now().isoformat()
                }
                formatted_data.append(formatted_item)
            
            return jsonify({
                'success': True,
                'message': '获取指数数据成功',
                'data': formatted_data,
                'total': len(formatted_data)
            })
        else:
            return jsonify({
                'success': False,
                'message': result.message or '获取指数数据失败',
                'data': []
            })
        
    except Exception as e:
        return handle_service_error(e)


@market_bp.route('/overview', methods=['GET'])
def get_market_overview():
    """获取市场概览数据
    
    GET /api/v1/market/overview
    """
    try:
        # 获取主要指数数据
        major_indices = [
            '000001.SH',  # 上证指数
            '399001.SZ',  # 深证成指
            '399006.SZ',  # 创业板指
            '000300.SH',  # 沪深300
            '000016.SH',  # 上证50
            '399905.SZ'   # 中证500
        ]
        
        query_service = get_query_service()
        
        # 构建实时查询请求
        from .models import RealtimeQueryRequest
        realtime_request = RealtimeQueryRequest(
            codes=major_indices,
            indicators=['latest', 'chg', 'chg_pct', 'volume', 'amount', 'open', 'high', 'low']
        )
        
        result = query_service.get_realtime_quotes(realtime_request)
        
        # 格式化市场概览数据
        if result.success and result.data:
            market_data = {
                'timestamp': datetime.now().isoformat(),
                'indices': [],
                'market_summary': {
                    'total_volume': 0,
                    'total_amount': 0,
                    'up_count': 0,
                    'down_count': 0,
                    'unchanged_count': 0
                }
            }
            
            total_volume = 0
            total_amount = 0
            up_count = 0
            down_count = 0
            unchanged_count = 0
            
            for item in result.data:
                change_pct = item.get('chg_pct', 0) or 0
                volume = item.get('volume', 0) or 0
                amount = item.get('amount', 0) or 0
                
                # 统计涨跌情况
                if change_pct > 0:
                    up_count += 1
                elif change_pct < 0:
                    down_count += 1
                else:
                    unchanged_count += 1
                
                # 累计成交量和成交额
                total_volume += volume
                total_amount += amount
                
                # 格式化指数数据
                index_data = {
                    'symbol': item.get('code', ''),
                    'name': item.get('name', ''),
                    'current': item.get('latest', 0),
                    'change': item.get('chg', 0),
                    'change_percent': change_pct,
                    'volume': volume,
                    'amount': amount,
                    'open': item.get('open', 0),
                    'high': item.get('high', 0),
                    'low': item.get('low', 0)
                }
                market_data['indices'].append(index_data)
            
            # 更新市场汇总数据
            market_data['market_summary'].update({
                'total_volume': total_volume,
                'total_amount': total_amount,
                'up_count': up_count,
                'down_count': down_count,
                'unchanged_count': unchanged_count
            })
            
            return jsonify({
                'success': True,
                'message': '获取市场概览成功',
                'data': market_data
            })
        else:
            return jsonify({
                'success': False,
                'message': result.message or '获取市场概览失败',
                'data': None
            })
        
    except Exception as e:
        return handle_service_error(e)


# 错误处理
@market_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': '接口不存在'
    }), 404


@market_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'success': False,
        'message': '请求方法不允许'
    }), 405


@market_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': '服务器内部错误'
    }), 500