"""请求数据模型"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime

class ModelType(str, Enum):
    """支持的模型类型"""
    QWEN = "qwen"
    GEMINI = "gemini"
    OPENAI = "openai"
    ALL = "all"

class MarketType(str, Enum):
    """市场类型"""
    STOCK = "stock"
    CRYPTO = "crypto"
    FUTURES = "futures"
    FOREX = "forex"

class RiskLevel(str, Enum):
    """风险等级"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TimeFrame(str, Enum):
    """时间周期"""
    MINUTE_1 = "1m"
    MINUTE_5 = "5m"
    MINUTE_15 = "15m"
    MINUTE_30 = "30m"
    HOUR_1 = "1h"
    HOUR_4 = "4h"
    DAY_1 = "1d"
    DAY_3 = "3d"
    WEEK_1 = "1w"
    WEEK_2 = "2w"
    MONTH_1 = "1M"
    MONTH_3 = "3M"
    MONTH_6 = "6M"
    YEAR_1 = "1Y"

class StrategyRequest(BaseModel):
    """策略生成请求模型"""
    
    description: str = Field(
        ..., 
        description="策略描述",
        min_length=10,
        max_length=1000,
        example="创建一个基于RSI指标的反转策略，当RSI低于30时买入，高于70时卖出"
    )
    
    user_id: str = Field(
        ..., 
        description="用户ID",
        min_length=1,
        max_length=100,
        example="user_123"
    )
    
    models: List[ModelType] = Field(
        default=[ModelType.QWEN],
        description="使用的模型列表，默认使用通义千问",
        example=["qwen"]
    )
    
    market_type: MarketType = Field(
        default=MarketType.STOCK,
        description="市场类型",
        example="stock"
    )
    
    timeframe: TimeFrame = Field(
        default=TimeFrame.DAY_1,
        description="时间周期",
        example="1d"
    )
    
    risk_level: RiskLevel = Field(
        default=RiskLevel.MEDIUM,
        description="风险等级",
        example="medium"
    )
    
    parameters: Optional[Dict[str, Any]] = Field(
        default=None,
        description="自定义参数",
        example={"rsi_period": 14, "oversold": 30, "overbought": 70}
    )
    
    template_id: Optional[str] = Field(
        default=None,
        description="策略模板ID",
        example="rsi_reversal"
    )
    
    ptrade_syntax: bool = Field(
        default=True,
        description="是否使用PTrade语法",
        example=True
    )
    
    optimization_enabled: bool = Field(
        default=False,
        description="是否启用策略优化",
        example=False
    )
    
    @validator('models')
    def validate_models(cls, v):
        """验证模型列表"""
        if not v:
            raise ValueError("至少需要指定一个模型")
        
        # 如果包含ALL，则替换为所有可用模型，通义千问优先
        if ModelType.ALL in v:
            return [ModelType.QWEN, ModelType.GEMINI, ModelType.OPENAI]
        
        return v
    
    @validator('description')
    def validate_description(cls, v):
        """验证策略描述"""
        if not v.strip():
            raise ValueError("策略描述不能为空")
        return v.strip()
    
    class Config:
        """Pydantic配置"""
        use_enum_values = True
        schema_extra = {
            "example": {
                "description": "创建一个基于RSI指标的反转策略，当RSI低于30时买入，高于70时卖出",
                "user_id": "user_123",
                "models": ["qwen"],
                "market_type": "stock",
                "timeframe": "1d",
                "risk_level": "medium",
                "parameters": {
                    "rsi_period": 14,
                    "oversold": 30,
                    "overbought": 70
                },
                "ptrade_syntax": True,
                "optimization_enabled": False
            }
        }

class StrategyOptimizationRequest(BaseModel):
    """策略优化请求模型"""
    
    strategy_code: str = Field(
        ...,
        description="策略代码",
        min_length=50
    )
    
    optimization_params: Dict[str, Any] = Field(
        ...,
        description="优化参数",
        example={
            "rsi_period": {"min": 10, "max": 20, "step": 1},
            "oversold": {"min": 20, "max": 35, "step": 5}
        }
    )
    
    optimization_metric: str = Field(
        default="sharpe_ratio",
        description="优化指标",
        example="sharpe_ratio"
    )
    
    max_iterations: int = Field(
        default=100,
        description="最大迭代次数",
        ge=10,
        le=1000
    )

class StrategyValidationRequest(BaseModel):
    """策略验证请求模型"""
    
    code: str = Field(
        ...,
        description="策略代码",
        min_length=10
    )
    
    strict_mode: bool = Field(
        default=True,
        description="是否启用严格模式验证"
    )
    
    ptrade_syntax: bool = Field(
        default=True,
        description="是否验证PTrade语法"
    )

class TemplateListRequest(BaseModel):
    """模板列表请求模型"""
    
    category: Optional[str] = Field(
        default=None,
        description="模板分类",
        example="trend_following"
    )
    
    market_type: Optional[MarketType] = Field(
        default=None,
        description="市场类型过滤"
    )
    
    search_keyword: Optional[str] = Field(
        default=None,
        description="搜索关键词",
        max_length=100
    )
    
    limit: int = Field(
        default=20,
        description="返回数量限制",
        ge=1,
        le=100
    )
    
    offset: int = Field(
        default=0,
        description="偏移量",
        ge=0
    )

class ChatRequest(BaseModel):
    """聊天请求模型"""
    
    message: str = Field(
        ...,
        description="用户消息",
        min_length=1,
        max_length=2000
    )
    
    user_id: str = Field(
        ...,
        description="用户ID"
    )
    
    session_id: Optional[str] = Field(
        default=None,
        description="会话ID"
    )
    
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="上下文信息"
    )
    
    model: ModelType = Field(
        default=ModelType.QWEN,
        description="使用的模型"
    )