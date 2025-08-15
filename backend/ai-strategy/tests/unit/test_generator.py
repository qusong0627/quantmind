"""策略生成器单元测试"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from ai_strategy.core.generator import StrategyGenerator
from ai_strategy.models.requests import StrategyRequest, ModelType, MarketType, RiskLevel, TimeFrame
from ai_strategy.models.responses import StrategyResponse, ModelResponse
from ai_strategy.models.strategy import Strategy, StrategyCode, PerformanceMetric, RiskMetric
from ai_strategy.providers.base import BaseLLMProvider

class MockLLMProvider(BaseLLMProvider):
    """模拟LLM提供商"""
    
    def __init__(self, name: str, response_data: dict = None):
        self.name = name
        self.response_data = response_data or {
            "code": "# Mock strategy code\nclass MockStrategy:\n    pass",
            "description": "Mock strategy description",
            "parameters": {"param1": 10, "param2": 0.5}
        }
        self.client = MagicMock()
    
    async def initialize_client(self):
        """初始化客户端"""
        pass
    
    async def generate_content(self, prompt: str, **kwargs) -> dict:
        """生成内容"""
        return self.response_data
    
    def extract_code(self, content: str) -> str:
        """提取代码"""
        return self.response_data["code"]
    
    def extract_description(self, content: str) -> str:
        """提取描述"""
        return self.response_data["description"]
    
    def extract_parameters(self, content: str) -> dict:
        """提取参数"""
        return self.response_data["parameters"]
    
    def calculate_confidence(self, content: str) -> float:
        """计算置信度"""
        return 0.85
    
    def calculate_risk_metrics(self, code: str) -> dict:
        """计算风险指标"""
        return {
            "complexity_score": 0.3,
            "risk_score": 0.2,
            "maintainability_score": 0.8
        }
    
    async def verify_connection(self) -> bool:
        """验证连接"""
        return True
    
    async def get_model_info(self) -> dict:
        """获取模型信息"""
        return {"name": self.name, "version": "1.0"}

class TestStrategyGenerator:
    """策略生成器测试类"""
    
    @pytest.fixture
    def mock_providers(self):
        """模拟提供商"""
        return {
            "qwen": MockLLMProvider("qwen", {
                "code": "# Qwen strategy\nclass QwenStrategy:\n    def __init__(self):\n        self.name = 'qwen'",
                "description": "Qwen generated strategy",
                "parameters": {"period": 20, "threshold": 0.02}
            }),
            "gemini": MockLLMProvider("gemini", {
                "code": "# Gemini strategy\nclass GeminiStrategy:\n    def __init__(self):\n        self.name = 'gemini'",
                "description": "Gemini generated strategy",
                "parameters": {"window": 14, "factor": 1.5}
            })
        }
    
    @pytest.fixture
    def generator(self, mock_providers):
        """策略生成器实例"""
        return StrategyGenerator(mock_providers)
    
    @pytest.fixture
    def sample_request(self):
        """示例请求"""
        return StrategyRequest(
            description="Generate a moving average crossover strategy",
            user_id="test_user",
            models=[ModelType.QWEN, ModelType.GEMINI],
            market_type=MarketType.STOCK,
            time_frame=TimeFrame.DAILY,
            risk_level=RiskLevel.MEDIUM,
            custom_parameters={"lookback_period": 30},
            template_id=None,
            ptrade_syntax=True,
            optimization_enabled=False
        )
    
    def test_generator_initialization(self, mock_providers):
        """测试生成器初始化"""
        generator = StrategyGenerator(mock_providers)
        
        assert generator.providers == mock_providers
        assert len(generator.providers) == 2
        assert "qwen" in generator.providers
        assert "gemini" in generator.providers
    
    @pytest.mark.asyncio
    async def test_generate_strategy_success(self, generator, sample_request):
        """测试成功生成策略"""
        response = await generator.generate_strategy(sample_request)
        
        assert isinstance(response, StrategyResponse)
        assert response.success is True
        assert response.request_id is not None
        assert len(response.strategies) > 0
        assert response.best_strategy is not None
        assert len(response.model_responses) == 2  # qwen + gemini
        
        # 检查最佳策略
        best_strategy = response.best_strategy
        assert isinstance(best_strategy, Strategy)
        assert best_strategy.code is not None
        assert best_strategy.description is not None
        assert best_strategy.parameters is not None
    
    @pytest.mark.asyncio
    async def test_generate_strategy_single_model(self, generator):
        """测试单模型生成策略"""
        request = StrategyRequest(
            description="Simple RSI strategy",
            user_id="test_user",
            models=[ModelType.QWEN],  # 只使用一个模型
            market_type=MarketType.STOCK,
            time_frame=TimeFrame.DAILY,
            risk_level=RiskLevel.LOW
        )
        
        response = await generator.generate_strategy(request)
        
        assert response.success is True
        assert len(response.model_responses) == 1
        assert response.model_responses[0].model == "qwen"
        assert response.best_strategy is not None
    
    @pytest.mark.asyncio
    async def test_generate_strategy_with_template(self, generator):
        """测试使用模板生成策略"""
        request = StrategyRequest(
            description="Customize moving average strategy",
            user_id="test_user",
            models=[ModelType.QWEN],
            market_type=MarketType.STOCK,
            time_frame=TimeFrame.DAILY,
            risk_level=RiskLevel.MEDIUM,
            template_id="ma_crossover"
        )
        
        with patch('templates.manager.get_template_manager') as mock_template_manager:
            mock_manager = MagicMock()
            mock_manager.get_template.return_value = {
                "id": "ma_crossover",
                "name": "Moving Average Crossover",
                "code": "# Template code",
                "description": "Template description"
            }
            mock_template_manager.return_value = mock_manager
            
            response = await generator.generate_strategy(request)
            
            assert response.success is True
            assert response.best_strategy is not None
    
    @pytest.mark.asyncio
    async def test_generate_strategy_provider_failure(self, mock_providers):
        """测试提供商失败情况"""
        # 创建会失败的提供商
        failing_provider = MockLLMProvider("failing")
        failing_provider.generate_content = AsyncMock(side_effect=Exception("Provider failed"))
        
        providers = {"failing": failing_provider}
        generator = StrategyGenerator(providers)
        
        request = StrategyRequest(
            description="Test strategy",
            user_id="test_user",
            models=[ModelType.QWEN],  # 映射到failing provider
            market_type=MarketType.STOCK,
            time_frame=TimeFrame.DAILY,
            risk_level=RiskLevel.LOW
        )
        
        response = await generator.generate_strategy(request)
        
        # 应该返回失败响应
        assert response.success is False
        assert len(response.strategies) == 0
        assert response.best_strategy is None
        assert response.error is not None
    
    @pytest.mark.asyncio
    async def test_generate_strategy_partial_failure(self, mock_providers):
        """测试部分提供商失败"""
        # 让一个提供商失败
        mock_providers["gemini"].generate_content = AsyncMock(side_effect=Exception("Gemini failed"))
        
        generator = StrategyGenerator(mock_providers)
        
        request = StrategyRequest(
            description="Test strategy",
            user_id="test_user",
            models=[ModelType.QWEN, ModelType.GEMINI],
            market_type=MarketType.STOCK,
            time_frame=TimeFrame.DAILY,
            risk_level=RiskLevel.MEDIUM
        )
        
        response = await generator.generate_strategy(request)
        
        # 应该成功，但只有一个策略
        assert response.success is True
        assert len(response.strategies) == 1
        assert len(response.model_responses) == 2  # 包含失败的响应
        assert response.best_strategy is not None
        
        # 检查失败的模型响应
        failed_response = next(r for r in response.model_responses if not r.success)
        assert failed_response.model == "gemini"
        assert failed_response.error is not None
    
    def test_build_prompt_basic(self, generator, sample_request):
        """测试基本提示词构建"""
        prompt = generator._build_prompt(sample_request)
        
        assert isinstance(prompt, str)
        assert len(prompt) > 0
        assert "moving average crossover strategy" in prompt.lower()
        assert "stock" in prompt.lower()
        assert "daily" in prompt.lower()
        assert "medium" in prompt.lower()
    
    def test_build_prompt_with_custom_parameters(self, generator):
        """测试包含自定义参数的提示词构建"""
        request = StrategyRequest(
            description="RSI strategy",
            user_id="test_user",
            models=[ModelType.QWEN],
            market_type=MarketType.CRYPTO,
            time_frame=TimeFrame.HOURLY,
            risk_level=RiskLevel.HIGH,
            custom_parameters={
                "rsi_period": 14,
                "overbought": 70,
                "oversold": 30
            }
        )
        
        prompt = generator._build_prompt(request)
        
        assert "rsi_period" in prompt
        assert "overbought" in prompt
        assert "oversold" in prompt
        assert "crypto" in prompt.lower()
        assert "hourly" in prompt.lower()
    
    def test_build_prompt_with_ptrade_syntax(self, generator):
        """测试PTrade语法提示词"""
        request = StrategyRequest(
            description="Test strategy",
            user_id="test_user",
            models=[ModelType.QWEN],
            market_type=MarketType.STOCK,
            time_frame=TimeFrame.DAILY,
            risk_level=RiskLevel.LOW,
            ptrade_syntax=True
        )
        
        prompt = generator._build_prompt(request)
        
        assert "ptrade" in prompt.lower()
    
    def test_select_best_strategy(self, generator):
        """测试最佳策略选择"""
        strategies = [
            Strategy(
                id="strategy1",
                name="Strategy 1",
                code=StrategyCode(content="# Strategy 1", language="python"),
                description="First strategy",
                parameters={"param1": 10},
                performance_metrics=PerformanceMetric(
                    sharpe_ratio=1.2,
                    max_drawdown=0.15,
                    total_return=0.25,
                    win_rate=0.65
                ),
                risk_metrics=RiskMetric(
                    var_95=0.05,
                    expected_shortfall=0.08,
                    beta=1.1,
                    volatility=0.18
                ),
                confidence_score=0.8,
                created_at=datetime.now()
            ),
            Strategy(
                id="strategy2",
                name="Strategy 2",
                code=StrategyCode(content="# Strategy 2", language="python"),
                description="Second strategy",
                parameters={"param1": 15},
                performance_metrics=PerformanceMetric(
                    sharpe_ratio=1.5,  # 更高的夏普比率
                    max_drawdown=0.12,
                    total_return=0.30,
                    win_rate=0.70
                ),
                risk_metrics=RiskMetric(
                    var_95=0.04,
                    expected_shortfall=0.06,
                    beta=0.9,
                    volatility=0.15
                ),
                confidence_score=0.9,  # 更高的置信度
                created_at=datetime.now()
            )
        ]
        
        best_strategy = generator._select_best_strategy(strategies)
        
        # 应该选择Strategy 2（更高的夏普比率和置信度）
        assert best_strategy.id == "strategy2"
        assert best_strategy.performance_metrics.sharpe_ratio == 1.5
    
    def test_select_best_strategy_empty_list(self, generator):
        """测试空策略列表"""
        best_strategy = generator._select_best_strategy([])
        assert best_strategy is None
    
    def test_select_best_strategy_single_strategy(self, generator):
        """测试单个策略"""
        strategy = Strategy(
            id="single",
            name="Single Strategy",
            code=StrategyCode(content="# Single", language="python"),
            description="Single strategy",
            parameters={},
            performance_metrics=PerformanceMetric(
                sharpe_ratio=1.0,
                max_drawdown=0.10,
                total_return=0.20,
                win_rate=0.60
            ),
            risk_metrics=RiskMetric(
                var_95=0.05,
                expected_shortfall=0.07,
                beta=1.0,
                volatility=0.16
            ),
            confidence_score=0.75,
            created_at=datetime.now()
        )
        
        best_strategy = generator._select_best_strategy([strategy])
        assert best_strategy is strategy
    
    def test_calculate_code_quality_score(self, generator):
        """测试代码质量评分"""
        # 高质量代码
        good_code = """
class MovingAverageStrategy:
    def __init__(self, short_period=10, long_period=20):
        self.short_period = short_period
        self.long_period = long_period
    
    def generate_signals(self, data):
        # Calculate moving averages
        short_ma = data.rolling(self.short_period).mean()
        long_ma = data.rolling(self.long_period).mean()
        
        # Generate buy/sell signals
        signals = []
        for i in range(len(data)):
            if short_ma[i] > long_ma[i]:
                signals.append('BUY')
            else:
                signals.append('SELL')
        
        return signals
"""
        
        score = generator._calculate_code_quality_score(good_code)
        assert 0.0 <= score <= 1.0
        assert score > 0.5  # 应该是较高的分数
        
        # 低质量代码
        bad_code = "x=1;y=2;print(x+y)"
        
        bad_score = generator._calculate_code_quality_score(bad_code)
        assert 0.0 <= bad_score <= 1.0
        assert bad_score < score  # 应该比好代码分数低
    
    def test_calculate_risk_score(self, generator):
        """测试风险评分计算"""
        # 低风险代码
        safe_code = """
class SafeStrategy:
    def __init__(self):
        self.position_size = 0.01  # 小仓位
        self.stop_loss = 0.02      # 止损
    
    def calculate_position(self, signal):
        return signal * self.position_size
"""
        
        risk_score = generator._calculate_risk_score(safe_code)
        assert 0.0 <= risk_score <= 1.0
        
        # 高风险代码
        risky_code = """
class RiskyStrategy:
    def __init__(self):
        self.leverage = 10  # 高杠杆
    
    def all_in(self):
        return 1.0  # 全仓
"""
        
        risky_score = generator._calculate_risk_score(risky_code)
        assert 0.0 <= risky_score <= 1.0
        assert risky_score > risk_score  # 风险代码应该有更高的风险分数

if __name__ == "__main__":
    pytest.main([__file__])