import React, { useState, useEffect } from 'react';
import { Card, Table, Progress, Tag, Tooltip, Row, Col, Statistic } from 'antd';
import { 
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  PieChartOutlined,
  DollarOutlined,
  PercentageOutlined,
  TrophyOutlined,
  WarningOutlined
} from '@ant-design/icons';

const PortfolioWidget = ({ isEditMode, lastUpdateTime }) => {
  const [portfolioData, setPortfolioData] = useState({
    summary: {
      totalValue: 1250000,
      totalCost: 1180000,
      totalPnL: 70000,
      totalPnLPercent: 5.93,
      dayPnL: 8500,
      dayPnLPercent: 0.68,
      positions: 12,
      cash: 85000
    },
    holdings: [
      {
        key: '1',
        symbol: '000001',
        name: '平安银行',
        quantity: 10000,
        avgPrice: 12.50,
        currentPrice: 13.25,
        marketValue: 132500,
        pnl: 7500,
        pnlPercent: 6.0,
        dayChange: 0.15,
        dayChangePercent: 1.15,
        weight: 10.6,
        sector: '金融'
      },
      {
        key: '2',
        symbol: '000858',
        name: '五粮液',
        quantity: 800,
        avgPrice: 185.20,
        currentPrice: 192.80,
        marketValue: 154240,
        pnl: 6080,
        pnlPercent: 4.1,
        dayChange: -2.40,
        dayChangePercent: -1.23,
        weight: 12.3,
        sector: '消费'
      },
      {
        key: '3',
        symbol: '002415',
        name: '海康威视',
        quantity: 3000,
        avgPrice: 42.80,
        currentPrice: 45.60,
        marketValue: 136800,
        pnl: 8400,
        pnlPercent: 6.54,
        dayChange: 0.80,
        dayChangePercent: 1.79,
        weight: 10.9,
        sector: '科技'
      },
      {
        key: '4',
        symbol: '300750',
        name: '宁德时代',
        quantity: 600,
        avgPrice: 220.50,
        currentPrice: 235.80,
        marketValue: 141480,
        pnl: 9180,
        pnlPercent: 6.94,
        dayChange: 3.20,
        dayChangePercent: 1.38,
        weight: 11.3,
        sector: '新能源'
      },
      {
        key: '5',
        symbol: '600519',
        name: '贵州茅台',
        quantity: 100,
        avgPrice: 1680.00,
        currentPrice: 1725.50,
        marketValue: 172550,
        pnl: 4550,
        pnlPercent: 2.71,
        dayChange: -8.50,
        dayChangePercent: -0.49,
        weight: 13.8,
        sector: '消费'
      },
      {
        key: '6',
        symbol: '000002',
        name: '万科A',
        quantity: 8000,
        avgPrice: 18.20,
        currentPrice: 16.85,
        marketValue: 134800,
        pnl: -10800,
        pnlPercent: -7.42,
        dayChange: -0.25,
        dayChangePercent: -1.46,
        weight: 10.8,
        sector: '地产'
      }
    ],
    sectors: [
      { name: '消费', weight: 26.1, pnl: 10630, color: '#52c41a' },
      { name: '科技', weight: 15.2, pnl: 12400, color: '#1890ff' },
      { name: '金融', weight: 18.5, pnl: 7500, color: '#faad14' },
      { name: '新能源', weight: 11.3, pnl: 9180, color: '#722ed1' },
      { name: '地产', weight: 10.8, pnl: -10800, color: '#ff4d4f' },
      { name: '其他', weight: 18.1, pnl: 5090, color: '#8c8c8c' }
    ]
  });

  // 刷新持仓数据
  const refreshPortfolioData = () => {
    if (isEditMode) return;
    
    setPortfolioData(prev => ({
      ...prev,
      summary: {
        ...prev.summary,
        dayPnL: prev.summary.dayPnL + (Math.random() - 0.5) * 5000,
        dayPnLPercent: prev.summary.dayPnLPercent + (Math.random() - 0.5) * 0.5
      },
      holdings: prev.holdings.map(holding => ({
        ...holding,
        currentPrice: Math.max(holding.currentPrice * 0.9, holding.currentPrice + (Math.random() - 0.5) * holding.currentPrice * 0.03),
        dayChange: (Math.random() - 0.5) * 2,
        dayChangePercent: (Math.random() - 0.5) * 3
      }))
    }));
  };

  // 自动刷新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(refreshPortfolioData, 15000); // 15秒刷新一次
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshPortfolioData();
    }
  }, [lastUpdateTime, isEditMode]);

  const getChangeIcon = (change) => {
    if (change > 0) return <ArrowUpOutlined />;
    if (change < 0) return <ArrowDownOutlined />;
    return <MinusOutlined />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return '#52c41a';
    if (change < 0) return '#ff4d4f';
    return '#8c8c8c';
  };

  const formatNumber = (num) => {
    if (Math.abs(num) >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  const formatPercent = (percent) => {
    return (percent >= 0 ? '+' : '') + percent.toFixed(2) + '%';
  };

  const columns = [
    {
      title: '股票',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 80,
      render: (text, record) => (
        <div>
          <div style={{ fontSize: '10px', fontWeight: '500' }}>{text}</div>
          <div style={{ fontSize: '8px', color: '#8c8c8c' }}>
            {record.name.length > 4 ? record.name.substring(0, 4) + '...' : record.name}
          </div>
        </div>
      )
    },
    {
      title: '持仓',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 60,
      render: (text) => (
        <span style={{ fontSize: '9px' }}>{formatNumber(text)}</span>
      )
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 60,
      render: (text, record) => (
        <div>
          <div style={{ fontSize: '10px', fontWeight: '500' }}>
            {text.toFixed(2)}
          </div>
          <div style={{ 
            fontSize: '8px',
            color: getChangeColor(record.dayChange)
          }}>
            {getChangeIcon(record.dayChange)} {formatPercent(record.dayChangePercent)}
          </div>
        </div>
      )
    },
    {
      title: '市值',
      dataIndex: 'marketValue',
      key: 'marketValue',
      width: 70,
      render: (text, record) => (
        <div>
          <div style={{ fontSize: '10px', fontWeight: '500' }}>
            {formatNumber(text)}
          </div>
          <div style={{ fontSize: '8px', color: '#8c8c8c' }}>
            {record.weight.toFixed(1)}%
          </div>
        </div>
      )
    },
    {
      title: '盈亏',
      dataIndex: 'pnl',
      key: 'pnl',
      width: 70,
      render: (text, record) => (
        <div>
          <div style={{ 
            fontSize: '10px', 
            fontWeight: '500',
            color: getChangeColor(text)
          }}>
            {getChangeIcon(text)} {formatNumber(Math.abs(text))}
          </div>
          <div style={{ 
            fontSize: '8px',
            color: getChangeColor(text)
          }}>
            {formatPercent(record.pnlPercent)}
          </div>
        </div>
      )
    },
    {
      title: '板块',
      dataIndex: 'sector',
      key: 'sector',
      width: 50,
      render: (text) => (
        <Tag size="small" style={{ fontSize: '8px', margin: 0 }}>
          {text}
        </Tag>
      )
    }
  ];

  return (
    <Card
      title="持仓组合"
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px 20px', height: 'calc(100% - 57px)', overflow: 'auto' }}
      extra={
        <Tooltip title="组合总览">
          <PieChartOutlined />
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
          持仓组合组件 - 编辑模式
        </div>
      ) : (
        <div style={{ height: '100%' }}>
          {/* 组合概览 */}
          <Row gutter={[8, 8]} style={{ marginBottom: '12px' }}>
            <Col span={12}>
              <div style={{ 
                padding: '8px',
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', color: '#8c8c8c', marginBottom: '4px' }}>
                  <DollarOutlined /> 总市值
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>
                  {formatNumber(portfolioData.summary.totalValue)}
                </div>
                <div style={{ 
                  fontSize: '9px',
                  color: getChangeColor(portfolioData.summary.totalPnL)
                }}>
                  {getChangeIcon(portfolioData.summary.totalPnL)} 
                  {formatNumber(Math.abs(portfolioData.summary.totalPnL))} 
                  ({formatPercent(portfolioData.summary.totalPnLPercent)})
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
                <div style={{ fontSize: '10px', color: '#8c8c8c', marginBottom: '4px' }}>
                  <PercentageOutlined /> 今日盈亏
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '2px',
                  color: getChangeColor(portfolioData.summary.dayPnL)
                }}>
                  {getChangeIcon(portfolioData.summary.dayPnL)} 
                  {formatNumber(Math.abs(portfolioData.summary.dayPnL))}
                </div>
                <div style={{ 
                  fontSize: '9px',
                  color: getChangeColor(portfolioData.summary.dayPnL)
                }}>
                  {formatPercent(portfolioData.summary.dayPnLPercent)}
                </div>
              </div>
            </Col>
          </Row>

          {/* 板块分布 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '6px' }}>
              板块分布
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {portfolioData.sectors.slice(0, 4).map((sector, index) => (
                <div key={sector.name} style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  padding: '4px 6px',
                  background: '#fafafa',
                  borderRadius: '3px'
                }}>
                  <span style={{ 
                    fontSize: '10px', 
                    width: '35px', 
                    flexShrink: 0,
                    color: sector.color
                  }}>
                    {sector.name}
                  </span>
                  <Progress 
                    percent={sector.weight} 
                    size="small" 
                    showInfo={false}
                    strokeColor={sector.color}
                    style={{ flex: 1, marginRight: '6px' }}
                  />
                  <span style={{ 
                    fontSize: '9px', 
                    fontWeight: '500',
                    width: '25px',
                    textAlign: 'right',
                    marginRight: '4px'
                  }}>
                    {sector.weight.toFixed(1)}%
                  </span>
                  <span style={{ 
                    fontSize: '8px',
                    color: getChangeColor(sector.pnl),
                    width: '30px',
                    textAlign: 'right'
                  }}>
                    {getChangeIcon(sector.pnl)} {formatNumber(Math.abs(sector.pnl))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 持仓明细 */}
          <div>
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '6px' }}>
              持仓明细 ({portfolioData.summary.positions}只)
            </div>
            <Table
              columns={columns}
              dataSource={portfolioData.holdings}
              pagination={false}
              size="small"
              scroll={{ y: 200 }}
              style={{ 
                fontSize: '10px',
                '& .ant-table-thead > tr > th': {
                  fontSize: '9px',
                  padding: '4px 6px',
                  background: '#fafafa'
                },
                '& .ant-table-tbody > tr > td': {
                  fontSize: '9px',
                  padding: '4px 6px'
                }
              }}
            />
          </div>

          {/* 风险提示 */}
          {portfolioData.holdings.some(h => h.weight > 15) && (
            <div style={{ 
              marginTop: '8px',
              padding: '6px',
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <WarningOutlined style={{ color: '#faad14', marginRight: '4px', fontSize: '10px' }} />
              <span style={{ fontSize: '9px', color: '#d48806' }}>
                部分持仓占比过高，建议分散投资
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default PortfolioWidget;