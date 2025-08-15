# LLM API配置管理系统

这是一个专门为QuantMind系统设计的大语言模型API配置管理系统，支持多模型API的统一管理、动态切换和优先级控制。

## 🚀 功能特性

- **多提供商支持**: 支持Qwen、Gemini、OpenAI、Claude、百度、智谱等主流LLM提供商
- **统一接口**: 提供统一的API密钥获取和设置接口
- **优先级管理**: 支持提供商优先级设置和自动切换
- **配置验证**: 自动验证API密钥和连接状态
- **环境变量集成**: 支持从环境变量和配置文件加载设置
- **向后兼容**: 与现有API配置系统完全兼容
- **命令行工具**: 提供CLI工具进行配置管理

## 📁 文件结构

```
config/
├── llm_api_config.py          # LLM API配置数据结构和管理器
├── llm_config_loader.py       # 配置加载器和验证器
├── llm_config_cli.py          # 命令行管理工具
├── llm_usage_example.py       # 使用示例
├── api_config.py              # 统一API配置接口（已更新）
├── .env.llm.template          # 环境变量模板
└── README_LLM_CONFIG.md       # 本文档
```

## 🛠 快速开始

### 1. 环境配置

复制环境变量模板并配置API密钥：

```bash
cp config/.env.llm.template config/.env.llm
# 编辑 .env.llm 文件，填入你的API密钥
```

或者直接设置系统环境变量：

```bash
export QWEN_API_KEY="your_qwen_api_key"
export GEMINI_API_KEY="your_gemini_api_key"
export OPENAI_API_KEY="your_openai_api_key"
# ... 其他提供商
```

### 2. 基本使用

```python
from config.api_config import (
    get_api_key,
    get_enabled_llm_providers,
    get_primary_llm_provider
)

# 获取API密钥（自动从新配置系统或传统配置获取）
qwen_key = get_api_key('qwen')
gemini_key = get_api_key('gemini')

# 获取启用的提供商列表
enabled_providers = get_enabled_llm_providers()
print(f"可用提供商: {enabled_providers}")

# 获取主要（优先级最高）提供商
primary_provider = get_primary_llm_provider()
print(f"主要提供商: {primary_provider}")
```

### 3. 高级使用

```python
from config.llm_config_loader import LLMConfigLoader

# 创建配置加载器
loader = LLMConfigLoader()
loader.load_all_configs()

# 验证所有配置
validation_results = loader.validate_all_configs()
for provider, result in validation_results.items():
    if result['valid']:
        print(f"✓ {provider}: 配置有效")
    else:
        print(f"✗ {provider}: {result.get('error', '配置无效')}")

# 按优先级获取配置
sorted_configs = loader.api_manager.get_configs_by_priority()
for config in sorted_configs:
    print(f"{config.provider}: 优先级 {config.priority}")
```

## 🔧 命令行工具

系统提供了强大的CLI工具进行配置管理：

```bash
# 查看所有提供商状态
python config/llm_config_cli.py list

# 显示详细配置
python config/llm_config_cli.py show

# 启用/禁用提供商
python config/llm_config_cli.py enable qwen
python config/llm_config_cli.py disable openai

# 设置API密钥
python config/llm_config_cli.py set-key qwen your_api_key_here

# 设置优先级
python config/llm_config_cli.py set-priority qwen 1

# 测试连接
python config/llm_config_cli.py test qwen
python config/llm_config_cli.py test-all

# 导出配置
python config/llm_config_cli.py export config_backup.yaml

# 创建环境变量模板
python config/llm_config_cli.py create-env-template
```

## 📋 支持的提供商

| 提供商 | 标识符 | 默认模型 | 状态 |
|--------|--------|----------|------|
| 通义千问 | `qwen` | `qwen-turbo` | ✅ 支持 |
| Google Gemini | `gemini` | `gemini-2.0-flash-exp` | ✅ 支持 |
| OpenAI | `openai` | `gpt-4` | ✅ 支持 |
| Claude | `claude` | `claude-3-sonnet-20240229` | ✅ 支持 |
| 百度文心 | `baidu` | `ernie-bot-turbo` | ✅ 支持 |
| 智谱AI | `zhipu` | `glm-4` | ✅ 支持 |

## ⚙️ 配置选项

每个提供商支持以下配置选项：

```python
@dataclass
class LLMAPIConfig:
    provider: str              # 提供商标识符
    api_key: str = ""         # API密钥
    api_url: str = ""         # API端点URL
    models: List[str] = None  # 支持的模型列表
    default_model: str = ""   # 默认模型
    enabled: bool = True      # 是否启用
    priority: int = 5         # 优先级（1-10，1最高）
    timeout: int = 30         # 请求超时时间
    max_retries: int = 3      # 最大重试次数
    rate_limit: int = 60      # 速率限制（请求/分钟）
```

## 🔄 与现有系统集成

新的LLM配置系统与现有的`api_config.py`完全兼容：

```python
# 现有代码无需修改，自动使用新配置系统
from config.api_config import get_api_key

# 这会优先从新配置系统获取，如果不可用则回退到传统配置
api_key = get_api_key('qwen')
```

## 🎯 使用场景

### 场景1: 多模型负载均衡

```python
from config.api_config import get_enabled_llm_providers
import random

# 随机选择一个可用的提供商
available_providers = get_enabled_llm_providers()
if available_providers:
    selected_provider = random.choice(available_providers)
    api_key = get_api_key(selected_provider)
    # 使用选定的提供商进行API调用
```

### 场景2: 故障转移

```python
from config.llm_config_loader import LLMConfigLoader

loader = LLMConfigLoader()
loader.load_all_configs()

# 按优先级尝试提供商
configs = loader.api_manager.get_configs_by_priority()
for config in configs:
    if config.enabled and config.api_key:
        try:
            # 尝试使用当前提供商
            result = call_llm_api(config)
            break
        except Exception as e:
            print(f"提供商 {config.provider} 失败: {e}")
            continue
```

### 场景3: 成本优化

```python
# 根据成本选择提供商
cost_priority = {
    'qwen': 1,     # 最便宜
    'baidu': 2,
    'zhipu': 3,
    'gemini': 4,
    'claude': 5,
    'openai': 6    # 最贵
}

available = get_enabled_llm_providers()
cheapest = min(available, key=lambda x: cost_priority.get(x, 999))
api_key = get_api_key(cheapest)
```

## 🐛 故障排除

### 常见问题

1. **导入错误**: 确保所有依赖文件都在正确位置
2. **API密钥无效**: 使用CLI工具测试连接
3. **配置不生效**: 检查环境变量和配置文件路径
4. **SSL证书错误**: 某些提供商可能需要特殊的SSL配置

### 调试命令

```bash
# 运行使用示例查看详细状态
python config/llm_usage_example.py

# 测试所有提供商连接
python config/llm_config_cli.py test-all

# 显示详细配置信息
python config/llm_config_cli.py show
```

## 🔮 未来计划

- [ ] 支持更多LLM提供商
- [ ] 添加使用统计和监控
- [ ] 实现智能路由和负载均衡
- [ ] 支持模型性能基准测试
- [ ] 添加配置热重载功能
- [ ] 集成成本跟踪和预算控制

## 📝 更新日志

### v1.0.0 (2024-12-19)
- 初始版本发布
- 支持6个主流LLM提供商
- 提供CLI管理工具
- 完整的配置验证和测试功能
- 与现有系统的无缝集成

---

如有问题或建议，请联系开发团队或提交Issue。