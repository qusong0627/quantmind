#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
股票查询服务
实现基于同花顺iFinD API的股票数据查询功能
"""

import json
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Any, Union
from dataclasses import asdict

from .models import (
    StockInfo, RealtimeQuote, HistoricalQuote, TechnicalIndicator,
    QueryRequest, RealtimeQueryRequest, HistoricalQueryRequest,
    TechnicalIndicatorRequest, SearchRequest, QueryResponse,
    MarketType, TradeStatus, AdjustType, DataFrequency,
    parse_stock_code, format_stock_code, INDICATOR_MAPPING
)
from ..shared.cache import CacheManager
# 添加项目根目录到Python路径
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from config.ifind_token_manager import IFindTokenManager
from config.ifind_api_example import IFindAPIClient

logger = logging.getLogger(__name__)


class StockQueryService:
    """股票查询服务主类"""
    
    def __init__(self, token_manager: IFindTokenManager = None, cache_manager: CacheManager = None):
        """初始化股票查询服务
        
        Args:
            token_manager: Token管理器
            cache_manager: 缓存管理器
        """
        self.token_manager = token_manager or IFindTokenManager()
        self.cache_manager = cache_manager or CacheManager()
        self.api_client = IFindAPIClient(self.token_manager)
        
        # 缓存配置
        self.cache_config = {
            'realtime': 5,      # 实时数据缓存5秒
            'daily': 3600,      # 日线数据缓存1小时
            'basic_info': 86400, # 基础信息缓存1天
            'search': 300       # 搜索结果缓存5分钟
        }
    
    def search_stocks(self, request: SearchRequest) -> QueryResponse:
        """搜索股票
        
        Args:
            request: 搜索请求
            
        Returns:
            QueryResponse: 搜索结果
        """
        try:
            # 构建缓存键
            cache_key = f"search:{request.keyword}:{request.search_type}:{request.market}:{request.limit}"
            
            # 尝试从缓存获取
            cached_result = self.cache_manager.get(cache_key)
            if cached_result:
                logger.info(f"从缓存获取搜索结果: {request.keyword}")
                return QueryResponse.from_dict(cached_result)
            
            # 调用API搜索
            api_result = self.api_client.search_stocks(
                query=request.keyword,
                market=request.market.value if request.market else 'A'
            )
            
            if not api_result:
                return QueryResponse(
                    success=False,
                    message="搜索失败，API返回空结果"
                )
            
            # 解析搜索结果
            stocks = self._parse_search_results(api_result, request)
            
            response = QueryResponse(
                success=True,
                message="搜索成功",
                data=[stock.to_dict() for stock in stocks],
                total=len(stocks)
            )
            
            # 缓存结果
            self.cache_manager.set(
                cache_key, 
                response.to_dict(), 
                ttl=self.cache_config['search']
            )
            
            logger.info(f"搜索股票成功: {request.keyword}, 找到 {len(stocks)} 只股票")
            return response
            
        except Exception as e:
            logger.error(f"搜索股票失败: {e}")
            return QueryResponse(
                success=False,
                message=f"搜索失败: {str(e)}"
            )
    
    def get_stock_info(self, code: str) -> QueryResponse:
        """获取股票基础信息
        
        Args:
            code: 股票代码
            
        Returns:
            QueryResponse: 股票信息
        """
        try:
            # 标准化股票代码
            stock_code, market = parse_stock_code(code)
            formatted_code = format_stock_code(stock_code, market)
            
            # 构建缓存键
            cache_key = f"stock_info:{formatted_code}"
            
            # 尝试从缓存获取
            cached_result = self.cache_manager.get(cache_key)
            if cached_result:
                logger.info(f"从缓存获取股票信息: {formatted_code}")
                return QueryResponse.from_dict(cached_result)
            
            # 调用API获取基础数据
            api_result = self.api_client.get_basic_data(
                codes=[formatted_code],
                indicators=['pe', 'pb', 'market_cap', 'total_shares', 'float_shares']
            )
            
            if not api_result:
                return QueryResponse(
                    success=False,
                    message=f"获取股票信息失败: {formatted_code}"
                )
            
            # 解析股票信息
            stock_info = self._parse_stock_info(api_result, formatted_code)
            
            response = QueryResponse(
                success=True,
                message="获取股票信息成功",
                data=stock_info.to_dict() if stock_info else None,
                total=1 if stock_info else 0
            )
            
            # 缓存结果
            self.cache_manager.set(
                cache_key,
                response.to_dict(),
                ttl=self.cache_config['basic_info']
            )
            
            logger.info(f"获取股票信息成功: {formatted_code}")
            return response
            
        except Exception as e:
            logger.error(f"获取股票信息失败: {e}")
            return QueryResponse(
                success=False,
                message=f"获取股票信息失败: {str(e)}"
            )
    
    def get_realtime_quotes(self, request: RealtimeQueryRequest) -> QueryResponse:
        """获取实时行情
        
        Args:
            request: 实时行情查询请求
            
        Returns:
            QueryResponse: 实时行情数据
        """
        try:
            # 标准化股票代码
            formatted_codes = []
            for code in request.codes:
                stock_code, market = parse_stock_code(code)
                formatted_codes.append(format_stock_code(stock_code, market))
            
            # 构建缓存键
            cache_key = f"realtime:{",".join(sorted(formatted_codes))}:{",".join(sorted(request.indicators))}"
            
            # 尝试从缓存获取
            cached_result = self.cache_manager.get(cache_key)
            if cached_result:
                logger.info(f"从缓存获取实时行情: {len(formatted_codes)} 只股票")
                return QueryResponse.from_dict(cached_result)
            
            # 调用API获取实时行情
            api_result = self.api_client.get_realtime_quotes(
                codes=formatted_codes,
                indicators=request.indicators
            )
            
            if not api_result:
                return QueryResponse(
                    success=False,
                    message="获取实时行情失败，API返回空结果"
                )
            
            # 解析实时行情数据
            quotes = self._parse_realtime_quotes(api_result, formatted_codes)
            
            response = QueryResponse(
                success=True,
                message="获取实时行情成功",
                data=[quote.to_dict() for quote in quotes],
                total=len(quotes)
            )
            
            # 缓存结果
            self.cache_manager.set(
                cache_key,
                response.to_dict(),
                ttl=self.cache_config['realtime']
            )
            
            logger.info(f"获取实时行情成功: {len(quotes)} 只股票")
            return response
            
        except Exception as e:
            logger.error(f"获取实时行情失败: {e}")
            return QueryResponse(
                success=False,
                message=f"获取实时行情失败: {str(e)}"
            )
    
    def get_historical_data(self, request: HistoricalQueryRequest) -> QueryResponse:
        """获取历史数据
        
        Args:
            request: 历史数据查询请求
            
        Returns:
            QueryResponse: 历史数据
        """
        try:
            # 标准化股票代码
            formatted_codes = []
            for code in request.codes:
                stock_code, market = parse_stock_code(code)
                formatted_codes.append(format_stock_code(stock_code, market))
            
            # 构建缓存键
            cache_key = (
                f"historical:{",".join(sorted(formatted_codes))}:"
                f"{request.start_date}:{request.end_date}:"
                f"{request.frequency.value}:{request.adjust_type.value}:"
                f"{",".join(sorted(request.indicators))}"
            )
            
            # 尝试从缓存获取
            cached_result = self.cache_manager.get(cache_key)
            if cached_result:
                logger.info(f"从缓存获取历史数据: {len(formatted_codes)} 只股票")
                return QueryResponse.from_dict(cached_result)
            
            # 调用API获取历史数据
            api_result = self.api_client.get_historical_data(
                codes=formatted_codes,
                start_date=request.start_date.isoformat() if request.start_date else None,
                end_date=request.end_date.isoformat() if request.end_date else None,
                indicators=request.indicators,
                period=request.frequency.value
            )
            
            if not api_result:
                return QueryResponse(
                    success=False,
                    message="获取历史数据失败，API返回空结果"
                )
            
            # 解析历史数据
            historical_data = self._parse_historical_data(api_result, formatted_codes)
            
            response = QueryResponse(
                success=True,
                message="获取历史数据成功",
                data=[data.to_dict() for data in historical_data],
                total=len(historical_data)
            )
            
            # 缓存结果
            cache_ttl = self.cache_config['daily'] if request.frequency == DataFrequency.DAILY else 300
            self.cache_manager.set(
                cache_key,
                response.to_dict(),
                ttl=cache_ttl
            )
            
            logger.info(f"获取历史数据成功: {len(historical_data)} 条记录")
            return response
            
        except Exception as e:
            logger.error(f"获取历史数据失败: {e}")
            return QueryResponse(
                success=False,
                message=f"获取历史数据失败: {str(e)}"
            )
    
    def get_technical_indicators(self, request: TechnicalIndicatorRequest) -> QueryResponse:
        """获取技术指标
        
        Args:
            request: 技术指标查询请求
            
        Returns:
            QueryResponse: 技术指标数据
        """
        try:
            # 标准化股票代码
            formatted_codes = []
            for code in request.codes:
                stock_code, market = parse_stock_code(code)
                formatted_codes.append(format_stock_code(stock_code, market))
            
            # 构建缓存键
            cache_key = (
                f"indicators:{",".join(sorted(formatted_codes))}:"
                f"{request.start_date}:{request.end_date}:"
                f"{request.frequency.value}:"
                f"{",".join(sorted(request.indicators))}"
            )
            
            # 尝试从缓存获取
            cached_result = self.cache_manager.get(cache_key)
            if cached_result:
                logger.info(f"从缓存获取技术指标: {len(formatted_codes)} 只股票")
                return QueryResponse.from_dict(cached_result)
            
            # 调用API获取技术指标
            api_result = self.api_client.get_technical_indicators(
                codes=formatted_codes,
                indicators=request.indicators,
                start_date=request.start_date.isoformat() if request.start_date else None,
                end_date=request.end_date.isoformat() if request.end_date else None,
                period=request.frequency.value
            )
            
            if not api_result:
                return QueryResponse(
                    success=False,
                    message="获取技术指标失败，API返回空结果"
                )
            
            # 解析技术指标数据
            indicators = self._parse_technical_indicators(api_result, formatted_codes)
            
            response = QueryResponse(
                success=True,
                message="获取技术指标成功",
                data=[indicator.to_dict() for indicator in indicators],
                total=len(indicators)
            )
            
            # 缓存结果
            self.cache_manager.set(
                cache_key,
                response.to_dict(),
                ttl=self.cache_config['daily']
            )
            
            logger.info(f"获取技术指标成功: {len(indicators)} 条记录")
            return response
            
        except Exception as e:
            logger.error(f"获取技术指标失败: {e}")
            return QueryResponse(
                success=False,
                message=f"获取技术指标失败: {str(e)}"
            )
    
    def get_hot_stocks(self, market: Optional[MarketType] = None, limit: int = 20) -> QueryResponse:
        """获取热门股票
        
        Args:
            market: 市场类型限制
            limit: 返回数量限制
            
        Returns:
            QueryResponse: 热门股票列表
        """
        try:
            # 构建缓存键
            cache_key = f"hot_stocks:{market.value if market else 'all'}:{limit}"
            
            # 尝试从缓存获取
            cached_result = self.cache_manager.get(cache_key)
            if cached_result:
                logger.info("从缓存获取热门股票")
                return QueryResponse.from_dict(cached_result)
            
            # 这里可以根据实际需求实现热门股票的获取逻辑
            # 例如：成交量排序、涨幅排序等
            hot_stocks = self._get_hot_stocks_from_api(market, limit)
            
            response = QueryResponse(
                success=True,
                message="获取热门股票成功",
                data=[stock.to_dict() for stock in hot_stocks],
                total=len(hot_stocks)
            )
            
            # 缓存结果
            self.cache_manager.set(
                cache_key,
                response.to_dict(),
                ttl=300  # 5分钟缓存
            )
            
            logger.info(f"获取热门股票成功: {len(hot_stocks)} 只股票")
            return response
            
        except Exception as e:
            logger.error(f"获取热门股票失败: {e}")
            return QueryResponse(
                success=False,
                message=f"获取热门股票失败: {str(e)}"
            )
    
    def _parse_search_results(self, api_result: Dict[str, Any], request: SearchRequest) -> List[StockInfo]:
        """解析搜索结果"""
        stocks = []
        
        # 根据API返回格式解析数据
        if 'data' in api_result and isinstance(api_result['data'], list):
            for item in api_result['data'][:request.limit]:
                try:
                    # 解析股票代码和市场
                    code = item.get('code', '')
                    if not code:
                        continue
                    
                    stock_code, market = parse_stock_code(code)
                    
                    stock = StockInfo(
                        code=format_stock_code(stock_code, market),
                        name=item.get('name', ''),
                        market=market,
                        industry=item.get('industry'),
                        sector=item.get('sector'),
                        company_name=item.get('company_name'),
                        status=TradeStatus.TRADING
                    )
                    stocks.append(stock)
                    
                except Exception as e:
                    logger.warning(f"解析搜索结果项失败: {e}")
                    continue
        
        return stocks
    
    def _parse_stock_info(self, api_result: Dict[str, Any], code: str) -> Optional[StockInfo]:
        """解析股票基础信息"""
        try:
            # 检查API返回结构
            if 'tables' not in api_result:
                return None
            
            tables = api_result['tables']
            if not isinstance(tables, list) or not tables:
                return None
            
            # 获取第一个表的数据
            table_data = tables[0]
            if 'table' not in table_data:
                return None
            
            table = table_data['table']
            stock_code, market = parse_stock_code(code)
            
            # 从表格数据中提取信息
            pe_value = self._get_first_value(table.get('ths_pe_ttm_stock', [None]))
            pb_value = self._get_first_value(table.get('ths_pb_stock', [None]))
            
            return StockInfo(
                code=code,
                name=table_data.get('thscode', code),  # 使用thscode作为名称
                market=market,
                industry=None,  # 基础数据API不返回行业信息
                sector=None,    # 基础数据API不返回板块信息
                total_shares=None,  # 需要其他指标获取
                float_shares=None,  # 需要其他指标获取
                status=TradeStatus.TRADING
            )
            
        except Exception as e:
            logger.error(f"解析股票信息失败: {e}")
            return None
    
    def _parse_realtime_quotes(self, api_result: Dict[str, Any], codes: List[str]) -> List[RealtimeQuote]:
        """解析实时行情数据"""
        quotes = []
        
        try:
            # 检查API返回结构
            if 'tables' not in api_result:
                return quotes
            
            tables = api_result['tables']
            if not isinstance(tables, list) or not tables:
                return quotes
            
            # 处理每个表（每只股票一个表）
            for table_data in tables:
                if 'table' not in table_data:
                    continue
                
                table = table_data['table']
                code = table_data.get('thscode', '')
                
                # 获取时间信息
                time_list = table_data.get('time', [])
                timestamp_str = time_list[0] if time_list else None
                
                try:
                    # 解析时间戳
                    if timestamp_str:
                        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                    else:
                        timestamp = datetime.now()
                    
                    quote = RealtimeQuote(
                        code=code,
                        timestamp=timestamp,
                        latest=self._safe_float(self._get_first_value(table.get('latest'))),
                        open=self._safe_float(self._get_first_value(table.get('open'))),
                        high=self._safe_float(self._get_first_value(table.get('high'))),
                        low=self._safe_float(self._get_first_value(table.get('low'))),
                        pre_close=self._safe_float(self._get_first_value(table.get('preClose'))),
                        volume=self._safe_int(self._get_first_value(table.get('volume'))),
                        amount=self._safe_float(self._get_first_value(table.get('amount'))),
                        chg=self._safe_float(self._get_first_value(table.get('chg'))),
                        chg_pct=self._safe_float(self._get_first_value(table.get('chg_pct'))),
                        turnover_ratio=self._safe_float(self._get_first_value(table.get('turnover_ratio'))),
                        pe_ttm=self._safe_float(self._get_first_value(table.get('pe_ttm'))),
                        pb=self._safe_float(self._get_first_value(table.get('pb'))),
                        market_cap=self._safe_float(self._get_first_value(table.get('market_cap'))),
                        float_market_cap=self._safe_float(self._get_first_value(table.get('float_market_cap')))
                    )
                    quotes.append(quote)
                    
                except Exception as e:
                    logger.warning(f"解析实时行情项失败: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"解析实时行情数据失败: {e}")
        
        return quotes
    
    def _get_first_value(self, value_list):
        """获取列表的第一个值，如果不是列表则直接返回"""
        if isinstance(value_list, list) and value_list:
            return value_list[0]
        return value_list
    
    def _parse_historical_data(self, api_result: Dict[str, Any], codes: List[str]) -> List[HistoricalQuote]:
        """解析历史数据"""
        historical_data = []
        
        try:
            # 检查API返回结构
            if 'tables' not in api_result:
                return historical_data
            
            tables = api_result['tables']
            if not isinstance(tables, list) or not tables:
                return historical_data
            
            # 获取第一个表的数据
            table_data = tables[0]
            if 'time' not in table_data or 'table' not in table_data:
                return historical_data
            
            times = table_data['time']
            table = table_data['table']
            
            # 转换数据格式
            for i, time_str in enumerate(times):
                try:
                    # 解析交易日期
                    trade_date = datetime.strptime(time_str, '%Y-%m-%d').date()
                    
                    quote = HistoricalQuote(
                        code=table_data.get('thscode', codes[0] if codes else ''),
                        trade_date=trade_date,
                        open=self._safe_float(table.get('open', [None] * len(times))[i]),
                        high=self._safe_float(table.get('high', [None] * len(times))[i]),
                        low=self._safe_float(table.get('low', [None] * len(times))[i]),
                        close=self._safe_float(table.get('close', [None] * len(times))[i]),
                        volume=self._safe_int(table.get('volume', [None] * len(times))[i]),
                        amount=self._safe_float(table.get('amount', [None] * len(times))[i]),
                        adj_close=self._safe_float(table.get('adj_close', [None] * len(times))[i]),
                        chg=self._safe_float(table.get('chg', [None] * len(times))[i]),
                        chg_pct=self._safe_float(table.get('chg_pct', [None] * len(times))[i]),
                        turnover_ratio=self._safe_float(table.get('turnover_ratio', [None] * len(times))[i]),
                        pe_ttm=self._safe_float(table.get('pe_ttm', [None] * len(times))[i]),
                        pb=self._safe_float(table.get('pb', [None] * len(times))[i])
                    )
                    historical_data.append(quote)
                    
                except Exception as e:
                    logger.warning(f"解析历史数据项失败: {e}")
                    continue

        
        except Exception as e:
            logger.error(f"解析历史数据失败: {e}")
        
        return historical_data
    
    def _parse_technical_indicators(self, api_result: Dict[str, Any], codes: List[str]) -> List[TechnicalIndicator]:
        """解析技术指标数据"""
        indicators = []
        
        try:
            # 检查API返回格式
            if 'tables' not in api_result:
                logger.warning("API结果中没有tables字段")
                return indicators
            
            tables = api_result['tables']
            if not isinstance(tables, list) or not tables:
                logger.warning("tables字段为空或格式不正确")
                return indicators
            
            # 处理每个股票的数据
            for table in tables:
                try:
                    stock_code = table.get('thscode', codes[0] if codes else '')
                    time_list = table.get('time', [])
                    data_table = table.get('table', {})
                    
                    if not time_list or not data_table:
                        continue
                    
                    # 为每个时间点创建技术指标记录
                    for i, date_str in enumerate(time_list):
                        try:
                            trade_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                            
                            # 提取该时间点的所有指标值
                            values = {}
                            for indicator_name, value_list in data_table.items():
                                if i < len(value_list) and value_list[i] is not None:
                                    values[indicator_name] = self._safe_float(value_list[i])
                            
                            if values:  # 只有当有指标值时才创建记录
                                indicator = TechnicalIndicator(
                                    code=stock_code,
                                    trade_date=trade_date,
                                    indicator_name='mixed',  # 混合指标
                                    values=values
                                )
                                indicators.append(indicator)
                                
                        except Exception as e:
                            logger.warning(f"解析日期 {date_str} 的技术指标失败: {e}")
                            continue
                            
                except Exception as e:
                    logger.warning(f"解析股票 {table.get('thscode', 'unknown')} 的技术指标失败: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"解析技术指标数据失败: {e}")
        
        return indicators
    
    def _get_hot_stocks_from_api(self, market: Optional[MarketType], limit: int) -> List[StockInfo]:
        """从API获取热门股票（示例实现）"""
        # 这里是一个示例实现，实际应该根据具体的API接口来实现
        hot_stocks = []
        
        try:
            # 可以根据成交量、涨幅等指标来获取热门股票
            # 这里使用一些示例数据
            sample_codes = [
                '000001.SZ', '000002.SZ', '000858.SZ', '002415.SZ',
                '600000.SH', '600036.SH', '600519.SH', '600887.SH'
            ]
            
            for code in sample_codes[:limit]:
                stock_code, market_type = parse_stock_code(code)
                if market and market_type != market:
                    continue
                
                stock = StockInfo(
                    code=code,
                    name=f"股票{stock_code}",
                    market=market_type,
                    status=TradeStatus.TRADING
                )
                hot_stocks.append(stock)
        
        except Exception as e:
            logger.error(f"获取热门股票失败: {e}")
        
        return hot_stocks
    
    def _safe_float(self, value: Any) -> Optional[float]:
        """安全转换为浮点数"""
        if value is None or value == '':
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def _safe_int(self, value: Any) -> Optional[int]:
        """安全转换为整数"""
        if value is None or value == '':
            return None
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None


class StockSearchService:
    """股票搜索专用服务"""
    
    def __init__(self, query_service: StockQueryService):
        self.query_service = query_service
    
    def search_by_code(self, code: str) -> QueryResponse:
        """按代码搜索股票"""
        request = SearchRequest(
            keyword=code,
            search_type="code",
            limit=1
        )
        return self.query_service.search_stocks(request)
    
    def search_by_name(self, name: str, limit: int = 20) -> QueryResponse:
        """按名称搜索股票"""
        request = SearchRequest(
            keyword=name,
            search_type="name",
            limit=limit
        )
        return self.query_service.search_stocks(request)
    
    def search_by_keyword(self, keyword: str, limit: int = 20) -> QueryResponse:
        """按关键词搜索股票"""
        request = SearchRequest(
            keyword=keyword,
            search_type="all",
            limit=limit
        )
        return self.query_service.search_stocks(request)
    
    def search_by_industry(self, industry: str, limit: int = 50) -> QueryResponse:
        """按行业搜索股票"""
        request = SearchRequest(
            keyword=industry,
            search_type="industry",
            limit=limit
        )
        return self.query_service.search_stocks(request)