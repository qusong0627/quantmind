import React, { useState, useEffect } from 'react';
import { List, Tag, Row, Col, Space, Button, Avatar } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, PieChartOutlined, RiseOutlined, FallOutlined, EyeOutlined } from '@ant-design/icons';

const PositionOverviewWidget = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟获取A股持仓数据
    const fetchPositions = () => {
      setTimeout(() => {
        setPositions([
          {
            id: 1,
            code: '000001.SZ',
            name: '平安银行',
            shares: 1000,
            avgPrice: 12.50,
            currentPrice: 13.25,
            marketValue: 13250,
            unrealizedPnL: 750,
            unrealizedPnLPercent: 6.00,
            weight: 28.5,
            sector: '银行',
            pe: 5.2,
            pb: 0.8
          },
          {
            id: 2,
            code: '600036.SH',
            name: '招商银行',
            shares: 500,
            avgPrice: 42.80,
            currentPrice: 41.20,
            marketValue: 20600,
            unrealizedPnL: -800,
            unrealizedPnLPercent: -3.74,
            weight: 44.3,
            sector: '银行',
            pe: 4.8,
            pb: 0.9
          },
          {
            id: 3,
            code: '000858.SZ',
            name: '五粮液',
            shares: 100,
            avgPrice: 168.50,
            currentPrice: 175.30,
            marketValue: 17530,
            unrealizedPnL: 680,
            unrealizedPnLPercent: 4.04,
            weight: 37.7,
            sector: '食品饮料',
            pe: 28.5,
            pb: 4.2
          },
          {
            id: 4,
            code: '300750.SZ',
            name: '宁德时代',
            shares: 50,
            avgPrice: 420.00,
            currentPrice: 398.50,
            marketValue: 19925,
            unrealizedPnL: -1075,
            unrealizedPnLPercent: -5.12,
            weight: 42.8,
            sector: '新能源',
            pe: 35.6,
            pb: 6.8
          },
          {
            id: 5,
            code: '002415.SZ',
            name: '海康威视',
            shares: 800,
            avgPrice: 32.50,
            currentPrice: 35.80,
            marketValue: 28640,
            unrealizedPnL: 2640,
            unrealizedPnLPercent: 10.15,
            weight: 61.5,
            sector: '电子',
            pe: 18.2,
            pb: 2.1
          }
        ]);
        setLoading(false);
      }, 1000);
    };

    fetchPositions();
  }, []);

  // 获取板块颜色
  const getSectorColor = (sector) => {
    const sectorColors = {
      '银行': '#1890ff',
      '食品饮料': '#52c41a',
      '新能源': '#faad14',
      '电子': '#722ed1',
      '医药': '#eb2f96',
      '地产': '#fa8c16',
      '科技': '#13c2c2'
    };
    return sectorColors[sector] || '#8c8c8c';
  };

  // 获取风险等级颜色
  const getRiskColor = (weight) => {
    if (weight > 50) return '#ff4d4f'; // 高风险
    if (weight > 30) return '#faad14'; // 中风险
    return '#52c41a'; // 低风险
  };

  // 渲染持仓列表项
  const renderPositionItem = (item) => {
    const isProfit = item.unrealizedPnL >= 0;
    const profitColor = isProfit ? '#fff2f0' : '#f6ffed';
    const profitTextColor = isProfit ? '#ff4d4f' : '#52c41a';
    const weightColor = getRiskColor(item.weight);
    const sectorColor = getSectorColor(item.sector);
    
    return (
      <List.Item 
        className="position-item"
        style={{ 
          backgroundColor: profitColor,
          border: `1px solid ${isProfit ? '#ffccc7' : '#b7eb8f'}`,
          borderRadius: '8px',
          margin: '8px 0',
          padding: '12px 16px'
        }}
      >
        <div className="position-info" style={{ flex: '0 0 180px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar 
              size="small" 
              style={{ 
                backgroundColor: sectorColor,
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {item.name.charAt(0)}
            </Avatar>
            <div>
              <div className="position-code" style={{ 
                fontSize: '13px', 
                fontWeight: 'bold',
                color: '#262626'
              }}>
                {item.code}
              </div>
              <div className="position-name" style={{ 
                fontSize: '12px', 
                color: '#8c8c8c'
              }}>
                {item.name}
              </div>
            </div>
          </div>
          <Tag 
            color={sectorColor} 
            size="small" 
            style={{ marginTop: '4px', fontSize: '10px' }}
          >
            {item.sector}
          </Tag>
        </div>
        
        <div className="position-data" style={{ flex: '1', display: 'flex', gap: '24px' }}>
          <div className="position-shares">
            <div className="data-label" style={{ fontSize: '11px', color: '#8c8c8c' }}>持仓</div>
            <div className="data-value" style={{ fontSize: '13px', fontWeight: '600' }}>
              {item.shares.toLocaleString()}股
            </div>
          </div>
          <div className="position-price">
            <div className="data-label" style={{ fontSize: '11px', color: '#8c8c8c' }}>现价</div>
            <div className="data-value" style={{ fontSize: '13px', fontWeight: '600' }}>
              ¥{item.currentPrice.toFixed(2)}
            </div>
          </div>
          <div className="position-market-value">
            <div className="data-label" style={{ fontSize: '11px', color: '#8c8c8c' }}>市值</div>
            <div className="data-value" style={{ fontSize: '13px', fontWeight: '600' }}>
              ¥{(item.marketValue / 10000).toFixed(2)}万
            </div>
          </div>
          <div className="position-valuation">
            <div className="data-label" style={{ fontSize: '11px', color: '#8c8c8c' }}>PE/PB</div>
            <div className="data-value" style={{ fontSize: '12px' }}>
              {item.pe}/{item.pb}
            </div>
          </div>
        </div>
        
        <div className="position-performance" style={{ flex: '0 0 120px', textAlign: 'right' }}>
          <div className="position-pnl" style={{ 
            color: profitTextColor,
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '4px'
          }}>
            {isProfit ? <RiseOutlined /> : <FallOutlined />}
            <span>{isProfit ? '+' : ''}¥{Math.abs(item.unrealizedPnL).toFixed(0)}</span>
          </div>
          <div className="pnl-percent" style={{ 
            color: profitTextColor,
            fontSize: '12px',
            marginTop: '2px'
          }}>
            ({isProfit ? '+' : ''}{item.unrealizedPnLPercent.toFixed(2)}%)
          </div>
          <div className="position-weight" style={{ marginTop: '4px' }}>
            <Tag 
              color={weightColor === '#ff4d4f' ? 'red' : weightColor === '#faad14' ? 'orange' : 'green'}
              size="small"
            >
              仓位 {item.weight.toFixed(1)}%
            </Tag>
            {item.weight > 50 && <span style={{ color: '#ff4d4f', fontSize: '12px' }}>⚠️高仓位</span>}
          </div>
        </div>
        
        <Button 
          type="text" 
          size="small" 
          icon={<EyeOutlined />}
          className="position-action"
          onClick={() => console.log('查看持仓详情:', item.code)}
          style={{ marginLeft: '8px' }}
        />
      </List.Item>
    );
  };

  const totalMarketValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
  const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
  const totalUnrealizedPnLPercent = totalMarketValue > 0 ? (totalUnrealizedPnL / (totalMarketValue - totalUnrealizedPnL)) * 100 : 0;
  const avgPE = positions.reduce((sum, pos) => sum + pos.pe * pos.weight, 0) / positions.reduce((sum, pos) => sum + pos.weight, 0);

  return (
    <div className="widget-content position-overview-widget">
      <div className="widget-header">
        <div className="widget-title-group">
          <Space>
            <PieChartOutlined style={{ color: '#1890ff' }} />
            <h4 className="widget-title">持仓概览</h4>
            <Tag color="blue" size="small">{positions.length}只A股</Tag>
          </Space>
        </div>
        <div className="widget-actions">
          <Button type="link" size="small" icon={<EyeOutlined />}>
            详细分析
          </Button>
        </div>
      </div>

      <div className="widget-body">
        {/* 统计概览区 */}
        <Row gutter={16} className="position-stats" style={{ marginBottom: '16px' }}>
          <Col span={6}>
            <div className="stat-item" style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '8px' }}>
              <div className="stat-value" style={{ 
                color: '#1890ff', 
                fontSize: '18px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                <RiseOutlined />
                ¥{(totalMarketValue / 10000).toFixed(1)}万
              </div>
              <div className="stat-label" style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>总市值</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="stat-item" style={{ 
              textAlign: 'center', 
              padding: '12px', 
              backgroundColor: totalUnrealizedPnL >= 0 ? '#fff2f0' : '#f6ffed',
              borderRadius: '8px'
            }}>
              <div className="stat-value" style={{ 
                color: totalUnrealizedPnL >= 0 ? '#ff4d4f' : '#52c41a',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                {totalUnrealizedPnL >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {totalUnrealizedPnL >= 0 ? '+' : ''}¥{Math.abs(totalUnrealizedPnL).toFixed(0)}
              </div>
              <div className="stat-label" style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>浮动盈亏</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="stat-item" style={{ 
              textAlign: 'center', 
              padding: '12px', 
              backgroundColor: totalUnrealizedPnLPercent >= 0 ? '#fff2f0' : '#f6ffed',
              borderRadius: '8px'
            }}>
              <div className="stat-value" style={{ 
                color: totalUnrealizedPnLPercent >= 0 ? '#ff4d4f' : '#52c41a',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {totalUnrealizedPnLPercent >= 0 ? '+' : ''}{Math.abs(totalUnrealizedPnLPercent).toFixed(2)}%
              </div>
              <div className="stat-label" style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>总收益率</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="stat-item" style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f0f5ff', borderRadius: '8px' }}>
              <div className="stat-value" style={{ 
                color: '#722ed1',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {avgPE.toFixed(1)}
              </div>
              <div className="stat-label" style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>平均PE</div>
            </div>
          </Col>
        </Row>
        
        {/* 持仓列表区 */}
        <div className="position-list">
          <List
            dataSource={positions}
            loading={loading}
            renderItem={renderPositionItem}
            size="small"
            style={{ backgroundColor: 'transparent' }}
          />
        </div>
      </div>
    </div>
  );
};

export default PositionOverviewWidget;