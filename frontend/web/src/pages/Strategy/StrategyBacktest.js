import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Tabs,
  Divider,
  Alert,
  Spin,
  Progress,
  message,
  Modal,
  Tooltip,
  Table
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FileTextOutlined,
  DownloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Line, Column } from '@ant-design/plots';
import moment from 'moment';
import './StrategyBacktest.css';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const StrategyBacktest = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [backtestRunning, setBacktestRunning] = useState(false);
  const [backtestProgress, setBacktestProgress] = useState(0);
  const [backtestResults, setBacktestResults] = useState(null);
  const [activeTab, setActiveTab] = useState('config');
  const [configModalVisible, setConfigModalVisible] = useState(false);

  // 默认策略代码
  const defaultStrategyCode = `# 双均线策略示例
import backtrader as bt
import pandas as pd

class DualMovingAverageStrategy(bt.Strategy):
    params = (
        ('fast_period', 10),
        ('slow_period', 30),
        ('stop_loss', 0.05),
        ('take_profit', 0.15)
    )
    
    def __init__(self):
        self.fast_ma = bt.indicators.SMA(self.data.close, period=self.params.fast_period)
        self.slow_ma = bt.indicators.SMA(self.data.close, period=self.params.slow_period)
        self.crossover = bt.indicators.CrossOver(self.fast_ma, self.slow_ma)
        
    def next(self):
        if not self.position:
            if self.crossover > 0:
                self.buy(size=100)
        else:
            if self.crossover < 0:
                self.sell(size=self.position.size)
            elif self.data.close[0] <= self.position.price * (1 - self.params.stop_loss):
                self.sell(size=self.position.size)  # 止损
            elif self.data.close[0] >= self.position.price * (1 + self.params.take_profit):
                self.sell(size=self.position.size)  # 止盈`;

  const [strategyCode, setStrategyCode] = useState(defaultStrategyCode);

  // 回测配置状态
  const [backtestConfig, setBacktestConfig] = useState({
    symbol: '000001.SZ',
    startDate: moment().subtract(1, 'year'),
    endDate: moment(),
    initialCapital: 100000,
    commission: 0.001,
    slippage: 0.0,
    benchmarkSymbol: '000300.SH',
    riskFreeRate: 0.03,
    positionSizing: 'fixed',
    maxPositionSize: 1.0,
    stopLoss: null,
    takeProfit: null
  });

  // 模拟回测结果数据
  const mockBacktestResults = {
    backtestId: 'bt_' + Date.now(),
    status: 'completed',
    totalReturn: 15.67,
    annualReturn: 18.23,
    sharpeRatio: 1.45,
    maxDrawdown: -8.32,
    winRate: 68.5,
    profitFactor: 2.34,
    totalTrades: 156,
    finalValue: 115670,
    benchmarkReturn: 12.34,
    alpha: 3.33,
    beta: 0.85,
    equityCurve: [
      { date: '2024-01-01', portfolio: 100000, benchmark: 100000 },
      { date: '2024-02-01', portfolio: 102300, benchmark: 101200 },
      { date: '2024-03-01', portfolio: 105600, benchmark: 102800 },
      { date: '2024-04-01', portfolio: 108900, benchmark: 104100 },
      { date: '2024-05-01', portfolio: 112400, benchmark: 105500 },
      { date: '2024-06-01', portfolio: 115670, benchmark: 106800 }
    ],
    monthlyReturns: [
      { month: '2024-01', return: 2.3, benchmark: 1.2 },
      { month: '2024-02', return: 3.2, benchmark: 1.6 },
      { month: '2024-03', return: 3.1, benchmark: 1.3 },
      { month: '2024-04', return: -1.2, benchmark: 0.8 },
      { month: '2024-05', return: 4.5, benchmark: 2.1 },
      { month: '2024-06', return: 2.8, benchmark: 1.5 }
    ],
    trades: [
      {
        id: 1,
        symbol: '000001.SZ',
        type: 'Long',
        entryDate: '2024-03-01',
        exitDate: '2024-03-05',
        entryPrice: 15.25,
        exitPrice: 15.80,
        quantity: 1000,
        pnl: 550,
        pnlPercent: 3.61,
        status: 'Closed'
      },
      {
        id: 2,
        symbol: '000001.SZ',
        type: 'Long',
        entryDate: '2024-03-10',
        exitDate: '2024-03-15',
        entryPrice: 16.20,
        exitPrice: 15.95,
        quantity: 1000,
        pnl: -250,
        pnlPercent: -1.54,
        status: 'Closed'
      }
    ]
  };

  // API配置
  const API_BASE_URL = 'http://localhost:8003'; // 增强版回测服务地址

  // 启动回测
  const handleStartBacktest = async () => {
    if (!strategyCode.trim()) {
      message.error('请输入策略代码');
      return;
    }

    try {
      setBacktestRunning(true);
      setBacktestProgress(0);
      setBacktestResults(null);
      setActiveTab('results');
      
      const response = await fetch(`${API_BASE_URL}/backtest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy_code: strategyCode,
          symbol: backtestConfig.symbol,
          start_date: backtestConfig.startDate.format('YYYY-MM-DD'),
          end_date: backtestConfig.endDate.format('YYYY-MM-DD'),
          initial_capital: backtestConfig.initialCapital,
          commission: backtestConfig.commission,
          user_id: 'demo_user',
          data_source: 'tonghuashun',
          data_frequency: '1d',
          benchmark_symbol: backtestConfig.benchmarkSymbol,
          risk_free_rate: backtestConfig.riskFreeRate,
          slippage: backtestConfig.slippage,
          transaction_cost: 0.0003
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const backtestId = result.backtest_id;
      
      // 使用WebSocket监听回测进度
      const ws = new WebSocket(`ws://localhost:8003/ws/${backtestId}`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.progress !== undefined) {
          setBacktestProgress(data.progress);
        }
        if (data.status === 'completed') {
          // 获取最终结果
          fetchBacktestResult(backtestId);
          ws.close();
        } else if (data.status === 'failed') {
          message.error(data.message || '回测失败');
          setBacktestRunning(false);
          ws.close();
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // 降级到轮询模式
        pollBacktestResult(backtestId);
      };
      
    } catch (error) {
      console.error('回测启动失败:', error);
      message.error('回测启动失败: ' + error.message);
      setBacktestRunning(false);
    }
  };
  
  // 获取回测结果
  const fetchBacktestResult = async (backtestId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/backtest/${backtestId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'completed') {
          setBacktestResults(result);
          setBacktestRunning(false);
          setBacktestProgress(100);
          message.success('回测完成！');
        }
      }
    } catch (err) {
      console.error('获取回测结果失败:', err);
    }
  };
  
  // 轮询回测结果（WebSocket失败时的降级方案）
  const pollBacktestResult = async (backtestId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/backtest/${backtestId}`);
        if (response.ok) {
          const result = await response.json();
          setBacktestProgress(result.progress || 0);
          
          if (result.status === 'completed') {
            setBacktestResults(result);
            setBacktestRunning(false);
            setBacktestProgress(100);
            message.success('回测完成！');
            clearInterval(pollInterval);
          } else if (result.status === 'failed') {
            message.error(result.error_message || '回测失败');
            setBacktestRunning(false);
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('轮询回测结果失败:', err);
      }
    }, 2000); // 每2秒轮询一次
    
    // 设置超时
    setTimeout(() => {
      clearInterval(pollInterval);
      if (backtestRunning) {
        message.error('回测超时');
        setBacktestRunning(false);
      }
    }, 300000); // 5分钟超时
  };

  // 停止回测
  const handleStopBacktest = () => {
    setBacktestRunning(false);
    setBacktestProgress(0);
    message.info('回测已停止');
  };

  // 重置回测
  const handleResetBacktest = () => {
    setBacktestResults(null);
    setBacktestProgress(0);
    setActiveTab('config');
  };

  // 资金曲线图表配置
  const equityChartConfig = {
    data: backtestResults?.equity_curve ? [
      ...backtestResults.equity_curve.map(point => ({
        date: point.date,
        value: point.value,
        type: '策略收益'
      })),
      ...(backtestResults.benchmark_curve || []).map(point => ({
        date: point.date,
        value: point.value,
        type: '基准收益'
      }))
    ] : [],
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    color: ['#1890ff', '#52c41a'],
    legend: {
      position: 'top',
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: datum.type,
          value: `¥${datum.value?.toLocaleString()}`
        };
      },
    },
  };

  // 月度收益图表配置
  const monthlyReturnsConfig = {
    data: backtestResults?.monthly_returns ? backtestResults.monthly_returns.map(item => ({
      month: item.month,
      return: (item.return || 0) * 100
    })) : [],
    xField: 'month',
    yField: 'return',
    columnStyle: {
      fill: ({ return: ret }) => ret > 0 ? '#52c41a' : '#ff4d4f'
    },
    meta: {
      return: {
        alias: '月度收益率(%)',
      },
    },
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
      formatter: (v) => `${v.return.toFixed(2)}%`
    },
  };

  return (
    <div className="strategy-backtest">
      <Card title="策略回测" className="backtest-header">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <div className="backtest-info">
              <h3>量化策略回测平台</h3>
              <p>基于同花顺数据源的专业回测引擎，支持多种策略类型和风险管理</p>
            </div>
          </Col>
          <Col>
            <div className="backtest-actions">
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleStartBacktest}
                loading={backtestRunning}
                disabled={backtestRunning}
              >
                {backtestRunning ? '回测中...' : '开始回测'}
              </Button>
              {backtestRunning && (
                <Button
                  size="large"
                  icon={<PauseCircleOutlined />}
                  onClick={handleStopBacktest}
                  style={{ marginLeft: 8 }}
                >
                  停止
                </Button>
              )}
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleResetBacktest}
                style={{ marginLeft: 8 }}
              >
                重置
              </Button>
              <Button
                size="large"
                icon={<SettingOutlined />}
                onClick={() => setConfigModalVisible(true)}
                style={{ marginLeft: 8 }}
              >
                高级设置
              </Button>
            </div>
          </Col>
        </Row>
        
        {backtestRunning && (
          <div className="backtest-progress" style={{ marginTop: 16 }}>
            <Progress 
              percent={backtestProgress} 
              status={backtestProgress === 100 ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <p style={{ textAlign: 'center', marginTop: 8 }}>
              正在执行回测... {backtestProgress}%
            </p>
          </div>
        )}
      </Card>

      <div className="backtest-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <TabPane tab="回测配置" key="config" icon={<SettingOutlined />}>
            <BacktestConfig
              form={form}
              strategyCode={strategyCode}
              setStrategyCode={setStrategyCode}
              backtestConfig={backtestConfig}
              setBacktestConfig={setBacktestConfig}
            />
          </TabPane>
          
          <TabPane tab="回测结果" key="results" icon={<BarChartOutlined />}>
            <BacktestResults
              results={backtestResults}
              loading={backtestRunning}
              equityChartConfig={equityChartConfig}
              monthlyReturnsConfig={monthlyReturnsConfig}
            />
          </TabPane>
          
          <TabPane tab="性能分析" key="performance" icon={<LineChartOutlined />}>
            <PerformanceAnalysis results={backtestResults} />
          </TabPane>
          
          <TabPane tab="交易分析" key="trades" icon={<FileTextOutlined />}>
            <TradeAnalysis results={backtestResults} />
          </TabPane>
        </Tabs>
      </div>

      {/* 高级设置模态框 */}
      <Modal
        title="高级回测设置"
        visible={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfigModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={() => setConfigModalVisible(false)}>
            保存设置
          </Button>
        ]}
        width={800}
      >
        <AdvancedConfig
          backtestConfig={backtestConfig}
          setBacktestConfig={setBacktestConfig}
        />
      </Modal>
    </div>
  );
};

// 回测配置组件
const BacktestConfig = ({ form, strategyCode, setStrategyCode, backtestConfig, setBacktestConfig }) => {
  return (
    <Row gutter={24}>
      <Col span={12}>
        <Card title="策略代码" className="config-card">
          <TextArea
            value={strategyCode}
            onChange={(e) => setStrategyCode(e.target.value)}
            placeholder="请输入策略代码..."
            rows={20}
            style={{ fontFamily: 'Monaco, Consolas, monospace' }}
          />
        </Card>
      </Col>
      
      <Col span={12}>
        <Card title="回测参数" className="config-card">
          <Form
            form={form}
            layout="vertical"
            initialValues={backtestConfig}
            onValuesChange={(changedValues, allValues) => {
              setBacktestConfig({ ...backtestConfig, ...changedValues });
            }}
          >
            <Form.Item
              label="交易标的"
              name="symbol"
              tooltip="支持股票代码，如：000001.SZ, 600000.SH"
            >
              <Input placeholder="请输入股票代码" />
            </Form.Item>
            
            <Form.Item label="回测时间范围" name="dateRange">
              <RangePicker
                style={{ width: '100%' }}
                defaultValue={[backtestConfig.startDate, backtestConfig.endDate]}
                onChange={(dates) => {
                  setBacktestConfig({
                    ...backtestConfig,
                    startDate: dates[0],
                    endDate: dates[1]
                  });
                }}
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="初始资金" name="initialCapital">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/¥\s?|(,*)/g, '')}
                    min={10000}
                    max={10000000}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="手续费率" name="commission">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `${value}%`}
                    parser={value => value.replace('%', '')}
                    min={0}
                    max={1}
                    step={0.001}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item label="基准指数" name="benchmarkSymbol">
              <Select placeholder="选择基准指数">
                <Option value="000300.SH">沪深300</Option>
                <Option value="000001.SH">上证指数</Option>
                <Option value="399001.SZ">深证成指</Option>
                <Option value="399006.SZ">创业板指</Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="仓位管理" name="positionSizing">
              <Select>
                <Option value="fixed">固定仓位</Option>
                <Option value="percent">百分比仓位</Option>
                <Option value="kelly">凯利公式</Option>
              </Select>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

// 回测结果组件
const BacktestResults = ({ results, loading, equityChartConfig, monthlyReturnsConfig }) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>正在执行回测，请稍候...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <Alert
        message="暂无回测结果"
        description="请先配置策略参数并启动回测"
        type="info"
        showIcon
        style={{ margin: '50px 0' }}
      />
    );
  }

  return (
    <div className="backtest-results">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div className="metric-card">
              <div className="metric-value">{((results.total_return || 0) * 100).toFixed(2)}%</div>
              <div className="metric-label">总收益率</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="metric-card">
              <div className="metric-value">{((results.annual_return || 0) * 100).toFixed(2)}%</div>
              <div className="metric-label">年化收益率</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="metric-card">
              <div className="metric-value">{(results.sharpe_ratio || 0).toFixed(3)}</div>
              <div className="metric-label">夏普比率</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="metric-card">
              <div className="metric-value">{((results.max_drawdown || 0) * 100).toFixed(2)}%</div>
              <div className="metric-label">最大回撤</div>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={24}>
          <Card title="资金曲线" className="chart-card">
            <Line {...equityChartConfig} />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="月度收益" className="chart-card">
            <Column {...monthlyReturnsConfig} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// 性能分析组件
const PerformanceAnalysis = ({ results }) => {
  if (!results) {
    return (
      <Alert
        message="暂无性能数据"
        description="请先完成回测以查看性能分析"
        type="info"
        showIcon
      />
    );
  }

  return (
    <div className="performance-analysis">
      <Row gutter={16}>
        <Col span={12}>
          <Card title="收益指标" className="analysis-card">
            <div className="metric-row">
              <span>总收益率:</span>
              <span className="metric-value positive">{((results.total_return || 0) * 100).toFixed(2)}%</span>
            </div>
            <div className="metric-row">
              <span>年化收益率:</span>
              <span className="metric-value positive">{((results.annual_return || 0) * 100).toFixed(2)}%</span>
            </div>
            <div className="metric-row">
              <span>基准收益率:</span>
              <span className="metric-value">{((results.benchmark_return || 0) * 100).toFixed(2)}%</span>
            </div>
            <div className="metric-row">
              <span>超额收益:</span>
              <span className="metric-value positive">{(((results.total_return || 0) - (results.benchmark_return || 0)) * 100).toFixed(2)}%</span>
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="风险指标" className="analysis-card">
            <div className="metric-row">
              <span>最大回撤:</span>
              <span className="metric-value negative">{((results.max_drawdown || 0) * 100).toFixed(2)}%</span>
            </div>
            <div className="metric-row">
              <span>夏普比率:</span>
              <span className="metric-value">{(results.sharpe_ratio || 0).toFixed(3)}</span>
            </div>
            <div className="metric-row">
              <span>Alpha:</span>
              <span className="metric-value positive">{((results.alpha || 0) * 100).toFixed(2)}%</span>
            </div>
            <div className="metric-row">
              <span>Beta:</span>
              <span className="metric-value">{(results.beta || 0).toFixed(3)}</span>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// 交易分析组件
const TradeAnalysis = ({ results }) => {
  if (!results || !results.trades) {
    return (
      <Alert
        message="暂无交易数据"
        description="请先完成回测以查看交易分析"
        type="info"
        showIcon
      />
    );
  }

  const columns = [
    {
      title: '交易ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '标的',
      dataIndex: 'symbol',
      key: 'symbol',
    },
    {
      title: '方向',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <span className={type === 'Long' ? 'trade-long' : 'trade-short'}>
          {type === 'Long' ? '做多' : '做空'}
        </span>
      ),
    },
    {
      title: '开仓时间',
      dataIndex: 'entryDate',
      key: 'entryDate',
    },
    {
      title: '平仓时间',
      dataIndex: 'exitDate',
      key: 'exitDate',
    },
    {
      title: '开仓价格',
      dataIndex: 'entryPrice',
      key: 'entryPrice',
      render: (price) => `¥${price.toFixed(2)}`,
    },
    {
      title: '平仓价格',
      dataIndex: 'exitPrice',
      key: 'exitPrice',
      render: (price) => `¥${price.toFixed(2)}`,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '盈亏',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (pnl) => (
        <span className={pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
          ¥{pnl.toFixed(2)}
        </span>
      ),
    },
    {
      title: '收益率',
      dataIndex: 'pnlPercent',
      key: 'pnlPercent',
      render: (percent) => (
        <span className={percent >= 0 ? 'pnl-positive' : 'pnl-negative'}>
          {percent.toFixed(2)}%
        </span>
      ),
    },
  ];

  return (
    <div className="trade-analysis">
      <Card title="交易记录" className="trades-card">
        <div className="trades-summary" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <div className="summary-item">
                <div className="summary-value">{results.total_trades || 0}</div>
                <div className="summary-label">总交易次数</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="summary-item">
                <div className="summary-value">{((results.win_rate || 0) * 100).toFixed(2)}%</div>
                <div className="summary-label">胜率</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="summary-item">
                <div className="summary-value">{(results.profit_factor || 0).toFixed(2)}</div>
                <div className="summary-label">盈亏比</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="summary-item">
                <div className="summary-value">¥{(results.final_value || 0).toLocaleString()}</div>
                <div className="summary-label">最终资产</div>
              </div>
            </Col>
          </Row>
        </div>
        
        <Table
          columns={columns}
          dataSource={results.trade_list || []}
          rowKey={(record, index) => record.id || index}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条交易记录`,
          }}
        />
      </Card>
    </div>
  );
};

// 高级配置组件
const AdvancedConfig = ({ backtestConfig, setBacktestConfig }) => {
  return (
    <div className="advanced-config">
      <Row gutter={16}>
        <Col span={12}>
          <h4>风险管理</h4>
          <Form layout="vertical">
            <Form.Item label="止损比例 (%)">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={50}
                step={0.1}
                placeholder="如：5.0 表示5%止损"
              />
            </Form.Item>
            <Form.Item label="止盈比例 (%)">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={100}
                step={0.1}
                placeholder="如：15.0 表示15%止盈"
              />
            </Form.Item>
            <Form.Item label="最大仓位比例">
              <InputNumber
                style={{ width: '100%' }}
                min={0.1}
                max={1.0}
                step={0.1}
                defaultValue={1.0}
              />
            </Form.Item>
          </Form>
        </Col>
        
        <Col span={12}>
          <h4>交易成本</h4>
          <Form layout="vertical">
            <Form.Item label="滑点 (%)">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={1}
                step={0.001}
                defaultValue={0}
              />
            </Form.Item>
            <Form.Item label="印花税率 (%)">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={1}
                step={0.001}
                defaultValue={0.1}
              />
            </Form.Item>
            <Form.Item label="过户费率 (%)">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={0.1}
                step={0.001}
                defaultValue={0.002}
              />
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default StrategyBacktest;