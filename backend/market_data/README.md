# 大盘数据服务 (Market Data Service)

大盘指数数据服务，提供实时的A股主要指数数据获取功能。

## 功能特性

- ✅ **实时数据获取**: 获取实时指数数据
- ✅ **主要指数支持**: 支持上证指数、深证成指、创业板指、沪深300等主要指数
- ✅ **市场概览**: 提供市场整体涨跌统计和概览信息
- ✅ **RESTful API**: 提供标准的REST API接口
- ✅ **异步处理**: 基于asyncio和aiohttp的高性能异步处理
- ✅ **健康检查**: 内置服务健康检查功能
- ✅ **CORS支持**: 支持跨域请求
- ✅ **错误处理**: 完善的错误处理和日志记录

## 支持的指数

### 上海证券交易所
- **sh000001**: 上证指数
- **sh000016**: 上证50
- **sh000300**: 沪深300
- **sh000688**: 科创50

### 深圳证券交易所
- **sz399001**: 深证成指
- **sz399006**: 创业板指
- **sz399905**: 中证500
- **sz399102**: 创业板综
- **sz399303**: 国证2000
- **sz399324**: 深证红利

## 快速开始

### 安装依赖

```bash
pip install flask flask-cors aiohttp
```

### 启动服务

```bash
# 开发模式启动
python run.py server --debug

# 生产模式启动
python run.py server --host 0.0.0.0 --port 5002

# 测试服务功能
python run.py test
```

### 环境变量配置

```bash
# 服务配置
export PORT=5002
export DEBUG=false
export LOG_LEVEL=INFO

# API配置
export TENCENT_API_TIMEOUT=10
export CACHE_ENABLED=true
export CACHE_TTL=60

# CORS配置
export CORS_ORIGINS="http://localhost:3000,http://localhost:8080"
```

## API 接口文档

### 基础信息

- **Base URL**: `http://localhost:5002`
- **Content-Type**: `application/json`
- **字符编码**: UTF-8

### 接口列表

#### 1. 健康检查

```http
GET /api/v1/market/health
```

**响应示例**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "market_data"
}
```

#### 2. 获取指数数据

```http
GET /api/v1/market/indices?symbols=sh000001,sz399001&include_major=true
```

**查询参数**:
- `symbols` (可选): 指数代码列表，逗号分隔
- `include_major` (可选): 是否包含主要指数，默认true

**响应示例**:
```json
{
  "success": true,
  "message": "数据获取成功",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "sh000001": {
      "symbol": "sh000001",
      "name": "上证指数",
      "market": "SHANGHAI",
      "current_price": 3200.50,
      "change_points": 15.30,
      "change_percent": 0.48,
      "volume": 150000000,
      "amount": 200000000000,
      "trend": "UP",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  },
  "overview": {
    "total_indices": 10,
    "up_count": 6,
    "down_count": 3,
    "flat_count": 1,
    "major_indices": {
      "shanghai": {...},
      "shenzhen": {...}
    }
  }
}
```

#### 3. 获取市场概览

```http
GET /api/v1/market/overview
```

**响应示例**:
```json
{
  "success": true,
  "message": "市场概览获取成功",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "overview": {
    "total_indices": 10,
    "up_count": 6,
    "down_count": 3,
    "flat_count": 1,
    "major_indices": {
      "shanghai": {
        "symbol": "sh000001",
        "name": "上证指数",
        "current_price": 3200.50,
        "change_percent": 0.48
      }
    }
  }
}
```

#### 4. 获取单个指数数据

```http
GET /api/v1/market/indices/sh000001
```

**响应示例**:
```json
{
  "success": true,
  "message": "指数数据获取成功",
  "data": {
    "symbol": "sh000001",
    "name": "上证指数",
    "current_price": 3200.50,
    "change_percent": 0.48
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 5. 获取支持的指数列表

```http
GET /api/v1/market/supported
```

**响应示例**:
```json
{
  "success": true,
  "message": "支持的指数列表获取成功",
  "data": {
    "sh000001": {
      "name": "上证指数",
      "market": "SHANGHAI"
    },
    "sz399001": {
      "name": "深证成指",
      "market": "SHENZHEN"
    }
  },
  "count": 10,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 6. 获取实时市场数据

```http
GET /api/v1/market/realtime
```

**响应示例**:
```json
{
  "success": true,
  "message": "数据获取成功",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "indices": {
    "sh000001": {...},
    "sz399001": {...}
  },
  "overview": {
    "total_indices": 10,
    "up_count": 6,
    "down_count": 3,
    "flat_count": 1
  }
}
```

## 编程接口使用

### Python异步使用

```python
import asyncio
from market_data import MarketDataService

async def main():
    # 使用市场数据服务
    market_service = MarketDataService()
    response = await market_service.get_realtime_market_data()
    if response.success:
        print(f"获取到 {len(response.data)} 个指数数据")

asyncio.run(main())
```

### Flask应用集成

```python
from market_data import create_app

# 创建应用
app = create_app()

# 自定义配置
app.config.update({
    'DEBUG': True,
    'PORT': 5002
})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
```

## 数据模型

### IndexData (指数数据)

```python
@dataclass
class IndexData:
    symbol: str          # 指数代码
    name: str           # 指数名称
    market: MarketType  # 市场类型
    code: str           # 内部代码
    current_price: float # 当前价格
    change_points: float # 涨跌点数
    change_percent: float # 涨跌幅度
    volume: int         # 成交量
    amount: int         # 成交额
    market_cap: Optional[float] # 市值
    trend: TrendStatus  # 趋势状态
    timestamp: datetime # 数据时间戳
```

### MarketOverview (市场概览)

```python
@dataclass
class MarketOverview:
    total_indices: int  # 总指数数量
    up_count: int      # 上涨数量
    down_count: int    # 下跌数量
    flat_count: int    # 平盘数量
    major_indices: Dict[str, Optional[IndexData]] # 主要指数
```

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 常见错误码

- **404**: 接口不存在或指数代码不存在
- **500**: 内部服务器错误
- **503**: 服务不可用（健康检查失败）
- **timeout**: API请求超时

## 性能优化

- **异步处理**: 使用asyncio和aiohttp提高并发性能
- **连接复用**: HTTP连接池复用减少连接开销
- **缓存机制**: 可选的内存缓存减少API调用
- **批量请求**: 支持批量获取多个指数数据

## 监控和日志

### 日志配置

```python
# 日志级别: DEBUG, INFO, WARNING, ERROR
LOG_LEVEL = 'INFO'
LOG_FILE = 'market_data.log'
```

### 健康检查

```bash
# 检查服务状态
curl http://localhost:5002/health

# 检查市场数据服务
curl http://localhost:5002/api/v1/market/health
```

## 部署建议

### 开发环境

```bash
# 启动开发服务器
python run.py server --debug --log-level DEBUG
```

### 生产环境

```bash
# 使用Gunicorn部署
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5002 "market_data:create_app()"

# 使用Docker部署
docker build -t market-data-service .
docker run -p 5002:5002 market-data-service
```

## 注意事项

1. **数据来源**: 基于多种数据源，数据仅供参考
2. **请求频率**: 建议控制请求频率，避免过于频繁的API调用
3. **网络依赖**: 服务依赖外部API，需要稳定的网络连接
4. **数据延迟**: 数据可能存在几秒到几分钟的延迟
5. **服务可用性**: 外部API的可用性可能影响服务稳定性

## 许可证

MIT License

## 更新日志

### v1.0.0 (2024-01-15)
- ✅ 初始版本发布
- ✅ 基础的指数数据获取功能
- ✅ RESTful API接口
- ✅ 异步处理支持
- ✅ 健康检查功能
- ✅ 完整的文档和示例