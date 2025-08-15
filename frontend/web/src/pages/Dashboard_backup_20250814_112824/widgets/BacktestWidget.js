import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Divider } from 'antd';
import { BarChartOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';

const BacktestWidget = ({ isEditMode, lastUpdateTime }) => {
  // 演示数据
  const backtestData = {
    strategyName: '量化多因子策略',
    period: '2023-01-01 至 2024-01-01',
    totalReturn: 23.45,
    annualizedReturn: 18.67,
    maxDrawdown: -8.32,
    sharpeRatio: 1.85,
    winRate: 67.8,
    totalTrades: 156,
    profitTrades: 106,
    lossTrades: 50
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChartOutlined />
          <span>回测结果</span>
        </div>
      }
      size="small"
      styles={{
        body: { padding: '16px' }
      }}
      extra={
        <Tag color="green">已完成</Tag>
      }
    >
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
          {backtestData.strategyName}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          回测周期: {backtestData.period}
        </div>
      </div>
      
      <Row gutter={[16, 12]}>
        <Col span={12}>
          <Statistic
            title="总收益率"
            value={backtestData.totalReturn}
            precision={2}
            suffix="%"
            valueStyle={{ 
              color: backtestData.totalReturn > 0 ? '#3f8600' : '#cf1322',
              fontSize: '16px'
            }}
            prefix={backtestData.totalReturn > 0 ? <RiseOutlined /> : <FallOutlined />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="年化收益率"
            value={backtestData.annualizedReturn}
            precision={2}
            suffix="%"
            valueStyle={{ 
              color: backtestData.annualizedReturn > 0 ? '#3f8600' : '#cf1322',
              fontSize: '16px'
            }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="最大回撤"
            value={Math.abs(backtestData.maxDrawdown)}
            precision={2}
            suffix="%"
            valueStyle={{ color: '#cf1322', fontSize: '16px' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="夏普比率"
            value={backtestData.sharpeRatio}
            precision={2}
            valueStyle={{ 
              color: backtestData.sharpeRatio > 1 ? '#3f8600' : '#faad14',
              fontSize: '16px'
            }}
          />
        </Col>
      </Row>
      
      <Divider style={{ margin: '12px 0' }} />
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px' }}>胜率</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{backtestData.winRate}%</span>
        </div>
        <Progress 
          percent={backtestData.winRate} 
          size="small" 
          strokeColor={backtestData.winRate > 60 ? '#52c41a' : '#faad14'}
          showInfo={false}
        />
      </div>
      
      <Row gutter={16} style={{ fontSize: '12px', color: '#666' }}>
        <Col span={8}>
          <div>总交易: {backtestData.totalTrades}</div>
        </Col>
        <Col span={8}>
          <div style={{ color: '#52c41a' }}>盈利: {backtestData.profitTrades}</div>
        </Col>
        <Col span={8}>
          <div style={{ color: '#ff4d4f' }}>亏损: {backtestData.lossTrades}</div>
        </Col>
      </Row>
    </Card>
  );
};

export default BacktestWidget;