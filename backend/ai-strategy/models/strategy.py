"""策略数据模型"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from enum import Enum
import re

class StrategyType(str, Enum):
    """策略类型"""
    TREND_FOLLOWING = "trend_following"
    MEAN_REVERSION = "mean_reversion"
    MOMENTUM = "momentum"
    ARBITRAGE = "arbitrage"
    MARKET_MAKING = "market_making"
    PAIRS_TRADING = "pairs_trading"
    STATISTICAL_ARBITRAGE = "statistical_arbitrage"
    CUSTOM = "custom"

class SignalType(str, Enum):
    """信号类型"""
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"
    STRONG_BUY = "strong_buy"
    STRONG_SELL = "strong_sell"

class ParameterType(str, Enum):
    """参数类型"""
    INTEGER = "integer"
    FLOAT = "float"
    STRING = "string"
    BOOLEAN = "boolean"
    LIST = "list"
    DICT = "dict"

class StrategyParameter(BaseModel):
    """策略参数定义"""
    
    name: str = Field(
        ...,
        description="参数名称",
        example="rsi_period"
    )
    
    type: ParameterType = Field(
        ...,
        description="参数类型"
    )
    
    default_value: Any = Field(
        ...,
        description="默认值",
        example=14
    )
    
    min_value: Optional[Union[int, float]] = Field(
        default=None,
        description="最小值",
        example=5
    )
    
    max_value: Optional[Union[int, float]] = Field(
        default=None,
        description="最大值",
        example=50
    )
    
    description: str = Field(
        ...,
        description="参数描述",
        example="RSI计算周期"
    )
    
    options: Optional[List[Any]] = Field(
        default=None,
        description="可选值列表",
        example=None
    )
    
    required: bool = Field(
        default=True,
        description="是否必需"
    )
    
    @validator('default_value')
    def validate_default_value(cls, v, values):
        """验证默认值类型"""
        param_type = values.get('type')
        if param_type == ParameterType.INTEGER and not isinstance(v, int):
            raise ValueError(f"整数参数的默认值必须是整数: {v}")
        elif param_type == ParameterType.FLOAT and not isinstance(v, (int, float)):
            raise ValueError(f"浮点数参数的默认值必须是数字: {v}")
        elif param_type == ParameterType.BOOLEAN and not isinstance(v, bool):
            raise ValueError(f"布尔参数的默认值必须是布尔值: {v}")
        return v

class RiskMetric(BaseModel):
    """风险指标"""
    
    name: str = Field(
        ...,
        description="指标名称",
        example="max_drawdown"
    )
    
    value: float = Field(
        ...,
        description="指标值",
        example=0.15
    )
    
    description: str = Field(
        ...,
        description="指标描述",
        example="最大回撤"
    )
    
    unit: str = Field(
        default="",
        description="单位",
        example="%"
    )
    
    benchmark: Optional[float] = Field(
        default=None,
        description="基准值",
        example=0.20
    )

class PerformanceMetric(BaseModel):
    """性能指标"""
    
    name: str = Field(
        ...,
        description="指标名称",
        example="sharpe_ratio"
    )
    
    value: float = Field(
        ...,
        description="指标值",
        example=1.25
    )
    
    description: str = Field(
        ...,
        description="指标描述",
        example="夏普比率"
    )
    
    higher_is_better: bool = Field(
        default=True,
        description="数值越高越好"
    )

class StrategySignal(BaseModel):
    """策略信号"""
    
    timestamp: datetime = Field(
        ...,
        description="信号时间"
    )
    
    signal_type: SignalType = Field(
        ...,
        description="信号类型"
    )
    
    strength: float = Field(
        ...,
        description="信号强度",
        ge=0.0,
        le=1.0
    )
    
    price: Optional[float] = Field(
        default=None,
        description="信号价格"
    )
    
    volume: Optional[float] = Field(
        default=None,
        description="建议交易量"
    )
    
    confidence: float = Field(
        ...,
        description="置信度",
        ge=0.0,
        le=1.0
    )
    
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="信号元数据"
    )

class StrategyCode(BaseModel):
    """策略代码"""
    
    class_name: str = Field(
        ...,
        description="策略类名",
        example="RSIReversalStrategy"
    )
    
    code: str = Field(
        ...,
        description="策略代码",
        min_length=50
    )
    
    imports: List[str] = Field(
        default_factory=list,
        description="导入语句",
        example=["import pandas as pd", "import numpy as np"]
    )
    
    methods: List[str] = Field(
        default_factory=list,
        description="方法列表",
        example=["__init__", "generate_signals", "calculate_rsi"]
    )
    
    dependencies: List[str] = Field(
        default_factory=list,
        description="依赖包",
        example=["pandas", "numpy", "talib"]
    )
    
    ptrade_compliant: bool = Field(
        default=True,
        description="是否符合PTrade规范"
    )
    
    @validator('class_name')
    def validate_class_name(cls, v):
        """验证类名格式"""
        if not re.match(r'^[A-Z][a-zA-Z0-9_]*$', v):
            raise ValueError("类名必须以大写字母开头，只能包含字母、数字和下划线")
        return v
    
    @validator('code')
    def validate_code_structure(cls, v):
        """验证代码结构"""
        # 检查是否包含必需的方法
        required_methods = ['__init__', 'generate_signals']
        for method in required_methods:
            if f'def {method}' not in v:
                raise ValueError(f"策略代码必须包含 {method} 方法")
        return v

class Strategy(BaseModel):
    """完整的策略模型"""
    
    id: str = Field(
        ...,
        description="策略ID",
        example="strategy_rsi_reversal_001"
    )
    
    name: str = Field(
        ...,
        description="策略名称",
        example="RSI反转策略"
    )
    
    description: str = Field(
        ...,
        description="策略描述",
        example="基于RSI指标的经典反转策略，当RSI低于30时买入，高于70时卖出"
    )
    
    strategy_type: StrategyType = Field(
        ...,
        description="策略类型"
    )
    
    code: StrategyCode = Field(
        ...,
        description="策略代码"
    )
    
    parameters: List[StrategyParameter] = Field(
        default_factory=list,
        description="策略参数"
    )
    
    risk_metrics: List[RiskMetric] = Field(
        default_factory=list,
        description="风险指标"
    )
    
    performance_metrics: List[PerformanceMetric] = Field(
        default_factory=list,
        description="性能指标"
    )
    
    market_types: List[str] = Field(
        default_factory=list,
        description="适用市场类型",
        example=["stock", "crypto"]
    )
    
    timeframes: List[str] = Field(
        default_factory=list,
        description="适用时间周期",
        example=["1d", "4h", "1h"]
    )
    
    tags: List[str] = Field(
        default_factory=list,
        description="策略标签",
        example=["rsi", "reversal", "technical_indicator"]
    )
    
    author: str = Field(
        default="AI Generated",
        description="策略作者"
    )
    
    version: str = Field(
        default="1.0.0",
        description="策略版本"
    )
    
    created_at: datetime = Field(
        default_factory=datetime.now,
        description="创建时间"
    )
    
    updated_at: datetime = Field(
        default_factory=datetime.now,
        description="更新时间"
    )
    
    is_active: bool = Field(
        default=True,
        description="是否激活"
    )
    
    confidence_score: float = Field(
        default=0.0,
        description="策略置信度",
        ge=0.0,
        le=1.0
    )
    
    backtest_results: Optional[Dict[str, Any]] = Field(
        default=None,
        description="回测结果"
    )
    
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="策略元数据"
    )
    
    class Config:
        """Pydantic配置"""
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        schema_extra = {
            "example": {
                "id": "strategy_rsi_reversal_001",
                "name": "RSI反转策略",
                "description": "基于RSI指标的经典反转策略",
                "strategy_type": "mean_reversion",
                "market_types": ["stock", "crypto"],
                "timeframes": ["1d", "4h"],
                "tags": ["rsi", "reversal", "technical_indicator"],
                "confidence_score": 0.85
            }
        }

class StrategyComparison(BaseModel):
    """策略对比结果"""
    
    strategies: List[Strategy] = Field(
        ...,
        description="对比的策略列表"
    )
    
    comparison_metrics: Dict[str, Dict[str, float]] = Field(
        ...,
        description="对比指标",
        example={
            "sharpe_ratio": {"strategy_1": 1.25, "strategy_2": 1.18},
            "max_drawdown": {"strategy_1": 0.15, "strategy_2": 0.18}
        }
    )
    
    best_strategy_id: str = Field(
        ...,
        description="最佳策略ID"
    )
    
    ranking: List[str] = Field(
        ...,
        description="策略排名（按ID）"
    )
    
    comparison_summary: str = Field(
        ...,
        description="对比总结"
    )
    
    created_at: datetime = Field(
        default_factory=datetime.now,
        description="对比时间"
    )