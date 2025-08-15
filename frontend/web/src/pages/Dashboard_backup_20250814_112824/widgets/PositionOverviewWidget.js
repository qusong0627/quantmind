import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, PieChartOutlined } from '@ant-design/icons';

const PositionOverviewWidget = ({ isEditMode, lastUpdateTime }) => {
  const [positionData, setPositionData] = useState({
    totalValue: 1250000,
    totalCost: 1180000,
    totalProfit: 70000,
    totalProfitPercent: 5.93,
    todayProfit: 12500,
    todayProfitPercent: 1.01,
    positionCount: 8,
    availableCash: 85000,
    marketValue: 1165000,
    sectors: [
      { name: '金融', value: 35, color: '#1890ff' },
      { name: '科技', value: 28, color: '#52c41a' },
      { name: '消费', value: 20, color: '#faad14' },
      { name: '医药', value: 12, color: '#722ed1' },
      { name: '其他', value: 5, color: '#8c8c8c' }
    ]
  });

  // 刷新持仓数据
  const refreshPositionData = () => {
    if (isEditMode) return;
    
    setPositionData(prev => ({
      ...prev,
      totalValue: prev.totalValue + (Math.random() - 0.5) * 10000,
      todayProfit: (Math.random() - 0.5) * 20000,
      todayProfitPercent: (Math.random() - 0.5) * 2
    }));
  };

  // 自动刷新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(refreshPositionData, 15000); // 15秒刷新一次
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshPositionData();
    }
  }, [lastUpdateTime, isEditMode]);

  const formatCurrency = (value) => {
    return `¥${(value / 10000).toFixed(2)}万`;
  };

  const formatPercent = (value) => {
    const isPositive = value >= 0;
    const color = isPositive ? '#52c41a' : '#ff4d4f';
    const icon = isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
    return (
      <span style={{ color }}>
        {icon} {Math.abs(value).toFixed(2)}%
      </span>
    );
  };

  return (
    <Card
      title="持仓概览"
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px 20px', height: 'calc(100% - 57px)', overflow: 'auto' }}
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
          持仓概览组件 - 编辑模式
        </div>
      ) : (
        <div style={{ height: '100%' }}>
          {/* 总体统计 */}
          <Row gutter={[8, 8]} style={{ marginBottom: '12px' }}>
            <Col span={12}>
              <div style={{ 
                padding: '8px',
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '4px'
              }}>
                <Statistic
                  title="总资产"
                  value={positionData.totalValue}
                  formatter={(value) => formatCurrency(value)}
                  valueStyle={{ fontSize: '16px', fontWeight: '600' }}
                  prefix={<DollarOutlined />}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ 
                padding: '8px',
                background: positionData.totalProfit >= 0 ? '#f6ffed' : '#fff2f0',
                border: `1px solid ${positionData.totalProfit >= 0 ? '#b7eb8f' : '#ffccc7'}`,
                borderRadius: '4px'
              }}>
                <Statistic
                  title="总盈亏"
                  value={positionData.totalProfit}
                  formatter={(value) => formatCurrency(value)}
                  valueStyle={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: positionData.totalProfit >= 0 ? '#52c41a' : '#ff4d4f'
                  }}
                  suffix={formatPercent(positionData.totalProfitPercent)}
                />
              </div>
            </Col>
          </Row>

          {/* 今日盈亏 */}
          <Row gutter={[8, 8]} style={{ marginBottom: '12px' }}>
            <Col span={24}>
              <div style={{ 
                padding: '8px',
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                borderRadius: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>今日盈亏</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: positionData.todayProfit >= 0 ? '#52c41a' : '#ff4d4f'
                    }}>
                      {positionData.todayProfit >= 0 ? '+' : ''}{formatCurrency(positionData.todayProfit)}
                    </div>
                    <div style={{ fontSize: '11px' }}>
                      {formatPercent(positionData.todayProfitPercent)}
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* 资产分布 */}
          <Row gutter={[8, 8]} style={{ marginBottom: '12px' }}>
            <Col span={12}>
              <div style={{ 
                padding: '8px',
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>持仓数量</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1890ff' }}>
                  {positionData.positionCount}
                </div>
                <div style={{ fontSize: '10px', color: '#8c8c8c' }}>只股票</div>
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
                <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>可用资金</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#52c41a' }}>
                  {formatCurrency(positionData.availableCash)}
                </div>
                <div style={{ fontSize: '10px', color: '#8c8c8c' }}>现金</div>
              </div>
            </Col>
          </Row>

          {/* 行业分布 */}
          <div style={{ 
            padding: '8px',
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
              <PieChartOutlined /> 行业分布
            </div>
            {positionData.sectors.map((sector, index) => (
              <div key={sector.name} style={{ marginBottom: '6px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '2px'
                }}>
                  <span style={{ fontSize: '11px' }}>{sector.name}</span>
                  <span style={{ fontSize: '11px', fontWeight: '500' }}>{sector.value}%</span>
                </div>
                <Progress 
                  percent={sector.value} 
                  size="small" 
                  showInfo={false}
                  strokeColor={sector.color}
                  trailColor="#f0f0f0"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default PositionOverviewWidget;