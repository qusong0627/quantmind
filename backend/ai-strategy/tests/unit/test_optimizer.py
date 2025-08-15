"""策略优化器单元测试"""

import pytest
import numpy as np
from unittest.mock import Mock, patch, AsyncMock

from ai_strategy.core.optimizer import (
    StrategyOptimizer, 
    OptimizationMethod, 
    OptimizationObjective
)


class TestStrategyOptimizer:
    """StrategyOptimizer 测试类"""
    
    def setup_method(self):
        """测试前设置"""
        self.optimizer = StrategyOptimizer()
        
        # 模拟策略代码
        self.strategy_code = """
class TestStrategy:
    def __init__(self, period=20, threshold=0.5):
        self.period = period
        self.threshold = threshold
    
    def calculate_returns(self):
        # 模拟收益计算
        return np.random.normal(0.001, 0.02, 252)
"""
        
        # 参数范围
        self.param_ranges = {
            "period": (5, 50),
            "threshold": (0.1, 0.9)
        }
    
    def test_optimizer_initialization(self):
        """测试优化器初始化"""
        optimizer = StrategyOptimizer()
        assert optimizer is not None
        assert hasattr(optimizer, 'optimize_parameters')
        assert hasattr(optimizer, 'analyze_parameter_sensitivity')
    
    @pytest.mark.asyncio
    async def test_optimize_parameters_grid_search(self):
        """测试网格搜索参数优化"""
        with patch.object(self.optimizer, '_evaluate_strategy_performance', new_callable=AsyncMock) as mock_eval:
            # 模拟性能评估结果
            mock_eval.return_value = {
                "sharpe_ratio": 1.5,
                "total_return": 0.15,
                "max_drawdown": 0.05,
                "volatility": 0.12
            }
            
            result = await self.optimizer.optimize_parameters(
                strategy_code=self.strategy_code,
                param_ranges=self.param_ranges,
                method=OptimizationMethod.GRID_SEARCH,
                objective=OptimizationObjective.SHARPE_RATIO,
                grid_points=3
            )
            
            assert result is not None
            assert "best_params" in result
            assert "best_score" in result
            assert "optimization_history" in result
            assert "method" in result
            assert result["method"] == "grid_search"
            assert mock_eval.call_count > 0
    
    @pytest.mark.asyncio
    async def test_optimize_parameters_random_search(self):
        """测试随机搜索参数优化"""
        with patch.object(self.optimizer, '_evaluate_strategy_performance', new_callable=AsyncMock) as mock_eval:
            mock_eval.return_value = {
                "sharpe_ratio": 1.2,
                "total_return": 0.12,
                "max_drawdown": 0.08,
                "volatility": 0.15
            }
            
            result = await self.optimizer.optimize_parameters(
                strategy_code=self.strategy_code,
                param_ranges=self.param_ranges,
                method=OptimizationMethod.RANDOM_SEARCH,
                objective=OptimizationObjective.TOTAL_RETURN,
                n_trials=10
            )
            
            assert result is not None
            assert "best_params" in result
            assert "best_score" in result
            assert result["method"] == "random_search"
            assert mock_eval.call_count == 10
    
    @pytest.mark.asyncio
    async def test_optimize_parameters_bayesian(self):
        """测试贝叶斯优化"""
        with patch.object(self.optimizer, '_evaluate_strategy_performance', new_callable=AsyncMock) as mock_eval:
            mock_eval.return_value = {
                "sharpe_ratio": 1.8,
                "total_return": 0.18,
                "max_drawdown": 0.03,
                "volatility": 0.10
            }
            
            result = await self.optimizer.optimize_parameters(
                strategy_code=self.strategy_code,
                param_ranges=self.param_ranges,
                method=OptimizationMethod.BAYESIAN,
                objective=OptimizationObjective.MAX_DRAWDOWN,
                n_trials=15
            )
            
            assert result is not None
            assert "best_params" in result
            assert "best_score" in result
            assert result["method"] == "bayesian"
            assert mock_eval.call_count == 15
    
    @pytest.mark.asyncio
    async def test_optimize_parameters_genetic_algorithm(self):
        """测试遗传算法优化"""
        with patch.object(self.optimizer, '_evaluate_strategy_performance', new_callable=AsyncMock) as mock_eval:
            mock_eval.return_value = {
                "sharpe_ratio": 1.6,
                "total_return": 0.16,
                "max_drawdown": 0.06,
                "volatility": 0.13
            }
            
            result = await self.optimizer.optimize_parameters(
                strategy_code=self.strategy_code,
                param_ranges=self.param_ranges,
                method=OptimizationMethod.GENETIC_ALGORITHM,
                objective=OptimizationObjective.VOLATILITY,
                population_size=20,
                generations=10
            )
            
            assert result is not None
            assert "best_params" in result
            assert "best_score" in result
            assert result["method"] == "genetic_algorithm"
            # 遗传算法会评估多个个体
            assert mock_eval.call_count >= 20
    
    @pytest.mark.asyncio
    async def test_optimize_parameters_invalid_method(self):
        """测试无效的优化方法"""
        with pytest.raises(ValueError, match="Unsupported optimization method"):
            await self.optimizer.optimize_parameters(
                strategy_code=self.strategy_code,
                param_ranges=self.param_ranges,
                method="invalid_method",
                objective=OptimizationObjective.SHARPE_RATIO
            )
    
    @pytest.mark.asyncio
    async def test_analyze_parameter_sensitivity(self):
        """测试参数敏感性分析"""
        with patch.object(self.optimizer, '_evaluate_strategy_performance', new_callable=AsyncMock) as mock_eval:
            # 模拟不同参数值的性能结果
            def mock_performance(*args, **kwargs):
                params = kwargs.get('parameters', {})
                period = params.get('period', 20)
                # 模拟period对性能的影响
                sharpe = max(0.5, 2.0 - abs(period - 20) * 0.05)
                return {
                    "sharpe_ratio": sharpe,
                    "total_return": sharpe * 0.1,
                    "max_drawdown": 0.1 / sharpe,
                    "volatility": 0.15
                }
            
            mock_eval.side_effect = mock_performance
            
            result = await self.optimizer.analyze_parameter_sensitivity(
                strategy_code=self.strategy_code,
                param_ranges=self.param_ranges,
                objective=OptimizationObjective.SHARPE_RATIO,
                n_samples=10
            )
            
            assert result is not None
            assert "sensitivity_scores" in result
            assert "parameter_impacts" in result
            assert "correlation_matrix" in result
            assert "period" in result["sensitivity_scores"]
            assert "threshold" in result["sensitivity_scores"]
    
    @pytest.mark.asyncio
    async def test_backtest_strategy(self):
        """测试策略回测"""
        # 模拟市场数据
        market_data = {
            "dates": [f"2023-01-{i:02d}" for i in range(1, 31)],
            "prices": np.random.uniform(100, 110, 30).tolist(),
            "volumes": np.random.uniform(1000, 5000, 30).tolist()
        }
        
        parameters = {"period": 20, "threshold": 0.5}
        
        with patch.object(self.optimizer, '_simulate_trading', new_callable=AsyncMock) as mock_simulate:
            mock_simulate.return_value = {
                "trades": [
                    {"date": "2023-01-05", "action": "buy", "price": 105, "quantity": 100},
                    {"date": "2023-01-15", "action": "sell", "price": 108, "quantity": 100}
                ],
                "portfolio_value": [10000, 10500, 10800, 10300],
                "returns": [0.0, 0.05, 0.08, 0.03]
            }
            
            result = await self.optimizer.backtest_strategy(
                strategy_code=self.strategy_code,
                parameters=parameters,
                market_data=market_data,
                initial_capital=10000
            )
            
            assert result is not None
            assert "performance_metrics" in result
            assert "trades" in result
            assert "portfolio_history" in result
            assert "sharpe_ratio" in result["performance_metrics"]
            assert "total_return" in result["performance_metrics"]
    
    def test_grid_search_implementation(self):
        """测试网格搜索实现"""
        param_ranges = {
            "period": (10, 30),
            "threshold": (0.2, 0.8)
        }
        
        grid_points = self.optimizer._generate_grid_points(param_ranges, grid_points=3)
        
        assert len(grid_points) == 9  # 3x3 网格
        
        # 检查参数范围
        for point in grid_points:
            assert 10 <= point["period"] <= 30
            assert 0.2 <= point["threshold"] <= 0.8
    
    def test_random_search_implementation(self):
        """测试随机搜索实现"""
        param_ranges = {
            "period": (5, 50),
            "threshold": (0.1, 0.9)
        }
        
        random_points = self.optimizer._generate_random_points(param_ranges, n_trials=20)
        
        assert len(random_points) == 20
        
        # 检查参数范围
        for point in random_points:
            assert 5 <= point["period"] <= 50
            assert 0.1 <= point["threshold"] <= 0.9
    
    def test_objective_function_calculation(self):
        """测试目标函数计算"""
        performance_metrics = {
            "sharpe_ratio": 1.5,
            "total_return": 0.15,
            "max_drawdown": 0.05,
            "volatility": 0.12
        }
        
        # 测试不同目标函数
        sharpe_score = self.optimizer._calculate_objective_score(
            performance_metrics, OptimizationObjective.SHARPE_RATIO
        )
        assert sharpe_score == 1.5
        
        return_score = self.optimizer._calculate_objective_score(
            performance_metrics, OptimizationObjective.TOTAL_RETURN
        )
        assert return_score == 0.15
        
        # 最大回撤是负向指标，应该取负值
        drawdown_score = self.optimizer._calculate_objective_score(
            performance_metrics, OptimizationObjective.MAX_DRAWDOWN
        )
        assert drawdown_score == -0.05
        
        # 波动率是负向指标，应该取负值
        volatility_score = self.optimizer._calculate_objective_score(
            performance_metrics, OptimizationObjective.VOLATILITY
        )
        assert volatility_score == -0.12
    
    @pytest.mark.asyncio
    async def test_evaluate_strategy_performance(self):
        """测试策略性能评估"""
        parameters = {"period": 20, "threshold": 0.5}
        
        with patch.object(self.optimizer, 'backtest_strategy', new_callable=AsyncMock) as mock_backtest:
            mock_backtest.return_value = {
                "performance_metrics": {
                    "sharpe_ratio": 1.5,
                    "total_return": 0.15,
                    "max_drawdown": 0.05,
                    "volatility": 0.12,
                    "win_rate": 0.6,
                    "profit_factor": 1.8
                }
            }
            
            result = await self.optimizer._evaluate_strategy_performance(
                strategy_code=self.strategy_code,
                parameters=parameters
            )
            
            assert result is not None
            assert "sharpe_ratio" in result
            assert "total_return" in result
            assert result["sharpe_ratio"] == 1.5
    
    def test_parameter_validation(self):
        """测试参数验证"""
        # 测试有效参数范围
        valid_ranges = {
            "period": (5, 50),
            "threshold": (0.1, 0.9)
        }
        assert self.optimizer._validate_param_ranges(valid_ranges) is True
        
        # 测试无效参数范围（最小值大于最大值）
        invalid_ranges = {
            "period": (50, 5),  # 最小值大于最大值
            "threshold": (0.1, 0.9)
        }
        assert self.optimizer._validate_param_ranges(invalid_ranges) is False
        
        # 测试空参数范围
        empty_ranges = {}
        assert self.optimizer._validate_param_ranges(empty_ranges) is False
    
    def test_performance_metrics_calculation(self):
        """测试性能指标计算"""
        # 模拟收益序列
        returns = np.array([0.01, -0.005, 0.02, -0.01, 0.015, -0.008, 0.012])
        portfolio_values = np.array([10000, 10100, 10050, 10250, 10150, 10302, 10220, 10342])
        
        metrics = self.optimizer._calculate_performance_metrics(returns, portfolio_values)
        
        assert "sharpe_ratio" in metrics
        assert "total_return" in metrics
        assert "max_drawdown" in metrics
        assert "volatility" in metrics
        assert "win_rate" in metrics
        
        # 检查计算结果的合理性
        assert metrics["total_return"] > 0  # 总收益应该为正
        assert 0 <= metrics["win_rate"] <= 1  # 胜率应该在0-1之间
        assert metrics["max_drawdown"] <= 0  # 最大回撤应该为负或零
    
    @pytest.mark.asyncio
    async def test_optimization_with_constraints(self):
        """测试带约束的优化"""
        constraints = {
            "max_drawdown": 0.1,  # 最大回撤不超过10%
            "min_sharpe": 1.0     # 最小夏普比率1.0
        }
        
        with patch.object(self.optimizer, '_evaluate_strategy_performance', new_callable=AsyncMock) as mock_eval:
            # 模拟一些满足约束，一些不满足约束的结果
            def mock_performance(*args, **kwargs):
                params = kwargs.get('parameters', {})
                period = params.get('period', 20)
                
                if period < 15:  # 不满足约束的情况
                    return {
                        "sharpe_ratio": 0.8,  # 低于最小夏普比率
                        "max_drawdown": 0.15,  # 超过最大回撤
                        "total_return": 0.05,
                        "volatility": 0.20
                    }
                else:  # 满足约束的情况
                    return {
                        "sharpe_ratio": 1.5,
                        "max_drawdown": 0.08,
                        "total_return": 0.15,
                        "volatility": 0.12
                    }
            
            mock_eval.side_effect = mock_performance
            
            result = await self.optimizer.optimize_parameters(
                strategy_code=self.strategy_code,
                param_ranges=self.param_ranges,
                method=OptimizationMethod.GRID_SEARCH,
                objective=OptimizationObjective.SHARPE_RATIO,
                constraints=constraints,
                grid_points=3
            )
            
            assert result is not None
            assert "best_params" in result
            # 最佳参数应该满足约束
            assert result["best_params"]["period"] >= 15


class TestGlobalOptimizer:
    """全局优化器测试类"""
    
    def test_get_global_optimizer_singleton(self):
        """测试全局优化器单例模式"""
        optimizer1 = get_global_optimizer()
        optimizer2 = get_global_optimizer()
        assert optimizer1 is optimizer2
    
    def test_get_global_optimizer_type(self):
        """测试全局优化器类型"""
        optimizer = get_global_optimizer()
        assert isinstance(optimizer, StrategyOptimizer)


class TestOptimizationEnums:
    """优化枚举测试类"""
    
    def test_optimization_method_enum(self):
        """测试优化方法枚举"""
        assert OptimizationMethod.GRID_SEARCH == "grid_search"
        assert OptimizationMethod.RANDOM_SEARCH == "random_search"
        assert OptimizationMethod.BAYESIAN == "bayesian"
        assert OptimizationMethod.GENETIC_ALGORITHM == "genetic_algorithm"
    
    def test_optimization_objective_enum(self):
        """测试优化目标枚举"""
        assert OptimizationObjective.SHARPE_RATIO == "sharpe_ratio"
        assert OptimizationObjective.TOTAL_RETURN == "total_return"
        assert OptimizationObjective.MAX_DRAWDOWN == "max_drawdown"
        assert OptimizationObjective.VOLATILITY == "volatility"


if __name__ == "__main__":
    pytest.main([__file__])