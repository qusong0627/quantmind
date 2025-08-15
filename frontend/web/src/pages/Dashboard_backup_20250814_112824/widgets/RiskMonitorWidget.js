import React, { useState, useEffect } from 'react';
import { Card, Progress, Alert, List, Tag, Tooltip, Badge } from 'antd';
import { 
  ExclamationCircleOutlined,
  SafetyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const RiskMonitorWidget = ({ isEditMode, lastUpdateTime }) => {
  const [riskData, setRiskData] = useState({
    overallRisk: 'medium', // low, medium, high
    riskScore: 65,
    alerts: [
      {
        id: 1,
        type: 'warning',
        level: 'medium',
        title: '持仓集中度过高',
        description: '前5大持仓占比达到78%，建议分散投资',
        time: '10分钟前',
        isNew: true
      },
      {
        id: 2,
        type: 'error',
        level: 'high',
        title: '单日亏损超限',
        description: '今日亏损已达到设定阈值的85%',
        time: '25分钟前',
        isNew: false
      },
      {
        id: 3,
        type: 'info',
        level: 'low',
        title: '市场波动加剧',
        description: 'VIX指数上升至28.5，建议关注市场风险',
        time: '1小时前',
        isNew: false
      }
    ],
    metrics: {
      var: 2.35, // Value at Risk
      cvar: 3.82, // Conditional VaR
      beta: 1.15,
      correlation: 0.78,
      concentration: 78.5,
      leverage: 1.25,
      liquidity: 85.2,
      drawdown: -5.8
    },
    limits: {
      maxDrawdown: -10.0,
      maxConcentration: 80.0,
      maxLeverage: 2.0,
      minLiquidity: 70.0
    }
  });

  // 刷新风险数据
  const refreshRiskData = () => {
    if (isEditMode) return;
    
    setRiskData(prev => ({
      ...prev,
      riskScore: Math.max(20, Math.min(95, prev.riskScore + (Math.random() - 0.5) * 10)),
      metrics: {
        ...prev.metrics,
        var: Math.max(0.5, prev.metrics.var + (Math.random() - 0.5) * 0.5),
        cvar: Math.max(1.0, prev.metrics.cvar + (Math.random() - 0.5) * 0.8),
        beta: Math.max(0.5, Math.min(2.0, prev.metrics.beta + (Math.random() - 0.5) * 0.2)),
        correlation: Math.max(0.3, Math.min(1.0, prev.metrics.correlation + (Math.random() - 0.5) * 0.1)),
        concentration: Math.max(50, Math.min(90, prev.metrics.concentration + (Math.random() - 0.5) * 5)),
        leverage: Math.max(1.0, Math.min(3.0, prev.metrics.leverage + (Math.random() - 0.5) * 0.1)),
        liquidity: Math.max(60, Math.min(95, prev.metrics.liquidity + (Math.random() - 0.5) * 5)),
        drawdown: Math.max(-15, Math.min(0, prev.metrics.drawdown + (Math.random() - 0.5) * 1))
      }
    }));
  };

  // 自动刷新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(refreshRiskData, 18000); // 18秒刷新一次
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshRiskData();
    }
  }, [lastUpdateTime, isEditMode]);

  const getRiskColor = (level) => {
    const colorMap = {
      low: '#52c41a',
      medium: '#faad14',
      high: '#ff4d4f'
    };
    return colorMap[level] || '#8c8c8c';
  };

  const getRiskText = (level) => {
    const textMap = {
      low: '低风险',
      medium: '中风险',
      high: '高风险'
    };
    return textMap[level] || '未知';
  };

  const getAlertIcon = (type) => {
    const iconMap = {
      error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      warning: <WarningOutlined style={{ color: '#faad14' }} />,
      info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />
    };
    return iconMap[type] || <InfoCircleOutlined />;
  };

  const getMetricStatus = (value, limit, isReverse = false) => {
    if (!limit) return 'normal';
    
    if (isReverse) {
      if (value < limit) return 'danger';
      if (value < limit * 1.1) return 'warning';
      return 'normal';
    } else {
      if (value > limit) return 'danger';
      if (value > limit * 0.9) return 'warning';
      return 'normal';
    }
  };

  const getStatusColor = (status) => {
    const colorMap = {
      normal: '#52c41a',
      warning: '#faad14',
      danger: '#ff4d4f'
    };
    return colorMap[status] || '#8c8c8c';
  };

  return (
    <Card
      title="风险监控"
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px 20px', height: 'calc(100% - 57px)', overflow: 'auto' }}
      extra={
        <Tooltip title="风险等级">
          <SafetyOutlined style={{ color: getRiskColor(riskData.overallRisk) }} />
        </Tooltip>
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
          风险监控组件 - 编辑模式
        </div>
      ) : (
        <div style={{ height: '100%' }}>
          {/* 整体风险评分 */}
          <div style={{ 
            padding: '8px',
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>
              <SafetyOutlined /> 风险评分
            </div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600',
              color: getRiskColor(riskData.overallRisk),
              marginBottom: '4px'
            }}>
              {parseFloat(riskData.riskScore).toFixed(1)}
            </div>
            <Tag color={getRiskColor(riskData.overallRisk)} size="small">
              {getRiskText(riskData.overallRisk)}
            </Tag>
            <Progress 
              percent={riskData.riskScore} 
              size="small" 
              showInfo={false}
              strokeColor={getRiskColor(riskData.overallRisk)}
              style={{ marginTop: '6px' }}
            />
          </div>

          {/* 风险指标 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '6px' }}>
              关键指标
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* VaR */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '4px 6px',
                background: '#fafafa',
                borderRadius: '3px'
              }}>
                <span style={{ fontSize: '10px', color: '#8c8c8c' }}>VaR (95%)</span>
                <span style={{ fontSize: '10px', fontWeight: '500', color: '#ff4d4f' }}>
                  -{parseFloat(riskData.metrics.var).toFixed(2)}%
                </span>
              </div>
              
              {/* CVaR */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '4px 6px',
                background: '#fafafa',
                borderRadius: '3px'
              }}>
                <span style={{ fontSize: '10px', color: '#8c8c8c' }}>CVaR</span>
                <span style={{ fontSize: '10px', fontWeight: '500', color: '#ff4d4f' }}>
                  -{parseFloat(riskData.metrics.cvar).toFixed(2)}%
                </span>
              </div>
              
              {/* Beta */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '4px 6px',
                background: '#fafafa',
                borderRadius: '3px'
              }}>
                <span style={{ fontSize: '10px', color: '#8c8c8c' }}>Beta</span>
                <span style={{ fontSize: '10px', fontWeight: '500', color: '#1890ff' }}>
                  {parseFloat(riskData.metrics.beta).toFixed(2)}
                </span>
              </div>
              
              {/* 相关性 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '4px 6px',
                background: '#fafafa',
                borderRadius: '3px'
              }}>
                <span style={{ fontSize: '10px', color: '#8c8c8c' }}>市场相关性</span>
                <span style={{ fontSize: '10px', fontWeight: '500', color: '#722ed1' }}>
                  {parseFloat(riskData.metrics.correlation * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* 限额监控 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '6px' }}>
              限额监控
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* 持仓集中度 */}
              <div style={{ 
                padding: '4px 6px',
                background: '#fafafa',
                borderRadius: '3px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '2px'
                }}>
                  <span style={{ fontSize: '10px', color: '#8c8c8c' }}>持仓集中度</span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '500',
                    color: getStatusColor(getMetricStatus(riskData.metrics.concentration, riskData.limits.maxConcentration))
                  }}>
                    {parseFloat(riskData.metrics.concentration).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  percent={(riskData.metrics.concentration / riskData.limits.maxConcentration) * 100} 
                  size="small" 
                  showInfo={false}
                  strokeColor={getStatusColor(getMetricStatus(riskData.metrics.concentration, riskData.limits.maxConcentration))}
                />
              </div>
              
              {/* 杠杆率 */}
              <div style={{ 
                padding: '4px 6px',
                background: '#fafafa',
                borderRadius: '3px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '2px'
                }}>
                  <span style={{ fontSize: '10px', color: '#8c8c8c' }}>杠杆率</span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '500',
                    color: getStatusColor(getMetricStatus(riskData.metrics.leverage, riskData.limits.maxLeverage))
                  }}>
                    {parseFloat(riskData.metrics.leverage).toFixed(2)}x
                  </span>
                </div>
                <Progress 
                  percent={(riskData.metrics.leverage / riskData.limits.maxLeverage) * 100} 
                  size="small" 
                  showInfo={false}
                  strokeColor={getStatusColor(getMetricStatus(riskData.metrics.leverage, riskData.limits.maxLeverage))}
                />
              </div>
              
              {/* 流动性 */}
              <div style={{ 
                padding: '4px 6px',
                background: '#fafafa',
                borderRadius: '3px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '2px'
                }}>
                  <span style={{ fontSize: '10px', color: '#8c8c8c' }}>流动性</span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '500',
                    color: getStatusColor(getMetricStatus(riskData.metrics.liquidity, riskData.limits.minLiquidity, true))
                  }}>
                    {parseFloat(riskData.metrics.liquidity).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  percent={riskData.metrics.liquidity} 
                  size="small" 
                  showInfo={false}
                  strokeColor={getStatusColor(getMetricStatus(riskData.metrics.liquidity, riskData.limits.minLiquidity, true))}
                />
              </div>
            </div>
          </div>

          {/* 风险警报 */}
          <div>
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '6px' }}>
              <ExclamationCircleOutlined /> 风险警报
            </div>
            <List
              size="small"
              dataSource={riskData.alerts.slice(0, 3)}
              renderItem={(item) => (
                <List.Item style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      marginBottom: '2px'
                    }}>
                      {getAlertIcon(item.type)}
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '500',
                        marginLeft: '4px',
                        flex: 1
                      }}>
                        {item.title}
                      </span>
                      {item.isNew && (
                        <Badge status="processing" />
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '9px', 
                      color: '#8c8c8c',
                      lineHeight: '12px',
                      marginBottom: '2px',
                      paddingLeft: '16px'
                    }}>
                      {item.description}
                    </div>
                    <div style={{ 
                      fontSize: '8px', 
                      color: '#bfbfbf',
                      paddingLeft: '16px'
                    }}>
                      {item.time}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default RiskMonitorWidget;