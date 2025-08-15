import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Tooltip, Select } from 'antd';
import { 
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  BarChartOutlined,
  LineChartOutlined
} from '@ant-design/icons';

const { Option } = Select;

const PerformanceWidget = ({ isEditMode, lastUpdateTime }) => {
  const [timeRange, setTimeRange] = useState('1M');
  const [performanceData, setPerformanceData] = useState({
    '1D': {
      totalReturn: 2.35,
      benchmark: 1.12,
      alpha: 1.23,
      beta: 1.05,
      sharpe: 1.85,
      maxDrawdown: -0.8,
      winRate: 75,
      volatility: 12.5
    },
    '1W': {
      totalReturn: 8.92,
      benchmark: 4.56,
      alpha: 4.36,
      beta: 1.12,
      sharpe: 2.15,
      maxDrawdown: -2.1,
      winRate: 68,
      volatility: 15.2
    },
    '1M': {
      totalReturn: 15.67,
      benchmark: 8.23,
      alpha: 7.44,
      beta: 1.18,
      sharpe: 1.92,
      maxDrawdown: -5.2,
      winRate: 72,
      volatility: 18.7
    },
    '3M': {
      totalReturn: 28.45,
      benchmark: 12.78,
      alpha: 15.67,
      beta: 1.25,
      sharpe: 1.78,
      maxDrawdown: -8.9,
      winRate: 69,
      volatility: 22.1
    },
    '1Y': {
      totalReturn: 45.23,
      benchmark: 18.56,
      alpha: 26.67,
      beta: 1.32,
      sharpe: 1.65,
      maxDrawdown: -12.5,
      winRate: 65,
      volatility: 25.8
    }
  });

  // 刷新性能数据
  const refreshPerformanceData = () => {
    if (isEditMode) return;
    
    setPerformanceData(prev => {
      const newData = { ...prev };
      Object.keys(newData).forEach(period => {
        newData[period] = {
          ...newData[period],
          totalReturn: newData[period].totalReturn + (Math.random() - 0.5) * 2,
          benchmark: newData[period].benchmark + (Math.random() - 0.5) * 1,
          sharpe: Math.max(0, newData[period].sharpe + (Math.random() - 0.5) * 0.2),
          winRate: Math.max(50, Math.min(90, newData[period].winRate + (Math.random() - 0.5) * 5))
        };
      });
      return newData;
    });
  };

  // 自动刷新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(refreshPerformanceData, 20000); // 20秒刷新一次
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshPerformanceData();
    }
  }, [lastUpdateTime, isEditMode]);

  const currentData = performanceData[timeRange];

  const getReturnColor = (value) => {
    return value >= 0 ? '#52c41a' : '#ff4d4f';
  };

  const getReturnIcon = (value) => {
    return value >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
  };

  const getSharpeColor = (value) => {
    if (value >= 2) return '#52c41a';
    if (value >= 1) return '#faad14';
    return '#ff4d4f';
  };

  const getWinRateColor = (value) => {
    if (value >= 70) return '#52c41a';
    if (value >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const formatPercent = (value, showSign = true) => {
    const sign = showSign && value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <Card
      title="性能分析"
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px 20px', height: 'calc(100% - 57px)', overflow: 'auto' }}
      extra={
        !isEditMode && (
          <Select 
            value={timeRange} 
            onChange={setTimeRange}
            size="small"
            style={{ width: 60 }}
          >
            <Option value="1D">1日</Option>
            <Option value="1W">1周</Option>
            <Option value="1M">1月</Option>
            <Option value="3M">3月</Option>
            <Option value="1Y">1年</Option>
          </Select>
        )
      }
    >
      {isEditMode ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: '#8c8c8c',
          fontSize: '14px'
        }}>
          性能分析组件 - 编辑模式
        </div>
      ) : (
        <div style={{ height: '100%' }}>
          {/* 核心指标 */}
          <Row gutter={[8, 8]} style={{ marginBottom: '12px' }}>
            <Col span={12}>
              <div style={{ 
                padding: '8px',
                background: currentData.totalReturn >= 0 ? '#f6ffed' : '#fff2f0',
                border: `1px solid ${currentData.totalReturn >= 0 ? '#b7eb8f' : '#ffccc7'}`,
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', color: '#8c8c8c', marginBottom: '2px' }}>
                  <TrophyOutlined /> 总收益率
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: getReturnColor(currentData.totalReturn)
                }}>
                  {getReturnIcon(currentData.totalReturn)} {formatPercent(currentData.totalReturn)}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ 
                padding: '8px',
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', color: '#8c8c8c', marginBottom: '2px' }}>
                  <BarChartOutlined /> 基准收益
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: getReturnColor(currentData.benchmark)
                }}>
                  {getReturnIcon(currentData.benchmark)} {formatPercent(currentData.benchmark)}
                </div>
              </div>
            </Col>
          </Row>

          {/* Alpha和Beta */}
          <Row gutter={[8, 8]} style={{ marginBottom: '12px' }}>
            <Col span={12}>
              <div style={{ 
                padding: '6px',
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                borderRadius: '4px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '10px', color: '#8c8c8c' }}>Alpha</span>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: getReturnColor(currentData.alpha)
                  }}>
                    {formatPercent(currentData.alpha)}
                  </span>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ 
                padding: '6px',
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                borderRadius: '4px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '10px', color: '#8c8c8c' }}>Beta</span>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: '#1890ff'
                  }}>
                    {currentData.beta.toFixed(2)}
                  </span>
                </div>
              </div>
            </Col>
          </Row>

          {/* 夏普比率 */}
          <div style={{ 
            padding: '8px',
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
            marginBottom: '12px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
                <LineChartOutlined /> 夏普比率
              </span>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: getSharpeColor(currentData.sharpe)
              }}>
                {currentData.sharpe.toFixed(2)}
              </span>
            </div>
            <Progress 
              percent={(currentData.sharpe / 3) * 100} 
              size="small" 
              showInfo={false}
              strokeColor={getSharpeColor(currentData.sharpe)}
            />
          </div>

          {/* 胜率 */}
          <div style={{ 
            padding: '8px',
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
            marginBottom: '12px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
                <TrophyOutlined /> 胜率
              </span>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: getWinRateColor(currentData.winRate)
              }}>
                {currentData.winRate.toFixed(0)}%
              </span>
            </div>
            <Progress 
              percent={currentData.winRate} 
              size="small" 
              showInfo={false}
              strokeColor={getWinRateColor(currentData.winRate)}
            />
          </div>

          {/* 风险指标 */}
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <div style={{ 
                padding: '6px',
                background: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: '4px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '10px', color: '#8c8c8c' }}>最大回撤</span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '600',
                    color: '#ff4d4f'
                  }}>
                    {formatPercent(currentData.maxDrawdown, false)}
                  </span>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ 
                padding: '6px',
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                borderRadius: '4px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '10px', color: '#8c8c8c' }}>波动率</span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '600',
                    color: '#722ed1'
                  }}>
                    {formatPercent(currentData.volatility, false)}
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )}
    </Card>
  );
};

export default PerformanceWidget;