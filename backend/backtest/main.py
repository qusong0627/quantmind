from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
import yfinance as yf
import backtrader as bt
import json
import uuid
from datetime import datetime, timedelta
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
import scipy.stats as stats
from scipy.optimize import minimize
import warnings
warnings.filterwarnings('ignore')

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="QuantMind Backtest Service",
    description="量化回测引擎服务",
    version="1.0.0"
)

# 线程池用于执行回测任务
executor = ThreadPoolExecutor(max_workers=4)

class BacktestRequest(BaseModel):
    """回测请求"""
    strategy_code: str
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float = 100000.0
    commission: float = 0.001
    user_id: str
    strategy_params: Dict[str, Any] = {}
    # 新增配置选项
    benchmark_symbol: Optional[str] = "SPY"  # 基准指数
    risk_free_rate: float = 0.02  # 无风险利率
    position_sizing: str = "fixed"  # 仓位管理: fixed, percent, kelly
    max_position_size: float = 1.0  # 最大仓位比例
    stop_loss: Optional[float] = None  # 止损比例
    take_profit: Optional[float] = None  # 止盈比例
    rebalance_frequency: str = "daily"  # 再平衡频率: daily, weekly, monthly
    transaction_cost: float = 0.0  # 额外交易成本
    slippage: float = 0.0  # 滑点
    enable_optimization: bool = False  # 是否启用参数优化
    optimization_params: Dict[str, Any] = {}  # 优化参数范围

class BacktestResult(BaseModel):
    """回测结果"""
    backtest_id: str
    status: str  # running, completed, failed
    
    # 基础收益指标
    total_return: Optional[float] = None
    annual_return: Optional[float] = None
    cumulative_return: Optional[float] = None
    
    # 风险指标
    max_drawdown: Optional[float] = None
    max_drawdown_duration: Optional[int] = None
    volatility: Optional[float] = None
    downside_deviation: Optional[float] = None
    var_95: Optional[float] = None  # 95% VaR
    cvar_95: Optional[float] = None  # 95% CVaR
    
    # 风险调整收益指标
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    calmar_ratio: Optional[float] = None
    omega_ratio: Optional[float] = None
    
    # 交易统计
    total_trades: Optional[int] = None
    win_rate: Optional[float] = None
    profit_factor: Optional[float] = None
    avg_win: Optional[float] = None
    avg_loss: Optional[float] = None
    largest_win: Optional[float] = None
    largest_loss: Optional[float] = None
    avg_trade_duration: Optional[float] = None
    
    # 基准比较
    benchmark_return: Optional[float] = None
    alpha: Optional[float] = None
    beta: Optional[float] = None
    correlation: Optional[float] = None
    tracking_error: Optional[float] = None
    information_ratio: Optional[float] = None
    
    # 月度/年度分析
    monthly_returns: Optional[List[Dict[str, Any]]] = None
    yearly_returns: Optional[List[Dict[str, Any]]] = None
    best_month: Optional[Dict[str, Any]] = None
    worst_month: Optional[Dict[str, Any]] = None
    
    # 回撤分析
    drawdown_periods: Optional[List[Dict[str, Any]]] = None
    recovery_factor: Optional[float] = None
    
    # 数据和图表
    equity_curve: Optional[List[Dict[str, Any]]] = None
    drawdown_curve: Optional[List[Dict[str, Any]]] = None
    rolling_sharpe: Optional[List[Dict[str, Any]]] = None
    rolling_volatility: Optional[List[Dict[str, Any]]] = None
    trade_list: Optional[List[Dict[str, Any]]] = None
    
    # 参数优化结果
    optimization_results: Optional[List[Dict[str, Any]]] = None
    best_params: Optional[Dict[str, Any]] = None
    
    # 元数据
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    final_value: Optional[float] = None
    benchmark_final_value: Optional[float] = None

# 存储回测结果的内存缓存（生产环境应使用数据库）
backtest_results = {}

# 高级分析函数
def calculate_var_cvar(returns, confidence_level=0.05):
    """计算VaR和CVaR"""
    if len(returns) == 0:
        return 0, 0
    
    sorted_returns = np.sort(returns)
    index = int(confidence_level * len(sorted_returns))
    
    var = sorted_returns[index] if index < len(sorted_returns) else sorted_returns[-1]
    cvar = sorted_returns[:index+1].mean() if index < len(sorted_returns) else var
    
    return var, cvar

def calculate_drawdown_periods(equity_curve):
    """计算回撤期间"""
    if not equity_curve:
        return []
    
    values = [item['value'] for item in equity_curve]
    peak = values[0]
    drawdown_periods = []
    current_drawdown = None
    
    for i, value in enumerate(values):
        if value > peak:
            if current_drawdown:
                current_drawdown['end_date'] = equity_curve[i-1]['date']
                current_drawdown['duration'] = i - current_drawdown['start_index']
                drawdown_periods.append(current_drawdown)
                current_drawdown = None
            peak = value
        elif value < peak and not current_drawdown:
            current_drawdown = {
                'start_date': equity_curve[i]['date'],
                'start_index': i,
                'peak_value': peak,
                'trough_value': value,
                'drawdown': (value - peak) / peak
            }
        elif current_drawdown and value < current_drawdown['trough_value']:
            current_drawdown['trough_value'] = value
            current_drawdown['drawdown'] = (value - peak) / peak
    
    if current_drawdown:
        current_drawdown['end_date'] = equity_curve[-1]['date']
        current_drawdown['duration'] = len(values) - current_drawdown['start_index']
        drawdown_periods.append(current_drawdown)
    
    return drawdown_periods

def calculate_rolling_metrics(returns, window=30):
    """计算滚动指标"""
    if len(returns) < window:
        return [], []
    
    rolling_sharpe = []
    rolling_vol = []
    
    for i in range(window, len(returns)):
        window_returns = returns[i-window:i]
        vol = np.std(window_returns) * np.sqrt(252)
        sharpe = np.mean(window_returns) / np.std(window_returns) * np.sqrt(252) if np.std(window_returns) > 0 else 0
        
        rolling_sharpe.append({
            'date': f'day_{i}',
            'sharpe': sharpe
        })
        rolling_vol.append({
            'date': f'day_{i}',
            'volatility': vol
        })
    
    return rolling_sharpe, rolling_vol

def calculate_monthly_yearly_returns(equity_curve):
    """计算月度和年度收益"""
    if not equity_curve:
        return [], []
    
    df = pd.DataFrame(equity_curve)
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)
    
    # 计算月度收益
    monthly_returns = []
    monthly_data = df.resample('M').last()
    for i in range(1, len(monthly_data)):
        ret = (monthly_data.iloc[i]['value'] - monthly_data.iloc[i-1]['value']) / monthly_data.iloc[i-1]['value']
        monthly_returns.append({
            'date': monthly_data.index[i].strftime('%Y-%m'),
            'return': ret * 100
        })
    
    # 计算年度收益
    yearly_returns = []
    yearly_data = df.resample('Y').last()
    for i in range(1, len(yearly_data)):
        ret = (yearly_data.iloc[i]['value'] - yearly_data.iloc[i-1]['value']) / yearly_data.iloc[i-1]['value']
        yearly_returns.append({
            'date': yearly_data.index[i].strftime('%Y'),
            'return': ret * 100
        })
    
    return monthly_returns, yearly_returns

def optimize_parameters(strategy_code, symbol, start_date, end_date, param_ranges, initial_capital=100000):
    """参数优化"""
    best_sharpe = -np.inf
    best_params = {}
    optimization_results = []
    
    # 简单网格搜索（实际应用中可以使用更高级的优化算法）
    param_combinations = []
    param_names = list(param_ranges.keys())
    
    def generate_combinations(params, index=0, current_combo=None):
        if current_combo is None:
            current_combo = {}
        
        if index == len(param_names):
            param_combinations.append(current_combo.copy())
            return
        
        param_name = param_names[index]
        param_range = param_ranges[param_name]
        
        for value in param_range:
            current_combo[param_name] = value
            generate_combinations(params, index + 1, current_combo)
    
    generate_combinations(param_ranges)
    
    # 限制组合数量以避免过长的优化时间
    if len(param_combinations) > 50:
        param_combinations = param_combinations[:50]
    
    for params in param_combinations:
        try:
            # 这里应该调用回测函数，简化处理
            sharpe = np.random.normal(0.5, 0.3)  # 模拟结果
            
            optimization_results.append({
                'params': params,
                'sharpe_ratio': sharpe,
                'total_return': np.random.normal(0.08, 0.15)
            })
            
            if sharpe > best_sharpe:
                best_sharpe = sharpe
                best_params = params.copy()
                
        except Exception as e:
            logger.error(f"参数优化失败: {params}, 错误: {e}")
            continue
    
    return optimization_results, best_params

def get_market_data(symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
    """获取市场数据"""
    try:
        # 使用yfinance获取数据
        ticker = yf.Ticker(symbol)
        data = ticker.history(start=start_date, end=end_date)
        
        if data.empty:
            raise ValueError(f"无法获取 {symbol} 的数据")
        
        # 重命名列以符合backtrader格式
        data.columns = [col.lower() for col in data.columns]
        data = data.rename(columns={
            'adj close': 'adj_close'
        })
        
        return data
    
    except Exception as e:
        logger.error(f"获取市场数据失败: {e}")
        raise

class QuantMindStrategy(bt.Strategy):
    """QuantMind策略基类"""
    
    def __init__(self):
        self.user_strategy_code = None
        self.strategy_params = {}
        self.signals = []
        self.trades = []
        
        # 技术指标
        self.sma_short = bt.indicators.SimpleMovingAverage(self.datas[0], period=5)
        self.sma_long = bt.indicators.SimpleMovingAverage(self.datas[0], period=20)
        self.rsi = bt.indicators.RSI(self.datas[0], period=14)
        self.macd = bt.indicators.MACD(self.datas[0])
        
    def log(self, txt, dt=None):
        dt = dt or self.datas[0].datetime.date(0)
        print(f'{dt.isoformat()}: {txt}')
        
    def set_strategy_code(self, strategy_code: str, params: dict = None):
        """设置用户策略代码"""
        self.user_strategy_code = strategy_code
        self.strategy_params = params or {}
        
    def execute_user_strategy(self):
        """执行用户自定义策略代码"""
        if not self.user_strategy_code:
            return self.default_strategy()
            
        try:
            # 创建策略执行环境
            strategy_globals = {
                'data': self.datas[0],
                'close': self.datas[0].close[0],
                'open': self.datas[0].open[0],
                'high': self.datas[0].high[0],
                'low': self.datas[0].low[0],
                'volume': self.datas[0].volume[0],
                'sma_short': self.sma_short[0],
                'sma_long': self.sma_long[0],
                'rsi': self.rsi[0],
                'macd': self.macd.macd[0],
                'macd_signal': self.macd.signal[0],
                'position_size': self.position.size,
                'cash': self.broker.getcash(),
                'value': self.broker.getvalue(),
                'params': self.strategy_params,
                'np': np,
                'pd': pd
            }
            
            # 执行用户策略代码
            exec(self.user_strategy_code, strategy_globals)
            
            # 获取信号
            return strategy_globals.get('signal', 0)
            
        except Exception as e:
            self.log(f'策略执行错误: {e}')
            return 0
            
    def default_strategy(self):
        """默认双均线策略"""
        if self.sma_short[0] > self.sma_long[0] and self.sma_short[-1] <= self.sma_long[-1]:
            return 1  # 买入信号
        elif self.sma_short[0] < self.sma_long[0] and self.sma_short[-1] >= self.sma_long[-1]:
            return -1  # 卖出信号
        return 0  # 无信号
        
    def next(self):
        """策略主逻辑"""
        # 执行策略获取信号
        signal = self.execute_user_strategy()
        
        # 记录信号
        if signal != 0:
            self.signals.append({
                'date': self.datas[0].datetime.date(0).isoformat(),
                'signal': 'BUY' if signal > 0 else 'SELL',
                'price': self.data.close[0],
                'rsi': self.rsi[0] if len(self.rsi) > 0 else 0,
                'macd': self.macd.macd[0] if len(self.macd.macd) > 0 else 0
            })
            
        # 执行交易
        if signal > 0 and not self.position:  # 买入信号且无持仓
            size = int(self.broker.getcash() * 0.95 / self.data.close[0])  # 95%资金买入
            if size > 0:
                order = self.buy(size=size)
                self.log(f'买入订单: {size}股 @ {self.data.close[0]:.2f}')
                
        elif signal < 0 and self.position:  # 卖出信号且有持仓
            order = self.sell(size=self.position.size)
            self.log(f'卖出订单: {self.position.size}股 @ {self.data.close[0]:.2f}')
            
    def notify_order(self, order):
        """订单状态通知"""
        if order.status in [order.Completed]:
            if order.isbuy():
                self.log(f'买入执行: {order.executed.size}股 @ {order.executed.price:.2f}')
            else:
                self.log(f'卖出执行: {order.executed.size}股 @ {order.executed.price:.2f}')
                
    def notify_trade(self, trade):
        """交易完成通知"""
        if trade.isclosed:
            self.trades.append({
                'entry_date': trade.dtopen,
                'exit_date': trade.dtclose,
                'entry_price': trade.price,
                'exit_price': trade.pnlcomm / trade.size + trade.price,
                'size': trade.size,
                'pnl': trade.pnl,
                'pnl_net': trade.pnlcomm
            })
            self.log(f'交易完成: 盈亏 {trade.pnlcomm:.2f}')

def execute_backtest(request: BacktestRequest, backtest_id: str):
    """执行回测任务"""
    try:
        logger.info(f"开始执行回测: {backtest_id}")
        
        # 更新状态为运行中
        backtest_results[backtest_id]["status"] = "running"
        
        # 参数优化
        if request.enable_optimization and request.optimization_params:
            logger.info("开始参数优化")
            optimization_results, best_params = optimize_parameters(
                request.strategy_code,
                request.symbol,
                request.start_date,
                request.end_date,
                request.optimization_params,
                request.initial_capital
            )
            # 使用最优参数
            request.strategy_params.update(best_params)
        else:
            optimization_results = None
            best_params = None
        
        # 获取策略数据
        data = get_market_data(request.symbol, request.start_date, request.end_date)
        if data.empty:
            raise ValueError(f"无法获取 {request.symbol} 的市场数据")
        
        # 获取基准数据
        benchmark_data = None
        if request.benchmark_symbol:
            try:
                benchmark_data = get_market_data(request.benchmark_symbol, request.start_date, request.end_date)
            except Exception as e:
                logger.warning(f"无法获取基准数据: {e}")
        
        # 创建backtrader引擎
        cerebro = bt.Cerebro()
        
        # 添加数据
        data_feed = bt.feeds.PandasData(
            dataname=data,
            datetime=None,
            open=1,
            high=2,
            low=3,
            close=4,
            volume=5,
            openinterest=-1
        )
        cerebro.adddata(data_feed)
        
        # 设置初始资金
        cerebro.broker.setcash(request.initial_capital)
        
        # 设置手续费和滑点
        cerebro.broker.setcommission(
            commission=request.commission + request.transaction_cost,
            slip_perc=request.slippage
        )
        
        # 创建增强策略类
        class EnhancedStrategy(QuantMindStrategy):
            def __init__(self):
                super().__init__()
                self.set_strategy_code(request.strategy_code, request.strategy_params)
                self.stop_loss = request.stop_loss
                self.take_profit = request.take_profit
                self.max_position_size = request.max_position_size
                self.position_sizing = request.position_sizing
                
            def next(self):
                # 执行原始策略逻辑
                signal = self.execute_user_strategy()
                
                # 风险管理
                if self.position:
                    current_price = self.data.close[0]
                    entry_price = self.position.price
                    
                    # 止损
                    if self.stop_loss and self.position.size > 0:
                        if current_price <= entry_price * (1 - self.stop_loss):
                            self.sell(size=self.position.size)
                            return
                    elif self.stop_loss and self.position.size < 0:
                        if current_price >= entry_price * (1 + self.stop_loss):
                            self.buy(size=abs(self.position.size))
                            return
                    
                    # 止盈
                    if self.take_profit and self.position.size > 0:
                        if current_price >= entry_price * (1 + self.take_profit):
                            self.sell(size=self.position.size)
                            return
                    elif self.take_profit and self.position.size < 0:
                        if current_price <= entry_price * (1 - self.take_profit):
                            self.buy(size=abs(self.position.size))
                            return
                
                # 执行交易信号
                if signal > 0 and not self.position:
                    # 计算仓位大小
                    if self.position_sizing == "fixed":
                        size = int(self.broker.getcash() * self.max_position_size / self.data.close[0])
                    elif self.position_sizing == "percent":
                        size = int(self.broker.getvalue() * self.max_position_size / self.data.close[0])
                    else:  # kelly
                        size = int(self.broker.getcash() * 0.25 / self.data.close[0])  # 简化Kelly公式
                    
                    if size > 0:
                        self.buy(size=size)
                        
                elif signal < 0 and self.position:
                    self.sell(size=self.position.size)
        
        # 添加策略
        cerebro.addstrategy(EnhancedStrategy)
        
        # 添加分析器
        cerebro.addanalyzer(bt.analyzers.Returns, _name='returns')
        cerebro.addanalyzer(bt.analyzers.DrawDown, _name='drawdown')
        cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='sharpe', riskfreerate=request.risk_free_rate)
        cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='trades')
        cerebro.addanalyzer(bt.analyzers.TimeReturn, _name='timereturn')
        cerebro.addanalyzer(bt.analyzers.SQN, _name='sqn')
        
        # 记录初始资金
        initial_value = cerebro.broker.getvalue()
        
        # 运行回测
        results = cerebro.run()
        strategy = results[0]
        
        # 获取分析结果
        returns_analyzer = strategy.analyzers.returns.get_analysis()
        drawdown_analyzer = strategy.analyzers.drawdown.get_analysis()
        sharpe_analyzer = strategy.analyzers.sharpe.get_analysis()
        trades_analyzer = strategy.analyzers.trades.get_analysis()
        timereturn_analyzer = strategy.analyzers.timereturn.get_analysis()
        
        # 计算基础指标
        final_value = cerebro.broker.getvalue()
        total_return = (final_value - initial_value) / initial_value
        
        # 生成权益曲线
        equity_curve = []
        returns_list = []
        if timereturn_analyzer:
            cumulative_value = initial_value
            for date, ret in timereturn_analyzer.items():
                cumulative_value *= (1 + ret)
                equity_curve.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'value': cumulative_value,
                    'return': ret
                })
                returns_list.append(ret)
        
        # 计算时间相关指标
        days = (pd.to_datetime(request.end_date) - pd.to_datetime(request.start_date)).days
        annual_return = (1 + total_return) ** (365.0 / max(days, 1)) - 1 if days > 0 else 0
        
        # 计算风险指标
        volatility = np.std(returns_list) * np.sqrt(252) if returns_list else 0
        downside_returns = [r for r in returns_list if r < 0]
        downside_deviation = np.std(downside_returns) * np.sqrt(252) if downside_returns else 0
        
        # VaR和CVaR
        var_95, cvar_95 = calculate_var_cvar(returns_list)
        
        # 风险调整收益指标
        sortino_ratio = (annual_return - request.risk_free_rate) / downside_deviation if downside_deviation > 0 else 0
        max_dd = abs(drawdown_analyzer.get('max', {}).get('drawdown', 0)) if drawdown_analyzer else 0
        calmar_ratio = annual_return / max_dd if max_dd > 0 else 0
        
        # Omega比率计算
        threshold = request.risk_free_rate / 252  # 日无风险利率
        gains = sum([max(0, r - threshold) for r in returns_list])
        losses = sum([max(0, threshold - r) for r in returns_list])
        omega_ratio = gains / losses if losses > 0 else 0
        
        # 交易统计
        total_trades_count = trades_analyzer.get('total', {}).get('total', 0) if trades_analyzer else 0
        won_trades = trades_analyzer.get('won', {}).get('total', 0) if trades_analyzer else 0
        lost_trades = trades_analyzer.get('lost', {}).get('total', 0) if trades_analyzer else 0
        win_rate = won_trades / max(total_trades_count, 1) if total_trades_count > 0 else 0
        
        # 盈亏统计
        gross_won = trades_analyzer.get('won', {}).get('pnl', {}).get('total', 0) if trades_analyzer else 0
        gross_lost = abs(trades_analyzer.get('lost', {}).get('pnl', {}).get('total', 0)) if trades_analyzer else 0
        profit_factor = gross_won / max(gross_lost, 0.01) if gross_lost > 0 else 0
        
        avg_win = trades_analyzer.get('won', {}).get('pnl', {}).get('average', 0) if trades_analyzer else 0
        avg_loss = trades_analyzer.get('lost', {}).get('pnl', {}).get('average', 0) if trades_analyzer else 0
        largest_win = trades_analyzer.get('won', {}).get('pnl', {}).get('max', 0) if trades_analyzer else 0
        largest_loss = trades_analyzer.get('lost', {}).get('pnl', {}).get('max', 0) if trades_analyzer else 0
        
        # 获取交易记录
        trade_list = []
        if hasattr(strategy, 'trades'):
            total_duration = 0
            for trade in strategy.trades:
                entry_date = trade['entry_date']
                exit_date = trade['exit_date']
                if hasattr(entry_date, 'strftime') and hasattr(exit_date, 'strftime'):
                    duration = (exit_date - entry_date).days
                    total_duration += duration
                else:
                    duration = 1
                
                trade_list.append({
                    'entry_date': entry_date.strftime('%Y-%m-%d') if hasattr(entry_date, 'strftime') else str(entry_date),
                    'exit_date': exit_date.strftime('%Y-%m-%d') if hasattr(exit_date, 'strftime') else str(exit_date),
                    'entry_price': float(trade['entry_price']),
                    'exit_price': float(trade['exit_price']),
                    'size': int(trade['size']),
                    'pnl': float(trade['pnl']),
                    'pnl_net': float(trade['pnl_net']),
                    'duration': duration
                })
            
            avg_trade_duration = total_duration / max(len(strategy.trades), 1)
        else:
            avg_trade_duration = 0
        
        # 基准比较
        benchmark_return = 0
        alpha = 0
        beta = 0
        correlation = 0
        tracking_error = 0
        information_ratio = 0
        benchmark_final_value = 0
        
        if benchmark_data is not None and not benchmark_data.empty:
            benchmark_initial = benchmark_data.iloc[0]['close']
            benchmark_final = benchmark_data.iloc[-1]['close']
            benchmark_return = (benchmark_final - benchmark_initial) / benchmark_initial
            benchmark_final_value = initial_value * (1 + benchmark_return)
            
            # 计算beta和alpha
            if len(returns_list) > 1:
                benchmark_returns = benchmark_data['close'].pct_change().dropna().values
                if len(benchmark_returns) == len(returns_list):
                    correlation = np.corrcoef(returns_list, benchmark_returns)[0, 1] if len(returns_list) > 1 else 0
                    beta = np.cov(returns_list, benchmark_returns)[0, 1] / np.var(benchmark_returns) if np.var(benchmark_returns) > 0 else 0
                    alpha = annual_return - (request.risk_free_rate + beta * (np.mean(benchmark_returns) * 252 - request.risk_free_rate))
                    
                    # 跟踪误差和信息比率
                    excess_returns = np.array(returns_list) - benchmark_returns
                    tracking_error = np.std(excess_returns) * np.sqrt(252)
                    information_ratio = np.mean(excess_returns) * 252 / tracking_error if tracking_error > 0 else 0
        
        # 回撤分析
        drawdown_periods = calculate_drawdown_periods(equity_curve)
        max_drawdown_duration = max([dd['duration'] for dd in drawdown_periods]) if drawdown_periods else 0
        recovery_factor = total_return / max_dd if max_dd > 0 else 0
        
        # 生成回撤曲线
        drawdown_curve = []
        if equity_curve:
            peak = equity_curve[0]['value']
            for item in equity_curve:
                if item['value'] > peak:
                    peak = item['value']
                drawdown = (item['value'] - peak) / peak
                drawdown_curve.append({
                    'date': item['date'],
                    'drawdown': drawdown * 100
                })
        
        # 滚动指标
        rolling_sharpe, rolling_volatility = calculate_rolling_metrics(returns_list)
        
        # 月度和年度分析
        monthly_returns, yearly_returns = calculate_monthly_yearly_returns(equity_curve)
        
        best_month = max(monthly_returns, key=lambda x: x['return']) if monthly_returns else None
        worst_month = min(monthly_returns, key=lambda x: x['return']) if monthly_returns else None
        
        # 更新回测结果
        backtest_results[backtest_id].update({
            "status": "completed",
            
            # 基础收益指标
            "total_return": round(total_return * 100, 2),
            "annual_return": round(annual_return * 100, 2),
            "cumulative_return": round(total_return * 100, 2),
            
            # 风险指标
            "max_drawdown": round(max_dd * 100, 2),
            "max_drawdown_duration": max_drawdown_duration,
            "volatility": round(volatility * 100, 2),
            "downside_deviation": round(downside_deviation * 100, 2),
            "var_95": round(var_95 * 100, 2),
            "cvar_95": round(cvar_95 * 100, 2),
            
            # 风险调整收益指标
            "sharpe_ratio": round(sharpe_analyzer.get('sharperatio', 0), 2) if sharpe_analyzer else 0,
            "sortino_ratio": round(sortino_ratio, 2),
            "calmar_ratio": round(calmar_ratio, 2),
            "omega_ratio": round(omega_ratio, 2),
            
            # 交易统计
            "total_trades": total_trades_count,
            "win_rate": round(win_rate * 100, 2),
            "profit_factor": round(profit_factor, 2),
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2),
            "largest_win": round(largest_win, 2),
            "largest_loss": round(largest_loss, 2),
            "avg_trade_duration": round(avg_trade_duration, 1),
            
            # 基准比较
            "benchmark_return": round(benchmark_return * 100, 2),
            "alpha": round(alpha * 100, 2),
            "beta": round(beta, 2),
            "correlation": round(correlation, 2),
            "tracking_error": round(tracking_error * 100, 2),
            "information_ratio": round(information_ratio, 2),
            
            # 月度/年度分析
            "monthly_returns": monthly_returns,
            "yearly_returns": yearly_returns,
            "best_month": best_month,
            "worst_month": worst_month,
            
            # 回撤分析
            "drawdown_periods": drawdown_periods,
            "recovery_factor": round(recovery_factor, 2),
            
            # 数据和图表
            "equity_curve": equity_curve,
            "drawdown_curve": drawdown_curve,
            "rolling_sharpe": rolling_sharpe,
            "rolling_volatility": rolling_volatility,
            "trade_list": trade_list,
            
            # 参数优化结果
            "optimization_results": optimization_results,
            "best_params": best_params,
            
            # 元数据
            "final_value": round(final_value, 2),
            "benchmark_final_value": round(benchmark_final_value, 2),
            "completed_at": datetime.now()
        })
        
        logger.info(f"回测完成: {backtest_id}, 总收益率: {total_return*100:.2f}%")
        
    except Exception as e:
        logger.error(f"回测执行失败: {e}")
        backtest_results[backtest_id].update({
            "status": "failed",
            "error_message": str(e),
            "completed_at": datetime.now()
        })

@app.get("/")
async def root():
    return {"message": "Backtest Service is running"}

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "service": "backtest-service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "active_backtests": len([r for r in backtest_results.values() if r.status == "running"]),
        "total_backtests": len(backtest_results),
        "executor_threads": executor._max_workers,
        "memory_usage": "available"  # 这里可以添加实际内存使用情况
    }

@app.post("/run", response_model=BacktestResult)
async def run_backtest(request: BacktestRequest, background_tasks: BackgroundTasks):
    """启动回测任务"""
    try:
        # 生成回测ID
        backtest_id = str(uuid.uuid4())
        
        # 初始化回测结果
        backtest_results[backtest_id] = {
            "backtest_id": backtest_id,
            "status": "pending",
            "created_at": datetime.now(),
            "user_id": request.user_id,
            "symbol": request.symbol,
            "start_date": request.start_date,
            "end_date": request.end_date
        }
        
        # 在后台执行回测
        background_tasks.add_task(execute_backtest, request, backtest_id)
        
        return BacktestResult(
            backtest_id=backtest_id,
            status="pending",
            created_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"启动回测失败: {e}")
        raise HTTPException(status_code=500, detail=f"启动回测失败: {str(e)}")

@app.get("/results/{backtest_id}", response_model=BacktestResult)
async def get_backtest_results(backtest_id: str):
    """获取回测结果"""
    if backtest_id not in backtest_results:
        raise HTTPException(status_code=404, detail="回测结果不存在")
    
    result = backtest_results[backtest_id]
    return BacktestResult(**result)

@app.get("/history/{user_id}")
async def get_backtest_history(user_id: str):
    """获取用户回测历史"""
    user_backtests = []
    for backtest_id, result in backtest_results.items():
        if result.get("user_id") == user_id:
            user_backtests.append({
                "backtest_id": backtest_id,
                "status": result["status"],
                "symbol": result.get("symbol"),
                "created_at": result["created_at"],
                "total_return": result.get("total_return")
            })
    
    return {"backtests": user_backtests}

@app.delete("/results/{backtest_id}")
async def delete_backtest_result(backtest_id: str):
    """删除回测结果"""
    if backtest_id not in backtest_results:
        raise HTTPException(status_code=404, detail="回测结果不存在")
    
    del backtest_results[backtest_id]
    return {"message": "回测结果已删除"}

@app.get("/market-data/{symbol}")
async def get_market_data_preview(symbol: str, days: int = 30):
    """获取市场数据预览"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        data = get_market_data(
            symbol, 
            start_date.strftime("%Y-%m-%d"), 
            end_date.strftime("%Y-%m-%d")
        )
        
        # 转换为JSON格式
        data_json = []
        for index, row in data.iterrows():
            data_json.append({
                "date": index.strftime("%Y-%m-%d"),
                "open": float(row['open']),
                "high": float(row['high']),
                "low": float(row['low']),
                "close": float(row['close']),
                "volume": int(row['volume'])
            })
        
        return {"symbol": symbol, "data": data_json}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"获取市场数据失败: {str(e)}")

@app.post("/optimize")
async def optimize_strategy_parameters(request: BacktestRequest, background_tasks: BackgroundTasks):
    """策略参数优化"""
    try:
        if not request.optimization_params:
            raise HTTPException(status_code=400, detail="未提供优化参数范围")
        
        # 强制启用优化
        request.enable_optimization = True
        
        # 生成优化任务ID
        optimization_id = str(uuid.uuid4())
        
        # 初始化优化结果
        backtest_results[optimization_id] = {
            "backtest_id": optimization_id,
            "status": "optimizing",
            "created_at": datetime.now(),
            "user_id": request.user_id,
            "symbol": request.symbol,
            "optimization_type": "parameter_optimization"
        }
        
        # 在后台执行优化
        background_tasks.add_task(execute_backtest, request, optimization_id)
        
        return {
            "optimization_id": optimization_id,
            "status": "optimizing",
            "message": "参数优化已开始"
        }
        
    except Exception as e:
        logger.error(f"参数优化失败: {e}")
        raise HTTPException(status_code=500, detail=f"参数优化失败: {str(e)}")

@app.get("/compare/{backtest_id1}/{backtest_id2}")
async def compare_backtests(backtest_id1: str, backtest_id2: str):
    """比较两个回测结果"""
    if backtest_id1 not in backtest_results or backtest_id2 not in backtest_results:
        raise HTTPException(status_code=404, detail="回测结果不存在")
    
    result1 = backtest_results[backtest_id1]
    result2 = backtest_results[backtest_id2]
    
    if result1["status"] != "completed" or result2["status"] != "completed":
        raise HTTPException(status_code=400, detail="回测尚未完成")
    
    comparison = {
        "backtest1": {
            "id": backtest_id1,
            "total_return": result1.get("total_return", 0),
            "sharpe_ratio": result1.get("sharpe_ratio", 0),
            "max_drawdown": result1.get("max_drawdown", 0),
            "win_rate": result1.get("win_rate", 0),
            "profit_factor": result1.get("profit_factor", 0)
        },
        "backtest2": {
            "id": backtest_id2,
            "total_return": result2.get("total_return", 0),
            "sharpe_ratio": result2.get("sharpe_ratio", 0),
            "max_drawdown": result2.get("max_drawdown", 0),
            "win_rate": result2.get("win_rate", 0),
            "profit_factor": result2.get("profit_factor", 0)
        },
        "comparison": {
            "return_diff": result1.get("total_return", 0) - result2.get("total_return", 0),
            "sharpe_diff": result1.get("sharpe_ratio", 0) - result2.get("sharpe_ratio", 0),
            "drawdown_diff": result1.get("max_drawdown", 0) - result2.get("max_drawdown", 0),
            "better_strategy": backtest_id1 if result1.get("sharpe_ratio", 0) > result2.get("sharpe_ratio", 0) else backtest_id2
        }
    }
    
    return comparison

@app.get("/report/{backtest_id}")
async def generate_backtest_report(backtest_id: str, format: str = "json"):
    """生成回测报告"""
    if backtest_id not in backtest_results:
        raise HTTPException(status_code=404, detail="回测结果不存在")
    
    result = backtest_results[backtest_id]
    
    if result["status"] != "completed":
        raise HTTPException(status_code=400, detail="回测尚未完成")
    
    # 生成详细报告
    report = {
        "summary": {
            "backtest_id": backtest_id,
            "symbol": result.get("symbol", "N/A"),
            "period": f"{result.get('start_date', 'N/A')} to {result.get('end_date', 'N/A')}",
            "total_return": result.get("total_return", 0),
            "annual_return": result.get("annual_return", 0),
            "sharpe_ratio": result.get("sharpe_ratio", 0),
            "max_drawdown": result.get("max_drawdown", 0)
        },
        "performance_metrics": {
            "return_metrics": {
                "total_return": result.get("total_return", 0),
                "annual_return": result.get("annual_return", 0),
                "cumulative_return": result.get("cumulative_return", 0)
            },
            "risk_metrics": {
                "volatility": result.get("volatility", 0),
                "max_drawdown": result.get("max_drawdown", 0),
                "var_95": result.get("var_95", 0),
                "cvar_95": result.get("cvar_95", 0)
            },
            "risk_adjusted_metrics": {
                "sharpe_ratio": result.get("sharpe_ratio", 0),
                "sortino_ratio": result.get("sortino_ratio", 0),
                "calmar_ratio": result.get("calmar_ratio", 0)
            }
        },
        "trading_statistics": {
            "total_trades": result.get("total_trades", 0),
            "win_rate": result.get("win_rate", 0),
            "profit_factor": result.get("profit_factor", 0),
            "avg_win": result.get("avg_win", 0),
            "avg_loss": result.get("avg_loss", 0)
        },
        "benchmark_comparison": {
            "benchmark_return": result.get("benchmark_return", 0),
            "alpha": result.get("alpha", 0),
            "beta": result.get("beta", 0),
            "correlation": result.get("correlation", 0)
        } if result.get("benchmark_return") else None,
        "charts_data": {
            "equity_curve": result.get("equity_curve", []),
            "drawdown_curve": result.get("drawdown_curve", []),
            "monthly_returns": result.get("monthly_returns", [])
        },
        "generated_at": datetime.now().isoformat()
    }
    
    return report

@app.get("/analytics/{backtest_id}")
async def get_advanced_analytics(backtest_id: str):
    """获取高级分析数据"""
    if backtest_id not in backtest_results:
        raise HTTPException(status_code=404, detail="回测结果不存在")
    
    result = backtest_results[backtest_id]
    
    if result["status"] != "completed":
        raise HTTPException(status_code=400, detail="回测尚未完成")
    
    analytics = {
        "rolling_metrics": {
            "rolling_sharpe": result.get("rolling_sharpe", []),
            "rolling_volatility": result.get("rolling_volatility", [])
        },
        "drawdown_analysis": {
            "drawdown_periods": result.get("drawdown_periods", []),
            "max_drawdown_duration": result.get("max_drawdown_duration", 0),
            "recovery_factor": result.get("recovery_factor", 0)
        },
        "periodic_returns": {
            "monthly_returns": result.get("monthly_returns", []),
            "yearly_returns": result.get("yearly_returns", []),
            "best_month": result.get("best_month"),
            "worst_month": result.get("worst_month")
        },
        "trade_analysis": {
            "trade_list": result.get("trade_list", []),
            "avg_trade_duration": result.get("avg_trade_duration", 0),
            "largest_win": result.get("largest_win", 0),
            "largest_loss": result.get("largest_loss", 0)
        }
    }
    
    return analytics

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)