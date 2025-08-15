import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Tabs,
  Select,
  DatePicker,
  Button,
  Tooltip,
  Alert,
  Spin
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  PercentageOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import './StrategyPerformance.css';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

const StrategyPerformance = ({ strategyId, visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);
  const [timeRange, setTimeRange] = useState('1M');
  const [activeTab, setActiveTab] = useState('overview');

  // 模拟性能数据
  const mockPerformanceData = {
    overview: {
      totalReturn: 15.67,
      annualizedReturn: 18.23,
      sharpeRatio: 1.45,
      maxDrawdown: -8.32,
      winRate: 68.5,
      profitFactor: 2.34,
      totalTrades: 156,
      avgHoldingPeriod: 3.2
    },
    equity: [
      { date: '2024-01-01', value: 100000, benchmark: 100000 },
      { date: '2024-01-15', value: 102300, benchmark: 101200 },
      { date: '2024-02-01', value: 105600, benchmark: 102800 },
      { date: '2024-02-15', value: 108900, benchmark: 104100 },
      { date: '2024-03-01', value: 112400, benchmark: 105500 },
      { date: '2024-03-15', value: 115670, benchmark: 106800 }
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
        symbol: 'AAPL',
        type: 'Long',
        entryDate: '2024-03-01',
        exitDate: '2024-03-05',
        entryPrice: 150.25,
        exitPrice: 155.80,
        quantity: 100,
        pnl: 555,
        pnlPercent: 3.69,
        status: 'Closed'
      },
      {
        id: 2,
        symbol: 'TSLA',
        type: 'Short',
        entryDate: '2024-03-02',
        exitDate: '2024-03-08',
        entryPrice: 200.50,
        exitPrice: 195.30,
        quantity: 50,
        pnl: 260,
        pnlPercent: 2.59,
        status: 'Closed'
      },
      {
        id: 3,
        symbol: 'MSFT',
        type: 'Long',
        entryDate: '2024-03-10',
        exitDate: null,
        entryPrice: 420.75,
        exitPrice: null,
        quantity: 25,
        pnl: -125,
        pnlPercent: -1.19,
        status: 'Open'
      }
    ],
    riskMetrics: {
      var95: -2.45,
      var99: -3.78,
      expectedShortfall: -4.12,
      beta: 0.85,
      alpha: 0.023,
      correlation: 0.72,
      volatility: 12.34
    },
    sectorAllocation: [
      { sector: '科技', value: 35, count: 12 },
      { sector: '金融', value: 25, count: 8 },
      { sector: '医疗', value: 20, count: 6 },
      { sector: '消费', value: 15, count: 5 },
      { sector: '其他', value: 5, count: 2 }
    ]
  };

  useEffect(() => {
    if (visible && strategyId) {
      loadPerformanceData();
    }
  }, [visible, strategyId, timeRange]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPerformanceData(mockPerformanceData);
    } catch (error) {
      console.error('加载性能数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // TODO: 实现导出报告功能
    console.log('导出性能报告');
  };

  const renderOverviewTab = () => {
    if (!performanceData) return null;

    const { overview } = performanceData;

    return (
      <div className="overview-content">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} lg={6}>
            <Card className="metric-card">
              <Statistic
                title="总收益率"
                value={overview.totalReturn}
                precision={2}
                suffix="%"
                valueStyle={{ 
                  color: overview.totalReturn >= 0 ? '#3f8600' : '#cf1322',
                  fontSize: '20px'
                }}
                prefix={overview.totalReturn >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Card className="metric-card">
              <Statistic
                title="年化收益率"
                value={overview.annualizedReturn}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                prefix={<PercentageOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Card className="metric-card">
              <Statistic
                title="夏普比率"
                value={overview.sharpeRatio}
                precision={2}
                valueStyle={{ color: '#722ed1', fontSize: '20px' }}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Card className="metric-card">
              <Statistic
                title="最大回撤"
                value={Math.abs(overview.maxDrawdown)}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#cf1322', fontSize: '20px' }}
                prefix={<ArrowDownOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Card className="metric-card">
              <div className="win-rate-card">
                <div className="win-rate-title">胜率</div>
                <Progress
                  type="circle"
                  percent={overview.winRate}
                  size={80}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  format={percent => `${percent}%`}
                />
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Card className="metric-card">
              <Statistic
                title="盈亏比"
                value={overview.profitFactor}
                precision={2}
                valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Card className="metric-card">
              <Statistic
                title="总交易次数"
                value={overview.totalTrades}
                valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                prefix={<LineChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <Card className="metric-card">
              <Statistic
                title="平均持仓天数"
                value={overview.avgHoldingPeriod}
                precision={1}
                suffix="天"
                valueStyle={{ color: '#fa8c16', fontSize: '20px' }}
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderEquityTab = () => {
    if (!performanceData) return null;

    const equityConfig = {
      data: performanceData.equity.flatMap(item => [
        { date: item.date, value: item.value, type: '策略净值' },
        { date: item.date, value: item.benchmark, type: '基准净值' }
      ]),
      xField: 'date',
      yField: 'value',
      seriesField: 'type',
      smooth: true,
      animation: {
        appear: {
          animation: 'path-in',
          duration: 2000,
        },
      },
      color: ['#1890ff', '#52c41a'],
      point: {
        size: 3,
        shape: 'circle',
      },
      tooltip: {
        formatter: (datum) => {
          return {
            name: datum.type,
            value: `¥${datum.value.toLocaleString()}`
          };
        }
      }
    };

    return (
      <div className="equity-content">
        <Card title="净值曲线" className="chart-card">
          <Line {...equityConfig} height={400} />
        </Card>
      </div>
    );
  };

  const renderReturnsTab = () => {
    if (!performanceData) return null;

    const returnsConfig = {
      data: performanceData.monthlyReturns.flatMap(item => [
        { month: item.month, return: item.return, type: '策略收益' },
        { month: item.month, return: item.benchmark, type: '基准收益' }
      ]),
      xField: 'month',
      yField: 'return',
      seriesField: 'type',
      isGroup: true,
      color: ['#1890ff', '#52c41a'],
      columnWidthRatio: 0.8,
      tooltip: {
        formatter: (datum) => {
          return {
            name: datum.type,
            value: `${datum.return}%`
          };
        }
      }
    };

    return (
      <div className="returns-content">
        <Card title="月度收益对比" className="chart-card">
          <Column {...returnsConfig} height={400} />
        </Card>
      </div>
    );
  };

  const renderTradesTab = () => {
    if (!performanceData) return null;

    const columns = [
      {
        title: '股票代码',
        dataIndex: 'symbol',
        key: 'symbol',
        width: 100,
        render: (text) => <Tag color="blue">{text}</Tag>
      },
      {
        title: '方向',
        dataIndex: 'type',
        key: 'type',
        width: 80,
        render: (text) => (
          <Tag color={text === 'Long' ? 'green' : 'red'}>
            {text === 'Long' ? '做多' : '做空'}
          </Tag>
        )
      },
      {
        title: '开仓日期',
        dataIndex: 'entryDate',
        key: 'entryDate',
        width: 120
      },
      {
        title: '平仓日期',
        dataIndex: 'exitDate',
        key: 'exitDate',
        width: 120,
        render: (text) => text || '-'
      },
      {
        title: '开仓价格',
        dataIndex: 'entryPrice',
        key: 'entryPrice',
        width: 100,
        render: (value) => `$${value}`
      },
      {
        title: '平仓价格',
        dataIndex: 'exitPrice',
        key: 'exitPrice',
        width: 100,
        render: (value) => value ? `$${value}` : '-'
      },
      {
        title: '数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 80
      },
      {
        title: '盈亏金额',
        dataIndex: 'pnl',
        key: 'pnl',
        width: 100,
        render: (value) => (
          <span style={{ color: value >= 0 ? '#3f8600' : '#cf1322' }}>
            ${value}
          </span>
        )
      },
      {
        title: '盈亏比例',
        dataIndex: 'pnlPercent',
        key: 'pnlPercent',
        width: 100,
        render: (value) => (
          <span style={{ color: value >= 0 ? '#3f8600' : '#cf1322' }}>
            {value}%
          </span>
        )
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 80,
        render: (text) => (
          <Tag color={text === 'Open' ? 'processing' : 'success'}>
            {text === 'Open' ? '持仓中' : '已平仓'}
          </Tag>
        )
      }
    ];

    return (
      <div className="trades-content">
        <Card title="交易记录" className="trades-card">
          <Table
            columns={columns}
            dataSource={performanceData.trades}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            scroll={{ x: 800 }}
          />
        </Card>
      </div>
    );
  };

  const renderRiskTab = () => {
    if (!performanceData) return null;

    const { riskMetrics, sectorAllocation } = performanceData;

    const sectorConfig = {
      data: sectorAllocation,
      angleField: 'value',
      colorField: 'sector',
      radius: 0.8,
      label: {
        type: 'outer',
        content: '{name} {percentage}',
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };

    return (
      <div className="risk-content">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="风险指标" className="risk-metrics-card">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="VaR (95%)"
                    value={Math.abs(riskMetrics.var95)}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="VaR (99%)"
                    value={Math.abs(riskMetrics.var99)}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Beta系数"
                    value={riskMetrics.beta}
                    precision={2}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Alpha系数"
                    value={riskMetrics.alpha}
                    precision={3}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="相关性"
                    value={riskMetrics.correlation}
                    precision={2}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="波动率"
                    value={riskMetrics.volatility}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="行业配置" className="sector-card">
              <Pie {...sectorConfig} height={300} />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div className="strategy-performance-container">
      <Card 
        className="performance-card"
        title={
          <div className="performance-header">
            <span>策略性能分析</span>
            <div className="header-controls">
              <Select
                value={timeRange}
                onChange={setTimeRange}
                style={{ width: 100, marginRight: 8 }}
              >
                <Option value="1W">1周</Option>
                <Option value="1M">1月</Option>
                <Option value="3M">3月</Option>
                <Option value="6M">6月</Option>
                <Option value="1Y">1年</Option>
                <Option value="ALL">全部</Option>
              </Select>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadPerformanceData}
                style={{ marginRight: 8 }}
              >
                刷新
              </Button>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={handleExportReport}
              >
                导出报告
              </Button>
            </div>
          </div>
        }
        extra={
          <Button type="text" onClick={onClose}>
            关闭
          </Button>
        }
      >
        <Spin spinning={loading}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="概览" key="overview">
              {renderOverviewTab()}
            </TabPane>
            <TabPane tab="净值曲线" key="equity">
              {renderEquityTab()}
            </TabPane>
            <TabPane tab="收益分析" key="returns">
              {renderReturnsTab()}
            </TabPane>
            <TabPane tab="交易记录" key="trades">
              {renderTradesTab()}
            </TabPane>
            <TabPane tab="风险分析" key="risk">
              {renderRiskTab()}
            </TabPane>
          </Tabs>
        </Spin>
      </Card>
    </div>
  );
};

export default StrategyPerformance;