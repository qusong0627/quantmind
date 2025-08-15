# QuantMind API配置统一管理指南

## 概述

QuantMind项目现已实现API密钥和配置的统一管理，所有外部API密钥都集中在一个配置文件中，方便用户配置和管理。

## 配置文件结构

### 主要文件

- `config/api_keys.json` - 配置模板文件（包含在版本控制中）
- `config/api_keys.local.json` - 本地配置文件（不包含在版本控制中）
- `config/api_config.py` - 配置管理器
- `.env.example` - 环境变量示例

### 配置优先级

1. **环境变量** - 最高优先级
2. **本地配置文件** (`api_keys.local.json`)
3. **模板配置文件** (`api_keys.json`)

## 快速开始

### 1. 创建本地配置文件

```bash
# 使用配置管理工具创建
python scripts/config_manager.py create-local

# 或手动复制模板
cp config/api_keys.json config/api_keys.local.json
```

### 2. 配置API密钥

编辑 `config/api_keys.local.json` 文件，填入您的API密钥：

```json
{
  "data_sources": {
    "tsanghi": {
      "name": "沧海数据",
      "api_key": "your_actual_tsanghi_api_key_here",
      "env_var": "API__TSANGHI_API_KEY",
      "required": true
    },
    "qwen": {
      "name": "通义千问",
      "api_key": "your_actual_qwen_api_key_here",
      "env_var": "API__QWEN_API_KEY",
      "required": false
    }
  }
}
```

### 3. 验证配置

```bash
# 验证所有配置
python scripts/config_manager.py validate

# 查看所有服务状态
python scripts/config_manager.py list

# 查看特定服务配置
python scripts/config_manager.py show tsanghi
```

## 支持的API服务

### 数据源服务

| 服务名 | 描述 | 必需 | 环境变量 |
|--------|------|------|----------|
| tsanghi | 沧海数据API | ✅ | `API__TSANGHI_API_KEY` |
| ifind | 同花顺iFinD | ✅ | `API__IFIND_REFRESH_TOKEN` |
| alpha_vantage | Alpha Vantage | ❌ | `API__ALPHA_VANTAGE_API_KEY` |
| juhe | 聚合数据 | ❌ | `API__JUHE_API_KEY` |

### AI服务

| 服务名 | 描述 | 必需 | 环境变量 |
|--------|------|------|----------|
| openai | OpenAI GPT | ❌ | `API__OPENAI_API_KEY` |
| qwen | 通义千问 | ❌ | `API__QWEN_API_KEY` |
| gemini | Google Gemini | ❌ | `API__GEMINI_API_KEY` |
| canghai_ai | 沧海AI | ❌ | `API__CANGHAI_API_KEY` |

### 安全配置

| 配置项 | 描述 | 必需 | 环境变量 |
|--------|------|------|----------|
| jwt | JWT密钥 | ✅ | `SECURITY__SECRET_KEY` |

### 数据库配置

| 配置项 | 描述 | 必需 | 环境变量 |
|--------|------|------|----------|
| influxdb | InfluxDB访问令牌 | ❌ | `DATABASE__INFLUXDB_TOKEN` |

## 使用方式

### 在Python代码中使用

```python
from config.api_config import get_api_key, get_service_config

# 获取API密钥
tsanghi_key = get_api_key('tsanghi')
qwen_key = get_api_key('qwen')
ifind_token = get_api_key('ifind', 'refresh_token')

# 获取完整服务配置
tsanghi_config = get_service_config('tsanghi')
print(tsanghi_config['name'])  # 沧海数据
print(tsanghi_config['website'])  # API官网
```

### 通过环境变量配置

```bash
# 设置环境变量
export API__TSANGHI_API_KEY="your_tsanghi_key"
export API__QWEN_API_KEY="your_qwen_key"

# 或在.env文件中设置
echo "API__TSANGHI_API_KEY=your_tsanghi_key" >> .env
```

### 在Docker中使用

```yaml
# docker-compose.yml
services:
  api-gateway:
    environment:
      - API__TSANGHI_API_KEY=${API__TSANGHI_API_KEY}
      - API__QWEN_API_KEY=${API__QWEN_API_KEY}
```

## 配置管理工具

项目提供了强大的配置管理CLI工具：

### 基本命令

```bash
# 验证所有配置
python scripts/config_manager.py validate

# 列出所有服务
python scripts/config_manager.py list

# 按类别列出服务
python scripts/config_manager.py list --category ai_services

# 显示特定服务详情
python scripts/config_manager.py show tsanghi

# 检查环境变量
python scripts/config_manager.py check-env

# 创建本地配置文件
python scripts/config_manager.py create-local

# 导出配置模板
python scripts/config_manager.py export-template --output my_template.json
```

### 迁移工具

如果您的项目中存在硬编码的API密钥，可以使用迁移工具：

```bash
# 试运行（不实际修改文件）
python scripts/migrate_api_keys.py --dry-run

# 执行迁移
python scripts/migrate_api_keys.py
```

## 安全最佳实践

### 1. 文件权限

```bash
# 设置本地配置文件权限
chmod 600 config/api_keys.local.json
```

### 2. 版本控制

- ✅ 提交 `config/api_keys.json`（模板文件）
- ❌ 不要提交 `config/api_keys.local.json`（包含真实密钥）
- ❌ 不要提交 `.env` 文件

### 3. 生产环境

```bash
# 生产环境建议使用环境变量
export API__TSANGHI_API_KEY="prod_key"
export API__QWEN_API_KEY="prod_key"

# 或使用专门的生产配置文件
cp config/api_keys.json config/api_keys.production.json
# 编辑 api_keys.production.json
```

### 4. 密钥轮换

```bash
# 定期更新API密钥
# 1. 在API提供商处生成新密钥
# 2. 更新配置文件或环境变量
# 3. 重启服务
# 4. 验证新密钥工作正常
# 5. 撤销旧密钥
```

## 故障排除

### 常见问题

#### 1. 配置文件未找到

```bash
# 错误信息：未找到配置文件
# 解决方案：创建本地配置文件
python scripts/config_manager.py create-local
```

#### 2. API密钥无效

```bash
# 验证配置
python scripts/config_manager.py validate

# 检查特定服务
python scripts/config_manager.py show tsanghi
```

#### 3. 环境变量未生效

```bash
# 检查环境变量
python scripts/config_manager.py check-env

# 确认环境变量设置
echo $API__TSANGHI_API_KEY
```

#### 4. 导入错误

```python
# 确保在项目根目录下运行
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.api_config import get_api_key
```

### 调试模式

```python
# 启用详细日志
import logging
logging.basicConfig(level=logging.DEBUG)

from config.api_config import get_api_key
# 现在会显示详细的配置加载信息
```

## 扩展配置

### 添加新的API服务

1. 编辑 `config/api_keys.json`：

```json
{
  "ai_services": {
    "new_ai_service": {
      "name": "新AI服务",
      "description": "新的AI服务描述",
      "api_key": "your_new_service_api_key_here",
      "env_var": "API__NEW_SERVICE_API_KEY",
      "required": false,
      "website": "https://new-service.com",
      "note": "使用说明"
    }
  }
}
```

2. 更新 `.env.example`：

```bash
# 新AI服务
API__NEW_SERVICE_API_KEY=your_new_service_key_here
```

3. 在代码中使用：

```python
from config.api_config import get_api_key

new_service_key = get_api_key('new_ai_service')
```

### 自定义配置类别

可以在配置文件中添加新的类别：

```json
{
  "payment_services": {
    "stripe": {
      "name": "Stripe支付",
      "api_key": "your_stripe_key",
      "secret_key": "your_stripe_secret",
      "env_var": "PAYMENT__STRIPE_API_KEY",
      "required": true
    }
  }
}
```

## 更新日志

### v1.0.0 (当前版本)

- ✅ 统一API配置管理
- ✅ 支持环境变量优先级
- ✅ 配置验证和管理工具
- ✅ 自动迁移硬编码密钥
- ✅ 完整的安全最佳实践
- ✅ 详细的使用文档

## 支持

如果您在使用过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 使用配置管理工具进行诊断
3. 检查项目的GitHub Issues
4. 联系开发团队

---

**注意**：请妥善保管您的API密钥，不要在公共场所或版本控制系统中暴露真实的密钥信息。