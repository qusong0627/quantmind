"""Gemini LLM提供商实现"""

import json
import aiohttp
import asyncio
import ssl
from typing import Dict, Any, Optional
from .base import BaseLLMProvider, LLMConfig

class GeminiProvider(BaseLLMProvider):
    """Gemini LLM提供商"""
    
    def __init__(self, config: LLMConfig):
        """初始化Gemini提供商
        
        Args:
            config: LLM配置
        """
        super().__init__(config)
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        # Gemini API密钥通过URL参数传递
        self.api_url_with_key = f"{self.config.api_url}?key={self.config.api_key}"
    
    def _initialize_client(self) -> None:
        """初始化HTTP客户端"""
        # Gemini使用HTTP API，不需要特殊的客户端初始化
        self.logger.info("Gemini HTTP客户端初始化完成")
    
    async def _generate_content(self, prompt: str, **kwargs) -> str:
        """使用Gemini API生成内容
        
        Args:
            prompt: 提示词
            **kwargs: 额外参数
        
        Returns:
            生成的内容
        
        Raises:
            Exception: API调用失败时抛出异常
        """
        # 构建请求数据
        request_data = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": self._build_full_prompt(prompt)
                        }
                    ]
                }
            ],
            "generationConfig": {
                "maxOutputTokens": kwargs.get("max_tokens", self.config.max_tokens),
                "temperature": kwargs.get("temperature", self.config.temperature),
                "topP": kwargs.get("top_p", 0.8),
                "topK": kwargs.get("top_k", 40),
                "candidateCount": 1,
                "stopSequences": []
            },
            "safetySettings": [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        }
        
        # 发送API请求
        timeout = aiohttp.ClientTimeout(total=self.config.timeout)
        
        # 创建SSL上下文，跳过证书验证（开发环境）
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        async with aiohttp.ClientSession(timeout=timeout, connector=connector) as session:
            try:
                self.logger.debug(f"发送Gemini API请求: {self.config.api_url}")
                
                async with session.post(
                    self.api_url_with_key,
                    headers=self.headers,
                    json=request_data
                ) as response:
                    
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Gemini API请求失败 (状态码: {response.status}): {error_text}")
                    
                    response_data = await response.json()
                    
                    # 解析响应
                    return self._parse_response(response_data)
                    
            except aiohttp.ClientError as e:
                raise Exception(f"Gemini API网络请求失败: {str(e)}")
            except json.JSONDecodeError as e:
                raise Exception(f"Gemini API响应解析失败: {str(e)}")
            except Exception as e:
                if "Gemini API" in str(e):
                    raise
                raise Exception(f"Gemini API调用异常: {str(e)}")
    
    def _parse_response(self, response_data: Dict[str, Any]) -> str:
        """解析Gemini API响应
        
        Args:
            response_data: API响应数据
        
        Returns:
            生成的内容
        
        Raises:
            Exception: 响应格式错误时抛出异常
        """
        try:
            # 检查是否有错误
            if "error" in response_data:
                error_info = response_data["error"]
                error_message = error_info.get("message", "未知错误")
                raise Exception(f"Gemini API返回错误: {error_message}")
            
            # 检查响应结构
            if "candidates" not in response_data:
                raise Exception("Gemini API响应缺少candidates字段")
            
            candidates = response_data["candidates"]
            if not candidates:
                raise Exception("Gemini API响应candidates为空")
            
            candidate = candidates[0]
            
            # 检查安全过滤
            if "finishReason" in candidate:
                finish_reason = candidate["finishReason"]
                if finish_reason == "SAFETY":
                    raise Exception("Gemini API响应被安全过滤器阻止")
                elif finish_reason == "RECITATION":
                    raise Exception("Gemini API响应因版权问题被阻止")
            
            # 提取内容
            if "content" not in candidate:
                raise Exception("Gemini API响应缺少content字段")
            
            content = candidate["content"]
            if "parts" not in content or not content["parts"]:
                raise Exception("Gemini API响应content.parts为空")
            
            part = content["parts"][0]
            if "text" not in part:
                raise Exception("Gemini API响应缺少text字段")
            
            text = part["text"]
            if not text or not isinstance(text, str):
                raise Exception("Gemini API返回空内容或格式错误")
            
            self.logger.debug(f"Gemini API响应解析成功，内容长度: {len(text)}")
            return text.strip()
            
        except KeyError as e:
            raise Exception(f"Gemini API响应格式错误: 缺少字段 {str(e)}")
        except Exception as e:
            if "Gemini API" in str(e):
                raise
            raise Exception(f"Gemini API响应解析异常: {str(e)}")
    
    def _build_full_prompt(self, user_prompt: str) -> str:
        """构建完整的提示词
        
        Args:
            user_prompt: 用户提示词
        
        Returns:
            完整的提示词
        """
        system_prompt = self._get_system_prompt()
        return f"{system_prompt}\n\n用户需求：{user_prompt}"
    
    def _get_system_prompt(self) -> str:
        """获取系统提示词
        
        Returns:
            系统提示词
        """
        return """你是一个专业的量化交易策略开发专家。请根据用户需求生成高质量的Python量化交易策略代码。

要求：
1. 使用PTrade框架语法
2. 代码必须包含完整的策略类定义
3. 必须实现__init__和generate_signals方法
4. 代码要有良好的注释和文档
5. 策略要考虑风险控制
6. 返回格式要清晰，包含策略说明
7. 代码要具有创新性和实用性
8. 考虑市场的实际情况和交易成本

请确保生成的策略代码可以直接运行，逻辑合理，并且具有良好的风险收益特征。"""
    
    async def validate_connection(self) -> bool:
        """验证Gemini API连接
        
        Returns:
            连接是否正常
        """
        try:
            test_prompt = "请简单回复'连接正常'"
            response = await self._generate_content(test_prompt, max_tokens=10)
            
            # 检查响应是否合理
            if response and len(response) > 0:
                self.logger.info("Gemini API连接验证成功")
                return True
            else:
                self.logger.error("Gemini API连接验证失败: 响应为空")
                return False
                
        except Exception as e:
            self.logger.error(f"Gemini API连接验证失败: {e}")
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """获取Gemini模型信息
        
        Returns:
            模型信息
        """
        base_info = super().get_model_info()
        base_info.update({
            "provider": "Google Gemini",
            "api_version": "v1",
            "supported_features": [
                "文本生成",
                "代码生成",
                "多模态理解",
                "逻辑推理",
                "创意写作"
            ],
            "limitations": {
                "max_context_length": 30720,
                "rate_limit": "60 requests/minute",
                "supported_languages": ["中文", "英文", "多语言"]
            },
            "safety_settings": {
                "harassment": "BLOCK_MEDIUM_AND_ABOVE",
                "hate_speech": "BLOCK_MEDIUM_AND_ABOVE",
                "sexually_explicit": "BLOCK_MEDIUM_AND_ABOVE",
                "dangerous_content": "BLOCK_MEDIUM_AND_ABOVE"
            }
        })
        return base_info
    
    def _calculate_confidence(self, code: str, content: str) -> float:
        """计算Gemini生成内容的置信度
        
        Args:
            code: 生成的代码
            content: 完整内容
        
        Returns:
            置信度分数 (0-1)
        """
        base_score = super()._calculate_confidence(code, content)
        
        # Gemini特定的置信度调整
        adjustments = 0.0
        
        # 检查代码创新性
        innovative_patterns = ['lambda', 'list comprehension', 'numpy', 'scipy']
        for pattern in innovative_patterns:
            if pattern in code.lower():
                adjustments += 0.02
        
        # 检查逻辑复杂度
        if code.count('elif') >= 1:
            adjustments += 0.03
        
        # 检查错误处理
        if 'try:' in code and 'except' in code:
            adjustments += 0.05
        
        # 检查文档质量
        docstring_count = code.count('"""')
        if docstring_count >= 2:
            adjustments += 0.05
        
        return min(base_score + adjustments, 1.0)
    
    def _calculate_risk_metrics(self, code: str) -> Dict[str, float]:
        """计算Gemini生成策略的风险指标
        
        Args:
            code: 策略代码
        
        Returns:
            风险指标字典
        """
        base_metrics = super()._calculate_risk_metrics(code)
        
        # 根据代码特征调整风险指标
        if 'position_size' in code.lower():
            base_metrics["max_drawdown"] *= 0.85  # 有仓位管理，降低最大回撤
        
        if 'bollinger' in code.lower() or 'keltner' in code.lower():
            base_metrics["volatility"] *= 0.9  # 通道指标，降低波动率
        
        if code.count('or') >= 1:  # 多条件或逻辑
            base_metrics["win_rate"] *= 1.02  # 提升胜率
        
        if 'machine_learning' in code.lower() or 'sklearn' in code.lower():
            base_metrics["sharpe_ratio"] *= 1.15  # 机器学习策略，提升夏普比率
            base_metrics["profit_factor"] *= 1.1
        
        return base_metrics
    
    def _extract_description(self, content: str) -> str:
        """从生成内容中提取描述
        
        Args:
            content: 生成的内容
        
        Returns:
            策略描述
        """
        # Gemini通常生成更详细的描述，需要更好的提取逻辑
        lines = content.split('\n')
        description_lines = []
        
        # 查找策略描述部分
        in_description = False
        for line in lines:
            line = line.strip()
            
            # 跳过代码块
            if line.startswith('```'):
                in_description = not in_description
                continue
            
            if not in_description and line and not line.startswith('class') and not line.startswith('def'):
                if not line.startswith('#') or line.startswith('# '):
                    clean_line = line.lstrip('# ').strip()
                    if clean_line and len(clean_line) > 10:  # 过滤太短的行
                        description_lines.append(clean_line)
                        if len(description_lines) >= 2:  # 限制描述长度
                            break
        
        description = ' '.join(description_lines) if description_lines else "Gemini生成的智能量化交易策略"
        
        # 限制描述长度
        if len(description) > 200:
            description = description[:200] + "..."
        
        return description