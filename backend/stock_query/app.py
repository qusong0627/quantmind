#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
股票查询Web应用程序
提供基于Flask的RESTful API接口
"""

import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from backend.stock_query.controllers import stock_query_bp
from backend.stock_query.market_controllers import market_bp
from backend.stock_query.services import StockQueryService, StockSearchService
from backend.shared.cache import CacheManager
from config.ifind_token_manager import IFindTokenManager

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app(config=None):
    """创建Flask应用程序"""
    app = Flask(__name__)
    
    # 基础配置
    app.config.update({
        'SECRET_KEY': 'your-secret-key-here',
        'JSON_AS_ASCII': False,  # 支持中文JSON响应
        'JSONIFY_PRETTYPRINT_REGULAR': True,  # 格式化JSON输出
    })
    
    # 应用自定义配置
    if config:
        app.config.update(config)
    
    # 启用CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["*"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # 初始化服务
    try:
        token_manager = IFindTokenManager()
        cache_manager = CacheManager(use_memory=True, use_redis=False)
        query_service = StockQueryService(token_manager, cache_manager)
        search_service = StockSearchService(query_service)
        
        # 将服务实例存储到应用上下文
        app.token_manager = token_manager
        app.cache_manager = cache_manager
        app.query_service = query_service
        app.search_service = search_service
        
        logger.info("股票查询服务初始化成功")
        
    except Exception as e:
        logger.error(f"服务初始化失败: {e}")
        raise
    
    # 注册蓝图
    app.register_blueprint(stock_query_bp)
    app.register_blueprint(market_bp)
    
    # 根路径
    @app.route('/')
    def index():
        """首页"""
        return jsonify({
            'name': '股票查询API',
            'version': '1.0.0',
            'description': '基于同花顺iFinD API的股票数据查询服务',
            'timestamp': datetime.now().isoformat(),
            'endpoints': {
                'health': '/api/stock/health',
                'search': '/api/stock/search',
                'info': '/api/stock/info/<code>',
                'realtime': '/api/stock/realtime',
                'historical': '/api/stock/historical',
                'indicators': '/api/stock/indicators',
                'hot': '/api/stock/hot',
                'quick_search': '/api/stock/quick_search',
                'batch_info': '/api/stock/batch_info'
            }
        })
    
    # 全局错误处理
    @app.errorhandler(404)
    def not_found(error):
        """404错误处理"""
        return jsonify({
            'success': False,
            'message': '请求的资源不存在',
            'error_code': 'NOT_FOUND',
            'timestamp': datetime.now().isoformat()
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """500错误处理"""
        logger.error(f"内部服务器错误: {error}")
        return jsonify({
            'success': False,
            'message': '内部服务器错误',
            'error_code': 'INTERNAL_ERROR',
            'timestamp': datetime.now().isoformat()
        }), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        """400错误处理"""
        return jsonify({
            'success': False,
            'message': '请求参数错误',
            'error_code': 'BAD_REQUEST',
            'timestamp': datetime.now().isoformat()
        }), 400
    
    # 请求日志中间件
    @app.before_request
    def log_request_info():
        """记录请求信息"""
        logger.info(f"{request.method} {request.url} - {request.remote_addr}")
    
    @app.after_request
    def log_response_info(response):
        """记录响应信息"""
        logger.info(f"Response: {response.status_code}")
        return response
    
    return app


def main():
    """主函数"""
    try:
        # 创建应用
        app = create_app()
        
        # 检查Token状态
        if not app.token_manager.has_refresh_token():
            logger.warning("未设置Refresh Token，请先配置Token")
            logger.info("使用命令: python3 config/ifind_token_manager.py set_refresh <your_refresh_token>")
        
        # 启动应用
        logger.info("启动股票查询Web服务...")
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            threaded=True
        )
        
    except KeyboardInterrupt:
        logger.info("服务被用户中断")
    except Exception as e:
        logger.error(f"服务启动失败: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()