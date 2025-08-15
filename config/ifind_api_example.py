#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
同花顺iFinD API使用示例
演示如何使用Token管理器进行API调用
"""

import requests
import json
import logging
from typing import Dict, List, Optional, Any
from .ifind_token_manager import IFindTokenManager

logger = logging.getLogger(__name__)

class IFindAPIClient:
    """同花顺iFinD API客户端"""
    
    def __init__(self, token_manager: IFindTokenManager = None):
        """初始化API客户端
        
        Args:
            token_manager: Token管理器实例
        """
        self.token_manager = token_manager or IFindTokenManager()
        self.base_url = self.token_manager.config['ifind_api']['api_base_url']
    
    def _make_request(self, endpoint: str, data: Dict[str, Any]) -> Optional[Dict]:
        """发送API请求
        
        Args:
            endpoint: API端点
            data: 请求数据
            
        Returns:
            Optional[Dict]: 响应数据，失败返回None
        """
        headers = self.token_manager.get_api_headers()
        if not headers:
            logger.error("无法获取有效的API headers")
            return None
        
        try:
            url = f"{self.base_url}/{endpoint}"
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('errorcode') == 0:
                return result
            else:
                error_msg = result.get('errmsg', '未知错误')
                logger.error(f"API请求失败: {error_msg}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"网络请求失败: {e}")
            return None
        except Exception as e:
            logger.error(f"API请求时发生错误: {e}")
            return None
    
    def get_realtime_quotes(self, codes: List[str], indicators: List[str] = None) -> Optional[Dict]:
        """获取实时行情数据
        
        Args:
            codes: 股票代码列表，如['000001.SZ', '000002.SZ']
            indicators: 指标列表，如['latest', 'chg', 'chg_pct']
            
        Returns:
            Optional[Dict]: 实时行情数据
        """
        if indicators is None:
            indicators = ['tradeDate', 'tradeTime', 'latest', 'chg', 'chg_pct', 'volume', 'amount']
        
        data = {
            'codes': ','.join(codes),
            'indicators': ','.join(indicators)
        }
        
        return self._make_request('real_time_quotation', data)
    
    def get_historical_data(self, codes: List[str], start_date: str, end_date: str, 
                          indicators: List[str] = None, period: str = 'D') -> Optional[Dict]:
        """获取历史行情数据
        
        Args:
            codes: 股票代码列表
            start_date: 开始日期，格式：YYYY-MM-DD
            end_date: 结束日期，格式：YYYY-MM-DD
            indicators: 指标列表
            period: 周期，D=日线，W=周线，M=月线
            
        Returns:
            Optional[Dict]: 历史行情数据
        """
        if indicators is None:
            indicators = ['open', 'high', 'low', 'close', 'volume', 'amount']
        
        data = {
            'codes': ','.join(codes),
            'indicators': ','.join(indicators),
            'startdate': start_date,
            'enddate': end_date,
            'functionpara': json.dumps({
                'Interval': period,
                'Fill': 'Previous'
            })
        }
        
        return self._make_request('cmd_history_quotation', data)
    
    def get_basic_data(self, codes: List[str], indicators: List[str], 
                      start_date: str = None, end_date: str = None) -> Optional[Dict]:
        """获取基础数据
        
        Args:
            codes: 股票代码列表
            indicators: 指标列表，如['pe', 'pb', 'market_cap']
            start_date: 开始日期（可选）
            end_date: 结束日期（可选）
            
        Returns:
            Optional[Dict]: 基础数据
        """
        # 构造indipara参数
        indipara = []
        for indicator in indicators:
            indipara.append({
                "indicator": indicator,
                "indiparams": ["0", "101"],
                "_otherparams": {
                    "id": "680799",
                    "name": ["THSCODE", "F0", "F1", "FDIR"]
                }
            })
        
        data = {
            'codes': ';'.join(codes),  # 使用分号分隔
            'indipara': indipara
        }
        
        return self._make_request('basic_data_service', data)
    
    def get_technical_indicators(self, codes: List[str], indicators: List[str],
                               start_date: str, end_date: str, period: str = 'D') -> Optional[Dict]:
        """获取技术指标数据
        
        Args:
            codes: 股票代码列表
            indicators: 技术指标列表，如['MA5', 'MA10', 'MACD', 'RSI']
            start_date: 开始日期
            end_date: 结束日期
            period: 周期
            
        Returns:
            Optional[Dict]: 技术指标数据
        """
        # 对于技术指标，我们需要使用基础行情数据来计算
        # 先获取基础行情数据（开高低收），然后在客户端计算技术指标
        data = {
            'codes': ','.join(codes),
            'indicators': 'open,high,low,close,volume',  # 获取基础数据用于计算技术指标
            'startdate': start_date,
            'enddate': end_date
        }
        
        result = self._make_request('cmd_history_quotation', data)
        
        if result and result.get('errorcode') == 0:
            # 这里应该添加技术指标计算逻辑
            # 暂时返回基础数据，让上层服务处理技术指标计算
            return result
        
        return result
    
    def search_stocks(self, query: str, market: str = 'A') -> Optional[Dict]:
        """搜索股票
        
        Args:
            query: 搜索关键词
            market: 市场类型 ('A'=A股, 'HK'=港股, 'US'=美股)
            
        Returns:
            Dict: API响应数据
        """
        data = {
            'searchstring': query,
            'searchtype': 'stock'
        }
        
        return self._make_request('smart_stock_picking', data)


def demo_realtime_quotes():
    """演示获取实时行情"""
    print("\n=== 实时行情演示 ===")
    
    client = IFindAPIClient()
    
    # 获取几只热门股票的实时行情
    codes = ['000001.SZ', '000002.SZ', '600000.SH', '600036.SH']
    indicators = ['latest', 'chg', 'chg_pct', 'volume', 'amount', 'turnoverRatio']
    
    result = client.get_realtime_quotes(codes, indicators)
    
    if result:
        print("实时行情数据获取成功:")
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("实时行情数据获取失败")


def demo_historical_data():
    """演示获取历史数据"""
    print("\n=== 历史数据演示 ===")
    
    client = IFindAPIClient()
    
    # 获取最近30个交易日的历史数据
    codes = ['000001.SZ']
    indicators = ['open', 'high', 'low', 'close', 'volume']
    
    result = client.get_historical_data(
        codes=codes,
        start_date='2024-01-01',
        end_date='2024-01-31',
        indicators=indicators
    )
    
    if result:
        print("历史数据获取成功:")
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("历史数据获取失败")


def demo_basic_data():
    """演示获取基础数据"""
    print("\n=== 基础数据演示 ===")
    
    client = IFindAPIClient()
    
    # 获取基础财务指标
    codes = ['000001.SZ', '000002.SZ']
    indicators = ['pe', 'pb', 'market_cap', 'total_shares']
    
    result = client.get_basic_data(codes, indicators)
    
    if result:
        print("基础数据获取成功:")
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("基础数据获取失败")


def main():
    """主函数"""
    # 配置日志
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    try:
        # 检查Token状态
        token_manager = IFindTokenManager()
        status = token_manager.get_token_status()
        
        print("Token状态检查:")
        for key, value in status.items():
            print(f"  {key}: {value}")
        
        if not status['has_refresh_token']:
            print("\n警告: 未设置Refresh Token，请先设置:")
            print("python ifind_token_manager.py set_refresh_token <your_refresh_token>")
            return
        
        if not status['access_token_valid']:
            print("\nAccess Token无效或已过期，尝试刷新...")
            success, message = token_manager.refresh_access_token()
            if not success:
                print(f"刷新失败: {message}")
                return
            print("Token刷新成功")
        
        # 运行演示
        demo_realtime_quotes()
        demo_historical_data()
        demo_basic_data()
        
    except Exception as e:
        logger.error(f"演示运行失败: {e}")


if __name__ == '__main__':
    main()