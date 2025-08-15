"""LLM提供商基础接口"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import time
import asyncio
from utils.logger import LoggerMixin
from models.responses import ModelResponse

@dataclass
class LLMConfig:
    """LLM配置"""
    api_key: str
    api_url: str
    model: str
    max_tokens: int = 4000
    temperature: float = 0.7
    timeout: int = 30
    retry_attempts: int = 3
    retry_delay: int = 1
    
    def __post_init__(self):
        """验证配置"""
        if not self.api_key:
            raise ValueError("API密钥不能为空")
        if not self.api_url:
            raise ValueError("API URL不能为空")
        if not self.model:
            raise ValueError("模型名称不能为空")
        if self.max_tokens <= 0:
            raise ValueError("最大token数必须大于0")
        if not 0 <= self.temperature <= 2:
            raise ValueError("温度参数必须在0-2之间")
        if self.timeout <= 0:
            raise ValueError("超时时间必须大于0")

class BaseLLMProvider(ABC, LoggerMixin):
    """LLM提供商基础接口"""
    
    def __init__(self, config: LLMConfig):
        """初始化提供商
        
        Args:
            config: LLM配置
        """
        self.config = config
        self.name = self.__class__.__name__.replace('Provider', '').lower()
        self._client = None
        self._initialize_client()
        self.logger.info(f"初始化 {self.name} 提供商")
    
    @abstractmethod
    def _initialize_client(self) -> None:
        """初始化客户端
        
        子类必须实现此方法来初始化具体的API客户端
        """
        pass
    
    @abstractmethod
    async def _generate_content(self, prompt: str, **kwargs) -> str:
        """生成内容的核心方法
        
        Args:
            prompt: 提示词
            **kwargs: 额外参数
        
        Returns:
            生成的内容
        
        Raises:
            Exception: 生成失败时抛出异常
        """
        pass
    
    async def generate(self, prompt: str, **kwargs) -> ModelResponse:
        """生成策略内容
        
        Args:
            prompt: 提示词
            **kwargs: 额外参数
        
        Returns:
            模型响应
        """
        start_time = time.time()
        error = None
        content = ""
        
        try:
            self.logger.info(f"开始使用 {self.name} 生成内容")
            
            # 带重试的内容生成
            content = await self._generate_with_retry(prompt, **kwargs)
            
            # 提取代码和参数
            code = self._extract_code(content)
            description = self._extract_description(content)
            parameters = self._extract_parameters(code)
            
            # 计算置信度
            confidence_score = self._calculate_confidence(code, content)
            
            # 计算风险指标
            risk_metrics = self._calculate_risk_metrics(code)
            
            execution_time = time.time() - start_time
            
            self.logger.info(f"{self.name} 生成完成，耗时: {execution_time:.2f}秒")
            
            return ModelResponse(
                model_name=self.name,
                code=code,
                description=description,
                parameters=parameters,
                risk_metrics=risk_metrics,
                confidence_score=confidence_score,
                execution_time=execution_time,
                error=None,
                warnings=[],
                metadata={
                    "tokens_used": len(content.split()),
                    "model_version": self.config.model,
                    "temperature": self.config.temperature
                }
            )
            
        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = str(e)
            
            self.logger.error(f"{self.name} 生成失败: {error_msg}")
            
            return ModelResponse(
                model_name=self.name,
                code="",
                description="生成失败",
                parameters={},
                risk_metrics={},
                confidence_score=0.0,
                execution_time=execution_time,
                error=error_msg,
                warnings=[],
                metadata={}
            )
    
    async def _generate_with_retry(self, prompt: str, **kwargs) -> str:
        """带重试机制的内容生成
        
        Args:
            prompt: 提示词
            **kwargs: 额外参数
        
        Returns:
            生成的内容
        
        Raises:
            Exception: 重试次数用尽后仍失败
        """
        last_exception = None
        
        for attempt in range(self.config.retry_attempts):
            try:
                if attempt > 0:
                    self.logger.info(f"{self.name} 第 {attempt + 1} 次重试")
                    await asyncio.sleep(self.config.retry_delay * attempt)
                
                return await self._generate_content(prompt, **kwargs)
                
            except Exception as e:
                last_exception = e
                self.logger.warning(f"{self.name} 第 {attempt + 1} 次尝试失败: {e}")
                
                if attempt == self.config.retry_attempts - 1:
                    break
        
        raise last_exception or Exception("生成内容失败")
    
    def _extract_code(self, content: str) -> str:
        """从生成内容中提取代码
        
        Args:
            content: 生成的内容
        
        Returns:
            提取的代码
        """
        import re
        
        # 查找Python代码块
        code_patterns = [
            r'```python\s*\n(.*?)\n```',
            r'```\s*\n(.*?)\n```',
            r'class\s+\w+.*?(?=\n\n|\n#|$)',
        ]
        
        for pattern in code_patterns:
            matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
            if matches:
                code = matches[0].strip()
                if 'class' in code and 'def' in code:
                    return code
        
        # 如果没有找到代码块，尝试提取整个内容中的类定义
        lines = content.split('\n')
        code_lines = []
        in_class = False
        
        for line in lines:
            if line.strip().startswith('class '):
                in_class = True
                code_lines.append(line)
            elif in_class:
                if line.strip() and not line.startswith(' ') and not line.startswith('\t'):
                    if not line.strip().startswith('def ') and not line.strip().startswith('#'):
                        break
                code_lines.append(line)
        
        return '\n'.join(code_lines) if code_lines else content
    
    def _extract_description(self, content: str) -> str:
        """从生成内容中提取描述
        
        Args:
            content: 生成的内容
        
        Returns:
            策略描述
        """
        lines = content.split('\n')
        description_lines = []
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('```') and not line.startswith('class') and not line.startswith('def'):
                if not line.startswith('#') or line.startswith('# '):
                    description_lines.append(line.lstrip('# '))
                if len(description_lines) >= 3:  # 限制描述长度
                    break
        
        return ' '.join(description_lines) if description_lines else "AI生成的量化交易策略"
    
    def _extract_parameters(self, code: str) -> Dict[str, Any]:
        """从代码中提取参数
        
        Args:
            code: 策略代码
        
        Returns:
            参数字典
        """
        import re
        
        parameters = {}
        
        # 查找__init__方法中的参数
        init_pattern = r'def __init__\(self,\s*(.*?)\):'
        init_match = re.search(init_pattern, code, re.DOTALL)
        
        if init_match:
            params_str = init_match.group(1)
            # 解析参数
            param_pattern = r'(\w+)\s*=\s*([^,\n]+)'
            param_matches = re.findall(param_pattern, params_str)
            
            for param_name, param_value in param_matches:
                try:
                    # 尝试解析参数值
                    if param_value.isdigit():
                        parameters[param_name] = int(param_value)
                    elif '.' in param_value and param_value.replace('.', '').isdigit():
                        parameters[param_name] = float(param_value)
                    elif param_value.lower() in ['true', 'false']:
                        parameters[param_name] = param_value.lower() == 'true'
                    else:
                        parameters[param_name] = param_value.strip('"\'')
                except:
                    parameters[param_name] = param_value
        
        return parameters
    
    def _calculate_confidence(self, code: str, content: str) -> float:
        """计算生成内容的置信度
        
        Args:
            code: 生成的代码
            content: 完整内容
        
        Returns:
            置信度分数 (0-1)
        """
        score = 0.0
        
        # 代码结构检查
        if 'class' in code:
            score += 0.3
        if 'def __init__' in code:
            score += 0.2
        if 'def generate_signals' in code:
            score += 0.3
        if 'return' in code:
            score += 0.1
        
        # 代码长度检查
        if len(code) > 100:
            score += 0.1
        
        return min(score, 1.0)
    
    def _calculate_risk_metrics(self, code: str) -> Dict[str, float]:
        """计算风险指标
        
        Args:
            code: 策略代码
        
        Returns:
            风险指标字典
        """
        # 这里返回模拟的风险指标
        # 在实际应用中，可以通过代码分析或历史回测来计算
        return {
            "max_drawdown": 0.15,
            "volatility": 0.20,
            "sharpe_ratio": 1.2,
            "win_rate": 0.65,
            "profit_factor": 1.8
        }
    
    async def validate_connection(self) -> bool:
        """验证连接是否正常
        
        Returns:
            连接是否正常
        """
        try:
            test_prompt = "测试连接"
            await self._generate_content(test_prompt)
            return True
        except Exception as e:
            self.logger.error(f"{self.name} 连接验证失败: {e}")
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """获取模型信息
        
        Returns:
            模型信息
        """
        return {
            "name": self.name,
            "model": self.config.model,
            "api_url": self.config.api_url,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
            "timeout": self.config.timeout
        }
    
    def __str__(self) -> str:
        return f"{self.__class__.__name__}(model={self.config.model})"
    
    def __repr__(self) -> str:
        return self.__str__()