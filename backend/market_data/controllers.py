#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大盘数据控制器
提供REST API接口访问大盘数据服务
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

from .models import MarketDataRequest
from .tencent_finance_service import MarketDataService

logger = logging.getLogger(__name__)

# 创建蓝图
market_data_bp = Blueprint('market_data', __name__, url_prefix='/api/v1/market')

# 全局服务实例
market_service = None


async def get_service():
    """获取服务实例"""
    global market_service
    if market_service is None:
        market_service = MarketDataService()
        await market_service.__aenter__()
    return market_service

@market_data_bp.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """健康检查接口
    
    Returns:
        JSON: 健康状态
    """
    try:
        async def _health_check():
            service = await get_service()
            return await service.health_check()
        
        # 运行异步健康检查
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_health_check())
        loop.close()
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@market_data_bp.route('/indices', methods=['GET'])
@cross_origin()
def get_indices():
    """获取指数数据接口
    
    Query Parameters:
        symbols: 指数代码列表，逗号分隔 (可选)
        include_major: 是否包含主要指数，默认true
        
    Returns:
        JSON: 指数数据响应
    """
    try:
        # 解析查询参数
        symbols_param = request.args.get('symbols', '')
        symbols = [s.strip() for s in symbols_param.split(',') if s.strip()] if symbols_param else None
        include_major = request.args.get('include_major', 'true').lower() == 'true'
        
        # 构建请求对象
        market_request = MarketDataRequest(
            symbols=symbols,
            include_major=include_major
        )
        
        async def _get_indices():
            service = await get_service()
            return await service.get_market_data({
                'symbols': symbols if symbols else ['sh000001', 'sz399001', 'sz399006', 'sh000300']
            })
        
        # 运行异步请求
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_get_indices())
        loop.close()
        
        return jsonify(result), 200 if result.get('success') else 500
        
    except Exception as e:
        logger.error(f"获取指数数据失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取指数数据失败: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500


@market_data_bp.route('/overview', methods=['GET'])
@cross_origin()
def get_market_overview():
    """获取市场概览接口
    
    Returns:
        JSON: 市场概览数据
    """
    try:
        async def _get_overview():
            service = await get_service()
            return await service.get_realtime_market_overview()
        
        # 运行异步请求
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_get_overview())
        loop.close()
        
        return jsonify(result), 200 if result.get('success') else 500
        
    except Exception as e:
        logger.error(f"获取市场概览失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取市场概览失败: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500


@market_data_bp.route('/indices/<symbol>', methods=['GET'])
@cross_origin()
def get_single_index(symbol: str):
    """获取单个指数数据接口
    
    Args:
        symbol: 指数代码
        
    Returns:
        JSON: 单个指数数据
    """
    try:
        async def _get_single_index():
            service = await get_service()
            return await service.get_market_data({
                'symbols': [symbol]
            })
        
        # 运行异步请求
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_get_single_index())
        loop.close()
        
        return jsonify(result), 200 if result.get('success') else 500
        
    except Exception as e:
        logger.error(f"获取单个指数数据失败 {symbol}: {e}")
        return jsonify({
            'success': False,
            'message': f'获取指数数据失败: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500


@market_data_bp.route('/supported', methods=['GET'])
@cross_origin()
def get_supported_indices():
    """获取支持的指数列表接口
    
    Returns:
        JSON: 支持的指数列表
    """
    try:
        async def _get_supported():
            service = await get_service()
            return service.tencent_service.get_supported_symbols()
        
        # 运行异步请求
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        supported = loop.run_until_complete(_get_supported())
        loop.close()
        
        return jsonify({
            'success': True,
            'message': '支持的指数列表获取成功',
            'data': supported,
            'count': len(supported),
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"获取支持的指数列表失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取支持的指数列表失败: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500


@market_data_bp.route('/realtime', methods=['GET'])
@cross_origin()
def get_realtime_data():
    """获取实时市场数据接口（兼容接口）
    
    Returns:
        JSON: 实时市场数据
    """
    try:
        response = asyncio.run(market_service.get_realtime_market_overview())
        
        # 构建响应
        result = {
            'success': response.success,
            'message': response.message,
            'timestamp': datetime.now().isoformat()
        }
        
        if response.data:
            result['indices'] = {
                symbol: data.to_dict() for symbol, data in response.data.items()
            }
        
        if response.overview:
            result['overview'] = response.overview.to_dict()
        
        return jsonify(result), 200 if response.success else 500
        
    except Exception as e:
        logger.error(f"获取实时市场数据失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取实时市场数据失败: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500


# 错误处理
@market_data_bp.errorhandler(404)
def not_found(error):
    """404错误处理"""
    return jsonify({
        'success': False,
        'message': '接口不存在',
        'timestamp': datetime.now().isoformat()
    }), 404


@market_data_bp.errorhandler(500)
def internal_error(error):
    """500错误处理"""
    logger.error(f"内部服务器错误: {error}")
    return jsonify({
        'success': False,
        'message': '内部服务器错误',
        'timestamp': datetime.now().isoformat()
    }), 500