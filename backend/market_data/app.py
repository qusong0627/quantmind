#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大盘数据服务Flask应用
大盘指数数据服务
"""

import logging
import os
from datetime import datetime

from flask import Flask, jsonify
from flask_cors import CORS

from .controllers import market_data_bp
from .scheduler import get_scheduler, start_scheduler, stop_scheduler

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('market_data.log')
    ]
)

logger = logging.getLogger(__name__)


def create_app(config=None):
    """创建Flask应用
    
    Args:
        config: 配置对象
        
    Returns:
        Flask: Flask应用实例
    """
    app = Flask(__name__)
    
    # 基本配置
    app.config.update({
        'SECRET_KEY': os.environ.get('SECRET_KEY', 'market-data-secret-key'),
        'DEBUG': os.environ.get('DEBUG', 'False').lower() == 'true',
        'TESTING': False,
        'JSON_AS_ASCII': False,  # 支持中文JSON
        'JSONIFY_PRETTYPRINT_REGULAR': True
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
    
    # 注册蓝图
    app.register_blueprint(market_data_bp, url_prefix='/api/v1/market')
    
    # 启动定时调度器
    def start_data_scheduler():
        """启动数据定时采集"""
        try:
            scheduler = start_scheduler(interval=10)  # 10秒间隔
            logger.info("市场数据定时采集已启动")
        except Exception as e:
            logger.error(f"启动定时采集失败: {e}")
    
    # 在应用启动时调用
    start_data_scheduler()
    
    # 添加调度器相关的API端点
    @app.route('/api/v1/scheduler/status')
    def scheduler_status():
        """获取调度器状态"""
        try:
            scheduler = get_scheduler()
            status = scheduler.get_status()
            return jsonify({
                'success': True,
                'data': status,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            logger.error(f"获取调度器状态失败: {e}")
            return jsonify({
                'success': False,
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/v1/scheduler/latest')
    def scheduler_latest_data():
        """获取最新采集的数据"""
        try:
            scheduler = get_scheduler()
            latest_data = scheduler.get_latest_data()
            return jsonify({
                'success': True,
                'data': latest_data,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            logger.error(f"获取最新数据失败: {e}")
            return jsonify({
                'success': False,
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/v1/scheduler/start', methods=['POST'])
    def start_scheduler_endpoint():
        """启动调度器"""
        try:
            scheduler = start_scheduler(interval=10)
            return jsonify({
                'success': True,
                'message': '调度器已启动',
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            logger.error(f"启动调度器失败: {e}")
            return jsonify({
                'success': False,
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/v1/scheduler/stop', methods=['POST'])
    def stop_scheduler_endpoint():
        """停止调度器"""
        try:
            stop_scheduler()
            return jsonify({
                'success': True,
                'message': '调度器已停止',
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            logger.error(f"停止调度器失败: {e}")
            return jsonify({
                'success': False,
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500
    
    # 根路径
    @app.route('/')
    def index():
        """根路径"""
        return jsonify({
            'service': 'QuantMind Market Data Service',
            'description': '大盘指数数据服务',
            'version': '1.0.0',
            'timestamp': datetime.now().isoformat(),
            'endpoints': {
                'health': '/api/v1/market/health',
                'indices': '/api/v1/market/indices',
                'overview': '/api/v1/market/overview',
                'single_index': '/api/v1/market/indices/<symbol>',
                'supported': '/api/v1/market/supported',
                'realtime': '/api/v1/market/realtime',
                'scheduler_status': '/api/v1/scheduler/status',
                'scheduler_latest': '/api/v1/scheduler/latest',
                'scheduler_start': '/api/v1/scheduler/start',
                'scheduler_stop': '/api/v1/scheduler/stop'
            }
        })
    
    # 健康检查
    @app.route('/health')
    def health():
        """简单健康检查"""
        return jsonify({
            'status': 'healthy',
            'service': 'market_data',
            'timestamp': datetime.now().isoformat()
        })
    
    # 全局错误处理
    @app.errorhandler(404)
    def not_found(error):
        """404错误处理"""
        return jsonify({
            'success': False,
            'message': '接口不存在',
            'timestamp': datetime.now().isoformat()
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """500错误处理"""
        logger.error(f"内部服务器错误: {error}")
        return jsonify({
            'success': False,
            'message': '内部服务器错误',
            'timestamp': datetime.now().isoformat()
        }), 500
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        """全局异常处理"""
        logger.error(f"未处理的异常: {error}")
        return jsonify({
            'success': False,
            'message': '服务异常',
            'timestamp': datetime.now().isoformat()
        }), 500
    
    # 请求日志
    @app.before_request
    def log_request():
        """记录请求日志"""
        from flask import request
        logger.info(f"收到请求: {request.method} {request.path} from {request.remote_addr}")
    
    @app.after_request
    def log_response(response):
        """记录响应日志"""
        from flask import request
        logger.info(f"响应请求: {request.method} {request.path} -> {response.status_code}")
        return response
    
    logger.info("大盘数据服务应用创建成功")
    return app


# 创建应用实例
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"启动大盘数据服务，端口: {port}, 调试模式: {debug}")
    app.run(host='0.0.0.0', port=port, debug=debug)