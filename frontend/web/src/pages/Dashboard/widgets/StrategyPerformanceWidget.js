import React, { useState, useEffect } from 'react';
import { List, Button, Tag, Row, Col, Space, Tooltip } from 'antd';
import { TrophyOutlined, ArrowUpOutlined, ArrowDownOutlined, EyeOutlined, ThunderboltOutlined } from '@ant-design/icons';

function StrategyPerformanceWidget() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟获取策略数据
    const fetchData = () => {
      setTimeout(() => {
        const strategyData = [
          {
            id: 1,
            name: '量化多因子策略',
            totalReturn: 18.5,
            status: 'running',
            risk: 'low',
            winRate: 68.2,
            sharpeRatio: 1.8
          },
          {
            id: 2,
            name: '均值回归策略',
            totalReturn: 12.8,
            status: 'running',
            risk: 'medium',
            winRate: 55.4,
            sharpeRatio: 1.2
          },
          {
            id: 3,
            name: '动量追踪策略',
            totalReturn: -3.2,
            status: 'stopped',
            risk: 'high',
            winRate: 42.1,
            sharpeRatio: 0.6
          },
          {
            id: 4,
            name: '套利策略',
            totalReturn: 8.9,
            status: 'running',
            risk: 'low',
            winRate: 72.5,
            sharpeRatio: 1.5
          },
          {
            id: 5,
            name: '趋势跟踪策略',
            totalReturn: 15.3,
            status: 'running',
            risk: 'medium',
            winRate: 60.8,
            sharpeRatio: 1.4
          }
        ];
        
        setStrategies(strategyData);
        setLoading(false);
      }, 800);
    };

    fetchData();
  }, []);

  // 计算统计数据
  const totalStrategies = strategies.length;
  const runningStrategies = strategies.filter(s => s.status === 'running').length;
  const averageReturn = strategies.length > 0 
    ? strategies.reduce((sum, s) => sum + s.totalReturn, 0) / strategies.length 
    : 0;
  const bestStrategy = strategies.length > 0 
    ? strategies.reduce((best, current) => 
        current.totalReturn > best.totalReturn ? current : best
      )
    : null;

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      default: return 'default';
    }
  };

  const getRiskLabel = (risk) => {
    switch(risk) {
      case 'low': return '低风险';
      case 'medium': return '中风险';
      case 'high': return '高风险';
      default: return '未知';
    }
  };

  const renderStrategyItem = (item) => (
    <List.Item
      actions={[
        <Tooltip title="查看详情">
          <Button 
            type="text" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => console.log('查看策略详情:', item.name)}
          />
        </Tooltip>
      ]}
      style={{ padding: '12px 16px' }}
    >
      <List.Item.Meta
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#262626' }}>
              {item.totalReturn >= 15 && <ThunderboltOutlined style={{ color: '#f50', marginRight: 4 }} />}
              {item.name}
            </span>
            <Space size={4}>
              <Tag color={item.status === 'running' ? 'green' : 'red'} size="small">
                {item.status === 'running' ? '运行中' : '已停止'}
              </Tag>
              <Tag color={getRiskColor(item.risk)} size="small">
                {getRiskLabel(item.risk)}
              </Tag>
            </Space>
          </div>
        }
        description={
          <div style={{ marginTop: 8 }}>
            {/* 收益率 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ 
                color: item.totalReturn >= 0 ? '#ff4d4f' : '#52c41a',
                fontWeight: 'bold',
                fontSize: '18px',
                marginRight: 8
              }}>
                {item.totalReturn >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(item.totalReturn).toFixed(1)}%
              </span>
              <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                总收益率
              </span>
            </div>
            
            {/* 详细指标 */}
            <Row gutter={16} style={{ fontSize: '12px', color: '#666' }}>
              <Col span={8}>
                <span>胜率: </span>
                <span style={{ 
                  color: item.winRate >= 60 ? '#ff4d4f' : item.winRate >= 50 ? '#faad14' : '#52c41a',
                  fontWeight: '500'
                }}>
                  {item.winRate.toFixed(1)}%
                </span>
              </Col>
              <Col span={8}>
                <span>夏普: </span>
                <span style={{ 
                  color: item.sharpeRatio >= 1.5 ? '#ff4d4f' : item.sharpeRatio >= 1 ? '#faad14' : '#52c41a',
                  fontWeight: '500'
                }}>
                  {item.sharpeRatio.toFixed(1)}
                </span>
              </Col>
              <Col span={8}>
                <span style={{ color: item.status === 'running' ? '#ff4d4f' : '#8c8c8c' }}>
                  {item.status === 'running' ? '实时跟踪' : '已暂停'}
                </span>
              </Col>
            </Row>
          </div>
        }
      />
    </List.Item>
  );

  return (
    <div className="widget-content strategy-performance-widget strategy-scroll-container">
      <div className="widget-header">
        <h3 className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrophyOutlined style={{ color: '#f50' }} />
          策略表现
          <Tag color="blue" size="small">{totalStrategies}个策略</Tag>
        </h3>
        <div className="widget-actions">
          <Button type="link" size="small" icon={<EyeOutlined />}>
            查看全部
          </Button>
        </div>
      </div>

      <div className="widget-body strategy-scroll-body">
        {/* 统计概览区 - 紧凑布局 */}
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <div style={{ textAlign: 'center', padding: '8px 4px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff', marginBottom: 2 }}>
                {totalStrategies}
              </div>
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>总策略数</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center', padding: '8px 4px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f', marginBottom: 2 }}>
                {runningStrategies}
              </div>
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>运行中</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center', padding: '8px 4px' }}>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: averageReturn >= 0 ? '#ff4d4f' : '#52c41a',
                marginBottom: 2
              }}>
                {averageReturn >= 0 ? '+' : ''}{averageReturn.toFixed(1)}%
              </div>
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>平均收益</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center', padding: '8px 4px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f50', marginBottom: 2 }}>
                {bestStrategy ? `+${bestStrategy.totalReturn.toFixed(1)}%` : '0%'}
              </div>
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>最佳表现</div>
            </div>
          </Col>
        </Row>

        {/* 策略列表区 - 自适应高度 */}
        <div className="strategy-list">
          <List
            dataSource={strategies}
            loading={loading}
            renderItem={renderStrategyItem}
            size="small"
            className="strategy-list-scroll"
          />
        </div>
      </div>
    </div>
  );
};

export default StrategyPerformanceWidget;