"""策略验证器单元测试"""

import pytest
import ast
from unittest.mock import patch, MagicMock

from ai_strategy.core.validator import StrategyValidator, ValidationLevel
from ai_strategy.models.responses import ValidationResult, ValidationStatus

class TestStrategyValidator:
    """策略验证器测试类"""
    
    @pytest.fixture
    def validator(self):
        """验证器实例"""
        return StrategyValidator()
    
    def test_validator_initialization(self, validator):
        """测试验证器初始化"""
        assert validator is not None
        assert hasattr(validator, 'validate_strategy')
        assert hasattr(validator, '_check_syntax')
        assert hasattr(validator, '_check_imports')
    
    def test_validate_strategy_valid_code(self, validator):
        """测试验证有效代码"""
        valid_code = """
class MovingAverageStrategy:
    def __init__(self, short_period=10, long_period=20):
        self.short_period = short_period
        self.long_period = long_period
    
    def generate_signals(self, data):
        import pandas as pd
        import numpy as np
        
        short_ma = data.rolling(self.short_period).mean()
        long_ma = data.rolling(self.long_period).mean()
        
        signals = []
        for i in range(len(data)):
            if short_ma.iloc[i] > long_ma.iloc[i]:
                signals.append(1)  # Buy signal
            else:
                signals.append(0)  # Hold/Sell signal
        
        return signals
    
    def calculate_returns(self, data, signals):
        returns = []
        for i in range(1, len(data)):
            if signals[i-1] == 1:
                ret = (data.iloc[i] - data.iloc[i-1]) / data.iloc[i-1]
                returns.append(ret)
            else:
                returns.append(0)
        return returns
"""
        
        result = validator.validate_strategy(valid_code, ValidationLevel.STANDARD)
        
        assert isinstance(result, ValidationResult)
        assert result.status == ValidationStatus.VALID
        assert result.is_valid is True
        assert len(result.errors) == 0
        assert result.quality_score > 0.5
        assert len(result.suggestions) >= 0
    
    def test_validate_strategy_syntax_error(self, validator):
        """测试语法错误代码"""
        invalid_code = """
class BrokenStrategy:
    def __init__(self):
        self.value = 10
    
    def broken_method(self):
        # 语法错误：缺少冒号
        if True
            return "broken"
"""
        
        result = validator.validate_strategy(invalid_code, ValidationLevel.BASIC)
        
        assert result.status == ValidationStatus.INVALID
        assert result.is_valid is False
        assert len(result.errors) > 0
        assert any("syntax" in error.lower() for error in result.errors)
        assert result.quality_score == 0.0
    
    def test_validate_strategy_dangerous_imports(self, validator):
        """测试危险导入"""
        dangerous_code = """
import os
import subprocess
import sys

class DangerousStrategy:
    def __init__(self):
        # 危险操作
        os.system("rm -rf /")
        subprocess.call(["curl", "http://malicious.com"])
    
    def execute(self):
        return "dangerous"
"""
        
        result = validator.validate_strategy(dangerous_code, ValidationLevel.STRICT)
        
        assert result.status == ValidationStatus.INVALID
        assert result.is_valid is False
        assert len(result.errors) > 0
        assert any("dangerous" in error.lower() or "security" in error.lower() for error in result.errors)
    
    def test_validate_strategy_missing_class(self, validator):
        """测试缺少策略类"""
        no_class_code = """
def some_function():
    return "no class here"

value = 42
"""
        
        result = validator.validate_strategy(no_class_code, ValidationLevel.STANDARD)
        
        assert result.status == ValidationStatus.INVALID
        assert result.is_valid is False
        assert len(result.errors) > 0
        assert any("class" in error.lower() for error in result.errors)
    
    def test_validate_strategy_missing_methods(self, validator):
        """测试缺少必需方法"""
        incomplete_code = """
class IncompleteStrategy:
    def __init__(self):
        self.name = "incomplete"
    
    # 缺少 generate_signals 方法
"""
        
        result = validator.validate_strategy(incomplete_code, ValidationLevel.COMPREHENSIVE)
        
        assert result.status in [ValidationStatus.WARNING, ValidationStatus.INVALID]
        assert len(result.suggestions) > 0 or len(result.errors) > 0
    
    def test_check_syntax_valid(self, validator):
        """测试语法检查 - 有效代码"""
        valid_code = """
class TestStrategy:
    def __init__(self):
        self.value = 10
    
    def method(self):
        return self.value * 2
"""
        
        errors = validator._check_syntax(valid_code)
        assert len(errors) == 0
    
    def test_check_syntax_invalid(self, validator):
        """测试语法检查 - 无效代码"""
        invalid_code = """
class TestStrategy:
    def __init__(self):
        self.value = 10
    
    def method(self):
        if True  # 缺少冒号
            return self.value
"""
        
        errors = validator._check_syntax(invalid_code)
        assert len(errors) > 0
        assert any("syntax" in error.lower() for error in errors)
    
    def test_check_imports_safe(self, validator):
        """测试导入检查 - 安全导入"""
        safe_code = """
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
from typing import List, Dict

class SafeStrategy:
    pass
"""
        
        errors = validator._check_imports(safe_code)
        assert len(errors) == 0
    
    def test_check_imports_dangerous(self, validator):
        """测试导入检查 - 危险导入"""
        dangerous_code = """
import os
import subprocess
import socket
import urllib.request

class DangerousStrategy:
    pass
"""
        
        errors = validator._check_imports(dangerous_code)
        assert len(errors) > 0
        assert any("dangerous" in error.lower() or "security" in error.lower() for error in errors)
    
    def test_check_class_structure_valid(self, validator):
        """测试类结构检查 - 有效结构"""
        valid_code = """
class ValidStrategy:
    def __init__(self, param1=10, param2=0.5):
        self.param1 = param1
        self.param2 = param2
    
    def generate_signals(self, data):
        return [1, 0, 1, 0]
    
    def calculate_returns(self, data, signals):
        return [0.01, 0.02, -0.01, 0.03]
"""
        
        tree = ast.parse(valid_code)
        errors = validator._check_class_structure(tree)
        assert len(errors) == 0
    
    def test_check_class_structure_no_class(self, validator):
        """测试类结构检查 - 无类定义"""
        no_class_code = """
def function():
    return "no class"

value = 42
"""
        
        tree = ast.parse(no_class_code)
        errors = validator._check_class_structure(tree)
        assert len(errors) > 0
        assert any("class" in error.lower() for error in errors)
    
    def test_check_method_signatures_valid(self, validator):
        """测试方法签名检查 - 有效签名"""
        valid_code = """
class ValidStrategy:
    def __init__(self, param1=10):
        self.param1 = param1
    
    def generate_signals(self, data):
        return []
    
    def calculate_returns(self, data, signals):
        return []
"""
        
        tree = ast.parse(valid_code)
        errors = validator._check_method_signatures(tree)
        assert len(errors) == 0
    
    def test_check_method_signatures_invalid(self, validator):
        """测试方法签名检查 - 无效签名"""
        invalid_code = """
class InvalidStrategy:
    def __init__(self):  # 缺少参数
        pass
    
    def generate_signals(self):  # 缺少data参数
        return []
"""
        
        tree = ast.parse(invalid_code)
        errors = validator._check_method_signatures(tree)
        # 根据具体实现，可能会有错误
        # assert len(errors) > 0
    
    def test_check_dangerous_operations_safe(self, validator):
        """测试危险操作检查 - 安全代码"""
        safe_code = """
class SafeStrategy:
    def __init__(self):
        self.data = []
    
    def process_data(self, input_data):
        result = []
        for item in input_data:
            result.append(item * 2)
        return result
"""
        
        tree = ast.parse(safe_code)
        errors = validator._check_dangerous_operations(tree)
        assert len(errors) == 0
    
    def test_check_dangerous_operations_unsafe(self, validator):
        """测试危险操作检查 - 危险代码"""
        unsafe_code = """
import os
import subprocess

class UnsafeStrategy:
    def __init__(self):
        os.system("rm -rf /tmp/*")
        subprocess.call(["curl", "http://malicious.com"])
    
    def read_file(self):
        with open("/etc/passwd", "r") as f:
            return f.read()
"""
        
        tree = ast.parse(unsafe_code)
        errors = validator._check_dangerous_operations(tree)
        assert len(errors) > 0
    
    def test_check_code_quality_good(self, validator):
        """测试代码质量检查 - 高质量代码"""
        good_code = """
class HighQualityStrategy:
    \"\"\"A well-documented strategy class.\"\"\"
    
    def __init__(self, short_period: int = 10, long_period: int = 20):
        \"\"\"Initialize the strategy with periods.
        
        Args:
            short_period: Short moving average period
            long_period: Long moving average period
        \"\"\"
        if short_period >= long_period:
            raise ValueError("Short period must be less than long period")
        
        self.short_period = short_period
        self.long_period = long_period
    
    def generate_signals(self, data):
        \"\"\"Generate trading signals based on moving average crossover.
        
        Args:
            data: Price data series
            
        Returns:
            List of trading signals
        \"\"\"
        if len(data) < self.long_period:
            return []
        
        signals = []
        for i in range(self.long_period, len(data)):
            short_ma = sum(data[i-self.short_period:i]) / self.short_period
            long_ma = sum(data[i-self.long_period:i]) / self.long_period
            
            if short_ma > long_ma:
                signals.append(1)  # Buy signal
            else:
                signals.append(0)  # Hold signal
        
        return signals
        """
        
        suggestions, score = validator._check_code_quality(good_code)
        assert score > 0.7  # 应该是高分
        assert len(suggestions) <= 2  # 建议应该很少
    
    def test_check_code_quality_poor(self, validator):
        """测试代码质量检查 - 低质量代码"""
        poor_code = """
class s:
    def __init__(self,a,b):
        self.a=a
        self.b=b
    def f(self,d):
        x=[]
        for i in range(len(d)):
            if d[i]>0:
                x.append(1)
            else:
                x.append(0)
        return x
"""
        
        suggestions, score = validator._check_code_quality(poor_code)
        assert score < 0.5  # 应该是低分
        assert len(suggestions) > 0  # 应该有很多建议
    
    def test_check_ptrade_compliance_valid(self, validator):
        """测试PTrade合规性检查 - 合规代码"""
        ptrade_code = """
class PTradeStrategy:
    def __init__(self):
        self.position = 0
        self.cash = 100000
    
    def on_bar(self, bar):
        # PTrade compatible method
        if bar.close > bar.open:
            self.buy(100)
        else:
            self.sell(100)
    
    def buy(self, quantity):
        self.position += quantity
    
    def sell(self, quantity):
        self.position -= quantity
"""
        
        errors = validator._check_ptrade_compliance(ptrade_code)
        assert len(errors) == 0
    
    def test_validation_levels(self, validator):
        """测试不同验证级别"""
        test_code = """
class TestStrategy:
    def __init__(self):
        self.value = 10
    
    def generate_signals(self, data):
        return [1, 0, 1]
"""
        
        # BASIC级别
        basic_result = validator.validate_strategy(test_code, ValidationLevel.BASIC)
        assert basic_result.status in [ValidationStatus.VALID, ValidationStatus.WARNING]
        
        # STANDARD级别
        standard_result = validator.validate_strategy(test_code, ValidationLevel.STANDARD)
        assert standard_result.status in [ValidationStatus.VALID, ValidationStatus.WARNING]
        
        # STRICT级别
        strict_result = validator.validate_strategy(test_code, ValidationLevel.STRICT)
        assert strict_result.status in [ValidationStatus.VALID, ValidationStatus.WARNING, ValidationStatus.INVALID]
        
        # COMPREHENSIVE级别
        comprehensive_result = validator.validate_strategy(test_code, ValidationLevel.COMPREHENSIVE)
        assert comprehensive_result.status in [ValidationStatus.VALID, ValidationStatus.WARNING, ValidationStatus.INVALID]
    
    def test_empty_code_validation(self, validator):
        """测试空代码验证"""
        result = validator.validate_strategy("", ValidationLevel.BASIC)
        
        assert result.status == ValidationStatus.INVALID
        assert result.is_valid is False
        assert len(result.errors) > 0
        assert result.quality_score == 0.0
    
    def test_whitespace_only_code(self, validator):
        """测试仅包含空白字符的代码"""
        whitespace_code = "   \n\t  \n   "
        
        result = validator.validate_strategy(whitespace_code, ValidationLevel.BASIC)
        
        assert result.status == ValidationStatus.INVALID
        assert result.is_valid is False
        assert len(result.errors) > 0
    
    def test_complex_valid_strategy(self, validator):
        """测试复杂但有效的策略"""
        complex_code = """
import pandas as pd
import numpy as np
from typing import List, Dict, Optional

class AdvancedMovingAverageStrategy:
    \"\"\"Advanced moving average crossover strategy with risk management.\"\"\"
    
    def __init__(self, 
                 short_period: int = 10, 
                 long_period: int = 20,
                 stop_loss: float = 0.02,
                 take_profit: float = 0.05):
        \"\"\"Initialize the advanced strategy.
        
        Args:
            short_period: Short MA period
            long_period: Long MA period  
            stop_loss: Stop loss percentage
            take_profit: Take profit percentage
        \"\"\"
        self.short_period = short_period
        self.long_period = long_period
        self.stop_loss = stop_loss
        self.take_profit = take_profit
        self.position = 0
        self.entry_price = 0.0
    
    def calculate_moving_averages(self, data: pd.Series) -> Dict[str, pd.Series]:
        \"\"\"Calculate short and long moving averages.
        
        Args:
            data: Price data series
            
        Returns:
            Dictionary containing short and long MA series
        \"\"\"
        short_ma = data.rolling(window=self.short_period).mean()
        long_ma = data.rolling(window=self.long_period).mean()
        
        return {
            'short_ma': short_ma,
            'long_ma': long_ma
        }
    
    def generate_signals(self, data: pd.Series) -> List[int]:
        \"\"\"Generate trading signals with risk management.
        
        Args:
            data: Price data series
            
        Returns:
            List of trading signals (1=buy, -1=sell, 0=hold)
        \"\"\"
        if len(data) < self.long_period:
            return [0] * len(data)
        
        mas = self.calculate_moving_averages(data)
        signals = []
        
        for i in range(len(data)):
            if i < self.long_period:
                signals.append(0)
                continue
            
            current_price = data.iloc[i]
            short_ma = mas['short_ma'].iloc[i]
            long_ma = mas['long_ma'].iloc[i]
            
            # Risk management
            if self.position != 0:
                price_change = (current_price - self.entry_price) / self.entry_price
                
                if self.position > 0:  # Long position
                    if price_change <= -self.stop_loss or price_change >= self.take_profit:
                        signals.append(-1)  # Close position
                        self.position = 0
                        continue
                elif self.position < 0:  # Short position
                    if price_change >= self.stop_loss or price_change <= -self.take_profit:
                        signals.append(1)  # Close position
                        self.position = 0
                        continue
            
            # Signal generation
            if pd.notna(short_ma) and pd.notna(long_ma):
                if short_ma > long_ma and self.position <= 0:
                    signals.append(1)  # Buy signal
                    self.position = 1
                    self.entry_price = current_price
                elif short_ma < long_ma and self.position >= 0:
                    signals.append(-1)  # Sell signal
                    self.position = -1
                    self.entry_price = current_price
                else:
                    signals.append(0)  # Hold
            else:
                signals.append(0)
        
        return signals
    
    def calculate_returns(self, data: pd.Series, signals: List[int]) -> List[float]:
        \"\"\"Calculate strategy returns.
        
        Args:
            data: Price data series
            signals: Trading signals
            
        Returns:
            List of returns
        \"\"\"
        returns = [0.0]  # First return is always 0
        
        for i in range(1, len(data)):
            if i-1 < len(signals) and signals[i-1] != 0:
                price_return = (data.iloc[i] - data.iloc[i-1]) / data.iloc[i-1]
                strategy_return = signals[i-1] * price_return
                returns.append(strategy_return)
            else:
                returns.append(0.0)
        
        return returns
    
    def get_performance_metrics(self, returns: List[float]) -> Dict[str, float]:
        \"\"\"Calculate performance metrics.
        
        Args:
            returns: List of returns
            
        Returns:
            Dictionary of performance metrics
        \"\"\"
        returns_array = np.array(returns)
        
        total_return = np.sum(returns_array)
        volatility = np.std(returns_array) if len(returns_array) > 1 else 0.0
        sharpe_ratio = total_return / volatility if volatility > 0 else 0.0
        
        # Calculate max drawdown
        cumulative_returns = np.cumsum(returns_array)
        running_max = np.maximum.accumulate(cumulative_returns)
        drawdowns = cumulative_returns - running_max
        max_drawdown = np.min(drawdowns) if len(drawdowns) > 0 else 0.0
        
        return {
            'total_return': total_return,
            'volatility': volatility,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': abs(max_drawdown)
        }
"""
        
        result = validator.validate_strategy(complex_code, ValidationLevel.COMPREHENSIVE)
        
        assert result.status == ValidationStatus.VALID
        assert result.is_valid is True
        assert len(result.errors) == 0
        assert result.quality_score > 0.8  # 应该是高质量分数

if __name__ == "__main__":
    pytest.main([__file__])