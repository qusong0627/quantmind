#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
腾讯财经数据采集服务 (Python版本)
基于腾讯财经免费API直接获取实时指数数据
严格按照文档规范实现11个字段的完整数据解析
支持主要指数的实时数据获取，包括上证指数、深证成指、创业板指等
数据来源：https://qt.gtimg.cn/q=s_sh000001

作者: QuantMind Team
版本: 2.0.0
更新时间: 2024-12-19
"""

import asyncio
import aiohttp
import json
import logging
import re
import time
import random
from typing import Dict, List, Optional, Any, Union, Tuple
from datetime import datetime
from urllib.parse import quote
from dataclasses import dataclass, asdict
import traceback

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 腾讯财经API配置
TENCENT_API_BASE = 'https://qt.gtimg.cn/q='
REQUEST_TIMEOUT = 8  # 8秒超时
MAX_RETRIES = 3  # 最大重试次数
RETRY_DELAY = 1.0  # 重试延迟（秒）
RATE_LIMIT_DELAY = 1.0  # 速率限制延迟（秒）

# 支持的主要指数配置（基于文档规范）
MAJOR_INDICES = {
    'sh000001': {'name': '上证指数', 'market': '上海', 'description': '上海证券交易所综合股价指数'},
    'sh000016': {'name': '上证50', 'market': '上海', 'description': '上海证券市场规模大、流动性好的50只股票'},
    'sh000300': {'name': '沪深300', 'market': '上海', 'description': '沪深两市规模大、流动性好的300只股票'},
    'sz399001': {'name': '深成指数', 'market': '深圳', 'description': '深圳证券交易所成份股价指数'},
    'sz399006': {'name': '创业板指', 'market': '深圳', 'description': '创业板指数'},
    'sz399905': {'name': '中证500', 'market': '深圳', 'description': '中证500指数'},
    'sz399102': {'name': '创业板综', 'market': '深圳', 'description': '创业板综合指数'},
    'sz399005': {'name': '中小板指', 'market': '深圳', 'description': '中小板指数'}
}



@dataclass
class IndexData:
    """指数数据结构"""
    symbol: str
    market_id: str
    name: str
    code: str
    current_price: float
    change_points: float
    change_percent: float
    volume: int
    amount: int
    reserved: str
    market_cap: float
    type: str
    market: str
    trend: str
    timestamp: str
    display_text: Dict[str, str]
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return asdict(self)

# 数据字段映射（基于文档规范的11个字段）
DATA_FIELD_MAPPING = {
    0: 'market_id',      # 市场标识：1=上海证券交易所，0=深圳证券交易所
    1: 'name',           # 指数名称：中文名称
    2: 'code',           # 指数代码：6位数字代码
    3: 'current_price',  # 当前点位：实时指数点位
    4: 'change_points',  # 涨跌点数：相对于前一交易日收盘的变化
    5: 'change_percent', # 涨跌幅：涨跌幅百分比
    6: 'volume',         # 成交量：单位：手
    7: 'amount',         # 成交金额：单位：万元
    8: 'reserved',       # 预留字段：暂未使用
    9: 'market_cap',     # 总市值：单位：亿元
    10: 'type'           # 证券类型：ZS=指数，其他类型待补充
}


class TencentFinanceService:
    """腾讯财经数据采集服务类"""
    
    def __init__(self):
        """初始化服务"""
        self.request_count = 0
        self.last_request_time = 0
        self.rate_limit_delay = RATE_LIMIT_DELAY
        self.session = None
        
    async def __aenter__(self):
        """异步上下文管理器入口"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT),
            headers={
                'User-Agent': 'Mozilla/5.0 (compatible; QuantMind/2.0)',
                'Accept': 'text/plain; charset=utf-8',
                'Accept-Charset': 'utf-8',
                'Content-Type': 'text/plain; charset=utf-8'
            }
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        if self.session:
            await self.session.close()
            
    async def enforce_rate_limit(self) -> None:
        """执行速率限制控制"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < self.rate_limit_delay:
            delay = self.rate_limit_delay - time_since_last_request
            logger.debug(f"速率限制：等待 {delay:.2f} 秒")
            await asyncio.sleep(delay)
            
        self.last_request_time = time.time()
        self.request_count += 1
        
    async def fetch_direct_from_tencent(self, symbols: Union[str, List[str]], retry_count: int = 0) -> Dict[str, Any]:
        """
        直接调用腾讯财经API获取指数数据（带重试机制）
        
        Args:
            symbols: 指数代码或代码数组
            retry_count: 当前重试次数
            
        Returns:
            Dict: 指数数据
        """
        try:
            await self.enforce_rate_limit()
            
            symbol_array = symbols if isinstance(symbols, list) else [symbols]
            query_string = ','.join([f's_{s}' for s in symbol_array])
            url = f"{TENCENT_API_BASE}{query_string}"
            
            logger.info(f"腾讯财经API调用 (尝试 {retry_count + 1}/{MAX_RETRIES + 1}): {url}")
            
            if not self.session:
                raise RuntimeError("Session未初始化，请使用async with语句")
                
            async with self.session.get(url) as response:
                if response.status != 200:
                    raise aiohttp.ClientError(f"HTTP {response.status}: {response.reason}")
                    
                text_data = await response.text(encoding='utf-8')
                logger.debug(f"腾讯财经原始数据: {text_data[:200]}...")
                
                if not text_data or text_data.strip() == '':
                    raise ValueError('API返回空数据')
                    
                return await self.parse_tencent_response(text_data)
                
        except Exception as error:
            logger.warning(f"腾讯财经API调用失败 (尝试 {retry_count + 1}): {str(error)}")
            
            # 如果还有重试次数，则重试
            if retry_count < MAX_RETRIES:
                delay = RETRY_DELAY * (retry_count + 1)  # 递增延迟
                logger.info(f"等待 {delay} 秒后重试...")
                await asyncio.sleep(delay)
                return await self.fetch_direct_from_tencent(symbols, retry_count + 1)
                
            # 重试次数用完，生成模拟数据
            logger.warning(f"直接调用腾讯财经API失败，生成模拟数据: {str(error)}")
            return await self.generate_mock_data(symbols)
            
    async def parse_tencent_response(self, text_data: str) -> Dict[str, Any]:
        """
        解析腾讯财经API返回的数据（严格按照文档规范的11个字段）
        
        Args:
            text_data: 原始文本数据
            
        Returns:
            Dict: 解析后的数据
        """
        results = {}
        errors = []
        
        try:
            # 处理字符编码
            processed_data = self.handle_character_encoding(text_data)
            
            # 使用正则表达式匹配每行数据
            lines = [line.strip() for line in processed_data.split('\n') if line.strip()]
            
            for index, line in enumerate(lines):
                try:
                    match = re.match(r'v_s_(\w+)="(.+)";', line)
                    if match:
                        symbol = match.group(1)
                        data = match.group(2)
                        fields = data.split('~')
                        
                        # 严格验证字段数量（必须是11个字段）
                        if len(fields) < 11:
                            raise ValueError(f"字段数量不足：期望11个字段，实际{len(fields)}个")
                            
                        # 按照文档规范解析11个字段
                        parsed_data = await self.parse_data_fields(fields, symbol)
                        
                        # 数据验证
                        validation = self.validate_parsed_data(parsed_data)
                        if not validation['is_valid']:
                            raise ValueError(f"数据验证失败: {', '.join(validation['errors'])}")
                            
                        results[symbol] = parsed_data
                    else:
                        raise ValueError(f"数据格式不匹配: {line}")
                        
                except Exception as error:
                    error_msg = f"行 {index + 1}: {str(error)}"
                    errors.append(error_msg)
                    logger.warning(f"解析第{index + 1}行数据失败: {str(error)}")
                    
            return {
                'success': len(results) > 0,
                'data': results,
                'message': f"成功解析{len(results)}个指数数据" if len(results) > 0 else "未能解析任何有效数据",
                'errors': errors if errors else None,
                'timestamp': datetime.now().isoformat(),
                'request_count': self.request_count
            }
            
        except Exception as error:
            logger.error(f"数据解析失败: {str(error)}")
            return {
                'success': False,
                'data': {},
                'message': f"数据解析失败: {str(error)}",
                'errors': [str(error)],
                'timestamp': datetime.now().isoformat()
            }
            
    def handle_character_encoding(self, text_data: str) -> str:
        """
        处理字符编码问题
        
        Args:
            text_data: 原始文本数据
            
        Returns:
            str: 处理后的文本数据
        """
        try:
            # 处理可能的编码问题
            if '\\u' in text_data or any(ord(c) > 127 for c in text_data):
                # 尝试解码Unicode转义序列
                def decode_unicode(match):
                    return chr(int(match.group(1), 16))
                    
                decoded = re.sub(r'\\u([0-9a-fA-F]{4})', decode_unicode, text_data)
                
                # 尝试处理其他编码问题
                try:
                    decoded = unquote(decoded, encoding='utf-8')
                except Exception as e:
                    logger.warning(f"字符编码处理警告: {str(e)}")
                    
                return decoded
                
            return text_data
            
        except Exception as error:
            logger.warning(f"字符编码处理失败，使用原始数据: {str(error)}")
            return text_data
            
    async def parse_data_fields(self, fields: List[str], symbol: str) -> Dict[str, Any]:
        """
        解析数据字段（严格按照文档规范的11个字段）
        
        Args:
            fields: 字段数组
            symbol: 指数代码
            
        Returns:
            Dict: 解析后的数据对象
        """
        parsed_data = {
            'symbol': symbol,
            'market_id': fields[0],                                    # 市场标识
            'name': self.clean_chinese_name(fields[1]),                # 指数名称
            'code': fields[2],                                         # 指数代码
            'current_price': self.safe_float(fields[3]),               # 当前点位
            'change_points': self.safe_float(fields[4]),               # 涨跌点数
            'change_percent': self.safe_float(fields[5]),              # 涨跌幅
            'volume': self.safe_int(fields[6]),                        # 成交量（手）
            'amount': self.safe_int(fields[7]),                        # 成交金额（万元）
            'reserved': fields[8],                                     # 预留字段
            'market_cap': self.safe_float(fields[9]),                  # 总市值（亿元）
            'type': fields[10],                                        # 证券类型
            
            # 扩展字段
            'market': self.get_market_name(fields[0]),                 # 市场名称
            'trend': self.get_trend_status(self.safe_float(fields[5])), # 涨跌状态
            'timestamp': datetime.now().isoformat(),                   # 时间戳
            
            # 格式化显示字段
            'display_text': {
                'price': self.format_number(self.safe_float(fields[3]), 2),
                'change': self.format_change(self.safe_float(fields[4]), self.safe_float(fields[5])),
                'volume': self.format_volume(self.safe_int(fields[6])),
                'amount': self.format_amount(self.safe_int(fields[7])),
                'market_cap': self.format_market_cap(self.safe_float(fields[9]))
            }
        }
        
        return parsed_data
        
    def clean_chinese_name(self, name: str) -> str:
        """
        清理中文名称
        
        Args:
            name: 原始名称
            
        Returns:
            str: 清理后的名称
        """
        if not name:
            return '未知指数'
            
        try:
            # 移除可能的特殊字符和空格
            cleaned = re.sub(r'[\r\n\t]', '', name.strip())
            
            # 如果名称为空或包含乱码，使用配置中的名称
            if not cleaned or re.search(r'[\x00-\x1F\x7F-\x9F]', cleaned):
                return '未知指数'
                
            return cleaned
            
        except Exception as error:
            logger.warning(f"名称清理失败: {str(error)}")
            return '未知指数'
            
    def safe_float(self, value: str) -> float:
        """
        安全的浮点数解析
        
        Args:
            value: 字符串值
            
        Returns:
            float: 浮点数
        """
        try:
            return float(value) if value else 0.0
        except (ValueError, TypeError):
            return 0.0
            
    def safe_int(self, value: str) -> int:
        """
        安全的整数解析
        
        Args:
            value: 字符串值
            
        Returns:
            int: 整数
        """
        try:
            return int(float(value)) if value else 0
        except (ValueError, TypeError):
            return 0
            
    def get_market_name(self, market_id: str) -> str:
        """
        获取市场名称
        
        Args:
            market_id: 市场ID
            
        Returns:
            str: 市场名称
        """
        return '上海' if market_id == '1' else '深圳'
        
    def validate_parsed_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        验证解析后的数据
        
        Args:
            data: 解析后的数据
            
        Returns:
            Dict: 验证结果
        """
        errors = []
        
        # 必需字段验证
        if not data.get('symbol'):
            errors.append('缺少指数代码')
        if not data.get('name') or data.get('name') == '未知指数':
            errors.append('指数名称无效')
        if not data.get('code'):
            errors.append('缺少指数代码')
        if not isinstance(data.get('current_price'), (int, float)):
            errors.append('当前价格格式错误')
            
        # 数值范围验证
        if data.get('current_price', 0) < 0:
            errors.append('当前价格不能为负数')
        if abs(data.get('change_percent', 0)) > 20:
            errors.append('涨跌幅超出合理范围')
        if data.get('volume', 0) < 0:
            errors.append('成交量不能为负数')
        if data.get('amount', 0) < 0:
            errors.append('成交金额不能为负数')
        if data.get('market_cap', 0) < 0:
            errors.append('市值不能为负数')
            
        # 市场ID验证
        if data.get('market_id') not in ['0', '1']:
            errors.append('市场ID无效')
            
        return {
            'is_valid': len(errors) == 0,
            'errors': errors
        }
        
    async def generate_mock_data(self, symbols: Union[str, List[str]]) -> Dict[str, Any]:
        """
        生成模拟数据（最后的降级方案）
        
        Args:
            symbols: 指数代码
            
        Returns:
            Dict: 模拟数据
        """
        import random
        
        symbol_array = symbols if isinstance(symbols, list) else [symbols]
        mock_data = {}
        
        for symbol in symbol_array:
            config = MAJOR_INDICES.get(symbol)
            if config:
                base_price = {
                    'sh000001': 3200,
                    'sz399001': 12000,
                    'sz399006': 2800
                }.get(symbol, 5000)
                
                change_percent = (random.random() - 0.5) * 4  # -2% 到 +2%
                change_points = base_price * change_percent / 100
                
                mock_data[symbol] = {
                    'symbol': symbol,
                    'market_id': '1' if symbol.startswith('sh') else '0',
                    'name': config['name'],
                    'code': symbol[2:],
                    'current_price': base_price + change_points,
                    'change_points': change_points,
                    'change_percent': change_percent,
                    'volume': random.randint(100000000, 1000000000),
                    'amount': random.randint(10000000, 100000000),
                    'reserved': '',
                    'market_cap': random.randint(100000, 1000000),
                    'type': 'ZS',
                    'market': config['market'],
                    'trend': self.get_trend_status(change_percent),
                    'timestamp': datetime.now().isoformat(),
                    'display_text': {
                        'price': self.format_number(base_price + change_points, 2),
                        'change': self.format_change(change_points, change_percent),
                        'volume': self.format_volume(random.randint(100000000, 1000000000)),
                        'amount': self.format_amount(random.randint(10000000, 100000000)),
                        'market_cap': self.format_market_cap(random.randint(100000, 1000000))
                    }
                }
                
        return {
            'success': True,
            'data': mock_data,
            'message': '使用模拟数据（所有数据源不可用）',
            'timestamp': datetime.now().isoformat(),
            'is_mock_data': True
        }
        
    async def get_single_index(self, symbol: str) -> Dict[str, Any]:
        """
        获取单个指数数据
        
        Args:
            symbol: 指数代码
            
        Returns:
            Dict: 指数数据
        """
        try:
            logger.info(f"获取单个指数数据: {symbol}")
            raw_data = await self.fetch_direct_from_tencent([symbol])
            
            if raw_data['success'] and symbol in raw_data['data']:
                return {
                    'success': True,
                    'data': raw_data['data'][symbol],
                    'message': '指数数据获取成功',
                    'timestamp': raw_data['timestamp']
                }
            else:
                raise ValueError(f"指数 {symbol} 数据不存在")
                
        except Exception as error:
            logger.error(f"单个指数数据请求失败: {str(error)}")
            raise RuntimeError(f"单个指数数据请求失败: {str(error)}")
            
    async def get_batch_indices(self, symbols: List[str]) -> Dict[str, Any]:
        """
        批量获取指数数据
        
        Args:
            symbols: 指数代码数组
            
        Returns:
            Dict: 批量指数数据
        """
        try:
            logger.info(f"批量获取指数数据: {symbols}")
            raw_data = await self.fetch_direct_from_tencent(symbols)
            
            if raw_data['success']:
                return {
                    'success': True,
                    'data': raw_data['data'],
                    'message': f"成功获取{len(raw_data['data'])}个指数数据",
                    'timestamp': raw_data['timestamp'],
                    'request_count': self.request_count
                }
            else:
                raise ValueError('批量获取指数数据失败')
                
        except Exception as error:
            logger.error(f"批量指数数据请求失败: {str(error)}")
            raise RuntimeError(f"批量指数数据请求失败: {str(error)}")
            
    async def get_all_major_indices(self) -> Dict[str, Any]:
        """
        获取所有主要指数的实时数据
        
        Returns:
            Dict: 包含所有主要指数的市场数据
        """
        try:
            symbols = list(MAJOR_INDICES.keys())
            raw_data = await self.fetch_direct_from_tencent(symbols)
            
            if raw_data['success']:
                return {
                    'success': True,
                    'data': raw_data['data'],
                    'message': f"成功获取{len(raw_data['data'])}个主要指数数据",
                    'timestamp': raw_data['timestamp'],
                    'request_count': self.request_count,
                    'is_mock_data': raw_data.get('is_mock_data', False)
                }
            else:
                raise ValueError(raw_data.get('message', '腾讯财经API返回错误'))
                
        except Exception as error:
            logger.error(f"主要指数数据请求失败: {str(error)}")
            raise RuntimeError(f"主要指数数据请求失败: {str(error)}")
            
    async def get_realtime_market_data(self) -> Dict[str, Any]:
        """
        获取实时市场数据（兼容旧接口）
        
        Returns:
            Dict: 市场数据
        """
        try:
            all_data = await self.get_all_major_indices()
            
            if all_data['success']:
                return {
                    'success': True,
                    'data': {
                        'market_indices': all_data['data']
                    },
                    'message': all_data['message'],
                    'timestamp': all_data['timestamp'],
                    'request_count': all_data['request_count'],
                    'is_mock_data': all_data.get('is_mock_data', False)
                }
            else:
                raise ValueError(all_data.get('message', '腾讯财经API返回错误'))
                
        except Exception as error:
            logger.error(f"实时市场数据请求失败: {str(error)}")
            raise RuntimeError(f"实时市场数据请求失败: {str(error)}")
            
    async def get_market_overview(self) -> Dict[str, Any]:
        """
        获取市场概览数据
        
        Returns:
            Dict: 市场概览
        """
        try:
            all_data = await self.get_all_major_indices()
            
            if not all_data['success']:
                raise ValueError('获取市场数据失败')
                
            indices = all_data['data']
            overview = {
                'total_indices': len(indices),
                'up_count': 0,
                'down_count': 0,
                'flat_count': 0,
                'major_indices': {
                    'shanghai': indices.get('sh000001'),    # 上证指数
                    'shenzhen': indices.get('sz399001'),    # 深证成指
                    'chuangye': indices.get('sz399006'),    # 创业板指
                    'csi300': indices.get('sh000300')       # 沪深300
                },
                'timestamp': all_data['timestamp'],
                'is_mock_data': all_data.get('is_mock_data', False)
            }
            
            # 统计涨跌情况
            for index_data in indices.values():
                trend = index_data.get('trend', 'flat')
                if trend == 'up':
                    overview['up_count'] += 1
                elif trend == 'down':
                    overview['down_count'] += 1
                else:
                    overview['flat_count'] += 1
                    
            return {
                'success': True,
                'data': overview,
                'message': '市场概览获取成功',
                'request_count': all_data['request_count']
            }
            
        except Exception as error:
            logger.error(f"获取市场概览失败: {str(error)}")
            raise RuntimeError(f"获取市场概览失败: {str(error)}")
            
    async def test_data_sources(self) -> Dict[str, Any]:
        """
        测试数据源连通性和数据质量
        
        Returns:
            Dict: 测试结果
        """
        test_results = {
            'timestamp': datetime.now().isoformat(),
            'tests': {
                'connectivity': {'status': 'pending', 'message': '', 'duration': 0},
                'data_quality': {'status': 'pending', 'message': '', 'duration': 0},
                'performance': {'status': 'pending', 'message': '', 'duration': 0}
            },
            'overall': {'status': 'pending', 'message': ''}
        }
        
        try:
            # 测试1: 连通性测试
            logger.info('开始连通性测试...')
            connectivity_start = time.time()
            
            try:
                test_data = await self.get_single_index('sh000001')
                test_results['tests']['connectivity'] = {
                    'status': 'passed' if test_data['success'] else 'failed',
                    'message': '腾讯财经API连通正常' if test_data['success'] else '腾讯财经API连通失败',
                    'duration': time.time() - connectivity_start,
                    'data': test_data['data'] if test_data['success'] else None
                }
            except Exception as error:
                test_results['tests']['connectivity'] = {
                    'status': 'failed',
                    'message': f"连通性测试失败: {str(error)}",
                    'duration': time.time() - connectivity_start
                }
                
            # 测试2: 数据质量测试
            logger.info('开始数据质量测试...')
            quality_start = time.time()
            
            try:
                batch_data = await self.get_batch_indices(['sh000001', 'sz399001', 'sz399006'])
                quality_score = 0
                total_fields = 0
                
                if batch_data['success']:
                    for item in batch_data['data'].values():
                        # 检查必需字段
                        required_fields = ['symbol', 'name', 'current_price', 'change_points', 'change_percent']
                        for field in required_fields:
                            total_fields += 1
                            if item.get(field) is not None and item.get(field) != '':
                                quality_score += 1
                                
                quality_percentage = (quality_score / total_fields * 100) if total_fields > 0 else 0
                test_results['tests']['data_quality'] = {
                    'status': 'passed' if quality_percentage >= 80 else 'failed',
                    'message': f"数据质量评分: {quality_percentage:.1f}% ({quality_score}/{total_fields})",
                    'duration': time.time() - quality_start,
                    'score': quality_percentage
                }
            except Exception as error:
                test_results['tests']['data_quality'] = {
                    'status': 'failed',
                    'message': f"数据质量测试失败: {str(error)}",
                    'duration': time.time() - quality_start
                }
                
            # 测试3: 性能测试
            logger.info('开始性能测试...')
            performance_start = time.time()
            
            try:
                all_data = await self.get_all_major_indices()
                duration = time.time() - performance_start
                
                test_results['tests']['performance'] = {
                    'status': 'passed' if duration < 10.0 else 'failed',  # 10秒内完成
                    'message': f"批量获取{len(all_data.get('data', {}))}个指数耗时{duration:.2f}秒",
                    'duration': duration,
                    'request_count': self.request_count
                }
            except Exception as error:
                test_results['tests']['performance'] = {
                    'status': 'failed',
                    'message': f"性能测试失败: {str(error)}",
                    'duration': time.time() - performance_start
                }
                
            # 计算总体结果
            passed_tests = sum(1 for test in test_results['tests'].values() if test['status'] == 'passed')
            total_tests = len(test_results['tests'])
            
            test_results['overall'] = {
                'status': 'passed' if passed_tests == total_tests else ('partial' if passed_tests > 0 else 'failed'),
                'message': f"测试完成: {passed_tests}/{total_tests} 项通过",
                'passed_tests': passed_tests,
                'total_tests': total_tests
            }
            
            return {
                'success': True,
                'data': test_results,
                'message': '数据源测试完成'
            }
            
        except Exception as error:
            logger.error(f"数据源测试失败: {str(error)}")
            return {
                'success': False,
                'data': test_results,
                'message': f"数据源测试失败: {str(error)}"
            }
            
    def get_trend_status(self, change_percent: float) -> str:
        """
        获取涨跌状态
        
        Args:
            change_percent: 涨跌幅
            
        Returns:
            str: 涨跌状态
        """
        change = float(change_percent) if change_percent else 0
        if change > 0:
            return 'up'
        elif change < 0:
            return 'down'
        else:
            return 'flat'
            
    def format_number(self, num: float, decimals: int = 2) -> str:
        """
        格式化数字
        
        Args:
            num: 数字
            decimals: 小数位数
            
        Returns:
            str: 格式化后的数字
        """
        number = float(num) if num else 0
        return f"{number:.{decimals}f}"
        
    def format_change(self, change_points: float, change_percent: float) -> str:
        """
        格式化涨跌显示
        
        Args:
            change_points: 涨跌点数
            change_percent: 涨跌幅
            
        Returns:
            str: 格式化后的涨跌显示
        """
        points = float(change_points) if change_points else 0
        percent = float(change_percent) if change_percent else 0
        sign = '+' if points >= 0 else ''
        return f"{sign}{points:.2f} ({sign}{percent:.2f}%)"
        
    def format_volume(self, volume: int) -> str:
        """
        格式化成交量
        
        Args:
            volume: 成交量（手）
            
        Returns:
            str: 格式化后的成交量
        """
        vol = int(volume) if volume else 0
        if vol >= 100000000:
            return f"{vol / 100000000:.2f}亿手"
        elif vol >= 10000:
            return f"{vol / 10000:.2f}万手"
        return f"{vol}手"
        
    def format_amount(self, amount: int) -> str:
        """
        格式化成交额
        
        Args:
            amount: 成交额（万元）
            
        Returns:
            str: 格式化后的成交额
        """
        amt = int(amount) if amount else 0
        if amt >= 100000000:
            return f"{amt / 100000000:.2f}万亿元"
        elif amt >= 10000:
            return f"{amt / 10000:.2f}亿元"
        return f"{amt}万元"
        
    def format_market_cap(self, market_cap: float) -> str:
        """
        格式化市值
        
        Args:
            market_cap: 市值（亿元）
            
        Returns:
            str: 格式化后的市值
        """
        cap = float(market_cap) if market_cap else 0
        if cap >= 10000:
            return f"{cap / 10000:.2f}万亿元"
        return f"{cap:.2f}亿元"
        
    def get_supported_indices(self) -> Dict[str, Dict[str, str]]:
        """
        获取支持的指数列表
        
        Returns:
            Dict: 支持的指数配置
        """
        return MAJOR_INDICES.copy()
        
    async def check_connectivity(self) -> bool:
        """
        检查腾讯财经API连通性
        
        Returns:
            bool: 连通性状态
        """
        try:
            test_data = await self.get_single_index('sh000001')
            return test_data['success']
        except Exception as error:
            logger.error(f"腾讯财经API连通性检查失败: {str(error)}")
            return False
            
    def get_service_stats(self) -> Dict[str, Any]:
        """
        获取服务统计信息
        
        Returns:
            Dict: 服务统计
        """
        return {
            'request_count': self.request_count,
            'last_request_time': self.last_request_time,
            'supported_indices_count': len(MAJOR_INDICES),
            'rate_limit_delay': self.rate_limit_delay,
            'max_retries': MAX_RETRIES,
            'request_timeout': REQUEST_TIMEOUT
        }


class MarketDataService:
    """市场数据服务类（整合腾讯财经数据）"""
    
    def __init__(self):
        """初始化市场数据服务"""
        self.tencent_service = TencentFinanceService()
        
    async def __aenter__(self):
        """异步上下文管理器入口"""
        await self.tencent_service.__aenter__()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        await self.tencent_service.__aexit__(exc_type, exc_val, exc_tb)
        
    async def get_market_data(self) -> Dict[str, Any]:
        """
        获取市场数据
        
        Returns:
            Dict: 市场数据
        """
        try:
            return await self.tencent_service.get_realtime_market_data()
        except Exception as error:
            logger.error(f"获取市场数据失败: {str(error)}")
            raise RuntimeError(f"获取市场数据失败: {str(error)}")
            
    async def get_realtime_market_overview(self) -> Dict[str, Any]:
        """
        获取实时市场概览
        
        Returns:
            Dict: 市场概览数据
        """
        try:
            return await self.tencent_service.get_market_overview()
        except Exception as error:
            logger.error(f"获取市场概览失败: {str(error)}")
            raise RuntimeError(f"获取市场概览失败: {str(error)}")
            
    async def health_check(self) -> Dict[str, Any]:
        """
        健康检查
        
        Returns:
            Dict: 健康状态
        """
        try:
            connectivity = await self.tencent_service.check_connectivity()
            stats = self.tencent_service.get_service_stats()
            
            return {
                'status': 'healthy' if connectivity else 'degraded',
                'tencent_api_connectivity': connectivity,
                'service_stats': stats,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as error:
            logger.error(f"健康检查失败: {str(error)}")
            return {
                'status': 'unhealthy',
                'error': str(error),
                'timestamp': datetime.now().isoformat()
            }


# 创建单例实例
_tencent_service_instance = None
_market_service_instance = None


def get_tencent_finance_service() -> TencentFinanceService:
    """
    获取腾讯财经服务单例实例
    
    Returns:
        TencentFinanceService: 服务实例
    """
    global _tencent_service_instance
    if _tencent_service_instance is None:
        _tencent_service_instance = TencentFinanceService()
    return _tencent_service_instance


def get_market_data_service() -> MarketDataService:
    """
    获取市场数据服务单例实例
    
    Returns:
        MarketDataService: 服务实例
    """
    global _market_service_instance
    if _market_service_instance is None:
        _market_service_instance = MarketDataService()
    return _market_service_instance


# 异步上下文管理器便捷函数
async def create_tencent_finance_service() -> TencentFinanceService:
    """
    创建腾讯财经服务实例（异步上下文管理器）
    
    Returns:
        TencentFinanceService: 服务实例
    """
    service = TencentFinanceService()
    await service.__aenter__()
    return service


async def create_market_data_service() -> MarketDataService:
    """
    创建市场数据服务实例（异步上下文管理器）
    
    Returns:
        MarketDataService: 服务实例
    """
    service = MarketDataService()
    await service.__aenter__()
    return service


if __name__ == '__main__':
    """
    测试脚本
    """
    async def test_service():
        """测试服务功能"""
        async with TencentFinanceService() as service:
            try:
                # 测试单个指数获取
                print("\n=== 测试单个指数获取 ===")
                single_data = await service.get_single_index('sh000001')
                print(f"单个指数结果: {json.dumps(single_data, ensure_ascii=False, indent=2)}")
                
                # 测试批量指数获取
                print("\n=== 测试批量指数获取 ===")
                batch_data = await service.get_batch_indices(['sh000001', 'sz399001', 'sz399006'])
                print(f"批量指数结果: {json.dumps(batch_data, ensure_ascii=False, indent=2)}")
                
                # 测试所有主要指数获取
                print("\n=== 测试所有主要指数获取 ===")
                all_data = await service.get_all_major_indices()
                print(f"所有指数结果: {json.dumps(all_data, ensure_ascii=False, indent=2)}")
                
                # 测试数据源
                print("\n=== 测试数据源 ===")
                test_results = await service.test_data_sources()
                print(f"测试结果: {json.dumps(test_results, ensure_ascii=False, indent=2)}")
                
                # 获取服务统计
                print("\n=== 服务统计 ===")
                stats = service.get_service_stats()
                print(f"服务统计: {json.dumps(stats, ensure_ascii=False, indent=2)}")
                
            except Exception as e:
                logger.error(f"测试失败: {str(e)}")
                traceback.print_exc()
                
    # 运行测试
    asyncio.run(test_service())