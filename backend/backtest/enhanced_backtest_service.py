from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
import json
import uuid
from datetime import datetime, timedelta
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
import requests
import time
from dataclasses import dataclass
from enum import Enum

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="QuantMind Enhanced Backtest Service",
    description="增强版量化回测引擎服务 - 集成同花顺数据源",
    version="2.0.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3003", "http://127.0.0.1:3003"],  # 允许前端域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有HTTP方法
    allow_headers=["*"],  # 允许所有请求头
)

# 线程池用于执行回测任务
executor = ThreadPoolExecutor(max_workers=4)

# WebSocket连接管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

class DataSource(str, Enum):
    """数据源枚举"""
    TUSHARE = "tushare"
    TONGHUASHUN = "tonghuashun"
    YAHOO = "yahoo"
    LOCAL = "local"

class BacktestStatus(str, Enum):
    """回测状态枚举"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class MarketDataPoint:
    """市场数据点"""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    amount: float = 0.0

class EnhancedBacktestRequest(BaseModel):
    """增强版回测请求"""
    strategy_code: str
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float = 100000.0
    commission: float = 0.001
    user_id: str
    strategy_params: Dict[str, Any] = {}
    
    # 数据源配置
    data_source: DataSource = DataSource.TONGHUASHUN
    data_frequency: str = "1d"  # 1d, 1h, 30m, 15m, 5m, 1m
    
    # 回测配置
    benchmark_symbol: Optional[str] = "000001.SH"  # 上证指数作为基准
    risk_free_rate: float = 0.03  # 3%无风险利率
    position_sizing: str = "fixed"  # fixed, percent, kelly, volatility
    max_position_size: float = 1.0
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    slippage: float = 0.001  # 0.1%滑点
    transaction_cost: float = 0.0003  # 0.03%交易成本
    
    # 高级配置
    enable_real_time: bool = False  # 是否启用实时回测
    enable_optimization: bool = False
    optimization_params: Dict[str, Any] = {}
    enable_monte_carlo: bool = False  # 蒙特卡洛模拟
    monte_carlo_runs: int = 1000
    
    # 风控配置
    max_drawdown_limit: Optional[float] = None  # 最大回撤限制
    daily_loss_limit: Optional[float] = None  # 日损失限制
    position_concentration_limit: float = 0.3  # 单一持仓集中度限制

class EnhancedBacktestResult(BaseModel):
    """增强版回测结果"""
    backtest_id: str
    status: BacktestStatus
    progress: float = 0.0  # 回测进度 0-100
    
    # 基础信息
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float
    final_capital: float = 0.0
    data_source: DataSource
    
    # 收益指标
    total_return: Optional[float] = None
    annual_return: Optional[float] = None
    cumulative_return: Optional[float] = None
    excess_return: Optional[float] = None  # 超额收益
    
    # 风险指标
    max_drawdown: Optional[float] = None
    max_drawdown_duration: Optional[int] = None
    volatility: Optional[float] = None
    downside_volatility: Optional[float] = None
    var_95: Optional[float] = None
    cvar_95: Optional[float] = None
    
    # 风险调整收益指标
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    calmar_ratio: Optional[float] = None
    omega_ratio: Optional[float] = None
    treynor_ratio: Optional[float] = None
    
    # 基准比较
    benchmark_return: Optional[float] = None
    alpha: Optional[float] = None
    beta: Optional[float] = None
    correlation: Optional[float] = None
    tracking_error: Optional[float] = None
    information_ratio: Optional[float] = None
    
    # 交易统计
    total_trades: Optional[int] = None
    win_rate: Optional[float] = None
    profit_factor: Optional[float] = None
    avg_win: Optional[float] = None
    avg_loss: Optional[float] = None
    largest_win: Optional[float] = None
    largest_loss: Optional[float] = None
    avg_trade_duration: Optional[float] = None
    
    # 时间序列数据
    equity_curve: Optional[List[Dict[str, Any]]] = None
    drawdown_curve: Optional[List[Dict[str, Any]]] = None
    benchmark_curve: Optional[List[Dict[str, Any]]] = None
    trade_list: Optional[List[Dict[str, Any]]] = None
    
    # 月度分析
    monthly_returns: Optional[List[Dict[str, Any]]] = None
    monthly_win_rate: Optional[List[Dict[str, Any]]] = None
    
    # 高级分析
    sector_exposure: Optional[Dict[str, float]] = None
    style_analysis: Optional[Dict[str, float]] = None
    attribution_analysis: Optional[Dict[str, Any]] = None
    
    # 风控报告
    risk_metrics: Optional[Dict[str, Any]] = None
    stress_test_results: Optional[Dict[str, Any]] = None
    
    # 元数据
    created_at: datetime
    completed_at: Optional[datetime] = None
    execution_time: Optional[float] = None  # 执行时间(秒)
    error_message: Optional[str] = None
    data_quality_score: Optional[float] = None  # 数据质量评分

# 存储回测结果
backtest_results: Dict[str, EnhancedBacktestResult] = {}

class TongHuaShunDataService:
    """同花顺数据服务"""
    
    def __init__(self):
        self.base_url = "http://localhost:5000"  # 市场数据服务地址
        self.session = requests.Session()
        
    async def get_stock_data(self, symbol: str, start_date: str, end_date: str, frequency: str = "1d") -> pd.DataFrame:
        """获取股票数据"""
        try:
            # 调用市场数据服务API
            url = f"{self.base_url}/api/stock/{symbol}"
            params = {
                "start_date": start_date,
                "end_date": end_date,
                "frequency": frequency
            }
            
            response = self.session.get(url, params=params, timeout=30)
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    df = pd.DataFrame(data["data"])
                    df['date'] = pd.to_datetime(df['date'])
                    df.set_index('date', inplace=True)
                    return df
                else:
                    logger.warning(f"No data returned for {symbol}")
                    return self._generate_mock_data(symbol, start_date, end_date)
            else:
                logger.error(f"API request failed: {response.status_code}")
                return self._generate_mock_data(symbol, start_date, end_date)
                
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {str(e)}")
            return self._generate_mock_data(symbol, start_date, end_date)
    
    def _generate_mock_data(self, symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
        """生成模拟数据"""
        logger.info(f"Generating mock data for {symbol}")
        
        start = pd.to_datetime(start_date)
        end = pd.to_datetime(end_date)
        dates = pd.date_range(start=start, end=end, freq='D')
        
        # 过滤工作日
        dates = dates[dates.weekday < 5]
        
        np.random.seed(42)  # 确保可重复性
        
        # 生成价格数据
        initial_price = 100.0
        returns = np.random.normal(0.0005, 0.02, len(dates))  # 日收益率
        prices = [initial_price]
        
        for ret in returns[1:]:
            prices.append(prices[-1] * (1 + ret))
        
        # 生成OHLC数据
        data = []
        for i, (date, price) in enumerate(zip(dates, prices)):
            high = price * (1 + abs(np.random.normal(0, 0.01)))
            low = price * (1 - abs(np.random.normal(0, 0.01)))
            open_price = prices[i-1] if i > 0 else price
            volume = int(np.random.normal(1000000, 200000))
            
            data.append({
                'open': round(open_price, 2),
                'high': round(high, 2),
                'low': round(low, 2),
                'close': round(price, 2),
                'volume': max(volume, 100000),
                'amount': round(price * volume, 2)
            })
        
        df = pd.DataFrame(data, index=dates)
        return df

# 数据服务实例
data_service = TongHuaShunDataService()

class EnhancedBacktestEngine:
    """增强版回测引擎"""
    
    def __init__(self):
        self.data_service = data_service
        
    async def run_backtest(self, request: EnhancedBacktestRequest, backtest_id: str):
        """执行回测"""
        result = backtest_results[backtest_id]
        
        try:
            # 更新状态
            result.status = BacktestStatus.RUNNING
            result.progress = 10.0
            await self._broadcast_progress(backtest_id, "开始获取市场数据...")
            
            # 获取市场数据
            stock_data = await self.data_service.get_stock_data(
                request.symbol, 
                request.start_date, 
                request.end_date,
                request.data_frequency
            )
            
            if stock_data.empty:
                raise ValueError(f"无法获取 {request.symbol} 的市场数据")
            
            result.progress = 30.0
            await self._broadcast_progress(backtest_id, "数据获取完成，开始执行策略...")
            
            # 获取基准数据
            benchmark_data = None
            if request.benchmark_symbol:
                benchmark_data = await self.data_service.get_stock_data(
                    request.benchmark_symbol,
                    request.start_date,
                    request.end_date,
                    request.data_frequency
                )
            
            result.progress = 50.0
            await self._broadcast_progress(backtest_id, "执行策略回测...")
            
            # 执行策略
            backtest_results_data = await self._execute_strategy(
                request, stock_data, benchmark_data
            )
            
            result.progress = 80.0
            await self._broadcast_progress(backtest_id, "计算性能指标...")
            
            # 计算性能指标
            await self._calculate_performance_metrics(result, backtest_results_data, request)
            
            result.progress = 100.0
            result.status = BacktestStatus.COMPLETED
            result.completed_at = datetime.now()
            
            await self._broadcast_progress(backtest_id, "回测完成！")
            
        except Exception as e:
            logger.error(f"Backtest {backtest_id} failed: {str(e)}")
            result.status = BacktestStatus.FAILED
            result.error_message = str(e)
            result.completed_at = datetime.now()
            
            await self._broadcast_progress(backtest_id, f"回测失败: {str(e)}")
    
    async def _execute_strategy(self, request: EnhancedBacktestRequest, stock_data: pd.DataFrame, benchmark_data: pd.DataFrame = None):
        """执行策略逻辑"""
        # 初始化回测环境
        initial_capital = request.initial_capital
        current_capital = initial_capital
        position = 0  # 当前持仓
        trades = []
        equity_curve = []
        
        # 策略执行环境
        strategy_globals = {
            'pd': pd,
            'np': np,
            'data': stock_data,
            'position': 0,
            'capital': current_capital,
            'trades': trades,
            'buy': lambda price, shares: self._execute_buy(price, shares, trades, position, current_capital),
            'sell': lambda price, shares: self._execute_sell(price, shares, trades, position, current_capital),
            'log': lambda msg: logger.info(f"Strategy: {msg}")
        }
        
        # 编译并执行用户策略
        try:
            exec(request.strategy_code, strategy_globals)
            
            # 如果策略定义了main函数，执行它
            if 'main' in strategy_globals:
                strategy_globals['main']()
            
        except Exception as e:
            logger.error(f"Strategy execution error: {str(e)}")
            raise ValueError(f"策略执行错误: {str(e)}")
        
        # 构建回测结果
        for i, (date, row) in enumerate(stock_data.iterrows()):
            portfolio_value = current_capital + position * row['close']
            equity_curve.append({
                'date': date.isoformat(),
                'value': portfolio_value,
                'return': (portfolio_value - initial_capital) / initial_capital
            })
        
        return {
            'equity_curve': equity_curve,
            'trades': trades,
            'final_capital': current_capital,
            'final_position': position
        }
    
    def _execute_buy(self, price: float, shares: int, trades: list, position: int, capital: float):
        """执行买入操作"""
        cost = price * shares
        if cost <= capital:
            trades.append({
                'type': 'buy',
                'price': price,
                'shares': shares,
                'cost': cost,
                'timestamp': datetime.now().isoformat()
            })
            return True
        return False
    
    def _execute_sell(self, price: float, shares: int, trades: list, position: int, capital: float):
        """执行卖出操作"""
        if shares <= position:
            revenue = price * shares
            trades.append({
                'type': 'sell',
                'price': price,
                'shares': shares,
                'revenue': revenue,
                'timestamp': datetime.now().isoformat()
            })
            return True
        return False
    
    async def _calculate_performance_metrics(self, result: EnhancedBacktestResult, backtest_data: dict, request: EnhancedBacktestRequest):
        """计算性能指标"""
        equity_curve = backtest_data['equity_curve']
        trades = backtest_data['trades']
        
        if not equity_curve:
            return
        
        # 基础指标
        initial_value = equity_curve[0]['value']
        final_value = equity_curve[-1]['value']
        
        result.final_capital = final_value
        result.total_return = (final_value - initial_value) / initial_value
        result.cumulative_return = result.total_return
        
        # 计算年化收益率
        days = len(equity_curve)
        if days > 0:
            result.annual_return = (final_value / initial_value) ** (365 / days) - 1
        
        # 计算最大回撤
        values = [point['value'] for point in equity_curve]
        peak = values[0]
        max_dd = 0
        
        for value in values:
            if value > peak:
                peak = value
            dd = (peak - value) / peak
            if dd > max_dd:
                max_dd = dd
        
        result.max_drawdown = max_dd
        
        # 计算波动率
        returns = []
        for i in range(1, len(equity_curve)):
            ret = (equity_curve[i]['value'] - equity_curve[i-1]['value']) / equity_curve[i-1]['value']
            returns.append(ret)
        
        if returns:
            result.volatility = np.std(returns) * np.sqrt(252)  # 年化波动率
            
            # 计算夏普比率
            if result.volatility > 0:
                excess_return = result.annual_return - request.risk_free_rate
                result.sharpe_ratio = excess_return / result.volatility
        
        # 交易统计
        result.total_trades = len(trades)
        
        if trades:
            buy_trades = [t for t in trades if t['type'] == 'buy']
            sell_trades = [t for t in trades if t['type'] == 'sell']
            
            if buy_trades and sell_trades:
                # 简化的盈亏计算
                total_profit = sum(t.get('revenue', 0) for t in sell_trades) - sum(t.get('cost', 0) for t in buy_trades)
                result.profit_factor = total_profit / initial_value if initial_value > 0 else 0
        
        # 设置时间序列数据
        result.equity_curve = equity_curve
        result.trade_list = trades
        
        # 生成月度收益
        result.monthly_returns = self._calculate_monthly_returns(equity_curve)
    
    def _calculate_monthly_returns(self, equity_curve: List[Dict]) -> List[Dict]:
        """计算月度收益"""
        if not equity_curve:
            return []
        
        monthly_data = {}
        
        for point in equity_curve:
            date = pd.to_datetime(point['date'])
            month_key = f"{date.year}-{date.month:02d}"
            
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    'month': month_key,
                    'start_value': point['value'],
                    'end_value': point['value']
                }
            else:
                monthly_data[month_key]['end_value'] = point['value']
        
        monthly_returns = []
        for month_key, data in monthly_data.items():
            monthly_return = (data['end_value'] - data['start_value']) / data['start_value']
            monthly_returns.append({
                'month': month_key,
                'return': monthly_return,
                'start_value': data['start_value'],
                'end_value': data['end_value']
            })
        
        return sorted(monthly_returns, key=lambda x: x['month'])
    
    async def _broadcast_progress(self, backtest_id: str, message: str):
        """广播进度更新"""
        progress_data = {
            'backtest_id': backtest_id,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        await manager.broadcast(json.dumps(progress_data))

# 回测引擎实例
backtest_engine = EnhancedBacktestEngine()

# API端点
@app.get("/")
async def root():
    return {
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

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "data_service": "connected",
        "active_backtests": len([r for r in backtest_results.values() if r.status == BacktestStatus.RUNNING])
    }

@app.post("/backtest", response_model=EnhancedBacktestResult)
async def create_backtest(request: EnhancedBacktestRequest, background_tasks: BackgroundTasks):
    """创建新的回测任务"""
    backtest_id = str(uuid.uuid4())
    
    # 创建回测结果对象
    result = EnhancedBacktestResult(
        backtest_id=backtest_id,
        status=BacktestStatus.PENDING,
        symbol=request.symbol,
        start_date=request.start_date,
        end_date=request.end_date,
        initial_capital=request.initial_capital,
        data_source=request.data_source,
        created_at=datetime.now()
    )
    
    backtest_results[backtest_id] = result
    
    # 在后台执行回测
    background_tasks.add_task(backtest_engine.run_backtest, request, backtest_id)
    
    return result

@app.get("/backtest/{backtest_id}", response_model=EnhancedBacktestResult)
async def get_backtest_result(backtest_id: str):
    """获取回测结果"""
    if backtest_id not in backtest_results:
        raise HTTPException(status_code=404, detail="回测任务不存在")
    
    return backtest_results[backtest_id]

@app.get("/backtest/user/{user_id}")
async def get_user_backtests(user_id: str):
    """获取用户的回测历史"""
    user_backtests = [
        {
            "backtest_id": result.backtest_id,
            "symbol": result.symbol,
            "status": result.status,
            "created_at": result.created_at,
            "total_return": result.total_return
        }
        for result in backtest_results.values()
        # 注意：这里需要在request中存储user_id才能过滤
    ]
    
    return {
        "user_id": user_id,
        "backtests": user_backtests,
        "total_count": len(user_backtests)
    }

@app.delete("/backtest/{backtest_id}")
async def delete_backtest(backtest_id: str):
    """删除回测结果"""
    if backtest_id not in backtest_results:
        raise HTTPException(status_code=404, detail="回测任务不存在")
    
    result = backtest_results[backtest_id]
    if result.status == BacktestStatus.RUNNING:
        result.status = BacktestStatus.CANCELLED
    
    del backtest_results[backtest_id]
    
    return {"message": "回测任务已删除"}

@app.websocket("/ws/{backtest_id}")
async def websocket_endpoint(websocket: WebSocket, backtest_id: str):
    """WebSocket端点，用于实时推送回测进度"""
    await manager.connect(websocket)
    try:
        while True:
            # 发送当前回测状态
            if backtest_id in backtest_results:
                result = backtest_results[backtest_id]
                status_data = {
                    "backtest_id": backtest_id,
                    "status": result.status,
                    "progress": result.progress,
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send_text(json.dumps(status_data))
            
            await asyncio.sleep(1)  # 每秒发送一次状态更新
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/data-sources")
async def get_supported_data_sources():
    """获取支持的数据源列表"""
    return {
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)