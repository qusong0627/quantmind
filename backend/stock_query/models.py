#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
股票查询系统数据模型
定义股票相关的数据结构和模型类
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum
import json


class MarketType(Enum):
    """市场类型枚举"""
    SZ = "SZ"  # 深圳证券交易所
    SH = "SH"  # 上海证券交易所
    BJ = "BJ"  # 北京证券交易所
    HK = "HK"  # 香港证券交易所
    US = "US"  # 美国证券交易所


class TradeStatus(Enum):
    """交易状态枚举"""
    TRADING = "trading"        # 正常交易
    SUSPENDED = "suspended"    # 停牌
    DELISTED = "delisted"      # 退市
    PRE_MARKET = "pre_market"  # 盘前
    AFTER_MARKET = "after_market"  # 盘后
    CLOSED = "closed"          # 休市


class AdjustType(Enum):
    """复权类型枚举"""
    NONE = "none"      # 不复权
    FORWARD = "qfq"    # 前复权
    BACKWARD = "hfq"   # 后复权


class DataFrequency(Enum):
    """数据频率枚举"""
    MINUTE_1 = "1m"    # 1分钟
    MINUTE_5 = "5m"    # 5分钟
    MINUTE_15 = "15m"  # 15分钟
    MINUTE_30 = "30m"  # 30分钟
    HOUR_1 = "1h"      # 1小时
    DAILY = "D"        # 日线
    WEEKLY = "W"       # 周线
    MONTHLY = "M"      # 月线


@dataclass
class StockInfo:
    """股票基础信息"""
    code: str                           # 股票代码 (000001.SZ)
    name: str                           # 股票名称
    market: MarketType                  # 市场类型
    industry: Optional[str] = None      # 所属行业
    sector: Optional[str] = None        # 所属板块
    list_date: Optional[date] = None    # 上市日期
    total_shares: Optional[float] = None # 总股本(万股)
    float_shares: Optional[float] = None # 流通股本(万股)
    status: TradeStatus = TradeStatus.TRADING  # 交易状态
    company_name: Optional[str] = None  # 公司全称
    exchange: Optional[str] = None      # 交易所
    currency: str = "CNY"               # 交易货币
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'code': self.code,
            'name': self.name,
            'market': self.market.value,
            'industry': self.industry,
            'sector': self.sector,
            'list_date': self.list_date.isoformat() if self.list_date else None,
            'total_shares': self.total_shares,
            'float_shares': self.float_shares,
            'status': self.status.value,
            'company_name': self.company_name,
            'exchange': self.exchange,
            'currency': self.currency,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StockInfo':
        """从字典创建实例"""
        return cls(
            code=data['code'],
            name=data['name'],
            market=MarketType(data['market']),
            industry=data.get('industry'),
            sector=data.get('sector'),
            list_date=date.fromisoformat(data['list_date']) if data.get('list_date') else None,
            total_shares=data.get('total_shares'),
            float_shares=data.get('float_shares'),
            status=TradeStatus(data.get('status', 'trading')),
            company_name=data.get('company_name'),
            exchange=data.get('exchange'),
            currency=data.get('currency', 'CNY'),
            created_at=datetime.fromisoformat(data.get('created_at', datetime.now().isoformat())),
            updated_at=datetime.fromisoformat(data.get('updated_at', datetime.now().isoformat()))
        )


@dataclass
class RealtimeQuote:
    """实时行情数据"""
    code: str                           # 股票代码
    timestamp: datetime                 # 时间戳
    latest: Optional[float] = None      # 最新价
    open: Optional[float] = None        # 开盘价
    high: Optional[float] = None        # 最高价
    low: Optional[float] = None         # 最低价
    pre_close: Optional[float] = None   # 昨收价
    volume: Optional[int] = None        # 成交量(股)
    amount: Optional[float] = None      # 成交额(元)
    chg: Optional[float] = None         # 涨跌额
    chg_pct: Optional[float] = None     # 涨跌幅(%)
    turnover_ratio: Optional[float] = None  # 换手率(%)
    pe_ttm: Optional[float] = None      # 市盈率TTM
    pb: Optional[float] = None          # 市净率
    market_cap: Optional[float] = None  # 总市值(万元)
    float_market_cap: Optional[float] = None  # 流通市值(万元)
    vol_ratio: Optional[float] = None   # 量比
    bid1: Optional[float] = None        # 买一价
    ask1: Optional[float] = None        # 卖一价
    bid1_size: Optional[int] = None     # 买一量
    ask1_size: Optional[int] = None     # 卖一量
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'code': self.code,
            'timestamp': self.timestamp.isoformat(),
            'latest': self.latest,
            'open': self.open,
            'high': self.high,
            'low': self.low,
            'pre_close': self.pre_close,
            'volume': self.volume,
            'amount': self.amount,
            'chg': self.chg,
            'chg_pct': self.chg_pct,
            'turnover_ratio': self.turnover_ratio,
            'pe_ttm': self.pe_ttm,
            'pb': self.pb,
            'market_cap': self.market_cap,
            'float_market_cap': self.float_market_cap,
            'vol_ratio': self.vol_ratio,
            'bid1': self.bid1,
            'ask1': self.ask1,
            'bid1_size': self.bid1_size,
            'ask1_size': self.ask1_size
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'RealtimeQuote':
        """从字典创建实例"""
        return cls(
            code=data['code'],
            timestamp=datetime.fromisoformat(data['timestamp']),
            latest=data.get('latest'),
            open=data.get('open'),
            high=data.get('high'),
            low=data.get('low'),
            pre_close=data.get('pre_close'),
            volume=data.get('volume'),
            amount=data.get('amount'),
            chg=data.get('chg'),
            chg_pct=data.get('chg_pct'),
            turnover_ratio=data.get('turnover_ratio'),
            pe_ttm=data.get('pe_ttm'),
            pb=data.get('pb'),
            market_cap=data.get('market_cap'),
            float_market_cap=data.get('float_market_cap'),
            vol_ratio=data.get('vol_ratio'),
            bid1=data.get('bid1'),
            ask1=data.get('ask1'),
            bid1_size=data.get('bid1_size'),
            ask1_size=data.get('ask1_size')
        )


@dataclass
class HistoricalQuote:
    """历史行情数据"""
    code: str                           # 股票代码
    trade_date: date                    # 交易日期
    open: Optional[float] = None        # 开盘价
    high: Optional[float] = None        # 最高价
    low: Optional[float] = None         # 最低价
    close: Optional[float] = None       # 收盘价
    volume: Optional[int] = None        # 成交量(股)
    amount: Optional[float] = None      # 成交额(元)
    adj_close: Optional[float] = None   # 复权收盘价
    chg: Optional[float] = None         # 涨跌额
    chg_pct: Optional[float] = None     # 涨跌幅(%)
    turnover_ratio: Optional[float] = None  # 换手率(%)
    pe_ttm: Optional[float] = None      # 市盈率TTM
    pb: Optional[float] = None          # 市净率
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'code': self.code,
            'trade_date': self.trade_date.isoformat(),
            'open': self.open,
            'high': self.high,
            'low': self.low,
            'close': self.close,
            'volume': self.volume,
            'amount': self.amount,
            'adj_close': self.adj_close,
            'chg': self.chg,
            'chg_pct': self.chg_pct,
            'turnover_ratio': self.turnover_ratio,
            'pe_ttm': self.pe_ttm,
            'pb': self.pb
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'HistoricalQuote':
        """从字典创建实例"""
        return cls(
            code=data['code'],
            trade_date=date.fromisoformat(data['trade_date']),
            open=data.get('open'),
            high=data.get('high'),
            low=data.get('low'),
            close=data.get('close'),
            volume=data.get('volume'),
            amount=data.get('amount'),
            adj_close=data.get('adj_close'),
            chg=data.get('chg'),
            chg_pct=data.get('chg_pct'),
            turnover_ratio=data.get('turnover_ratio'),
            pe_ttm=data.get('pe_ttm'),
            pb=data.get('pb')
        )


@dataclass
class TechnicalIndicator:
    """技术指标数据"""
    code: str                           # 股票代码
    trade_date: date                    # 交易日期
    indicator_name: str                 # 指标名称
    values: Dict[str, float]            # 指标值字典
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'code': self.code,
            'trade_date': self.trade_date.isoformat(),
            'indicator_name': self.indicator_name,
            'values': self.values
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TechnicalIndicator':
        """从字典创建实例"""
        return cls(
            code=data['code'],
            trade_date=date.fromisoformat(data['trade_date']),
            indicator_name=data['indicator_name'],
            values=data['values']
        )


@dataclass
class QueryRequest:
    """查询请求基类"""
    codes: List[str]                    # 股票代码列表
    start_date: Optional[date] = None   # 开始日期
    end_date: Optional[date] = None     # 结束日期
    limit: int = 100                    # 返回数量限制
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'codes': self.codes,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'limit': self.limit
        }


@dataclass
class RealtimeQueryRequest(QueryRequest):
    """实时行情查询请求"""
    indicators: List[str] = field(default_factory=lambda: [
        'latest', 'open', 'high', 'low', 'pre_close', 'volume', 'amount',
        'chg', 'chg_pct', 'turnover_ratio', 'pe_ttm', 'pb'
    ])


@dataclass
class HistoricalQueryRequest(QueryRequest):
    """历史数据查询请求"""
    frequency: DataFrequency = DataFrequency.DAILY  # 数据频率
    adjust_type: AdjustType = AdjustType.FORWARD    # 复权类型
    indicators: List[str] = field(default_factory=lambda: [
        'open', 'high', 'low', 'close', 'volume', 'amount', 'chg_pct'
    ])


@dataclass
class TechnicalIndicatorRequest(QueryRequest):
    """技术指标查询请求"""
    indicators: List[str] = field(default_factory=lambda: ['MA5', 'MA10', 'MA20'])
    frequency: DataFrequency = DataFrequency.DAILY
    parameters: Dict[str, Any] = field(default_factory=dict)  # 指标参数


@dataclass
class SearchRequest:
    """股票搜索请求"""
    keyword: str                        # 搜索关键词
    search_type: str = "all"            # 搜索类型: code, name, pinyin, industry, all
    market: Optional[MarketType] = None # 市场限制
    limit: int = 20                     # 返回数量限制
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'keyword': self.keyword,
            'search_type': self.search_type,
            'market': self.market.value if self.market else None,
            'limit': self.limit
        }


@dataclass
class QueryResponse:
    """查询响应基类"""
    success: bool                       # 是否成功
    message: str = ""                   # 响应消息
    data: Any = None                    # 响应数据
    total: int = 0                      # 总数量
    timestamp: datetime = field(default_factory=datetime.now)  # 响应时间戳
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'success': self.success,
            'message': self.message,
            'data': self.data,
            'total': self.total,
            'timestamp': self.timestamp.isoformat()
        }
    
    def to_json(self) -> str:
        """转换为JSON字符串"""
        return json.dumps(self.to_dict(), ensure_ascii=False, default=str)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'QueryResponse':
        """从字典创建实例"""
        return cls(
            success=data['success'],
            message=data.get('message', ''),
            data=data.get('data'),
            total=data.get('total', 0),
            timestamp=datetime.fromisoformat(data.get('timestamp', datetime.now().isoformat()))
        )


# 常用指标映射
INDICATOR_MAPPING = {
    # 实时行情指标
    'latest': '最新价',
    'open': '开盘价',
    'high': '最高价',
    'low': '最低价',
    'pre_close': '昨收价',
    'volume': '成交量',
    'amount': '成交额',
    'chg': '涨跌额',
    'chg_pct': '涨跌幅',
    'turnover_ratio': '换手率',
    'pe_ttm': '市盈率TTM',
    'pb': '市净率',
    'market_cap': '总市值',
    'float_market_cap': '流通市值',
    
    # 技术指标
    'MA5': '5日均线',
    'MA10': '10日均线',
    'MA20': '20日均线',
    'MA60': '60日均线',
    'MACD': 'MACD',
    'RSI': 'RSI',
    'KDJ': 'KDJ',
    'BOLL': '布林带',
    'WR': '威廉指标',
    'CCI': 'CCI',
    'OBV': 'OBV',
    'VOL': '成交量'
}


# 市场代码映射
MARKET_CODE_MAPPING = {
    'SZ': '深圳证券交易所',
    'SH': '上海证券交易所',
    'BJ': '北京证券交易所',
    'HK': '香港证券交易所',
    'US': '美国证券交易所'
}


def parse_stock_code(code: str) -> tuple[str, MarketType]:
    """解析股票代码，返回代码和市场类型
    
    Args:
        code: 股票代码，如 '000001.SZ' 或 '000001'
        
    Returns:
        tuple: (纯代码, 市场类型)
    """
    if '.' in code:
        stock_code, market_suffix = code.split('.', 1)
        try:
            market = MarketType(market_suffix.upper())
        except ValueError:
            market = MarketType.SZ  # 默认深圳
    else:
        stock_code = code
        # 根据代码规则推断市场
        if code.startswith(('000', '001', '002', '003', '300')):
            market = MarketType.SZ
        elif code.startswith(('600', '601', '603', '605', '688')):
            market = MarketType.SH
        elif code.startswith(('4', '8')):
            market = MarketType.BJ
        else:
            market = MarketType.SZ  # 默认深圳
    
    return stock_code, market


def format_stock_code(code: str, market: MarketType) -> str:
    """格式化股票代码
    
    Args:
        code: 纯股票代码
        market: 市场类型
        
    Returns:
        str: 格式化后的代码，如 '000001.SZ'
    """
    return f"{code}.{market.value}"