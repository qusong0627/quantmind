# 策略回测示例代码

本文档提供了一些常用的量化交易策略示例，可以直接在策略回测页面中使用。

## 基础API说明

在策略代码中，您可以使用以下变量和函数：

### 可用变量
- `data`: 股票历史数据DataFrame，包含open, high, low, close, volume等字段
- `position`: 当前持仓数量
- `capital`: 当前可用资金
- `trades`: 交易记录列表

### 可用函数
- `buy(price, shares)`: 买入股票
- `sell(price, shares)`: 卖出股票
- `log(message)`: 输出日志信息

## 示例策略

### 1. 简单移动平均策略

```python
# 简单移动平均策略
# 当短期均线上穿长期均线时买入，下穿时卖出

def main():
    # 计算移动平均线
    data['ma5'] = data['close'].rolling(window=5).mean()
    data['ma20'] = data['close'].rolling(window=20).mean()
    
    position = 0
    
    for i in range(20, len(data)):
        current_price = data.iloc[i]['close']
        ma5_current = data.iloc[i]['ma5']
        ma20_current = data.iloc[i]['ma20']
        ma5_prev = data.iloc[i-1]['ma5']
        ma20_prev = data.iloc[i-1]['ma20']
        
        # 金叉买入信号
        if ma5_prev <= ma20_prev and ma5_current > ma20_current and position == 0:
            shares = int(capital // current_price)
            if shares > 0:
                buy(current_price, shares)
                position = shares
                log(f"买入信号: 价格={current_price}, 数量={shares}")
        
        # 死叉卖出信号
        elif ma5_prev >= ma20_prev and ma5_current < ma20_current and position > 0:
            sell(current_price, position)
            log(f"卖出信号: 价格={current_price}, 数量={position}")
            position = 0
```

### 2. RSI超买超卖策略

```python
# RSI超买超卖策略
# RSI < 30时买入，RSI > 70时卖出

def calculate_rsi(prices, window=14):
    """计算RSI指标"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def main():
    # 计算RSI
    data['rsi'] = calculate_rsi(data['close'])
    
    position = 0
    
    for i in range(14, len(data)):
        current_price = data.iloc[i]['close']
        rsi = data.iloc[i]['rsi']
        
        # RSI超卖买入
        if rsi < 30 and position == 0:
            shares = int(capital // current_price)
            if shares > 0:
                buy(current_price, shares)
                position = shares
                log(f"RSI超卖买入: RSI={rsi:.2f}, 价格={current_price}")
        
        # RSI超买卖出
        elif rsi > 70 and position > 0:
            sell(current_price, position)
            log(f"RSI超买卖出: RSI={rsi:.2f}, 价格={current_price}")
            position = 0
```

### 3. 布林带策略

```python
# 布林带策略
# 价格触及下轨时买入，触及上轨时卖出

def main():
    # 计算布林带
    window = 20
    data['ma'] = data['close'].rolling(window=window).mean()
    data['std'] = data['close'].rolling(window=window).std()
    data['upper'] = data['ma'] + 2 * data['std']
    data['lower'] = data['ma'] - 2 * data['std']
    
    position = 0
    
    for i in range(window, len(data)):
        current_price = data.iloc[i]['close']
        upper = data.iloc[i]['upper']
        lower = data.iloc[i]['lower']
        
        # 价格触及下轨买入
        if current_price <= lower and position == 0:
            shares = int(capital // current_price)
            if shares > 0:
                buy(current_price, shares)
                position = shares
                log(f"触及下轨买入: 价格={current_price}, 下轨={lower:.2f}")
        
        # 价格触及上轨卖出
        elif current_price >= upper and position > 0:
            sell(current_price, position)
            log(f"触及上轨卖出: 价格={current_price}, 上轨={upper:.2f}")
            position = 0
```

### 4. 动量策略

```python
# 动量策略
# 基于价格动量进行交易

def main():
    # 计算动量指标
    momentum_period = 10
    data['momentum'] = data['close'].pct_change(momentum_period)
    data['ma_momentum'] = data['momentum'].rolling(window=5).mean()
    
    position = 0
    
    for i in range(momentum_period + 5, len(data)):
        current_price = data.iloc[i]['close']
        momentum = data.iloc[i]['momentum']
        ma_momentum = data.iloc[i]['ma_momentum']
        
        # 正动量买入
        if momentum > 0.02 and ma_momentum > 0.01 and position == 0:
            shares = int(capital // current_price)
            if shares > 0:
                buy(current_price, shares)
                position = shares
                log(f"正动量买入: 动量={momentum:.4f}, 价格={current_price}")
        
        # 负动量卖出
        elif momentum < -0.02 and position > 0:
            sell(current_price, position)
            log(f"负动量卖出: 动量={momentum:.4f}, 价格={current_price}")
            position = 0
```

### 5. 均值回归策略

```python
# 均值回归策略
# 当价格偏离均值过多时进行反向交易

def main():
    # 计算均值和标准差
    window = 20
    data['ma'] = data['close'].rolling(window=window).mean()
    data['std'] = data['close'].rolling(window=window).std()
    data['z_score'] = (data['close'] - data['ma']) / data['std']
    
    position = 0
    
    for i in range(window, len(data)):
        current_price = data.iloc[i]['close']
        z_score = data.iloc[i]['z_score']
        
        # Z-score < -2 时买入（价格被低估）
        if z_score < -2 and position == 0:
            shares = int(capital // current_price)
            if shares > 0:
                buy(current_price, shares)
                position = shares
                log(f"均值回归买入: Z-score={z_score:.2f}, 价格={current_price}")
        
        # Z-score > 2 时卖出（价格被高估）
        elif z_score > 2 and position > 0:
            sell(current_price, position)
            log(f"均值回归卖出: Z-score={z_score:.2f}, 价格={current_price}")
            position = 0
        
        # Z-score接近0时平仓
        elif abs(z_score) < 0.5 and position > 0:
            sell(current_price, position)
            log(f"回归均值平仓: Z-score={z_score:.2f}, 价格={current_price}")
            position = 0
```

## 使用说明

1. 将以上任意一个策略代码复制到策略回测页面的代码编辑器中
2. 设置回测参数（股票代码、时间范围、初始资金等）
3. 点击"开始回测"按钮执行策略
4. 查看回测结果和性能分析

## 注意事项

1. 策略代码必须包含`main()`函数作为入口点
2. 确保在使用技术指标前有足够的历史数据
3. 合理设置买卖条件，避免过度交易
4. 可以使用`log()`函数输出调试信息
5. 策略执行过程中要注意资金管理和风险控制

## 扩展功能

您还可以在策略中使用更多的技术分析库和功能：

- 使用pandas进行数据处理
- 使用numpy进行数值计算
- 实现更复杂的技术指标
- 添加止损和止盈逻辑
- 实现多因子模型

祝您回测愉快！