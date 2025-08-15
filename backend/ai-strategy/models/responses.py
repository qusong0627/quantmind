"""响应数据模型"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class ValidationStatus(str, Enum):
    """验证状态"""
    VALID = "valid"
    INVALID = "invalid"
    WARNING = "warning"

class ModelResponse(BaseModel):
    """单个模型响应"""
    
    model_name: str = Field(
        ...,
        description="模型名称",
        example="qwen"
    )
    
    code: str = Field(
        ...,
        description="生成的策略代码",
        example="class RSIStrategy:\n    def __init__(self, rsi_period=14):\n        self.rsi_period = rsi_period"
    )
    
    description: str = Field(
        ...,
        description="策略描述",
        example="基于RSI指标的反转策略"
    )
    
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="策略参数",
        example={"rsi_period": 14, "oversold": 30, "overbought": 70}
    )
    
    risk_metrics: Dict[str, float] = Field(
        default_factory=dict,
        description="风险指标",
        example={
            "max_drawdown": 0.15,
            "volatility": 0.20,
            "sharpe_ratio": 1.2,
            "win_rate": 0.65
        }
    )
    
    confidence_score: float = Field(
        ...,
        description="置信度评分",
        ge=0.0,
        le=1.0,
        example=0.85
    )
    
    execution_time: float = Field(
        ...,
        description="执行时间（秒）",
        ge=0.0,
        example=2.3
    )
    
    error: Optional[str] = Field(
        default=None,
        description="错误信息",
        example=None
    )
    
    warnings: List[str] = Field(
        default_factory=list,
        description="警告信息",
        example=[]
    )
    
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="元数据",
        example={"tokens_used": 1500, "model_version": "v2.0"}
    )

class StrategyResponse(BaseModel):
    """策略生成响应"""
    
    strategy_id: str = Field(
        ...,
        description="策略ID",
        example="strategy_user123_20240101_001"
    )
    
    request_description: str = Field(
        ...,
        description="请求描述",
        example="创建一个基于RSI指标的反转策略"
    )
    
    results: List[ModelResponse] = Field(
        ...,
        description="所有模型的结果"
    )
    
    best_result: Optional[ModelResponse] = Field(
        default=None,
        description="最佳结果"
    )
    
    comparison: Optional[Dict[str, Any]] = Field(
        default=None,
        description="模型对比结果",
        example={
            "best_model": "qwen",
            "comparison_metrics": {
                "confidence": {"qwen": 0.85, "gemini": 0.82},
                "execution_time": {"qwen": 2.3, "gemini": 3.1}
            }
        }
    )
    
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="响应元数据",
        example={
            "total_execution_time": 5.4,
            "models_used": ["qwen", "gemini"],
            "request_timestamp": "2024-01-01T12:00:00Z"
        }
    )
    
    created_at: datetime = Field(
        default_factory=datetime.now,
        description="创建时间"
    )
    
    class Config:
        """Pydantic配置"""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ValidationResult(BaseModel):
    """验证结果"""
    
    status: ValidationStatus = Field(
        ...,
        description="验证状态"
    )
    
    is_valid: bool = Field(
        ...,
        description="是否有效"
    )
    
    errors: List[str] = Field(
        default_factory=list,
        description="错误列表"
    )
    
    warnings: List[str] = Field(
        default_factory=list,
        description="警告列表"
    )
    
    suggestions: List[str] = Field(
        default_factory=list,
        description="改进建议"
    )
    
    syntax_check: Dict[str, Any] = Field(
        default_factory=dict,
        description="语法检查结果",
        example={
            "python_syntax": True,
            "ptrade_syntax": True,
            "imports_valid": True,
            "class_structure": True
        }
    )
    
    performance_metrics: Dict[str, Any] = Field(
        default_factory=dict,
        description="性能指标",
        example={
            "complexity_score": 0.3,
            "maintainability_index": 85,
            "cyclomatic_complexity": 5
        }
    )

class StrategyTemplate(BaseModel):
    """策略模板"""
    
    id: str = Field(
        ...,
        description="模板ID",
        example="rsi_reversal"
    )
    
    name: str = Field(
        ...,
        description="模板名称",
        example="RSI反转策略"
    )
    
    description: str = Field(
        ...,
        description="模板描述",
        example="基于RSI指标的经典反转策略模板"
    )
    
    category: str = Field(
        ...,
        description="模板分类",
        example="mean_reversion"
    )
    
    market_types: List[str] = Field(
        ...,
        description="适用市场类型",
        example=["stock", "crypto"]
    )
    
    parameters: Dict[str, Any] = Field(
        ...,
        description="默认参数",
        example={
            "rsi_period": 14,
            "oversold": 30,
            "overbought": 70
        }
    )
    
    code_template: str = Field(
        ...,
        description="代码模板"
    )
    
    tags: List[str] = Field(
        default_factory=list,
        description="标签",
        example=["rsi", "reversal", "technical_indicator"]
    )
    
    difficulty_level: str = Field(
        default="medium",
        description="难度等级",
        example="medium"
    )
    
    created_at: datetime = Field(
        default_factory=datetime.now,
        description="创建时间"
    )
    
    updated_at: datetime = Field(
        default_factory=datetime.now,
        description="更新时间"
    )
    
    time_frames: List[str] = Field(
        default_factory=list,
        description="适用时间框架",
        example=["1h", "4h", "1d"]
    )
    
    risk_level: str = Field(
        default="medium",
        description="风险等级",
        example="medium"
    )
    
    author: str = Field(
        default="system",
        description="作者",
        example="system"
    )
    
    version: str = Field(
        default="1.0.0",
        description="版本号",
        example="1.0.0"
    )
    
    usage_count: int = Field(
        default=0,
        description="使用次数",
        example=0
    )
    
    rating: float = Field(
        default=0.0,
        description="评分",
        example=0.0
    )
    
    performance_metrics: Dict[str, float] = Field(
        default_factory=dict,
        description="性能指标",
        example={"sharpe_ratio": 1.2, "max_drawdown": 0.15}
    )
    
    @property
    def code(self) -> str:
        """code_template 的别名，用于向后兼容"""
        return self.code_template
    
    @property
    def difficulty(self) -> str:
        """difficulty_level 的别名，用于向后兼容"""
        return self.difficulty_level
    
    @property
    def market_type(self) -> str:
        """market_types 的别名，用于向后兼容，返回第一个市场类型"""
        return self.market_types[0] if self.market_types else 'stock'
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "difficulty": self.difficulty,
            "market_types": self.market_types,
            "code_template": self.code_template,
            "parameters": self.parameters,
            "tags": self.tags
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StrategyTemplate':
        """从字典创建策略模板实例
        
        Args:
            data: 包含模板数据的字典
            
        Returns:
            StrategyTemplate实例
        """
        # 处理字段名映射
        field_mapping = {
            'difficulty': 'difficulty_level',
            'market_type': 'market_types',
            'code': 'code_template'
        }
        
        # 创建新的数据字典
        template_data = {}
        for key, value in data.items():
            # 映射字段名
            mapped_key = field_mapping.get(key, key)
            
            # 处理特殊字段
            if mapped_key == 'market_types' and isinstance(value, str):
                template_data[mapped_key] = [value]
            else:
                template_data[mapped_key] = value
        
        return cls(**template_data)

class TemplateListResponse(BaseModel):
    """模板列表响应"""
    
    templates: List[StrategyTemplate] = Field(
        ...,
        description="模板列表"
    )
    
    total: int = Field(
        ...,
        description="总数量"
    )
    
    page: int = Field(
        default=1,
        description="当前页码"
    )
    
    page_size: int = Field(
        default=20,
        description="每页数量"
    )
    
    categories: List[str] = Field(
        default_factory=list,
        description="可用分类"
    )

class OptimizationResult(BaseModel):
    """优化结果"""
    
    optimized_code: str = Field(
        ...,
        description="优化后的代码"
    )
    
    optimized_parameters: Dict[str, Any] = Field(
        ...,
        description="优化后的参数"
    )
    
    performance_improvement: Dict[str, float] = Field(
        ...,
        description="性能改进",
        example={
            "sharpe_ratio_improvement": 0.15,
            "max_drawdown_reduction": 0.05,
            "win_rate_improvement": 0.08
        }
    )
    
    optimization_history: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="优化历史"
    )
    
    execution_time: float = Field(
        ...,
        description="优化执行时间"
    )

class ChatResponse(BaseModel):
    """聊天响应"""
    
    response: str = Field(
        ...,
        description="AI回复"
    )
    
    code: Optional[str] = Field(
        default=None,
        description="生成的代码"
    )
    
    suggestions: List[str] = Field(
        default_factory=list,
        description="建议"
    )
    
    context: Dict[str, Any] = Field(
        default_factory=dict,
        description="上下文信息"
    )
    
    session_id: str = Field(
        ...,
        description="会话ID"
    )
    
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="时间戳"
    )

class HealthCheckResponse(BaseModel):
    """健康检查响应"""
    
    status: str = Field(
        default="healthy",
        description="服务状态"
    )
    
    version: str = Field(
        ...,
        description="服务版本"
    )
    
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="检查时间"
    )
    
    services: Dict[str, str] = Field(
        default_factory=dict,
        description="各服务状态",
        example={
            "qwen_api": "healthy",
            "gemini_api": "healthy",
            "database": "healthy"
        }
    )
    
    metrics: Dict[str, Any] = Field(
        default_factory=dict,
        description="性能指标",
        example={
            "uptime": 3600,
            "requests_processed": 1500,
            "average_response_time": 2.3,
            "error_rate": 0.01
        }
    )

class ErrorResponse(BaseModel):
    """错误响应"""
    
    error: str = Field(
        ...,
        description="错误类型"
    )
    
    message: str = Field(
        ...,
        description="错误消息"
    )
    
    details: Optional[Dict[str, Any]] = Field(
        default=None,
        description="错误详情"
    )
    
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="错误时间"
    )
    
    request_id: Optional[str] = Field(
        default=None,
        description="请求ID"
    )