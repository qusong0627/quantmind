#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
股票查询服务启动脚本
提供多种启动模式和管理功能
"""

import sys
import os
import argparse
import logging
from typing import Optional

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from backend.stock_query.app import create_app
from backend.stock_query.config import get_config, Environment
from backend.stock_query.test_stock_query import StockQueryTester
from config.ifind_token_manager import IFindTokenManager


class StockQueryRunner:
    """股票查询服务运行器"""
    
    def __init__(self):
        self.config = get_config()
        self.logger = self._setup_logging()
    
    def _setup_logging(self) -> logging.Logger:
        """设置日志"""
        logging.basicConfig(
            level=getattr(logging, self.config.logging.level),
            format=self.config.logging.format
        )
        
        logger = logging.getLogger(__name__)
        
        # 如果指定了日志文件，添加文件处理器
        if self.config.logging.file_path:
            from logging.handlers import RotatingFileHandler
            
            # 确保日志目录存在
            log_dir = os.path.dirname(self.config.logging.file_path)
            if log_dir and not os.path.exists(log_dir):
                os.makedirs(log_dir)
            
            file_handler = RotatingFileHandler(
                self.config.logging.file_path,
                maxBytes=self.config.logging.max_file_size,
                backupCount=self.config.logging.backup_count
            )
            file_handler.setFormatter(
                logging.Formatter(self.config.logging.format)
            )
            logger.addHandler(file_handler)
        
        return logger
    
    def check_prerequisites(self) -> bool:
        """检查运行前提条件"""
        self.logger.info("检查运行前提条件...")
        
        try:
            # 检查Token管理器
            token_manager = IFindTokenManager()
            
            if not token_manager.has_refresh_token():
                self.logger.error("未设置Refresh Token")
                self.logger.info("请使用以下命令设置Token:")
                self.logger.info("python3 config/ifind_token_manager.py set_refresh <your_refresh_token>")
                return False
            
            # 检查Token有效性
            if not token_manager.is_access_token_valid():
                self.logger.info("Access Token无效，尝试刷新...")
                if token_manager.refresh_access_token():
                    self.logger.info("Access Token刷新成功")
                else:
                    self.logger.error("Access Token刷新失败")
                    return False
            
            self.logger.info("前提条件检查通过")
            return True
            
        except Exception as e:
            self.logger.error(f"前提条件检查失败: {e}")
            return False
    
    def run_server(self, host: Optional[str] = None, port: Optional[int] = None, debug: Optional[bool] = None):
        """运行Web服务器"""
        self.logger.info("启动股票查询Web服务器...")
        
        if not self.check_prerequisites():
            self.logger.error("前提条件检查失败，无法启动服务")
            sys.exit(1)
        
        try:
            # 创建Flask应用
            app = create_app()
            
            # 使用传入的参数或配置文件中的参数
            server_host = host or self.config.web.host
            server_port = port or self.config.web.port
            server_debug = debug if debug is not None else self.config.web.debug
            
            self.logger.info(f"服务器启动在 http://{server_host}:{server_port}")
            self.logger.info(f"调试模式: {'开启' if server_debug else '关闭'}")
            self.logger.info(f"环境: {self.config.environment.value}")
            
            # 启动服务器
            app.run(
                host=server_host,
                port=server_port,
                debug=server_debug,
                threaded=self.config.web.threaded
            )
            
        except KeyboardInterrupt:
            self.logger.info("服务器被用户中断")
        except Exception as e:
            self.logger.error(f"服务器启动失败: {e}")
            sys.exit(1)
    
    def run_tests(self):
        """运行测试"""
        self.logger.info("运行股票查询功能测试...")
        
        try:
            tester = StockQueryTester()
            results = tester.run_all_tests()
            
            # 统计结果
            total_tests = len(results)
            passed_tests = sum(1 for result in results.values() if result)
            
            if passed_tests == total_tests:
                self.logger.info(f"所有测试通过！({passed_tests}/{total_tests})")
                return True
            else:
                self.logger.error(f"部分测试失败！({passed_tests}/{total_tests})")
                return False
                
        except Exception as e:
            self.logger.error(f"测试运行失败: {e}")
            return False
    
    def show_status(self):
        """显示服务状态"""
        self.logger.info("=== 股票查询服务状态 ===")
        
        try:
            # Token状态
            token_manager = IFindTokenManager()
            has_refresh = token_manager.has_refresh_token()
            has_access = token_manager.has_access_token()
            is_valid = token_manager.is_access_token_valid()
            
            self.logger.info(f"Refresh Token: {'✓' if has_refresh else '✗'}")
            self.logger.info(f"Access Token: {'✓' if has_access else '✗'}")
            self.logger.info(f"Token Valid: {'✓' if is_valid else '✗'}")
            
            # 配置信息
            self.logger.info(f"环境: {self.config.environment.value}")
            self.logger.info(f"Web服务: {self.config.web.host}:{self.config.web.port}")
            self.logger.info(f"缓存: 内存={'✓' if self.config.cache.use_memory_cache else '✗'}, Redis={'✓' if self.config.cache.use_redis_cache else '✗'}")
            self.logger.info(f"交易时间: {'✓' if self.config.is_market_trading_time() else '✗'}")
            
            # API配置
            self.logger.info(f"API超时: {self.config.api.request_timeout}秒")
            self.logger.info(f"最大并发: {self.config.api.max_concurrent_requests}")
            self.logger.info(f"速率限制: {self.config.api.rate_limit_per_second}/秒")
            
        except Exception as e:
            self.logger.error(f"状态检查失败: {e}")
    
    def show_config(self):
        """显示配置信息"""
        import json
        
        self.logger.info("=== 股票查询服务配置 ===")
        config_dict = self.config.to_dict()
        
        print(json.dumps(config_dict, indent=2, ensure_ascii=False, default=str))
    
    def show_help(self):
        """显示帮助信息"""
        help_text = """
股票查询服务管理工具

使用方法:
  python3 run.py <command> [options]

命令:
  server    启动Web服务器
  test      运行功能测试
  status    显示服务状态
  config    显示配置信息
  help      显示帮助信息

服务器选项:
  --host HOST     服务器主机地址 (默认: 0.0.0.0)
  --port PORT     服务器端口 (默认: 5000)
  --debug         启用调试模式
  --no-debug      禁用调试模式

环境变量:
  ENVIRONMENT     运行环境 (development/testing/production)
  WEB_HOST        Web服务主机
  WEB_PORT        Web服务端口
  LOG_LEVEL       日志级别
  LOG_FILE        日志文件路径

示例:
  python3 run.py server                    # 启动服务器
  python3 run.py server --port 8000        # 在8000端口启动
  python3 run.py server --debug            # 启用调试模式
  python3 run.py test                      # 运行测试
  python3 run.py status                    # 查看状态
  
  ENVIRONMENT=production python3 run.py server  # 生产环境启动
"""
        print(help_text)


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='股票查询服务管理工具',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        'command',
        choices=['server', 'test', 'status', 'config', 'help'],
        help='要执行的命令'
    )
    
    parser.add_argument(
        '--host',
        type=str,
        help='服务器主机地址'
    )
    
    parser.add_argument(
        '--port',
        type=int,
        help='服务器端口'
    )
    
    parser.add_argument(
        '--debug',
        action='store_true',
        help='启用调试模式'
    )
    
    parser.add_argument(
        '--no-debug',
        action='store_true',
        help='禁用调试模式'
    )
    
    args = parser.parse_args()
    
    # 创建运行器
    runner = StockQueryRunner()
    
    # 执行命令
    try:
        if args.command == 'server':
            debug = None
            if args.debug:
                debug = True
            elif args.no_debug:
                debug = False
            
            runner.run_server(
                host=args.host,
                port=args.port,
                debug=debug
            )
            
        elif args.command == 'test':
            success = runner.run_tests()
            sys.exit(0 if success else 1)
            
        elif args.command == 'status':
            runner.show_status()
            
        elif args.command == 'config':
            runner.show_config()
            
        elif args.command == 'help':
            runner.show_help()
            
    except KeyboardInterrupt:
        print("\n操作被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"执行失败: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()