# AI策略生成服务

基于多模型LLM的量化交易策略生成服务，支持智能策略生成、代码验证、参数优化和模板管理。

## 🚀 功能特性

### 核心功能
- **多模型策略生成**: 支持千问、Gemini等多个LLM模型并行生成策略
- **智能代码验证**: 全面的语法、安全性和合规性检查
- **参数优化**: 支持网格搜索、随机搜索、贝叶斯优化等多种优化算法
- **模板管理**: 丰富的策略模板库，支持分类、搜索和自定义
- **PTrade语法**: 完整的量化交易策略语法规范

### 技术特性
- **异步架构**: 基于FastAPI的高性能异步服务
- **模块化设计**: 清晰的分层架构，易于扩展和维护
- **配置驱动**: 灵活的YAML配置管理
- **全面日志**: 结构化日志记录和监控
- **错误处理**: 完善的异常处理和错误恢复机制

## 📁 项目结构

```
backend/ai-strategy/
├── api/                    # API层
│   └── v1/
│       └── routes.py      # API路由定义
├── core/                   # 核心业务逻辑
│   ├── generator.py       # 策略生成器
│   ├── validator.py       # 策略验证器
│   └── optimizer.py       # 策略优化器
├── models/                 # 数据模型
│   ├── requests.py        # 请求模型
│   ├── responses.py       # 响应模型
│   └── strategy.py        # 策略模型
├── providers/              # LLM提供商
│   ├── base.py           # 基础提供商接口
│   ├── qwen.py           # 千问提供商
│   ├── gemini.py         # Gemini提供商
│   └── factory.py        # 提供商工厂
├── templates/              # 策略模板
│   └── manager.py        # 模板管理器
├── utils/                  # 工具模块
│   ├── config.py         # 配置管理
│   └── logger.py         # 日志工具
├── tests/                  # 测试代码
│   ├── unit/             # 单元测试
│   ├── integration/      # 集成测试
│   └── fixtures/         # 测试数据
├── config.yaml            # 配置文件
├── main.py               # 主应用入口
├── requirements.txt      # 依赖包列表
└── README.md            # 项目文档
```

## 🛠️ 安装和配置

### 环境要求
- Python 3.8+
- 推荐使用虚拟环境

### 安装依赖
```bash
cd backend/ai-strategy
pip install -r requirements.txt
```

### 配置文件
编辑 `config.yaml` 文件，配置LLM提供商API密钥和其他参数：

```yaml
llm_providers:
  qwen:
    enabled: true
    api_key: "your_qwen_api_key"
    base_url: "https://dashscope.aliyuncs.com/api/v1"
    model: "qwen-max"
  
  gemini:
    enabled: true
    api_key: "your_gemini_api_key"
    base_url: "https://generativelanguage.googleapis.com/v1beta"
    model: "gemini-pro"
```

### 环境变量（可选）
```bash
export QWEN_API_KEY="your_qwen_api_key"
export GEMINI_API_KEY="your_gemini_api_key"
```

## 🚀 启动服务

### 开发模式
```bash
cd backend/ai-strategy
PYTHONPATH=/path/to/quantmind python main.py
```

### 生产模式
```bash
cd backend/ai-strategy
PYTHONPATH=/path/to/quantmind uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Docker部署（推荐）
```bash
# 构建镜像
docker build -t ai-strategy-service .

# 运行容器
docker run -d -p 8001:8001 \
  -e QWEN_API_KEY="your_key" \
  -e GEMINI_API_KEY="your_key" \
  ai-strategy-service
```

## 📚 API文档

服务启动后，访问以下地址查看API文档：
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

### 主要API端点

#### 健康检查
```http
GET /api/v1/health
```

#### 策略生成
```http
POST /api/v1/strategies/generate
Content-Type: application/json

{
  "description": "创建一个基于双均线交叉的趋势跟踪策略",
  "user_id": "user123",
  "models": ["qwen", "gemini"],
  "market_type": "stock",
  "time_frame": "1d",
  "risk_level": "medium"
}
```

#### 策略验证
```http
POST /api/v1/strategies/validate
Content-Type: application/json

{
  "code": "class MyStrategy:\n    def __init__(self):\n        pass\n    def generate_signals(self, data):\n        return data",
  "validation_level": "standard"
}
```

#### 策略优化
```http
POST /api/v1/strategies/optimize
Content-Type: application/json

{
  "strategy_id": "strategy123",
  "method": "grid_search",
  "objective": "sharpe_ratio",
  "max_iterations": 100
}
```

#### 模板管理
```http
# 获取模板列表
GET /api/v1/templates?category=trend_following&limit=10

# 搜索模板
GET /api/v1/templates/search/双均线

# 获取模板详情
GET /api/v1/templates/ma_crossover
```

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
pytest

# 运行单元测试
pytest tests/unit/

# 运行集成测试
pytest tests/integration/

# 生成覆盖率报告
pytest --cov=. --cov-report=html
```

### 测试API
```bash
# 健康检查
curl http://localhost:8001/api/v1/health

# 生成策略
curl -X POST http://localhost:8001/api/v1/strategies/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "双均线策略", "user_id": "test"}'
```

## 🔧 开发指南

### 添加新的LLM提供商

1. 在 `providers/` 目录下创建新的提供商文件
2. 继承 `BaseLLMProvider` 类
3. 实现必要的抽象方法
4. 在 `factory.py` 中注册新提供商
5. 在 `config.yaml` 中添加配置

```python
# providers/new_provider.py
from .base import BaseLLMProvider

class NewProvider(BaseLLMProvider):
    async def _initialize_client(self):
        # 初始化客户端
        pass
    
    async def generate_content(self, prompt: str, **kwargs) -> str:
        # 生成内容
        pass
```

### 添加新的优化算法

1. 在 `core/optimizer.py` 中添加新的优化方法
2. 在 `OptimizationMethod` 枚举中添加新选项
3. 在 `optimize_strategy` 方法中添加分支处理

### 添加新的策略模板

1. 在 `templates/manager.py` 的 `_get_builtin_templates` 方法中添加模板定义
2. 或者在模板目录中创建JSON文件

## 📊 监控和日志

### 日志配置
日志配置在 `config.yaml` 中定义：

```yaml
logging:
  level: INFO
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  file:
    enabled: true
    path: "logs/ai-strategy.log"
    max_size: "10MB"
    backup_count: 5
```

### 性能监控
- 请求响应时间记录
- API调用统计
- 错误率监控
- 资源使用情况

## 🔒 安全考虑

### 代码安全
- 禁止危险的导入和操作
- 代码沙箱执行
- 输入验证和清理

### API安全
- CORS配置
- 受信任主机限制
- 请求频率限制（可配置）
- API密钥管理

### 数据安全
- 敏感信息加密存储
- 日志脱敏处理
- 安全的配置管理

## 🚀 性能优化

### 并发处理
- 异步IO操作
- 并行策略生成
- 连接池管理

### 缓存策略
- 模板缓存
- 提供商实例缓存
- 配置缓存

### 资源管理
- 内存使用优化
- 连接复用
- 超时控制

## 🐛 故障排除

### 常见问题

1. **LLM提供商连接失败**
   - 检查API密钥配置
   - 验证网络连接
   - 查看提供商服务状态

2. **策略生成超时**
   - 调整超时配置
   - 检查提示词长度
   - 监控提供商响应时间

3. **内存使用过高**
   - 检查并发请求数量
   - 优化数据处理逻辑
   - 调整工作进程数量

### 日志分析
```bash
# 查看错误日志
grep "ERROR" logs/ai-strategy.log

# 监控实时日志
tail -f logs/ai-strategy.log

# 分析性能日志
grep "耗时" logs/ai-strategy.log | sort -k5 -nr
```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 编写测试
5. 提交Pull Request

### 代码规范
- 使用Black进行代码格式化
- 遵循PEP 8规范
- 添加类型注解
- 编写文档字符串

```bash
# 代码格式化
black .

# 代码检查
flake8 .

# 类型检查
mypy .
```

## 📄 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 📞 支持

如有问题或建议，请通过以下方式联系：
- 提交Issue
- 发送邮件
- 技术文档Wiki

---

**注意**: 请确保在生产环境中正确配置API密钥和安全设置。