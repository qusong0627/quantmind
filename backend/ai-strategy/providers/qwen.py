"""千问LLM提供商实现"""

import json
import aiohttp
import asyncio
from typing import Dict, Any, Optional
from .base import BaseLLMProvider, LLMConfig

class QwenProvider(BaseLLMProvider):
    """千问LLM提供商"""
    
    def __init__(self, config: LLMConfig):
        """初始化千问提供商
        
        Args:
            config: LLM配置
        """
        super().__init__(config)
        self.headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    def _initialize_client(self) -> None:
        """初始化HTTP客户端"""
        # 千问使用HTTP API，不需要特殊的客户端初始化
        self.logger.info("千问HTTP客户端初始化完成")
    
    async def _generate_content(self, prompt: str, **kwargs) -> str:
        """使用千问API生成内容
        
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
            "model": self.config.model,
            "input": {
                "messages": [
                    {
                        "role": "system",
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            },
            "parameters": {
                "max_tokens": kwargs.get("max_tokens", self.config.max_tokens),
                "temperature": kwargs.get("temperature", self.config.temperature),
                "top_p": kwargs.get("top_p", 0.8),
                "repetition_penalty": kwargs.get("repetition_penalty", 1.1)
            }
        }
        
        # 发送API请求
        timeout = aiohttp.ClientTimeout(total=self.config.timeout)
        
        # 创建SSL上下文，跳过证书验证（用于测试）
        import ssl
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        async with aiohttp.ClientSession(timeout=timeout, connector=connector) as session:
            try:
                self.logger.debug(f"发送千问API请求: {self.config.api_url}")
                
                async with session.post(
                    self.config.api_url,
                    headers=self.headers,
                    json=request_data
                ) as response:
                    
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"千问API请求失败 (状态码: {response.status}): {error_text}")
                    
                    response_data = await response.json()
                    
                    # 解析响应
                    return self._parse_response(response_data)
                    
            except aiohttp.ClientError as e:
                raise Exception(f"千问API网络请求失败: {str(e)}")
            except json.JSONDecodeError as e:
                raise Exception(f"千问API响应解析失败: {str(e)}")
            except Exception as e:
                if "千问API" in str(e):
                    raise
                raise Exception(f"千问API调用异常: {str(e)}")
    
    def _parse_response(self, response_data: Dict[str, Any]) -> str:
        """解析千问API响应
        
        Args:
            response_data: API响应数据
        
        Returns:
            生成的内容
        
        Raises:
            Exception: 响应格式错误时抛出异常
        """
        try:
            # 检查响应状态
            if "output" not in response_data:
                raise Exception("千问API响应缺少output字段")
            
            output = response_data["output"]
            
            if "choices" in output and output["choices"]:
                # 新版API格式
                choice = output["choices"][0]
                if "message" in choice and "content" in choice["message"]:
                    content = choice["message"]["content"]
                else:
                    raise Exception("千问API响应格式错误: 缺少message.content")
            elif "text" in output:
                # 旧版API格式
                content = output["text"]
            else:
                raise Exception("千问API响应格式错误: 无法找到生成内容")
            
            if not content or not isinstance(content, str):
                raise Exception("千问API返回空内容或格式错误")
            
            self.logger.debug(f"千问API响应解析成功，内容长度: {len(content)}")
            return content.strip()
            
        except KeyError as e:
            raise Exception(f"千问API响应格式错误: 缺少字段 {str(e)}")
        except Exception as e:
            if "千问API" in str(e):
                raise
            raise Exception(f"千问API响应解析异常: {str(e)}")
    
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

请确保生成的策略代码可以直接运行，并且逻辑合理。"""
    
    async def validate_connection(self) -> bool:
        """验证千问API连接
        
        Returns:
            连接是否正常
        """
        try:
            test_prompt = "请简单回复'连接正常'"
            response = await self._generate_content(test_prompt, max_tokens=10)
            
            # 检查响应是否合理
            if response and len(response) > 0:
                self.logger.info("千问API连接验证成功")
                return True
            else:
                self.logger.error("千问API连接验证失败: 响应为空")
                return False
                
        except Exception as e:
            self.logger.error(f"千问API连接验证失败: {e}")
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """获取千问模型信息
        
        Returns:
            模型信息
        """
        base_info = super().get_model_info()
        base_info.update({
            "provider": "阿里云千问",
            "api_version": "v1",
            "supported_features": [
                "文本生成",
                "代码生成",
                "策略分析",
                "风险评估"
            ],
            "limitations": {
                "max_context_length": 8000,
                "rate_limit": "100 requests/minute",
                "supported_languages": ["中文", "英文"]
            }
        })
        return base_info
    
    def _calculate_confidence(self, code: str, content: str) -> float:
        """计算千问生成内容的置信度
        
        Args:
            code: 生成的代码
            content: 完整内容
        
        Returns:
            置信度分数 (0-1)
        """
        base_score = super()._calculate_confidence(code, content)
        
        # 千问特定的置信度调整
        adjustments = 0.0
        
        # 检查中文注释质量
        chinese_comments = len([line for line in code.split('\n') 
                              if line.strip().startswith('#') and any('\u4e00' <= char <= '\u9fff' for char in line)])
        if chinese_comments > 0:
            adjustments += 0.05
        
        # 检查代码结构完整性
        if 'import' in code and 'pandas' in code:
            adjustments += 0.05
        
        # 检查策略逻辑复杂度
        if code.count('if') >= 2 and code.count('and') >= 1:
            adjustments += 0.05
        
        return min(base_score + adjustments, 1.0)
    
    def _calculate_risk_metrics(self, code: str) -> Dict[str, float]:
        """计算千问生成策略的风险指标
        
        Args:
            code: 策略代码
        
        Returns:
            风险指标字典
        """
        base_metrics = super()._calculate_risk_metrics(code)
        
        # 根据代码特征调整风险指标
        if 'stop_loss' in code.lower():
            base_metrics["max_drawdown"] *= 0.8  # 有止损，降低最大回撤
        
        if 'rsi' in code.lower() or 'macd' in code.lower():
            base_metrics["sharpe_ratio"] *= 1.1  # 技术指标策略，提升夏普比率
        
        if code.count('and') >= 2:  # 多条件策略
            base_metrics["win_rate"] *= 1.05  # 提升胜率
            base_metrics["volatility"] *= 0.9  # 降低波动率
        
        return base_metrics