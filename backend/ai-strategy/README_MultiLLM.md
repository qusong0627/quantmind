# 多模型AI策略生成服务

基于阿里云千问和Google Gemini大模型的智能量化策略生成服务，支持PTrade语法规范。

## 功能特性

### 🤖 多模型支持
- **阿里云千问**: 中文优化的大语言模型，擅长理解中文策略描述
- **Google Gemini**: 强大的多模态模型，代码生成能力出色
- **智能对比**: 同时调用两个模型，自动选择最佳结果

### 📊 PTrade语法规范
- 标准化的策略代码结构
- 统一的信号生成接口
- 丰富的技术指标支持
- 完整的参数配置系统

### 🔧 智能代码生成
- 自然语言描述转换为Python代码
- 自动参数提取和优化
- 代码语法验证和兼容性检查
- 置信度评分系统

## API接口

### 1. 健康检查
```bash
GET /health
```

### 2. 获取PTrade语法指南
```bash
GET /api/v1/ptrade-guide
```

### 3. 生成多模型策略
```bash
POST /api/v1/generate
```

**请求参数:**
```json
{
  "description": "创建一个基于RSI指标的反转策略",
  "user_id": "user123",
  "model": "both",  // "qwen", "gemini", "both"
  "market_type": "stock",
  "timeframe": "1d",
  "risk_level": "medium",
  "ptrade_syntax": true
}
```

**响应示例:**
```json
{
  "strategy_id": "multi_llm_user123_1234567890",
  "request_description": "创建一个基于RSI指标的反转策略",
  "results": [
    {
      "model_name": "qwen",
      "code": "class RSIStrategy:\n    def __init__(self, rsi_period=14):\n        self.rsi_period = rsi_period\n    \n    def generate_signals(self, data):\n        # RSI计算和信号生成逻辑\n        return data",
      "parameters": {"rsi_period": 14},
      "confidence_score": 0.85,
      "execution_time": 2.3
    }
  ],
  "best_strategy": {
    "model_name": "qwen",
    "confidence_score": 0.85
  },
  "created_at": "2024-01-01T12:00:00"
}
```

### 4. 验证策略代码
```bash
POST /api/v1/validate
```

**请求参数:**
```json
{
  "code": "class MyStrategy:\n    def __init__(self):\n        pass\n    def generate_signals(self, data):\n        return data"
}
```

## PTrade语法规范

### 基本结构
```python
class StrategyName:
    def __init__(self, **params):
        # 初始化参数
        self.param1 = params.get('param1', default_value)
    
    def generate_signals(self, data):
        # 生成交易信号
        # data: DataFrame with ['open', 'high', 'low', 'close', 'volume']
        # 返回: DataFrame with additional 'signal' column
        
        data['signal'] = 0  # 0=持有, 1=买入, -1=卖出
        return data
```

### 技术指标函数
- `MA(data, period)`: 移动平均线
- `EMA(data, period)`: 指数移动平均线
- `RSI(data, period)`: 相对强弱指数
- `MACD(data, fast, slow, signal)`: MACD指标
- `BOLL(data, period, std)`: 布林带
- `KDJ(data, period)`: KDJ指标

### 信号生成规则
```python
# 买入信号
data.loc[buy_condition, 'signal'] = 1

# 卖出信号
data.loc[sell_condition, 'signal'] = -1

# 持有信号
data.loc[hold_condition, 'signal'] = 0
```

## 使用示例

### Python客户端
```python
import asyncio
from multi_llm_strategy import StrategyGenerator, MultiLLMStrategyRequest

async def generate_strategy():
    generator = StrategyGenerator()
    
    request = MultiLLMStrategyRequest(
        description="基于双均线交叉的趋势跟踪策略",
        user_id="test_user",
        model="both",
        market_type="stock",
        timeframe="1d",
        risk_level="medium",
        ptrade_syntax=True
    )
    
    response = await generator.generate_strategies(request)
    print(f"生成策略: {response.strategy_id}")
    print(f"最佳模型: {response.best_strategy.model_name}")
    print(f"置信度: {response.best_strategy.confidence_score}")

asyncio.run(generate_strategy())
```

### cURL测试
```bash
# 生成策略
curl -X POST http://localhost:8005/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "创建一个MACD金叉死叉策略",
    "user_id": "test_user",
    "model": "both",
    "market_type": "stock",
    "timeframe": "1d",
    "risk_level": "medium",
    "ptrade_syntax": true
  }'

# 验证代码
curl -X POST http://localhost:8005/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "class TestStrategy:\n    def __init__(self):\n        pass\n    def generate_signals(self, data):\n        data[\"signal\"] = 0\n        return data"
  }'
```

## 部署说明

### 本地开发
```bash
# 安装依赖
pip install -r requirements_multi_llm.txt

# 启动服务
python3 multi_llm_strategy.py
```

### Docker部署
```bash
# 构建镜像
docker build -f Dockerfile.multi-llm -t quantmind-multi-llm .

# 运行容器
docker run -p 8005:8005 \
  -e QWEN_API_KEY="your-qwen-key" \
  -e GEMINI_API_KEY="your-gemini-key" \
  quantmind-multi-llm
```

### Docker Compose
```bash
# 启动所有服务
docker-compose up -d multi-llm-strategy
```

## 配置说明

### 环境变量
- `QWEN_API_KEY`: 阿里云千问API密钥
- `GEMINI_API_KEY`: Google Gemini API密钥
- `LOG_LEVEL`: 日志级别 (默认: INFO)

### API配置
- 千问API: `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`
- Gemini API: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

## 性能指标

### 响应时间
- 单模型调用: 2-8秒
- 双模型并行: 3-10秒
- 代码验证: <1秒

### 置信度评分
- 代码完整性: 30%
- 技术指标使用: 25%
- PTrade语法兼容性: 25%
- 执行时间: 20%

## 故障排除

### 常见问题
1. **API密钥错误**: 检查环境变量配置
2. **网络超时**: 调整httpx客户端超时设置
3. **代码生成失败**: 检查模型API状态和配额
4. **语法验证失败**: 确保代码包含必要的方法

### 日志查看
```bash
# 查看服务日志
docker logs quantmind-multi-llm-strategy

# 实时日志
docker logs -f quantmind-multi-llm-strategy
```

## 更新日志

### v2.0.0 (2024-01-01)
- 🎉 首次发布多模型策略生成服务
- ✨ 支持阿里云千问和Google Gemini
- 📝 完整的PTrade语法规范
- 🔧 智能代码验证和评分
- 🐳 Docker容器化部署
- 🌐 RESTful API接口

## 许可证

MIT License - 详见 LICENSE 文件