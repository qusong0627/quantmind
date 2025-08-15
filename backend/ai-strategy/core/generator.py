"""策略生成器核心模块"""

import asyncio
import time
from typing import List, Dict, Any, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

from models.requests import StrategyRequest
from models.responses import StrategyResponse, ModelResponse
from models.strategy import Strategy
from providers.factory import ProviderFactory, ProviderType
from providers.base import BaseLLMProvider
from utils.logger import LoggerMixin
from utils.config import get_config

@dataclass
class GenerationContext:
    """生成上下文"""
    request: StrategyRequest
    providers: List[BaseLLMProvider]
    start_time: float
    timeout: int = 60
    
    def is_timeout(self) -> bool:
        """检查是否超时"""
        return time.time() - self.start_time > self.timeout

class StrategyGenerator(LoggerMixin):
    """策略生成器
    
    负责协调多个LLM提供商生成量化交易策略
    """
    
    def __init__(self):
        """初始化策略生成器"""
        self.config = get_config()
        self.provider_factory = ProviderFactory()
        self.executor = ThreadPoolExecutor(max_workers=5)
        
        # 从配置获取生成参数
        generation_config = self.config.get('strategy_generation', {})
        self.max_concurrent = generation_config.get('max_concurrent_requests', 3)
        self.default_timeout = generation_config.get('timeout', 60)
        self.enable_comparison = generation_config.get('enable_comparison', True)
        
        self.logger.info("策略生成器初始化完成")
    
    async def generate_strategy(self, request: StrategyRequest) -> StrategyResponse:
        """生成策略
        
        Args:
            request: 策略生成请求
        
        Returns:
            策略生成响应
        """
        start_time = time.time()
        
        try:
            self.logger.info(f"开始生成策略，用户: {request.user_id}，模型: {request.models}")
            
            # 创建生成上下文
            context = await self._create_generation_context(request)
            
            # 并发生成策略
            model_responses = await self._generate_concurrent(context)
            
            # 选择最佳策略
            best_strategy = self._select_best_strategy(model_responses)
            
            # 构建响应
            response = self._build_response(
                request=request,
                model_responses=model_responses,
                best_strategy=best_strategy,
                execution_time=time.time() - start_time
            )
            
            self.logger.info(f"策略生成完成，耗时: {response.execution_time:.2f}秒")
            return response
            
        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = f"策略生成失败: {str(e)}"
            self.logger.error(error_msg)
            
            return StrategyResponse(
                strategy_id=f"error_{request.user_id}_{int(time.time())}",
                user_id=request.user_id,
                best_model="",
                strategy=Strategy(
                    name="生成失败",
                    description=error_msg,
                    code="",
                    parameters={},
                    risk_metrics={},
                    performance_metrics={}
                ),
                model_responses=[],
                comparison_result=None,
                execution_time=execution_time,
                success=False,
                error=error_msg
            )
    
    async def _create_generation_context(self, request: StrategyRequest) -> GenerationContext:
        """创建生成上下文
        
        Args:
            request: 策略生成请求
        
        Returns:
            生成上下文
        
        Raises:
            ValueError: 无可用提供商
        """
        # 获取可用提供商
        available_providers = self.provider_factory.get_available_providers()
        
        if not available_providers:
            raise ValueError("没有可用的LLM提供商")
        
        # 确定要使用的提供商
        if request.models:
            # 使用请求指定的模型
            requested_providers = [model for model in request.models if model in available_providers]
            if not requested_providers:
                raise ValueError(f"请求的模型 {request.models} 都不可用，可用模型: {available_providers}")
        else:
            # 使用所有可用提供商
            requested_providers = available_providers
        
        # 创建提供商实例
        providers = []
        for provider_name in requested_providers:
            try:
                provider_type = ProviderType(provider_name)
                provider = self.provider_factory.create_provider(provider_type)
                providers.append(provider)
            except Exception as e:
                self.logger.warning(f"创建提供商 {provider_name} 失败: {e}")
        
        if not providers:
            raise ValueError("无法创建任何提供商实例")
        
        return GenerationContext(
            request=request,
            providers=providers,
            start_time=time.time(),
            timeout=request.custom_params.get('timeout', self.default_timeout)
        )
    
    async def _generate_concurrent(self, context: GenerationContext) -> List[ModelResponse]:
        """并发生成策略
        
        Args:
            context: 生成上下文
        
        Returns:
            模型响应列表
        """
        # 构建提示词
        prompt = self._build_prompt(context.request)
        
        # 创建生成任务
        tasks = []
        for provider in context.providers:
            task = self._generate_with_provider(
                provider=provider,
                prompt=prompt,
                context=context
            )
            tasks.append(task)
        
        # 并发执行，限制并发数
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def limited_generate(task):
            async with semaphore:
                return await task
        
        # 等待所有任务完成
        results = await asyncio.gather(
            *[limited_generate(task) for task in tasks],
            return_exceptions=True
        )
        
        # 处理结果
        model_responses = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                provider_name = context.providers[i].name
                self.logger.error(f"提供商 {provider_name} 生成失败: {result}")
                # 创建错误响应
                error_response = ModelResponse(
                    model_name=provider_name,
                    code="",
                    description="生成失败",
                    parameters={},
                    risk_metrics={},
                    confidence_score=0.0,
                    execution_time=0.0,
                    error=str(result),
                    warnings=[],
                    metadata={}
                )
                model_responses.append(error_response)
            else:
                model_responses.append(result)
        
        return model_responses
    
    async def _generate_with_provider(
        self,
        provider: BaseLLMProvider,
        prompt: str,
        context: GenerationContext
    ) -> ModelResponse:
        """使用指定提供商生成策略
        
        Args:
            provider: LLM提供商
            prompt: 提示词
            context: 生成上下文
        
        Returns:
            模型响应
        
        Raises:
            asyncio.TimeoutError: 生成超时
        """
        try:
            # 设置超时
            response = await asyncio.wait_for(
                provider.generate(
                    prompt=prompt,
                    max_tokens=context.request.custom_params.get('max_tokens'),
                    temperature=context.request.custom_params.get('temperature')
                ),
                timeout=context.timeout
            )
            
            return response
            
        except asyncio.TimeoutError:
            raise Exception(f"提供商 {provider.name} 生成超时")
        except Exception as e:
            raise Exception(f"提供商 {provider.name} 生成异常: {str(e)}")
    
    def _build_prompt(self, request: StrategyRequest) -> str:
        """构建提示词
        
        Args:
            request: 策略生成请求
        
        Returns:
            完整的提示词
        """
        # 基础提示词
        prompt_parts = [
            f"请生成一个{request.market_type.value}市场的量化交易策略。",
            f"策略描述: {request.description}",
            f"时间周期: {request.time_frame.value}",
            f"风险等级: {request.risk_level.value}"
        ]
        
        # 添加模板信息
        if request.template_id:
            prompt_parts.append(f"基于模板: {request.template_id}")
        
        # 添加PTrade语法要求
        if request.use_ptrade_syntax:
            prompt_parts.append("请使用PTrade框架语法编写策略代码。")
        
        # 添加自定义参数
        if request.custom_params:
            custom_info = []
            for key, value in request.custom_params.items():
                if key not in ['max_tokens', 'temperature', 'timeout']:
                    custom_info.append(f"{key}: {value}")
            if custom_info:
                prompt_parts.append(f"额外要求: {', '.join(custom_info)}")
        
        # 添加代码要求
        prompt_parts.extend([
            "",
            "代码要求:",
            "1. 必须包含完整的策略类定义",
            "2. 实现__init__和generate_signals方法",
            "3. 代码要有详细注释",
            "4. 考虑风险控制和资金管理",
            "5. 确保代码可以直接运行",
            "6. 返回清晰的买卖信号"
        ])
        
        return "\n".join(prompt_parts)
    
    def _select_best_strategy(self, model_responses: List[ModelResponse]) -> Optional[ModelResponse]:
        """选择最佳策略
        
        Args:
            model_responses: 模型响应列表
        
        Returns:
            最佳策略响应，如果没有成功的响应则返回None
        """
        # 过滤成功的响应
        successful_responses = [r for r in model_responses if not r.error and r.code]
        
        if not successful_responses:
            self.logger.warning("没有成功的策略生成响应")
            return None
        
        if len(successful_responses) == 1:
            return successful_responses[0]
        
        # 多策略比较
        if self.enable_comparison:
            return self._compare_strategies(successful_responses)
        else:
            # 简单选择置信度最高的
            return max(successful_responses, key=lambda r: r.confidence_score)
    
    def _compare_strategies(self, responses: List[ModelResponse]) -> ModelResponse:
        """比较多个策略响应
        
        Args:
            responses: 策略响应列表
        
        Returns:
            最佳策略响应
        """
        # 计算综合评分
        scored_responses = []
        
        for response in responses:
            score = self._calculate_strategy_score(response)
            scored_responses.append((response, score))
            self.logger.debug(f"策略 {response.model_name} 评分: {score:.3f}")
        
        # 选择评分最高的
        best_response = max(scored_responses, key=lambda x: x[1])[0]
        
        self.logger.info(f"选择最佳策略: {best_response.model_name}")
        return best_response
    
    def _calculate_strategy_score(self, response: ModelResponse) -> float:
        """计算策略综合评分
        
        Args:
            response: 模型响应
        
        Returns:
            综合评分 (0-1)
        """
        # 权重配置
        weights = {
            'confidence': 0.3,
            'code_quality': 0.25,
            'risk_metrics': 0.25,
            'execution_time': 0.1,
            'completeness': 0.1
        }
        
        # 置信度评分
        confidence_score = response.confidence_score
        
        # 代码质量评分
        code_quality_score = self._evaluate_code_quality(response.code)
        
        # 风险指标评分
        risk_score = self._evaluate_risk_metrics(response.risk_metrics)
        
        # 执行时间评分（越快越好，但设置上限）
        time_score = max(0, 1 - response.execution_time / 30)  # 30秒为基准
        
        # 完整性评分
        completeness_score = self._evaluate_completeness(response)
        
        # 计算加权总分
        total_score = (
            weights['confidence'] * confidence_score +
            weights['code_quality'] * code_quality_score +
            weights['risk_metrics'] * risk_score +
            weights['execution_time'] * time_score +
            weights['completeness'] * completeness_score
        )
        
        return min(total_score, 1.0)
    
    def _evaluate_code_quality(self, code: str) -> float:
        """评估代码质量
        
        Args:
            code: 策略代码
        
        Returns:
            质量评分 (0-1)
        """
        if not code:
            return 0.0
        
        score = 0.0
        
        # 基础结构检查
        if 'class' in code:
            score += 0.2
        if 'def __init__' in code:
            score += 0.2
        if 'def generate_signals' in code:
            score += 0.2
        
        # 注释质量
        lines = code.split('\n')
        comment_lines = [line for line in lines if line.strip().startswith('#')]
        if len(comment_lines) > len(lines) * 0.1:  # 至少10%的注释
            score += 0.1
        
        # 代码长度合理性
        if 50 < len(lines) < 200:  # 合理的代码长度
            score += 0.1
        
        # 导入语句
        if 'import' in code:
            score += 0.1
        
        # 错误处理
        if 'try:' in code and 'except' in code:
            score += 0.1
        
        return min(score, 1.0)
    
    def _evaluate_risk_metrics(self, risk_metrics: Dict[str, float]) -> float:
        """评估风险指标
        
        Args:
            risk_metrics: 风险指标字典
        
        Returns:
            风险评分 (0-1)
        """
        if not risk_metrics:
            return 0.5  # 默认中等评分
        
        score = 0.0
        
        # 最大回撤评分（越小越好）
        max_drawdown = risk_metrics.get('max_drawdown', 0.2)
        if max_drawdown < 0.1:
            score += 0.3
        elif max_drawdown < 0.2:
            score += 0.2
        else:
            score += 0.1
        
        # 夏普比率评分（越大越好）
        sharpe_ratio = risk_metrics.get('sharpe_ratio', 1.0)
        if sharpe_ratio > 2.0:
            score += 0.3
        elif sharpe_ratio > 1.5:
            score += 0.2
        else:
            score += 0.1
        
        # 胜率评分
        win_rate = risk_metrics.get('win_rate', 0.5)
        if win_rate > 0.6:
            score += 0.2
        elif win_rate > 0.5:
            score += 0.15
        else:
            score += 0.1
        
        # 盈利因子评分
        profit_factor = risk_metrics.get('profit_factor', 1.0)
        if profit_factor > 2.0:
            score += 0.2
        elif profit_factor > 1.5:
            score += 0.15
        else:
            score += 0.1
        
        return min(score, 1.0)
    
    def _evaluate_completeness(self, response: ModelResponse) -> float:
        """评估响应完整性
        
        Args:
            response: 模型响应
        
        Returns:
            完整性评分 (0-1)
        """
        score = 0.0
        
        # 检查各个字段是否完整
        if response.code:
            score += 0.4
        if response.description:
            score += 0.2
        if response.parameters:
            score += 0.2
        if response.risk_metrics:
            score += 0.1
        if response.metadata:
            score += 0.1
        
        return min(score, 1.0)
    
    def _build_response(
        self,
        request: StrategyRequest,
        model_responses: List[ModelResponse],
        best_strategy: Optional[ModelResponse],
        execution_time: float
    ) -> StrategyResponse:
        """构建策略响应
        
        Args:
            request: 原始请求
            model_responses: 所有模型响应
            best_strategy: 最佳策略
            execution_time: 执行时间
        
        Returns:
            策略响应
        """
        # 生成策略ID
        strategy_id = f"{request.user_id}_{int(time.time())}"
        
        if best_strategy:
            # 构建策略对象
            strategy = Strategy(
                name=f"AI生成策略_{best_strategy.model_name}",
                description=best_strategy.description,
                code=best_strategy.code,
                parameters=best_strategy.parameters,
                risk_metrics=best_strategy.risk_metrics,
                performance_metrics={}  # 需要回测后填充
            )
            
            success = True
            error = None
            best_model = best_strategy.model_name
        else:
            # 没有成功的策略
            strategy = Strategy(
                name="生成失败",
                description="所有模型都未能成功生成策略",
                code="",
                parameters={},
                risk_metrics={},
                performance_metrics={}
            )
            
            success = False
            error = "所有模型生成都失败了"
            best_model = ""
        
        # 构建比较结果
        comparison_result = None
        if len([r for r in model_responses if not r.error]) > 1:
            comparison_result = self._build_comparison_result(model_responses)
        
        return StrategyResponse(
            strategy_id=strategy_id,
            user_id=request.user_id,
            best_model=best_model,
            strategy=strategy,
            model_responses=model_responses,
            comparison_result=comparison_result,
            execution_time=execution_time,
            success=success,
            error=error
        )
    
    def _build_comparison_result(self, model_responses: List[ModelResponse]) -> Dict[str, Any]:
        """构建比较结果
        
        Args:
            model_responses: 模型响应列表
        
        Returns:
            比较结果
        """
        successful_responses = [r for r in model_responses if not r.error]
        
        if len(successful_responses) < 2:
            return None
        
        comparison = {
            "total_models": len(model_responses),
            "successful_models": len(successful_responses),
            "model_scores": {},
            "best_model": "",
            "comparison_metrics": {
                "avg_confidence": 0.0,
                "avg_execution_time": 0.0,
                "code_length_range": [0, 0]
            }
        }
        
        # 计算各模型评分
        scores = []
        execution_times = []
        code_lengths = []
        
        for response in successful_responses:
            score = self._calculate_strategy_score(response)
            comparison["model_scores"][response.model_name] = {
                "score": score,
                "confidence": response.confidence_score,
                "execution_time": response.execution_time,
                "code_length": len(response.code)
            }
            
            scores.append(score)
            execution_times.append(response.execution_time)
            code_lengths.append(len(response.code))
        
        # 找出最佳模型
        best_response = max(successful_responses, key=lambda r: comparison["model_scores"][r.model_name]["score"])
        comparison["best_model"] = best_response.model_name
        
        # 计算统计指标
        comparison["comparison_metrics"] = {
            "avg_confidence": sum(r.confidence_score for r in successful_responses) / len(successful_responses),
            "avg_execution_time": sum(execution_times) / len(execution_times),
            "code_length_range": [min(code_lengths), max(code_lengths)]
        }
        
        return comparison
    
    def __del__(self):
        """清理资源"""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False)