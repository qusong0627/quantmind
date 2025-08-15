# 同花顺iFinD API Token管理指南

本指南介绍如何配置和使用同花顺iFinD API的Token管理系统。

## 文件说明

### 1. `ifind_tokens.json`
配置文件，用于存储API认证信息：
- `refresh_token`: 长期有效的刷新令牌
- `access_token`: 短期有效的访问令牌
- `token_expires_at`: access_token的过期时间
- `last_updated`: 最后更新时间
- API相关URL配置

### 2. `ifind_token_manager.py`
Token管理器，提供以下功能：
- 自动刷新过期的access_token
- 安全存储和读取token信息
- 提供API请求所需的headers
- 命令行工具支持

### 3. `ifind_api_example.py`
API使用示例，演示如何：
- 获取实时行情数据
- 获取历史行情数据
- 获取基础财务数据
- 获取技术指标数据

## 快速开始

### 步骤1: 获取Refresh Token

1. 登录同花顺iFinD平台
2. 获取您的refresh_token（具体获取方式请参考同花顺官方文档）

### 步骤2: 配置Token

```bash
# 设置refresh_token
python ifind_token_manager.py set_refresh_token "your_refresh_token_here"

# 检查token状态
python ifind_token_manager.py status

# 手动刷新access_token
python ifind_token_manager.py refresh
```

### 步骤3: 使用API

```python
from ifind_token_manager import IFindTokenManager
from ifind_api_example import IFindAPIClient

# 创建API客户端
client = IFindAPIClient()

# 获取实时行情
result = client.get_realtime_quotes(['000001.SZ', '000002.SZ'])
print(result)

# 获取历史数据
result = client.get_historical_data(
    codes=['000001.SZ'],
    start_date='2024-01-01',
    end_date='2024-01-31'
)
print(result)
```

## API接口说明

### 实时行情接口
```python
client.get_realtime_quotes(
    codes=['000001.SZ', '000002.SZ'],  # 股票代码列表
    indicators=['latest', 'chg', 'chg_pct', 'volume']  # 指标列表
)
```

### 历史数据接口
```python
client.get_historical_data(
    codes=['000001.SZ'],
    start_date='2024-01-01',
    end_date='2024-01-31',
    indicators=['open', 'high', 'low', 'close', 'volume'],
    period='D'  # D=日线, W=周线, M=月线
)
```

### 基础数据接口
```python
client.get_basic_data(
    codes=['000001.SZ'],
    indicators=['pe', 'pb', 'market_cap']
)
```

### 技术指标接口
```python
client.get_technical_indicators(
    codes=['000001.SZ'],
    indicators=['MA5', 'MA10', 'MACD', 'RSI'],
    start_date='2024-01-01',
    end_date='2024-01-31'
)
```

## 常用指标说明

### 实时行情指标
- `latest`: 最新价
- `chg`: 涨跌额
- `chg_pct`: 涨跌幅
- `volume`: 成交量
- `amount`: 成交额
- `turnoverRatio`: 换手率
- `pe_ttm`: 市盈率TTM
- `pb`: 市净率

### 历史数据指标
- `open`: 开盘价
- `high`: 最高价
- `low`: 最低价
- `close`: 收盘价
- `volume`: 成交量
- `amount`: 成交额

### 技术指标
- `MA5`, `MA10`, `MA20`: 移动平均线
- `MACD`: MACD指标
- `RSI`: 相对强弱指标
- `BOLL`: 布林带
- `KDJ`: KDJ指标

## 错误处理

### 常见错误码
- `10001`: Token无效或过期
- `10002`: 参数错误
- `10003`: 权限不足
- `10004`: 请求频率超限

### 自动重试机制
Token管理器会自动处理以下情况：
1. access_token过期时自动刷新
2. 网络请求失败时的重试
3. 错误日志记录

## 安全注意事项

1. **不要将token信息提交到版本控制系统**
   - `ifind_tokens.json`已添加到`.gitignore`
   - 请妥善保管您的refresh_token

2. **定期更新token**
   - refresh_token有一定的有效期
   - 建议定期检查token状态

3. **监控API调用频率**
   - 避免超出API调用限制
   - 合理设置请求间隔

## 故障排除

### Token相关问题
```bash
# 检查token状态
python ifind_token_manager.py status

# 重新设置refresh_token
python ifind_token_manager.py set_refresh_token "new_refresh_token"

# 手动刷新access_token
python ifind_token_manager.py refresh
```

### API调用问题
1. 检查网络连接
2. 验证股票代码格式（如：000001.SZ）
3. 确认指标名称正确
4. 检查日期格式（YYYY-MM-DD）

## 运行示例

```bash
# 运行完整示例
python ifind_api_example.py
```

这将演示：
- Token状态检查
- 实时行情获取
- 历史数据获取
- 基础数据获取

## 集成到项目中

在您的量化交易项目中使用：

```python
# 在您的策略代码中
from config.ifind_token_manager import IFindTokenManager
from config.ifind_api_example import IFindAPIClient

class TradingStrategy:
    def __init__(self):
        self.api_client = IFindAPIClient()
    
    def get_market_data(self, symbols):
        return self.api_client.get_realtime_quotes(symbols)
    
    def get_historical_data(self, symbol, days=30):
        from datetime import datetime, timedelta
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        return self.api_client.get_historical_data(
            codes=[symbol],
            start_date=start_date,
            end_date=end_date
        )
```

## 支持与反馈

如果您在使用过程中遇到问题，请：
1. 检查日志输出
2. 验证token配置
3. 参考同花顺官方API文档
4. 联系技术支持