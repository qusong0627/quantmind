# 策略回测API文档

本文档描述了QuantMind增强版回测服务的API接口规范。

## 服务信息

- **服务名称**: QuantMind Enhanced Backtest Service
- **版本**: 2.0.0
- **基础URL**: `http://localhost:8003`
- **协议**: HTTP/WebSocket

## 认证

当前版本暂不需要认证，后续版本将支持JWT认证。

## API端点

### 1. 服务状态

#### GET /
获取服务基本信息

**响应示例**:
```json
{
  "service": "QuantMind Enhanced Backtest Service",
  "version": "2.0.0",
  "status": "running",
  "features": [
    "同花顺数据源集成",
    "实时回测进度",
    "增强性能分析",
    "WebSocket支持",
    "风险管理"
  ]
}
```

#### GET /health
健康检查

**响应示例**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "data_service": "connected",
  "active_backtests": 2
}
```

### 2. 回测管理

#### POST /backtest
创建新的回测任务

**请求体**:
```json
{
  "strategy_code": "def main():\n    # 策略代码\n    pass",
  "symbol": "000001.SZ",
  "start_date": "2023-01-01",
  "end_date": "2023-12-31",
  "initial_capital": 100000.0,
  "commission": 0.001,
  "user_id": "user123",
  "strategy_params": {},
  "data_source": "tonghuashun",
  "data_frequency": "1d",
  "benchmark_symbol": "000001.SH",
  "risk_free_rate": 0.03,
  "position_sizing": "fixed",
  "max_position_size": 1.0,
  "stop_loss": null,
  "take_profit": null,
  "slippage": 0.001,
  "transaction_cost": 0.0003,
  "enable_real_time": false,
  "enable_optimization": false,
  "optimization_params": {},
  "enable_monte_carlo": false,
  "monte_carlo_runs": 1000,
  "max_drawdown_limit": null,
  "daily_loss_limit": null,
  "position_concentration_limit": 0.3
}
```

**响应示例**:
```json
{
  "backtest_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "progress": 0.0,
  "symbol": "000001.SZ",
  "start_date": "2023-01-01",
  "end_date": "2023-12-31",
  "initial_capital": 100000.0,
  "final_capital": 0.0,
  "data_source": "tonghuashun",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### GET /backtest/{backtest_id}
获取回测结果

**路径参数**:
- `backtest_id`: 回测任务ID

**响应示例**:
```json
{
  "backtest_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100.0,
  "symbol": "000001.SZ",
  "start_date": "2023-01-01",
  "end_date": "2023-12-31",
  "initial_capital": 100000.0,
  "final_capital": 105000.0,
  "data_source": "tonghuashun",
  "total_return": 0.05,
  "annual_return": 0.05,
  "cumulative_return": 0.05,
  "excess_return": 0.02,
  "max_drawdown": 0.08,
  "max_drawdown_duration": 15,
  "volatility": 0.15,
  "downside_volatility": 0.12,
  "var_95": -0.025,
  "cvar_95": -0.035,
  "sharpe_ratio": 1.2,
  "sortino_ratio": 1.5,
  "calmar_ratio": 0.625,
  "omega_ratio": 1.3,
  "treynor_ratio": 0.08,
  "benchmark_return": 0.03,
  "alpha": 0.02,
  "beta": 0.9,
  "correlation": 0.85,
  "tracking_error": 0.05,
  "information_ratio": 0.4,
  "total_trades": 25,
  "win_rate": 0.6,
  "profit_factor": 1.8,
  "avg_win": 800.0,
  "avg_loss": -400.0,
  "largest_win": 2000.0,
  "largest_loss": -1200.0,
  "avg_trade_duration": 5.2,
  "equity_curve": [
    {
      "date": "2023-01-01T00:00:00",
      "value": 100000.0,
      "return": 0.0
    }
  ],
  "drawdown_curve": [
    {
      "date": "2023-01-01T00:00:00",
      "drawdown": 0.0
    }
  ],
  "benchmark_curve": [
    {
      "date": "2023-01-01T00:00:00",
      "value": 100000.0,
      "return": 0.0
    }
  ],
  "trade_list": [
    {
      "type": "buy",
      "price": 10.5,
      "shares": 1000,
      "cost": 10500.0,
      "timestamp": "2023-01-15T09:30:00Z"
    }
  ],
  "monthly_returns": [
    {
      "month": "2023-01",
      "return": 0.02,
      "start_value": 100000.0,
      "end_value": 102000.0
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:35:00Z",
  "execution_time": 300.5,
  "data_quality_score": 0.95
}
```

#### GET /backtest/user/{user_id}
获取用户的回测历史

**路径参数**:
- `user_id`: 用户ID

**响应示例**:
```json
{
  "user_id": "user123",
  "backtests": [
    {
      "backtest_id": "550e8400-e29b-41d4-a716-446655440000",
      "symbol": "000001.SZ",
      "status": "completed",
      "created_at": "2024-01-15T10:30:00Z",
      "total_return": 0.05
    }
  ],
  "total_count": 1
}
```

#### DELETE /backtest/{backtest_id}
删除回测结果

**路径参数**:
- `backtest_id`: 回测任务ID

**响应示例**:
```json
{
  "message": "回测任务已删除"
}
```

### 3. 数据源管理

#### GET /data-sources
获取支持的数据源列表

**响应示例**:
```json
{
  "data_sources": [
    {
      "name": "tonghuashun",
      "display_name": "同花顺",
      "description": "同花顺金融数据源",
      "supported_frequencies": ["1d", "1h", "30m", "15m", "5m"],
      "supported_markets": ["A股", "港股", "美股"]
    },
    {
      "name": "yahoo",
      "display_name": "Yahoo Finance",
      "description": "Yahoo财经数据源",
      "supported_frequencies": ["1d", "1h"],
      "supported_markets": ["全球股市"]
    }
  ]
}
```

## WebSocket接口

### 实时回测进度

**连接URL**: `ws://localhost:8003/ws/{backtest_id}`

**消息格式**:
```json
{
  "backtest_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "progress": 45.5,
  "message": "执行策略回测...",
  "timestamp": "2024-01-15T10:32:30Z"
}
```

**状态说明**:
- `pending`: 等待执行
- `running`: 正在执行
- `completed`: 执行完成
- `failed`: 执行失败
- `cancelled`: 已取消

## 错误处理

### HTTP状态码

- `200`: 成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

### 错误响应格式

```json
{
  "detail": "错误描述信息"
}
```

## 数据模型

### BacktestStatus枚举

```python
class BacktestStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
```

### DataSource枚举

```python
class DataSource(str, Enum):
    TUSHARE = "tushare"
    TONGHUASHUN = "tonghuashun"
    YAHOO = "yahoo"
    LOCAL = "local"
```

## 使用示例

### Python客户端示例

```python
import requests
import websocket
import json

# 创建回测任务
backtest_request = {
    "strategy_code": "def main():\n    pass",
    "symbol": "000001.SZ",
    "start_date": "2023-01-01",
    "end_date": "2023-12-31",
    "initial_capital": 100000.0,
    "user_id": "test_user"
}

response = requests.post(
    "http://localhost:8003/backtest",
    json=backtest_request
)

backtest_result = response.json()
backtest_id = backtest_result["backtest_id"]

# 监听回测进度
def on_message(ws, message):
    data = json.loads(message)
    print(f"进度: {data['progress']}%, 状态: {data['status']}")
    
    if data['status'] == 'completed':
        # 获取最终结果
        result = requests.get(f"http://localhost:8003/backtest/{backtest_id}")
        print("回测完成:", result.json())
        ws.close()

ws = websocket.WebSocketApp(
    f"ws://localhost:8003/ws/{backtest_id}",
    on_message=on_message
)
ws.run_forever()
```

### JavaScript客户端示例

```javascript
// 创建回测任务
const backtestRequest = {
  strategy_code: "def main():\n    pass",
  symbol: "000001.SZ",
  start_date: "2023-01-01",
  end_date: "2023-12-31",
  initial_capital: 100000.0,
  user_id: "test_user"
};

fetch('http://localhost:8003/backtest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(backtestRequest)
})
.then(response => response.json())
.then(result => {
  const backtestId = result.backtest_id;
  
  // 监听回测进度
  const ws = new WebSocket(`ws://localhost:8003/ws/${backtestId}`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(`进度: ${data.progress}%, 状态: ${data.status}`);
    
    if (data.status === 'completed') {
      // 获取最终结果
      fetch(`http://localhost:8003/backtest/${backtestId}`)
        .then(response => response.json())
        .then(result => {
          console.log('回测完成:', result);
        });
      ws.close();
    }
  };
});
```

## 性能考虑

1. **并发限制**: 服务使用线程池限制并发回测任务数量
2. **内存管理**: 大型回测结果会自动清理以释放内存
3. **数据缓存**: 市场数据会被缓存以提高性能
4. **WebSocket连接**: 建议及时关闭不需要的WebSocket连接

## 版本更新

### v2.0.0 (当前版本)
- 集成同花顺数据源
- 支持WebSocket实时进度推送
- 增强性能分析指标
- 改进错误处理

### 计划功能
- JWT认证支持
- 更多数据源集成
- 策略优化算法
- 风险管理模块
- 回测报告导出