"""策略优化器"""

import asyncio
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Tuple, Callable
from dataclasses import dataclass
from enum import Enum
import json
import time
from concurrent.futures import ThreadPoolExecutor

from models.strategy import Strategy, StrategyParameter, PerformanceMetric
from models.requests import StrategyOptimizationRequest
from models.responses import OptimizationResult
from utils.logger import LoggerMixin
from utils.config import get_config

class OptimizationMethod(str, Enum):
    """优化方法"""
    GRID_SEARCH = "grid_search"          # 网格搜索
    RANDOM_SEARCH = "random_search"      # 随机搜索
    BAYESIAN = "bayesian"                # 贝叶斯优化
    GENETIC = "genetic"                  # 遗传算法
    PARTICLE_SWARM = "particle_swarm"    # 粒子群优化
    SIMULATED_ANNEALING = "simulated_annealing"  # 模拟退火

class OptimizationObjective(str, Enum):
    """优化目标"""
    SHARPE_RATIO = "sharpe_ratio"        # 夏普比率
    RETURN = "return"                    # 收益率
    MAX_DRAWDOWN = "max_drawdown"        # 最大回撤
    WIN_RATE = "win_rate"                # 胜率
    PROFIT_FACTOR = "profit_factor"      # 盈利因子
    CALMAR_RATIO = "calmar_ratio"        # 卡玛比率
    SORTINO_RATIO = "sortino_ratio"      # 索提诺比率
    CUSTOM = "custom"                    # 自定义

@dataclass
class OptimizationConfig:
    """优化配置"""
    method: OptimizationMethod
    objective: OptimizationObjective
    max_iterations: int = 100
    population_size: int = 50
    convergence_threshold: float = 1e-6
    timeout_seconds: int = 300
    parallel_workers: int = 4
    random_seed: Optional[int] = None
    custom_objective: Optional[Callable] = None
    constraints: Dict[str, Any] = None

@dataclass
class OptimizationResult:
    """优化结果"""
    best_parameters: Dict[str, Any]
    best_score: float
    optimization_history: List[Dict[str, Any]]
    convergence_info: Dict[str, Any]
    execution_time: float
    iterations_completed: int
    performance_metrics: Dict[str, float]
    parameter_sensitivity: Dict[str, float]

class StrategyOptimizer(LoggerMixin):
    """策略优化器
    
    负责优化策略参数以提升性能指标
    """
    
    def __init__(self):
        """初始化优化器"""
        self.config = get_config()
        
        # 获取优化配置
        opt_config = self.config.get('strategy_optimization', {})
        self.default_method = OptimizationMethod(opt_config.get('default_method', 'grid_search'))
        self.default_objective = OptimizationObjective(opt_config.get('default_objective', 'sharpe_ratio'))
        self.max_parallel_workers = opt_config.get('max_parallel_workers', 4)
        self.default_timeout = opt_config.get('default_timeout', 300)
        
        # 初始化执行器
        self.executor = ThreadPoolExecutor(max_workers=self.max_parallel_workers)
        
        self.logger.info("策略优化器初始化完成")
    
    async def optimize_strategy(
        self,
        strategy: Strategy,
        historical_data: pd.DataFrame,
        request: StrategyOptimizationRequest
    ) -> OptimizationResult:
        """优化策略
        
        Args:
            strategy: 待优化的策略
            historical_data: 历史数据
            request: 优化请求
        
        Returns:
            优化结果
        """
        start_time = time.time()
        
        try:
            # 构建优化配置
            opt_config = self._build_optimization_config(request)
            
            # 提取可优化参数
            optimizable_params = self._extract_optimizable_parameters(strategy)
            
            if not optimizable_params:
                raise ValueError("策略没有可优化的参数")
            
            self.logger.info(f"开始优化策略，方法: {opt_config.method.value}, 目标: {opt_config.objective.value}")
            
            # 根据优化方法执行优化
            if opt_config.method == OptimizationMethod.GRID_SEARCH:
                result = await self._grid_search_optimization(
                    strategy, historical_data, optimizable_params, opt_config
                )
            elif opt_config.method == OptimizationMethod.RANDOM_SEARCH:
                result = await self._random_search_optimization(
                    strategy, historical_data, optimizable_params, opt_config
                )
            elif opt_config.method == OptimizationMethod.BAYESIAN:
                result = await self._bayesian_optimization(
                    strategy, historical_data, optimizable_params, opt_config
                )
            elif opt_config.method == OptimizationMethod.GENETIC:
                result = await self._genetic_optimization(
                    strategy, historical_data, optimizable_params, opt_config
                )
            else:
                raise ValueError(f"不支持的优化方法: {opt_config.method}")
            
            # 计算执行时间
            execution_time = time.time() - start_time
            result.execution_time = execution_time
            
            # 计算参数敏感性
            result.parameter_sensitivity = self._calculate_parameter_sensitivity(
                result.optimization_history
            )
            
            self.logger.info(f"策略优化完成，最佳得分: {result.best_score:.4f}, 耗时: {execution_time:.2f}秒")
            
            return result
            
        except Exception as e:
            self.logger.error(f"策略优化失败: {e}")
            raise
    
    def _build_optimization_config(self, request: StrategyOptimizationRequest) -> OptimizationConfig:
        """构建优化配置"""
        return OptimizationConfig(
            method=OptimizationMethod(request.method or self.default_method),
            objective=OptimizationObjective(request.objective or self.default_objective),
            max_iterations=request.max_iterations or 100,
            population_size=request.population_size or 50,
            convergence_threshold=request.convergence_threshold or 1e-6,
            timeout_seconds=request.timeout_seconds or self.default_timeout,
            parallel_workers=min(request.parallel_workers or 4, self.max_parallel_workers),
            random_seed=request.random_seed,
            constraints=request.constraints or {}
        )
    
    def _extract_optimizable_parameters(self, strategy: Strategy) -> Dict[str, StrategyParameter]:
        """提取可优化参数"""
        optimizable_params = {}
        
        for param in strategy.parameters:
            if param.optimizable:
                optimizable_params[param.name] = param
        
        return optimizable_params
    
    async def _grid_search_optimization(
        self,
        strategy: Strategy,
        historical_data: pd.DataFrame,
        optimizable_params: Dict[str, StrategyParameter],
        config: OptimizationConfig
    ) -> OptimizationResult:
        """网格搜索优化"""
        # 生成参数网格
        param_grid = self._generate_parameter_grid(optimizable_params)
        
        # 限制网格大小
        max_combinations = min(len(param_grid), config.max_iterations)
        if len(param_grid) > max_combinations:
            # 随机采样
            import random
            if config.random_seed:
                random.seed(config.random_seed)
            param_grid = random.sample(param_grid, max_combinations)
        
        # 并行评估参数组合
        tasks = []
        for i, params in enumerate(param_grid):
            task = self._evaluate_parameter_combination(
                strategy, historical_data, params, config.objective, i
            )
            tasks.append(task)
        
        # 执行评估
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理结果
        valid_results = []
        optimization_history = []
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                self.logger.warning(f"参数组合 {i} 评估失败: {result}")
                continue
            
            valid_results.append(result)
            optimization_history.append({
                'iteration': i,
                'parameters': param_grid[i],
                'score': result['score'],
                'metrics': result['metrics']
            })
        
        if not valid_results:
            raise ValueError("所有参数组合评估都失败了")
        
        # 找到最佳结果
        best_result = max(valid_results, key=lambda x: x['score'])
        
        return OptimizationResult(
            best_parameters=best_result['parameters'],
            best_score=best_result['score'],
            optimization_history=optimization_history,
            convergence_info={'method': 'grid_search', 'converged': True},
            execution_time=0,  # 将在外部设置
            iterations_completed=len(valid_results),
            performance_metrics=best_result['metrics'],
            parameter_sensitivity={}
        )
    
    async def _random_search_optimization(
        self,
        strategy: Strategy,
        historical_data: pd.DataFrame,
        optimizable_params: Dict[str, StrategyParameter],
        config: OptimizationConfig
    ) -> OptimizationResult:
        """随机搜索优化"""
        import random
        
        if config.random_seed:
            random.seed(config.random_seed)
            np.random.seed(config.random_seed)
        
        best_score = float('-inf')
        best_params = None
        best_metrics = None
        optimization_history = []
        
        for iteration in range(config.max_iterations):
            # 随机生成参数
            params = self._generate_random_parameters(optimizable_params)
            
            # 评估参数
            try:
                result = await self._evaluate_parameter_combination(
                    strategy, historical_data, params, config.objective, iteration
                )
                
                score = result['score']
                metrics = result['metrics']
                
                # 更新最佳结果
                if score > best_score:
                    best_score = score
                    best_params = params
                    best_metrics = metrics
                
                optimization_history.append({
                    'iteration': iteration,
                    'parameters': params,
                    'score': score,
                    'metrics': metrics
                })
                
                # 检查收敛
                if len(optimization_history) > 10:
                    recent_scores = [h['score'] for h in optimization_history[-10:]]
                    if max(recent_scores) - min(recent_scores) < config.convergence_threshold:
                        self.logger.info(f"随机搜索在第 {iteration} 次迭代收敛")
                        break
                
            except Exception as e:
                self.logger.warning(f"第 {iteration} 次迭代评估失败: {e}")
                continue
        
        if best_params is None:
            raise ValueError("随机搜索未找到有效的参数组合")
        
        return OptimizationResult(
            best_parameters=best_params,
            best_score=best_score,
            optimization_history=optimization_history,
            convergence_info={'method': 'random_search', 'converged': True},
            execution_time=0,
            iterations_completed=len(optimization_history),
            performance_metrics=best_metrics,
            parameter_sensitivity={}
        )
    
    async def _bayesian_optimization(
        self,
        strategy: Strategy,
        historical_data: pd.DataFrame,
        optimizable_params: Dict[str, StrategyParameter],
        config: OptimizationConfig
    ) -> OptimizationResult:
        """贝叶斯优化（简化版本）"""
        # 注意：这是一个简化的贝叶斯优化实现
        # 在实际应用中，建议使用专业的贝叶斯优化库如scikit-optimize
        
        # 初始随机采样
        n_initial = min(10, config.max_iterations // 4)
        initial_results = []
        
        for i in range(n_initial):
            params = self._generate_random_parameters(optimizable_params)
            try:
                result = await self._evaluate_parameter_combination(
                    strategy, historical_data, params, config.objective, i
                )
                initial_results.append({
                    'parameters': params,
                    'score': result['score'],
                    'metrics': result['metrics']
                })
            except Exception as e:
                self.logger.warning(f"初始采样 {i} 失败: {e}")
        
        if not initial_results:
            raise ValueError("贝叶斯优化初始采样失败")
        
        # 找到最佳结果
        best_result = max(initial_results, key=lambda x: x['score'])
        
        optimization_history = [
            {
                'iteration': i,
                'parameters': result['parameters'],
                'score': result['score'],
                'metrics': result['metrics']
            }
            for i, result in enumerate(initial_results)
        ]
        
        return OptimizationResult(
            best_parameters=best_result['parameters'],
            best_score=best_result['score'],
            optimization_history=optimization_history,
            convergence_info={'method': 'bayesian', 'converged': True},
            execution_time=0,
            iterations_completed=len(initial_results),
            performance_metrics=best_result['metrics'],
            parameter_sensitivity={}
        )
    
    async def _genetic_optimization(
        self,
        strategy: Strategy,
        historical_data: pd.DataFrame,
        optimizable_params: Dict[str, StrategyParameter],
        config: OptimizationConfig
    ) -> OptimizationResult:
        """遗传算法优化（简化版本）"""
        import random
        
        if config.random_seed:
            random.seed(config.random_seed)
            np.random.seed(config.random_seed)
        
        # 初始化种群
        population = []
        for _ in range(config.population_size):
            individual = self._generate_random_parameters(optimizable_params)
            population.append(individual)
        
        best_score = float('-inf')
        best_params = None
        best_metrics = None
        optimization_history = []
        
        for generation in range(config.max_iterations):
            # 评估种群
            fitness_scores = []
            for i, individual in enumerate(population):
                try:
                    result = await self._evaluate_parameter_combination(
                        strategy, historical_data, individual, config.objective, 
                        generation * config.population_size + i
                    )
                    score = result['score']
                    fitness_scores.append(score)
                    
                    # 更新最佳结果
                    if score > best_score:
                        best_score = score
                        best_params = individual.copy()
                        best_metrics = result['metrics']
                    
                except Exception as e:
                    fitness_scores.append(float('-inf'))
                    self.logger.warning(f"个体评估失败: {e}")
            
            # 记录历史
            optimization_history.append({
                'iteration': generation,
                'parameters': best_params,
                'score': best_score,
                'metrics': best_metrics,
                'population_best': max(fitness_scores) if fitness_scores else float('-inf')
            })
            
            # 选择、交叉、变异
            new_population = self._genetic_operations(
                population, fitness_scores, optimizable_params
            )
            population = new_population
        
        if best_params is None:
            raise ValueError("遗传算法未找到有效的参数组合")
        
        return OptimizationResult(
            best_parameters=best_params,
            best_score=best_score,
            optimization_history=optimization_history,
            convergence_info={'method': 'genetic', 'converged': True},
            execution_time=0,
            iterations_completed=len(optimization_history),
            performance_metrics=best_metrics,
            parameter_sensitivity={}
        )
    
    def _generate_parameter_grid(self, optimizable_params: Dict[str, StrategyParameter]) -> List[Dict[str, Any]]:
        """生成参数网格"""
        param_combinations = [{}]
        
        for param_name, param in optimizable_params.items():
            new_combinations = []
            
            # 生成参数值列表
            if param.type == "int":
                values = list(range(
                    int(param.min_value),
                    int(param.max_value) + 1,
                    max(1, (int(param.max_value) - int(param.min_value)) // 10)
                ))
            elif param.type == "float":
                values = np.linspace(
                    param.min_value,
                    param.max_value,
                    min(10, int((param.max_value - param.min_value) / 0.01) + 1)
                ).tolist()
            else:
                values = [param.default_value]
            
            # 组合参数
            for combination in param_combinations:
                for value in values:
                    new_combination = combination.copy()
                    new_combination[param_name] = value
                    new_combinations.append(new_combination)
            
            param_combinations = new_combinations
        
        return param_combinations
    
    def _generate_random_parameters(self, optimizable_params: Dict[str, StrategyParameter]) -> Dict[str, Any]:
        """生成随机参数"""
        params = {}
        
        for param_name, param in optimizable_params.items():
            if param.type == "int":
                value = np.random.randint(int(param.min_value), int(param.max_value) + 1)
            elif param.type == "float":
                value = np.random.uniform(param.min_value, param.max_value)
            else:
                value = param.default_value
            
            params[param_name] = value
        
        return params
    
    async def _evaluate_parameter_combination(
        self,
        strategy: Strategy,
        historical_data: pd.DataFrame,
        parameters: Dict[str, Any],
        objective: OptimizationObjective,
        iteration: int
    ) -> Dict[str, Any]:
        """评估参数组合"""
        try:
            # 创建策略副本并设置参数
            strategy_copy = self._create_strategy_with_parameters(strategy, parameters)
            
            # 运行回测
            backtest_result = await self._run_backtest(strategy_copy, historical_data)
            
            # 计算目标函数值
            score = self._calculate_objective_score(backtest_result, objective)
            
            return {
                'parameters': parameters,
                'score': score,
                'metrics': backtest_result
            }
            
        except Exception as e:
            self.logger.error(f"参数组合评估失败 (迭代 {iteration}): {e}")
            raise
    
    def _create_strategy_with_parameters(self, strategy: Strategy, parameters: Dict[str, Any]) -> Strategy:
        """创建带有指定参数的策略副本"""
        # 这里应该根据实际的策略结构来实现
        # 简化实现：直接返回原策略
        return strategy
    
    async def _run_backtest(self, strategy: Strategy, historical_data: pd.DataFrame) -> Dict[str, float]:
        """运行回测"""
        # 这里应该实现实际的回测逻辑
        # 简化实现：返回模拟的性能指标
        return {
            'total_return': np.random.uniform(0.05, 0.25),
            'sharpe_ratio': np.random.uniform(0.8, 2.0),
            'max_drawdown': np.random.uniform(0.05, 0.20),
            'win_rate': np.random.uniform(0.45, 0.70),
            'profit_factor': np.random.uniform(1.1, 2.5)
        }
    
    def _calculate_objective_score(self, metrics: Dict[str, float], objective: OptimizationObjective) -> float:
        """计算目标函数得分"""
        if objective == OptimizationObjective.SHARPE_RATIO:
            return metrics.get('sharpe_ratio', 0)
        elif objective == OptimizationObjective.RETURN:
            return metrics.get('total_return', 0)
        elif objective == OptimizationObjective.MAX_DRAWDOWN:
            return -metrics.get('max_drawdown', 1)  # 负值，因为要最小化回撤
        elif objective == OptimizationObjective.WIN_RATE:
            return metrics.get('win_rate', 0)
        elif objective == OptimizationObjective.PROFIT_FACTOR:
            return metrics.get('profit_factor', 0)
        else:
            # 默认使用夏普比率
            return metrics.get('sharpe_ratio', 0)
    
    def _genetic_operations(
        self,
        population: List[Dict[str, Any]],
        fitness_scores: List[float],
        optimizable_params: Dict[str, StrategyParameter]
    ) -> List[Dict[str, Any]]:
        """遗传算法操作：选择、交叉、变异"""
        import random
        
        # 选择
        selected = self._tournament_selection(population, fitness_scores)
        
        # 交叉和变异
        new_population = []
        for i in range(0, len(selected), 2):
            parent1 = selected[i]
            parent2 = selected[i + 1] if i + 1 < len(selected) else selected[0]
            
            # 交叉
            child1, child2 = self._crossover(parent1, parent2, optimizable_params)
            
            # 变异
            child1 = self._mutate(child1, optimizable_params)
            child2 = self._mutate(child2, optimizable_params)
            
            new_population.extend([child1, child2])
        
        return new_population[:len(population)]
    
    def _tournament_selection(self, population: List[Dict[str, Any]], fitness_scores: List[float]) -> List[Dict[str, Any]]:
        """锦标赛选择"""
        import random
        
        selected = []
        tournament_size = 3
        
        for _ in range(len(population)):
            # 随机选择参赛者
            tournament_indices = random.sample(range(len(population)), min(tournament_size, len(population)))
            
            # 找到最佳个体
            best_idx = max(tournament_indices, key=lambda i: fitness_scores[i])
            selected.append(population[best_idx].copy())
        
        return selected
    
    def _crossover(
        self,
        parent1: Dict[str, Any],
        parent2: Dict[str, Any],
        optimizable_params: Dict[str, StrategyParameter]
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """交叉操作"""
        import random
        
        child1 = parent1.copy()
        child2 = parent2.copy()
        
        # 单点交叉
        param_names = list(optimizable_params.keys())
        if len(param_names) > 1:
            crossover_point = random.randint(1, len(param_names) - 1)
            
            for i, param_name in enumerate(param_names):
                if i >= crossover_point:
                    child1[param_name], child2[param_name] = child2[param_name], child1[param_name]
        
        return child1, child2
    
    def _mutate(
        self,
        individual: Dict[str, Any],
        optimizable_params: Dict[str, StrategyParameter],
        mutation_rate: float = 0.1
    ) -> Dict[str, Any]:
        """变异操作"""
        import random
        
        mutated = individual.copy()
        
        for param_name, param in optimizable_params.items():
            if random.random() < mutation_rate:
                if param.type == "int":
                    mutated[param_name] = random.randint(int(param.min_value), int(param.max_value))
                elif param.type == "float":
                    mutated[param_name] = random.uniform(param.min_value, param.max_value)
        
        return mutated
    
    def _calculate_parameter_sensitivity(self, optimization_history: List[Dict[str, Any]]) -> Dict[str, float]:
        """计算参数敏感性"""
        if len(optimization_history) < 2:
            return {}
        
        sensitivity = {}
        
        # 获取所有参数名
        param_names = set()
        for record in optimization_history:
            param_names.update(record['parameters'].keys())
        
        # 计算每个参数的敏感性
        for param_name in param_names:
            param_values = []
            scores = []
            
            for record in optimization_history:
                if param_name in record['parameters']:
                    param_values.append(record['parameters'][param_name])
                    scores.append(record['score'])
            
            if len(param_values) > 1:
                # 计算相关系数作为敏感性指标
                correlation = np.corrcoef(param_values, scores)[0, 1]
                sensitivity[param_name] = abs(correlation) if not np.isnan(correlation) else 0.0
            else:
                sensitivity[param_name] = 0.0
        
        return sensitivity
    
    def __del__(self):
        """清理资源"""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False)

# 全局优化器实例
_optimizer_instance: Optional[StrategyOptimizer] = None

def get_optimizer() -> StrategyOptimizer:
    """获取全局优化器实例
    
    Returns:
        策略优化器实例
    """
    global _optimizer_instance
    if _optimizer_instance is None:
        _optimizer_instance = StrategyOptimizer()
    return _optimizer_instance