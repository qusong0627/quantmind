"""API路由定义"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import asyncio
import time

from models.requests import (
    StrategyRequest,
    StrategyOptimizationRequest,
    StrategyValidationRequest,
    TemplateListRequest,
    ChatRequest
)
from models.responses import (
    StrategyResponse,
    OptimizationResult,
    ValidationResult,
    TemplateListResponse,
    ChatResponse,
    HealthCheckResponse,
    ErrorResponse
)
from core.generator import StrategyGenerator
from core.validator import StrategyValidator
from core.optimizer import StrategyOptimizer
from templates.manager import TemplateManager
from providers.factory import ProviderFactory
from utils.logger import get_logger
from utils.config import get_config

# 创建路由器
router = APIRouter(prefix="/api/v1", tags=["AI Strategy"])
logger = get_logger(__name__)

# 依赖注入
def get_strategy_generator() -> StrategyGenerator:
    """获取策略生成器"""
    return StrategyGenerator()

def get_strategy_validator() -> StrategyValidator:
    """获取策略验证器"""
    return StrategyValidator()

def get_strategy_optimizer() -> StrategyOptimizer:
    """获取策略优化器"""
    return StrategyOptimizer()

def get_template_manager() -> TemplateManager:
    """获取模板管理器"""
    from templates.manager import get_template_manager
    return get_template_manager()

def get_provider_factory() -> ProviderFactory:
    """获取提供商工厂"""
    from providers.factory import get_provider_factory
    return get_provider_factory()

# 健康检查
@router.get("/health", response_model=HealthCheckResponse)
async def health_check(
    provider_factory: ProviderFactory = Depends(get_provider_factory)
):
    """健康检查
    
    检查服务状态和各个组件的健康状况
    """
    try:
        start_time = time.time()
        
        # 检查配置
        config = get_config()
        config_status = "healthy" if config else "unhealthy"
        
        # 检查LLM提供商
        provider_status = {}
        enabled_providers = config.get('llm_providers', {}).keys()
        
        for provider_name in enabled_providers:
            try:
                provider = provider_factory.create_provider(provider_name)
                is_connected = await provider.verify_connection()
                provider_status[provider_name] = "healthy" if is_connected else "unhealthy"
            except Exception as e:
                logger.warning(f"提供商 {provider_name} 健康检查失败: {e}")
                provider_status[provider_name] = "unhealthy"
        
        # 检查模板管理器
        try:
            template_manager = get_template_manager()
            template_count = len(template_manager)
            template_status = "healthy" if template_count > 0 else "warning"
        except Exception as e:
            logger.error(f"模板管理器检查失败: {e}")
            template_status = "unhealthy"
            template_count = 0
        
        response_time = time.time() - start_time
        
        # 确定整体状态
        overall_status = "healthy"
        if config_status == "unhealthy" or template_status == "unhealthy":
            overall_status = "unhealthy"
        elif any(status == "unhealthy" for status in provider_status.values()):
            overall_status = "degraded"
        elif template_status == "warning":
            overall_status = "warning"
        
        return HealthCheckResponse(
            status=overall_status,
            timestamp=int(time.time()),
            version="1.0.0",
            components={
                "config": config_status,
                "providers": provider_status,
                "templates": template_status
            },
            metrics={
                "response_time_ms": round(response_time * 1000, 2),
                "template_count": template_count,
                "provider_count": len(provider_status)
            }
        )
        
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return HealthCheckResponse(
            status="unhealthy",
            timestamp=int(time.time()),
            version="1.0.0",
            components={},
            metrics={},
            error=str(e)
        )

# 策略生成
@router.post("/strategies/generate", response_model=StrategyResponse)
async def generate_strategy(
    request: StrategyRequest,
    background_tasks: BackgroundTasks,
    generator: StrategyGenerator = Depends(get_strategy_generator)
):
    """生成量化交易策略
    
    根据用户描述和配置，使用多个LLM模型生成量化交易策略
    """
    try:
        logger.info(f"收到策略生成请求: {request.description[:100]}...")
        
        # 生成策略
        response = await generator.generate_strategy(request)
        
        # 添加后台任务记录使用情况
        background_tasks.add_task(
            _log_strategy_generation,
            request.user_id,
            request.description,
            len(response.strategies)
        )
        
        logger.info(f"策略生成完成，生成了 {len(response.strategies)} 个策略")
        return response
        
    except Exception as e:
        logger.error(f"策略生成失败: {e}")
        raise HTTPException(status_code=500, detail=f"策略生成失败: {str(e)}")

# 策略验证
@router.post("/strategies/validate", response_model=ValidationResult)
async def validate_strategy(
    request: StrategyValidationRequest,
    validator: StrategyValidator = Depends(get_strategy_validator)
):
    """验证策略代码
    
    检查策略代码的语法、安全性和合规性
    """
    try:
        logger.info(f"收到策略验证请求，代码长度: {len(request.code)}")
        
        # 验证策略
        result = await validator.validate_strategy(request)
        
        logger.info(f"策略验证完成，状态: {result.status}")
        return result
        
    except Exception as e:
        logger.error(f"策略验证失败: {e}")
        raise HTTPException(status_code=500, detail=f"策略验证失败: {str(e)}")

# 策略优化
@router.post("/strategies/optimize", response_model=OptimizationResult)
async def optimize_strategy(
    request: StrategyOptimizationRequest,
    optimizer: StrategyOptimizer = Depends(get_strategy_optimizer)
):
    """优化策略参数
    
    使用指定的优化算法优化策略参数以提升性能
    """
    try:
        logger.info(f"收到策略优化请求，方法: {request.method}")
        
        # 这里需要根据实际情况获取策略和历史数据
        # 简化实现：创建模拟数据
        import pandas as pd
        import numpy as np
        
        # 创建模拟历史数据
        dates = pd.date_range(start='2020-01-01', end='2023-12-31', freq='D')
        historical_data = pd.DataFrame({
            'date': dates,
            'open': np.random.uniform(100, 200, len(dates)),
            'high': np.random.uniform(100, 200, len(dates)),
            'low': np.random.uniform(100, 200, len(dates)),
            'close': np.random.uniform(100, 200, len(dates)),
            'volume': np.random.uniform(1000000, 10000000, len(dates))
        })
        
        # 创建模拟策略
        from models.strategy import Strategy, StrategyParameter
        strategy = Strategy(
            id="test_strategy",
            name="测试策略",
            description="用于优化测试的策略",
            code="# 测试策略代码",
            parameters=[
                StrategyParameter(
                    name="fast_period",
                    type="int",
                    default_value=10,
                    min_value=5,
                    max_value=50,
                    optimizable=True,
                    description="快速均线周期"
                ),
                StrategyParameter(
                    name="slow_period",
                    type="int",
                    default_value=30,
                    min_value=20,
                    max_value=100,
                    optimizable=True,
                    description="慢速均线周期"
                )
            ],
            risk_metrics=[],
            performance_metrics=[]
        )
        
        # 优化策略
        result = await optimizer.optimize_strategy(strategy, historical_data, request)
        
        logger.info(f"策略优化完成，最佳得分: {result.best_score}")
        return result
        
    except Exception as e:
        logger.error(f"策略优化失败: {e}")
        raise HTTPException(status_code=500, detail=f"策略优化失败: {str(e)}")

# 模板管理
@router.get("/templates", response_model=TemplateListResponse)
async def list_templates(
    category: Optional[str] = Query(None, description="模板分类过滤"),
    difficulty: Optional[str] = Query(None, description="难度过滤"),
    market_type: Optional[str] = Query(None, description="市场类型过滤"),
    tags: Optional[str] = Query(None, description="标签过滤，多个标签用逗号分隔"),
    limit: Optional[int] = Query(20, description="返回数量限制"),
    template_manager: TemplateManager = Depends(get_template_manager)
):
    """获取策略模板列表
    
    支持按分类、难度、市场类型和标签过滤
    """
    try:
        # 处理标签参数
        tag_list = None
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',')]
        
        # 转换分类参数
        category_enum = None
        if category:
            from templates.manager import TemplateCategory
            try:
                category_enum = TemplateCategory(category)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"无效的分类: {category}")
        
        # 获取模板列表
        templates = template_manager.list_templates(
            category=category_enum,
            difficulty=difficulty,
            market_type=market_type,
            tags=tag_list,
            limit=limit
        )
        
        # 获取分类信息
        categories = template_manager.get_categories()
        
        # 获取热门模板
        popular_templates = template_manager.get_popular_templates(5)
        
        return TemplateListResponse(
            templates=templates,
            total_count=len(templates),
            categories=categories,
            popular_templates=popular_templates
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取模板列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取模板列表失败: {str(e)}")

@router.get("/templates/{template_id}")
async def get_template(
    template_id: str,
    template_manager: TemplateManager = Depends(get_template_manager)
):
    """获取指定模板详情"""
    try:
        template = template_manager.get_template(template_id)
        
        if not template:
            raise HTTPException(status_code=404, detail=f"模板不存在: {template_id}")
        
        return template
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取模板失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取模板失败: {str(e)}")

@router.get("/templates/search/{query}")
async def search_templates(
    query: str,
    limit: int = Query(10, description="返回数量限制"),
    template_manager: TemplateManager = Depends(get_template_manager)
):
    """搜索策略模板"""
    try:
        templates = template_manager.search_templates(query, limit)
        
        return {
            "query": query,
            "templates": templates,
            "count": len(templates)
        }
        
    except Exception as e:
        logger.error(f"搜索模板失败: {e}")
        raise HTTPException(status_code=500, detail=f"搜索模板失败: {str(e)}")

# 聊天接口
@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    generator: StrategyGenerator = Depends(get_strategy_generator)
):
    """与AI助手聊天
    
    提供策略相关的问答和建议
    """
    try:
        logger.info(f"收到聊天请求: {request.message[:100]}...")
        
        # 这里应该实现聊天逻辑
        # 简化实现：返回模拟响应
        response_message = f"您好！关于您的问题：{request.message}\n\n我建议您可以考虑以下几个方面：\n1. 明确您的投资目标和风险承受能力\n2. 选择合适的市场和时间周期\n3. 考虑使用技术指标进行信号生成\n\n如果您需要生成具体的策略代码，请使用策略生成功能。"
        
        return ChatResponse(
            message=response_message,
            suggestions=[
                "生成双均线交叉策略",
                "创建RSI反转策略",
                "了解风险管理方法"
            ],
            context={
                "conversation_id": request.conversation_id,
                "user_id": request.user_id
            }
        )
        
    except Exception as e:
        logger.error(f"聊天处理失败: {e}")
        raise HTTPException(status_code=500, detail=f"聊天处理失败: {str(e)}")

# PTrade语法指南
@router.get("/ptrade/guide")
async def get_ptrade_guide():
    """获取PTrade语法指南"""
    try:
        config = get_config()
        ptrade_config = config.get('ptrade_syntax', {})
        
        guide = {
            "version": ptrade_config.get('version', '1.0'),
            "description": "PTrade量化交易策略语法指南",
            "basic_syntax": {
                "class_definition": "class MyStrategy:",
                "init_method": "def __init__(self, param1=default_value):",
                "signal_method": "def generate_signals(self, data):",
                "data_access": "data['close'], data['volume']",
                "indicator_calculation": "data['ma'] = data['close'].rolling(20).mean()",
                "signal_generation": "data['signal'] = np.where(condition, 1, -1)"
            },
            "required_methods": [
                "__init__(self, **kwargs)",
                "generate_signals(self, data)"
            ],
            "data_format": {
                "columns": ["open", "high", "low", "close", "volume"],
                "index": "datetime",
                "signals": "1 (买入), -1 (卖出), 0 (持有)"
            },
            "examples": [
                {
                    "name": "简单移动平均策略",
                    "code": '''class SimpleMAStrategy:
    def __init__(self, period=20):
        self.period = period
    
    def generate_signals(self, data):
        data['ma'] = data['close'].rolling(self.period).mean()
        data['signal'] = np.where(data['close'] > data['ma'], 1, -1)
        return data'''
                }
            ],
            "best_practices": [
                "使用描述性的参数名称",
                "添加适当的注释",
                "处理缺失数据",
                "避免未来数据泄露",
                "实现适当的风险管理"
            ]
        }
        
        return guide
        
    except Exception as e:
        logger.error(f"获取PTrade指南失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取PTrade指南失败: {str(e)}")

# 系统信息
@router.get("/system/info")
async def get_system_info(
    provider_factory: ProviderFactory = Depends(get_provider_factory),
    template_manager: TemplateManager = Depends(get_template_manager)
):
    """获取系统信息"""
    try:
        config = get_config()
        
        # 获取提供商信息
        providers_info = {}
        for provider_name in config.get('llm_providers', {}).keys():
            try:
                provider = provider_factory.get_provider(provider_name)
                model_info = await provider.get_model_info()
                providers_info[provider_name] = {
                    "available": True,
                    "model_info": model_info
                }
            except Exception as e:
                providers_info[provider_name] = {
                    "available": False,
                    "error": str(e)
                }
        
        # 获取模板统计
        template_stats = {
            "total_count": len(template_manager),
            "categories": template_manager.get_categories()
        }
        
        return {
            "service_name": "AI Strategy Generation Service",
            "version": "1.0.0",
            "providers": providers_info,
            "templates": template_stats,
            "features": [
                "多模型策略生成",
                "策略代码验证",
                "参数优化",
                "模板管理",
                "PTrade语法支持"
            ],
            "supported_markets": ["stock", "crypto", "forex", "futures"],
            "supported_timeframes": ["1m", "5m", "15m", "1h", "4h", "1d", "1w"]
        }
        
    except Exception as e:
        logger.error(f"获取系统信息失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取系统信息失败: {str(e)}")

# 错误处理函数（将在main.py中注册到FastAPI应用）
async def http_exception_handler(request, exc):
    """HTTP异常处理器"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error_code=f"HTTP_{exc.status_code}",
            message=exc.detail,
            timestamp=int(time.time())
        ).dict()
    )

async def general_exception_handler(request, exc):
    """通用异常处理器"""
    logger.error(f"未处理的异常: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error_code="INTERNAL_ERROR",
            message="内部服务器错误",
            timestamp=int(time.time()),
            details=str(exc)
        ).dict()
    )

# 后台任务
async def _log_strategy_generation(user_id: str, description: str, strategy_count: int):
    """记录策略生成使用情况"""
    try:
        logger.info(f"用户 {user_id} 生成了 {strategy_count} 个策略: {description[:50]}...")
        # 这里可以添加更多的日志记录或统计逻辑
    except Exception as e:
        logger.error(f"记录策略生成失败: {e}")