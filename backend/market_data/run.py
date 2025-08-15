#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大盘数据服务启动脚本
提供多种启动方式：开发模式、生产模式、测试模式
"""

import argparse
import asyncio
import logging
import os
import sys
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from market_data.app import create_app
# 导入已移除，服务不再可用

logger = logging.getLogger(__name__)


def setup_logging(level=logging.INFO):
    """设置日志配置
    
    Args:
        level: 日志级别
    """
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('market_data.log')
        ]
    )


async def test_service():
    """测试服务功能"""
    print("\n=== 大盘数据服务测试 ===")
    print(f"测试时间: {datetime.now()}")
    print("\n注意: 腾讯财经相关服务已被移除")
    print("\n=== 测试完成 ===")
    return True


def run_server(host='0.0.0.0', port=5002, debug=False):
    """运行Flask服务器
    
    Args:
        host: 主机地址
        port: 端口号
        debug: 是否开启调试模式
    """
    print(f"\n=== 启动大盘数据服务 ===")
    print(f"服务地址: http://{host}:{port}")
    print(f"调试模式: {'开启' if debug else '关闭'}")
    print(f"启动时间: {datetime.now()}")
    
    # 创建应用
    app = create_app()
    
    # 启动服务器
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        print("\n服务已停止")
    except Exception as e:
        print(f"\n服务启动失败: {e}")
        logger.error(f"服务启动失败: {e}")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='大盘数据服务')
    parser.add_argument('command', choices=['server', 'test'], help='运行模式')
    parser.add_argument('--host', default='0.0.0.0', help='服务器主机地址')
    parser.add_argument('--port', type=int, default=5002, help='服务器端口')
    parser.add_argument('--debug', action='store_true', help='开启调试模式')
    parser.add_argument('--log-level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'], 
                       default='INFO', help='日志级别')
    
    args = parser.parse_args()
    
    # 设置日志
    log_level = getattr(logging, args.log_level)
    setup_logging(log_level)
    
    if args.command == 'server':
        # 启动服务器
        run_server(args.host, args.port, args.debug)
    elif args.command == 'test':
        # 运行测试
        asyncio.run(test_service())


if __name__ == '__main__':
    main()