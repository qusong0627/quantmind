import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Select, Space, Button } from 'antd';
import { RiseOutlined, FallOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const PerformanceWidget = ({ isEditMode }) => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('1M');
  const [performanceData, setPerformanceData] = useState({
    totalReturn: 12.5,
    annualReturn: 15.8,
    maxDrawdown: -8.2,
    sharpeRatio: 1.65,
    volatility: 18.5,
    winRate: 62.5,
    profitFactor: 1.85,
    totalTrades: 89,
    avgHoldingDays: 12.5,
    benchmarkReturn: 8.3,
    alpha: 4.2,
    beta: 1.15,
    informationRatio: 0.85,
    calmarRatio: 1.92,
    sortinoRatio: 2.15
  });
  
  const [comparisonData, setComparisonData] = useState([
    { period: '1周', portfolio: 2.1, benchmark: 1.5, excess: 0.6 },
    { period: '1月', portfolio: 5.8, benchmark: 3.2, excess: 2.6 },
    { period: '3月', portfolio: 12.5, benchmark: 8.3, excess: 4.2 },
    { period: '6月', portfolio: 18.9, benchmark: 12.1, excess: 6.8 },
    { period: '1年', portfolio: 25.6, benchmark: 15.2, excess: 10.4 }
  ]);

  // 模拟数据更新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(() => {
        setPerformanceData(prev => ({
          ...prev,
          totalReturn: prev.totalReturn + (Math.random() - 0.5) * 0.5,
          annualReturn: prev.annualReturn + (Math.random() - 0.5) * 0.3,
          maxDrawdown: prev.maxDrawdown + (Math.random() - 0.5) * 0.2,
          sharpeRatio: Math.max(0, prev.sharpeRatio + (Math.random() - 0.5) * 0.1),
          volatility: Math.max(0, prev.volatility + (Math.random() - 0.5) * 0.5)
        }));
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [isEditMode, timeRange]);

  // 获取风险等级
  const getRiskLevel = (volatility) => {
    if (volatility < 15) return { level: '低风险', color: '#52c41a' };
    if (volatility < 25) return { level: '中风险', color: '#faad14' };
    return { level: '高风险', color: '#ff4d4f' };
  };

  // 获取评级
  const getRating = (sharpeRatio) => {
    if (sharpeRatio >= 2) return { rating: '优秀', color: '#52c41a' };
    if (sharpeRatio >= 1.5) return { rating: '良好', color: '#1890ff' };
    if (sharpeRatio >= 1) return { rating: '一般', color: '#faad14' };
    return { rating: '较差', color: '#ff4d4f' };
  };

  const riskInfo = getRiskLevel(performanceData.volatility);
  const ratingInfo = getRating(performanceData.sharpeRatio);

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    // 这里可以根据时间范围重新获取数据
  };

  const viewDetailedReport = () => {
    navigate('/analytics/performance');
  };

  return (
    <div className="widget-content">
      <div className="widget-header">
        <h4 className="widget-title">投资组合表现</h4>
        <div className="widget-actions">
          <Space>
            <Select 
              value={timeRange} 
              onChange={handleTimeRangeChange}
              size="small"
              style={{ width: 80 }}
              disabled={isEditMode}
            >
              <Option value="1W">1周</Option>
              <Option value="1M">1月</Option>
              <Option value="3M">3月</Option>
              <Option value="6M">6月</Option>
              <Option value="1Y">1年</Option>
              <Option value="YTD">今年</Option>
            </Select>
            {!isEditMode && (
              <Button 
                type="primary" 
                size="small"
                icon={<BarChartOutlined />}
                onClick={viewDetailedReport}
              >
                详细报告
              </Button>
            )}
          </Space>
        </div>
      </div>
      
      <div className="widget-body" style={{ padding: '12px 0' }}>
        <div className="market-grid-center">
          {/* 核心指标 */}
          <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center', height: '80px' }}>
                <Statistic
                  title="总收益率"
                  value={performanceData.totalReturn}
                  suffix="%"
                  precision={1}
                  valueStyle={{ 
                    color: performanceData.totalReturn >= 0 ? '#cf1322' : '#3f8600',
                    fontSize: '16px'
                  }}
                  prefix={performanceData.totalReturn >= 0 ? <RiseOutlined /> : <FallOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center', height: '80px' }}>
                <Statistic
                  title="年化收益"
                  value={performanceData.annualReturn}
                  suffix="%"
                  precision={1}
                  valueStyle={{ 
                    color: performanceData.annualReturn >= 0 ? '#cf1322' : '#3f8600',
                    fontSize: '16px'
                  }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center', height: '80px' }}>
                <Statistic
                  title="最大回撤"
                  value={Math.abs(performanceData.maxDrawdown)}
                  suffix="%"
                  precision={1}
                  valueStyle={{ color: '#cf1322', fontSize: '16px' }}
                />
              </Card>
            </Col>
          </Row>
          
          {/* 风险指标 */}
          <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
            <Col span={12}>
              <Card size="small" style={{ height: '100px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>夏普比率</span>
                  <span style={{ 
                    float: 'right', 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    color: ratingInfo.color
                  }}>
                    {performanceData.sharpeRatio.toFixed(2)}
                  </span>
                </div>
                <Progress 
                  percent={Math.min(performanceData.sharpeRatio * 33.33, 100)} 
                  strokeColor={ratingInfo.color}
                  showInfo={false}
                  size="small"
                />
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '11px', 
                  color: ratingInfo.color,
                  textAlign: 'center'
                }}>
                  {ratingInfo.rating}
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" style={{ height: '100px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>波动率</span>
                  <span style={{ 
                    float: 'right', 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    color: riskInfo.color
                  }}>
                    {performanceData.volatility.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  percent={Math.min(performanceData.volatility * 2, 100)} 
                  strokeColor={riskInfo.color}
                  showInfo={false}
                  size="small"
                />
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '11px', 
                  color: riskInfo.color,
                  textAlign: 'center'
                }}>
                  {riskInfo.level}
                </div>
              </Card>
            </Col>
          </Row>
          
          {/* 交易统计 */}
          <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center', height: '70px' }}>
                <Statistic
                  title="胜率"
                  value={performanceData.winRate}
                  suffix="%"
                  precision={1}
                  valueStyle={{ fontSize: '14px' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center', height: '70px' }}>
                <Statistic
                  title="交易次数"
                  value={performanceData.totalTrades}
                  valueStyle={{ fontSize: '14px' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center', height: '70px' }}>
                <Statistic
                  title="盈利因子"
                  value={performanceData.profitFactor}
                  precision={2}
                  valueStyle={{ fontSize: '14px' }}
                />
              </Card>
            </Col>
          </Row>
          
          {/* 基准比较 */}
          <Card size="small" title="基准比较" style={{ marginBottom: '12px', minHeight: '80px' }}>
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>组合收益</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    color: performanceData.totalReturn >= 0 ? '#ff4d4f' : '#52c41a'
                  }}>
                    {performanceData.totalReturn >= 0 ? '+' : ''}{performanceData.totalReturn.toFixed(1)}%
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>基准收益</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    color: performanceData.benchmarkReturn >= 0 ? '#ff4d4f' : '#52c41a'
                  }}>
                    {performanceData.benchmarkReturn >= 0 ? '+' : ''}{performanceData.benchmarkReturn.toFixed(1)}%
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>超额收益</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    color: performanceData.alpha >= 0 ? '#ff4d4f' : '#52c41a'
                  }}>
                    {performanceData.alpha >= 0 ? '+' : ''}{performanceData.alpha.toFixed(1)}%
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
          
          {/* 高级指标 */}
          <Card size="small" title="高级指标">
            <Row gutter={[12, 8]}>
              <Col span={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>Beta系数:</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {performanceData.beta.toFixed(2)}
                  </span>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>信息比率:</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {performanceData.informationRatio.toFixed(2)}
                  </span>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>卡玛比率:</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {performanceData.calmarRatio.toFixed(2)}
                  </span>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>索提诺比率:</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {performanceData.sortinoRatio.toFixed(2)}
                  </span>
                </div>
              </Col>
            </Row>
          </Card>
          
          {performanceData.totalReturn < -10 && (
            <div style={{ 
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#fff1f0',
              border: '1px solid #ffa39e',
              borderRadius: '6px',
              color: '#cf1322',
              fontSize: '12px'
            }}>
              警告：组合收益率已经低于 -10%，请检查风险控制和策略配置。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceWidget;