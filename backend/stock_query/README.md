# 股票查询功能

基于同花顺iFinD API的股票数据查询服务，提供完整的股票搜索、实时行情、历史数据和技术指标查询功能。

## 功能特性

### 🔍 股票搜索
- 按股票代码搜索
- 按股票名称搜索
- 按关键词模糊搜索
- 按行业分类搜索
- 支持多种搜索条件组合

### 📊 实时行情
- 获取实时股价数据
- 支持批量查询
- 包含开盘价、最高价、最低价、收盘价
- 成交量、成交额、涨跌幅等信息

### 📈 历史数据
- 获取历史K线数据
- 支持日线、周线、月线等多种周期
- 支持前复权、后复权、不复权
- 可指定时间范围查询

### 🔧 技术指标
- 移动平均线（MA5、MA10、MA20等）
- RSI相对强弱指标
- MACD指标
- KDJ指标
- 布林带指标
- 支持自定义指标组合

### ⚡ 性能优化
- 多级缓存系统（内存+Redis）
- 智能缓存策略
- 并发请求控制
- 自动重试机制

### 🔐 安全特性
- Token自动管理和刷新
- 请求频率限制
- 错误处理和监控
- 安全的配置管理

## 快速开始

### 1. 环境准备

确保已安装Python 3.8+和必要的依赖包：

```bash
# 安装依赖
pip install flask flask-cors requests redis python-dateutil
```

### 2. 配置Token

首先需要配置同花顺iFinD API的Refresh Token：

```bash
# 设置Refresh Token
python3 config/ifind_token_manager.py set_refresh <your_refresh_token>

# 检查Token状态
python3 config/ifind_token_manager.py status
```

### 3. 运行测试

运行功能测试确保一切正常：

```bash
# 运行完整测试
python3 backend/stock_query/run.py test

# 或直接运行测试脚本
python3 backend/stock_query/test_stock_query.py
```

### 4. 启动服务

启动Web API服务：

```bash
# 使用管理脚本启动（推荐）
python3 backend/stock_query/run.py server

# 或直接启动Flask应用
python3 backend/stock_query/app.py
```

服务启动后，访问 http://localhost:5000 查看API文档。

## API接口

### 基础信息

- **基础URL**: `http://localhost:5000/api/stock`
- **响应格式**: JSON
- **字符编码**: UTF-8

### 接口列表

#### 1. 健康检查
```http
GET /api/stock/health
```

#### 2. 股票搜索
```http
POST /api/stock/search
Content-Type: application/json

{
  "keyword": "平安",
  "search_type": "name",
  "limit": 10
}
```

#### 3. 获取股票基础信息
```http
GET /api/stock/info/000001.SZ
```

#### 4. 获取实时行情
```http
POST /api/stock/realtime
Content-Type: application/json

{
  "codes": ["000001.SZ", "000002.SZ"],
  "indicators": ["latest", "open", "high", "low", "volume"]
}
```

#### 5. 获取历史数据
```http
POST /api/stock/historical
Content-Type: application/json

{
  "codes": ["000001.SZ"],
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "frequency": "daily",
  "indicators": ["open", "high", "low", "close", "volume"]
}
```

#### 6. 获取技术指标
```http
POST /api/stock/indicators
Content-Type: application/json

{
  "codes": ["000001.SZ"],
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "indicators": ["ma5", "ma10", "rsi", "macd"]
}
```

#### 7. 热门股票
```http
GET /api/stock/hot?limit=20
```

#### 8. 快速搜索
```http
GET /api/stock/quick_search?q=平安&limit=5
```

#### 9. 批量获取股票信息
```http
POST /api/stock/batch_info
Content-Type: application/json

{
  "codes": ["000001.SZ", "000002.SZ", "600000.SH"]
}
```

## 配置说明

### 环境变量

```bash
# 运行环境
ENVIRONMENT=development  # development/testing/production

# Web服务配置
WEB_HOST=0.0.0.0
WEB_PORT=5000
SECRET_KEY=your-secret-key

# API配置
API_TIMEOUT=30
IFIND_BASE_URL=https://quantapi.51ifind.com

# 缓存配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/stock_query.log
```

### 配置文件

主要配置在 `backend/stock_query/config.py` 中，包括：

- **API配置**: 请求超时、重试次数、并发限制等
- **缓存配置**: 内存缓存、Redis缓存、TTL设置等
- **数据配置**: 默认参数、支持的指标、市场信息等
- **Web配置**: 服务器设置、CORS配置、安全设置等

## 使用示例

### Python客户端示例

```python
import requests
import json

# API基础URL
base_url = "http://localhost:5000/api/stock"

# 1. 搜索股票
response = requests.post(f"{base_url}/search", json={
    "keyword": "平安银行",
    "search_type": "name",
    "limit": 5
})
print("搜索结果:", response.json())

# 2. 获取实时行情
response = requests.post(f"{base_url}/realtime", json={
    "codes": ["000001.SZ"],
    "indicators": ["latest", "chg", "chg_pct", "volume"]
})
print("实时行情:", response.json())

# 3. 获取历史数据
response = requests.post(f"{base_url}/historical", json={
    "codes": ["000001.SZ"],
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "frequency": "daily",
    "indicators": ["open", "high", "low", "close", "volume"]
})
print("历史数据:", response.json())
```

### JavaScript客户端示例

```javascript
// 基础配置
const baseURL = 'http://localhost:5000/api/stock';

// 搜索股票
async function searchStocks(keyword) {
    const response = await fetch(`${baseURL}/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            keyword: keyword,
            search_type: 'name',
            limit: 10
        })
    });
    
    const data = await response.json();
    console.log('搜索结果:', data);
    return data;
}

// 获取实时行情
async function getRealtimeQuotes(codes) {
    const response = await fetch(`${baseURL}/realtime`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            codes: codes,
            indicators: ['latest', 'chg', 'chg_pct', 'volume']
        })
    });
    
    const data = await response.json();
    console.log('实时行情:', data);
    return data;
}

// 使用示例
searchStocks('平安银行');
getRealtimeQuotes(['000001.SZ', '000002.SZ']);
```

## 管理工具

### 运行管理脚本

```bash
# 查看帮助
python3 backend/stock_query/run.py help

# 启动服务器
python3 backend/stock_query/run.py server

# 指定端口启动
python3 backend/stock_query/run.py server --port 8000

# 启用调试模式
python3 backend/stock_query/run.py server --debug

# 运行测试
python3 backend/stock_query/run.py test

# 查看服务状态
python3 backend/stock_query/run.py status

# 查看配置信息
python3 backend/stock_query/run.py config
```

### Token管理

```bash
# 设置Refresh Token
python3 config/ifind_token_manager.py set_refresh <token>

# 刷新Access Token
python3 config/ifind_token_manager.py refresh

# 查看Token状态
python3 config/ifind_token_manager.py status

# 清除Token
python3 config/ifind_token_manager.py clear
```

## 性能优化

### 缓存策略

- **股票基础信息**: 缓存1小时
- **实时行情**: 缓存1分钟
- **历史数据**: 缓存30分钟
- **技术指标**: 缓存15分钟
- **搜索结果**: 缓存10分钟

### 并发控制

- 最大并发请求数: 10（开发环境）/ 20（生产环境）
- 请求频率限制: 50次/秒
- 自动重试: 最多3次，延迟1秒

### 内存使用

- 内存缓存最大条目: 1000
- LRU淘汰策略
- 定期清理过期缓存

## 错误处理

### 常见错误码

- `TOKEN_INVALID`: Token无效或过期
- `RATE_LIMIT_EXCEEDED`: 请求频率超限
- `INVALID_STOCK_CODE`: 无效的股票代码
- `DATA_NOT_FOUND`: 数据不存在
- `API_ERROR`: API调用错误
- `CACHE_ERROR`: 缓存操作错误

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-01T12:00:00",
  "data": null
}
```

## 监控和日志

### 日志级别

- `DEBUG`: 详细调试信息
- `INFO`: 一般信息
- `WARNING`: 警告信息
- `ERROR`: 错误信息

### 监控指标

- 请求成功率
- 响应时间
- 缓存命中率
- Token刷新频率
- 错误统计

## 部署指南

### 开发环境

```bash
# 设置环境变量
export ENVIRONMENT=development

# 启动服务
python3 backend/stock_query/run.py server --debug
```

### 生产环境

```bash
# 设置环境变量
export ENVIRONMENT=production
export SECRET_KEY=your-production-secret-key
export REDIS_HOST=your-redis-host
export LOG_FILE=/var/log/stock_query.log

# 启动服务
python3 backend/stock_query/run.py server
```

### Docker部署

```dockerfile
# Dockerfile示例
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["python3", "backend/stock_query/run.py", "server"]
```

## 故障排除

### 常见问题

1. **Token相关问题**
   - 检查Token是否正确设置
   - 确认Token未过期
   - 尝试手动刷新Token

2. **API调用失败**
   - 检查网络连接
   - 确认API地址正确
   - 查看请求频率是否超限

3. **缓存问题**
   - 检查Redis连接
   - 清理过期缓存
   - 重启缓存服务

4. **性能问题**
   - 调整缓存TTL
   - 增加并发限制
   - 优化查询参数

### 调试技巧

```bash
# 启用详细日志
export LOG_LEVEL=DEBUG

# 查看实时日志
tail -f logs/stock_query.log

# 测试特定功能
python3 backend/stock_query/test_stock_query.py
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 运行测试
5. 创建Pull Request

## 许可证

本项目采用MIT许可证。详见LICENSE文件。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues]()
- 邮箱: your-email@example.com

---

**注意**: 使用本服务需要有效的同花顺iFinD API访问权限。请确保遵守相关服务条款和使用限制。