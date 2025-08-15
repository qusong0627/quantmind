#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大盘数据模型
定义大盘指数相关的数据结构和模型类
市场数据结构设计
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum
import json


class MarketType(Enum):
    """市场类型枚举"""
    SHANGHAI = "上海"  # 上海证券交易所
    SHENZHEN = "深圳"  # 深圳证券交易所


class TrendStatus(Enum):
    """涨跌趋势枚举"""
    UP = "up"      # 上涨
    DOWN = "down"  # 下跌
    FLAT = "flat"  # 平盘


@dataclass
class IndexData:
    """指数数据模型"""
    symbol: str                         # 指数代码 (sh000001)
    name: str                          # 指数名称 (上证指数)
    market: MarketType                 # 市场类型
    code: str                          # 纯数字代码 (000001)
    current_price: float               # 当前点位
    change_points: float               # 涨跌点数
    change_percent: float              # 涨跌幅(%)
    volume: int                        # 成交量(手)
    amount: int                        # 成交金额(万元)
    market_cap: Optional[float] = None # 总市值(亿元)
    market_id: str = ""               # 市场标识(1=上海,2=深圳)
    type: str = "ZS"                  # 数据类型(ZS=指数)
    timestamp: datetime = field(default_factory=datetime.now)  # 数据时间戳
    
    @property
    def trend(self) -> TrendStatus:
        """计算涨跌趋势"""
        if self.change_percent > 0:
            return TrendStatus.UP
        elif self.change_percent < 0:
            return TrendStatus.DOWN
        else:
            return TrendStatus.FLAT
    
    @property
    def display_text(self) -> Dict[str, str]:
        """格式化显示文本"""
        return {
            'price': f"{self.current_price:.2f}",
            'change': f"{self.change_points:+.2f} ({self.change_percent:+.2f}%)",
            'volume': self._format_volume(self.volume),
            'amount': self._format_amount(self.amount),
            'market_cap': self._format_market_cap(self.market_cap) if self.market_cap else "--"
        }
    
    def _format_volume(self, volume: int) -> str:
        """格式化成交量"""
        if volume >= 100000000:  # 1亿手
            return f"{volume / 100000000:.2f}亿手"
        elif volume >= 10000:  # 1万手
            return f"{volume / 10000:.2f}万手"
        else:
            return f"{volume}手"
    
    def _format_amount(self, amount: int) -> str:
        """格式化成交金额"""
        if amount >= 100000:  # 10万亿
            return f"{amount / 100000:.2f}万亿"
        elif amount >= 10000:  # 1万亿
            return f"{amount / 10000:.2f}万亿"
        else:
            return f"{amount}亿"
    
    def _format_market_cap(self, market_cap: float) -> str:
        """格式化市值"""
        if market_cap >= 10000:  # 1万亿
            return f"{market_cap / 10000:.2f}万亿"
        else:
            return f"{market_cap:.2f}亿"
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'symbol': self.symbol,
            'name': self.name,
            'market': self.market.value,
            'code': self.code,
            'currentPrice': self.current_price,
            'changePoints': self.change_points,
            'changePercent': self.change_percent,
            'volume': self.volume,
            'amount': self.amount,
            'marketCap': self.market_cap,
            'marketId': self.market_id,
            'type': self.type,
            'timestamp': self.timestamp.isoformat(),
            'trend': self.trend.value,
            'displayText': self.display_text
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'IndexData':
        """从字典创建实例"""
        return cls(
            symbol=data['symbol'],
            name=data['name'],
            market=MarketType(data['market']),
            code=data['code'],
            current_price=data['currentPrice'],
            change_points=data['changePoints'],
            change_percent=data['changePercent'],
            volume=data['volume'],
            amount=data['amount'],
            market_cap=data.get('marketCap'),
            market_id=data.get('marketId', ''),
            type=data.get('type', 'ZS'),
            timestamp=datetime.fromisoformat(data['timestamp']) if isinstance(data['timestamp'], str) else data['timestamp']
        )


@dataclass
class MarketOverview:
    """市场概览数据模型"""
    total_indices: int                  # 指数总数
    up_count: int                      # 上涨数量
    down_count: int                    # 下跌数量
    flat_count: int                    # 平盘数量
    major_indices: Dict[str, Optional[IndexData]]  # 主要指数
    timestamp: datetime = field(default_factory=datetime.now)
    
    @property
    def up_ratio(self) -> float:
        """上涨比例"""
        return (self.up_count / self.total_indices * 100) if self.total_indices > 0 else 0
    
    @property
    def down_ratio(self) -> float:
        """下跌比例"""
        return (self.down_count / self.total_indices * 100) if self.total_indices > 0 else 0
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'totalIndices': self.total_indices,
            'upCount': self.up_count,
            'downCount': self.down_count,
            'flatCount': self.flat_count,
            'upRatio': self.up_ratio,
            'downRatio': self.down_ratio,
            'majorIndices': {
                key: value.to_dict() if value else None 
                for key, value in self.major_indices.items()
            },
            'timestamp': self.timestamp.isoformat()
        }


@dataclass
class MarketDataRequest:
    """市场数据请求模型"""
    symbols: Optional[List[str]] = None  # 指数代码列表
    include_major: bool = True          # 是否包含主要指数
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'symbols': self.symbols,
            'includeMajor': self.include_major
        }


@dataclass
class MarketDataResponse:
    """市场数据响应模型"""
    success: bool                       # 是否成功
    message: str = ""                  # 响应消息
    data: Optional[Dict[str, IndexData]] = None  # 指数数据字典
    overview: Optional[MarketOverview] = None    # 市场概览
    timestamp: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'success': self.success,
            'message': self.message,
            'data': {key: value.to_dict() for key, value in self.data.items()} if self.data else None,
            'overview': self.overview.to_dict() if self.overview else None,
            'timestamp': self.timestamp.isoformat()
        }
    
    def to_json(self) -> str:
        """转换为JSON字符串"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)


# 支持的主要指数配置
MAJOR_INDICES_CONFIG = {
    'sh000001': {'name': '上证指数', 'market': MarketType.SHANGHAI},
    'sh000016': {'name': '上证50', 'market': MarketType.SHANGHAI},
    'sh000300': {'name': '沪深300', 'market': MarketType.SHANGHAI},
    'sz399001': {'name': '深证成指', 'market': MarketType.SHENZHEN},
    'sz399006': {'name': '创业板指', 'market': MarketType.SHENZHEN},
    'sz399905': {'name': '中证500', 'market': MarketType.SHENZHEN},
    'sz399300': {'name': '深成300', 'market': MarketType.SHENZHEN},
    'sz399102': {'name': '创业板综', 'market': MarketType.SHENZHEN},
    'sz399005': {'name': '中小板指', 'market': MarketType.SHENZHEN}
}


def get_symbol_from_code(code: str, market_id: str) -> str:
    """根据代码和市场ID生成标准symbol"""
    prefix = 'sh' if market_id == '1' else 'sz'
    return f"{prefix}{code}"


def parse_symbol(symbol: str) -> tuple[str, str]:
    """解析symbol获取市场前缀和代码"""
    if symbol.startswith('sh'):
        return 'sh', symbol[2:]
    elif symbol.startswith('sz'):
        return 'sz', symbol[2:]
    else:
        raise ValueError(f"无效的symbol格式: {symbol}")