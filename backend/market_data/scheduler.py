#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
市场数据定时采集器
实现10秒频率的大盘数据采集
"""

import asyncio
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional
from threading import Thread
import time

from .tencent_finance_service import MarketDataService

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarketDataScheduler:
    """市场数据定时采集器"""
    
    def __init__(self, interval: int = 10):
        """
        初始化定时采集器
        
        Args:
            interval: 采集间隔（秒），默认10秒
        """
        self.interval = interval
        self.running = False
        self.thread: Optional[Thread] = None
        self.latest_data: Dict[str, Any] = {}
        self.service: Optional[MarketDataService] = None
        
        # 要采集的指数列表
        self.target_symbols = [
            'sh000001',  # 上证指数
            'sz399001',  # 深成指数
            'sz399006',  # 创业板指
            'sh000300',  # 沪深300
            'sh000016',  # 上证50
            'sz399905'   # 中证500
        ]
    
    async def _collect_data(self) -> Dict[str, Any]:
        """采集市场数据"""
        try:
            # 每次都创建新的服务实例以避免连接问题
            async with MarketDataService() as service:
                # 获取实时市场数据
                result = await service.get_realtime_market_overview()
                
                if result.get('success'):
                    logger.info(f"数据采集成功，时间: {datetime.now().strftime('%H:%M:%S')}")
                    return result
                else:
                    logger.warning(f"数据采集失败: {result.get('message', '未知错误')}")
                    return {'success': False, 'data': None}
                    
        except Exception as e:
            logger.error(f"数据采集异常: {e}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    def _run_collection_loop(self):
        """运行数据采集循环"""
        logger.info(f"开始市场数据定时采集，间隔: {self.interval}秒")
        
        # 创建一个持久的事件循环
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            while self.running:
                try:
                    # 执行数据采集
                    data = loop.run_until_complete(self._collect_data())
                    
                    # 更新最新数据
                    if data.get('success'):
                        self.latest_data = data
                        self._log_market_summary(data)
                    
                    # 等待下一次采集
                    time.sleep(self.interval)
                    
                except Exception as e:
                    logger.error(f"采集循环异常: {e}")
                    time.sleep(self.interval)
        finally:
            # 清理服务连接
            if self.service:
                try:
                    loop.run_until_complete(self.service.__aexit__(None, None, None))
                except:
                    pass
            loop.close()
    
    def _log_market_summary(self, data: Dict[str, Any]):
        """记录市场概览摘要"""
        try:
            market_overview = data.get('data', {}).get('market_overview', [])
            if market_overview:
                logger.info("=== 市场概览 ===")
                for item in market_overview:
                    name = item.get('name', 'N/A')
                    price = item.get('current_price', 0)
                    change_percent = item.get('change_percent', 0)
                    change_sign = '+' if change_percent >= 0 else ''
                    logger.info(f"{name}: {price:.2f} ({change_sign}{change_percent:.2f}%)")
                logger.info("===============")
        except Exception as e:
            logger.error(f"记录市场摘要失败: {e}")
    
    def start(self):
        """启动定时采集"""
        if self.running:
            logger.warning("定时采集已在运行中")
            return
        
        self.running = True
        self.thread = Thread(target=self._run_collection_loop, daemon=True)
        self.thread.start()
        logger.info("市场数据定时采集已启动")
    
    def stop(self):
        """停止定时采集"""
        if not self.running:
            logger.warning("定时采集未在运行")
            return
        
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        
        # 清理服务
        if self.service:
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(self.service.__aexit__(None, None, None))
                loop.close()
                self.service = None
            except Exception as e:
                logger.error(f"清理服务失败: {e}")
        
        logger.info("市场数据定时采集已停止")
    
    def get_latest_data(self) -> Dict[str, Any]:
        """获取最新采集的数据"""
        return self.latest_data.copy()
    
    def is_running(self) -> bool:
        """检查是否正在运行"""
        return self.running
    
    def get_status(self) -> Dict[str, Any]:
        """获取采集器状态"""
        return {
            'running': self.running,
            'interval': self.interval,
            'target_symbols': self.target_symbols,
            'has_data': bool(self.latest_data),
            'last_update': self.latest_data.get('data', {}).get('update_time'),
            'thread_alive': self.thread.is_alive() if self.thread else False
        }

# 全局调度器实例
_scheduler_instance: Optional[MarketDataScheduler] = None

def get_scheduler() -> MarketDataScheduler:
    """获取全局调度器实例"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = MarketDataScheduler()
    return _scheduler_instance

def start_scheduler(interval: int = 10):
    """启动全局调度器"""
    scheduler = get_scheduler()
    scheduler.interval = interval
    scheduler.start()
    return scheduler

def stop_scheduler():
    """停止全局调度器"""
    global _scheduler_instance
    if _scheduler_instance:
        _scheduler_instance.stop()
        _scheduler_instance = None

# 测试代码
if __name__ == "__main__":
    def test_scheduler():
        """测试调度器功能"""
        scheduler = MarketDataScheduler(interval=5)  # 5秒间隔用于测试
        
        try:
            scheduler.start()
            
            # 运行30秒
            time.sleep(30)
            
            # 获取最新数据
            latest = scheduler.get_latest_data()
            print(f"最新数据: {json.dumps(latest, indent=2, ensure_ascii=False)}")
            
            # 获取状态
            status = scheduler.get_status()
            print(f"调度器状态: {json.dumps(status, indent=2, ensure_ascii=False)}")
            
        finally:
            scheduler.stop()
    
    # 运行测试
    test_scheduler()