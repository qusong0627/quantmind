import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Statistic, Row, Col, Progress, Tooltip } from 'antd';
import { EyeOutlined, LineChartOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const PositionsWidget = ({ isEditMode }) => {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([
    {
      id: 'pos_001',
      symbol: '000001.SZ',
      name: '平安银行',
      quantity: 1000,
      avgPrice: 12.50,
      currentPrice: 13.25,
      marketValue: 13250,
      unrealizedPnL: 750,
      unrealizedPnLPercent: 6.0,
      dayChange: 0.15,
      dayChangePercent: 1.15,
      position: 'long',
      sector: '金融',
      weight: 25.8,
      riskLevel: 'low'
    },
    {
      id: 'pos_002',
      symbol: '000858.SZ',
      name: '五粮液',
      quantity: 200,
      avgPrice: 185.60,
      currentPrice: 178.90,
      marketValue: 35780,
      unrealizedPnL: -1340,
      unrealizedPnLPercent: -3.61,
      dayChange: -2.10,
      dayChangePercent: -1.16,
      position: 'long',
      sector: '消费',
      weight: 35.2,
      riskLevel: 'medium'
    },
    {
      id: 'pos_003',
      symbol: '300750.SZ',
      name: '宁德时代',
      quantity: 100,
      avgPrice: 220.00,
      currentPrice: 235.80,
      marketValue: 23580,
      unrealizedPnL: 1580,
      unrealizedPnLPercent: 7.18,
      dayChange: 8.50,
      dayChangePercent: 3.74,
      position: 'long',
      sector: '新能源',
      weight: 23.2,
      riskLevel: 'high'
    },
    {
      id: 'pos_004',
      symbol: '600519.SH',
      name: '贵州茅台',
      quantity: 10,
      avgPrice: 1680.00,
      currentPrice: 1625.50,
      marketValue: 16255,
      unrealizedPnL: -545,
      unrealizedPnLPercent: -3.24,
      dayChange: -15.20,
      dayChangePercent: -0.93,
      position: 'long',
      sector: '消费',
      weight: 15.8,
      riskLevel: 'medium'
    }
  ]);
  
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // 模拟实时价格更新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(() => {
        setPositions(prev => prev.map(pos => {
          const priceChange = (Math.random() - 0.5) * 0.02; // ±1%的随机变动
          const newPrice = pos.currentPrice * (1 + priceChange);
          const newMarketValue = newPrice * pos.quantity;
          const newUnrealizedPnL = newMarketValue - (pos.avgPrice * pos.quantity);
          const newUnrealizedPnLPercent = (newUnrealizedPnL / (pos.avgPrice * pos.quantity)) * 100;
          const newDayChange = newPrice - pos.currentPrice;
          const newDayChangePercent = (newDayChange / pos.currentPrice) * 100;
          
          return {
            ...pos,
            currentPrice: newPrice,
            marketValue: newMarketValue,
            unrealizedPnL: newUnrealizedPnL,
            unrealizedPnLPercent: newUnrealizedPnLPercent,
            dayChange: pos.dayChange + newDayChange,
            dayChangePercent: pos.dayChangePercent + newDayChangePercent
          };
        }));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 获取风险等级标签
  const getRiskTag = (riskLevel) => {
    const riskConfig = {
      low: { color: 'green', text: '低风险' },
      medium: { color: 'orange', text: '中风险' },
      high: { color: 'red', text: '高风险' }
    };
    
    const config = riskConfig[riskLevel] || { color: 'default', text: '未知' };
    return <Tag color={config.color} size="small">{config.text}</Tag>;
  };

  // 获取行业标签颜色
  const getSectorColor = (sector) => {
    const colorMap = {
      '金融': 'blue',
      '消费': 'green',
      '新能源': 'cyan',
      '科技': 'purple',
      '医药': 'magenta',
      '制造': 'orange'
    };
    return colorMap[sector] || 'default';
  };

  // 查看持仓详情
  const viewPositionDetail = (position) => {
    setSelectedPosition(position);
    setDetailModalVisible(true);
  };

  // 查看K线图
  const viewChart = (symbol) => {
    navigate(`/chart/${symbol}`);
  };

  // 排序处理
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 排序后的数据
  const sortedPositions = React.useMemo(() => {
    if (!sortConfig.key) return positions;
    
    return [...positions].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [positions, sortConfig]);

  // 计算总计数据
  const totalMarketValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
  const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
  const totalUnrealizedPnLPercent = (totalUnrealizedPnL / (totalMarketValue - totalUnrealizedPnL)) * 100;

  const columns = [
    {
      title: '股票',
      key: 'stock',
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{record.name}</div>
          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{record.symbol}</div>
        </div>
      )
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      sorter: true,
      render: (value) => value.toLocaleString()
    },
    {
      title: '成本价',
      dataIndex: 'avgPrice',
      key: 'avgPrice',
      width: 80,
      sorter: true,
      render: (value) => `¥${value.toFixed(2)}`
    },
    {
      title: '现价',
      key: 'currentPrice',
      width: 100,
      sorter: true,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>¥{record.currentPrice.toFixed(2)}</div>
          <div style={{ 
            fontSize: '11px', 
            color: record.dayChangePercent >= 0 ? '#ff4d4f' : '#52c41a' 
          }}>
            {record.dayChangePercent >= 0 ? '+' : ''}{record.dayChangePercent.toFixed(2)}%
          </div>
        </div>
      )
    },
    {
      title: '市值',
      dataIndex: 'marketValue',
      key: 'marketValue',
      width: 100,
      sorter: true,
      render: (value) => `¥${value.toLocaleString()}`
    },
    {
      title: '盈亏',
      key: 'pnl',
      width: 100,
      sorter: (a, b) => a.unrealizedPnL - b.unrealizedPnL,
      render: (_, record) => (
        <div>
          <div style={{ 
            fontWeight: 'bold',
            color: record.unrealizedPnL >= 0 ? '#ff4d4f' : '#52c41a' 
          }}>
            {record.unrealizedPnL >= 0 ? '+' : ''}¥{record.unrealizedPnL.toFixed(0)}
          </div>
          <div style={{ 
            fontSize: '11px',
            color: record.unrealizedPnLPercent >= 0 ? '#ff4d4f' : '#52c41a' 
          }}>
            {record.unrealizedPnLPercent >= 0 ? '+' : ''}{record.unrealizedPnLPercent.toFixed(2)}%
          </div>
        </div>
      )
    },
    {
      title: '权重',
      key: 'weight',
      width: 80,
      render: (_, record) => (
        <div>
          <Progress 
            percent={record.weight} 
            size="small" 
            showInfo={false}
            strokeColor={record.weight > 30 ? '#ff4d4f' : record.weight > 20 ? '#faad14' : '#52c41a'}
          />
          <div style={{ fontSize: '11px', textAlign: 'center' }}>
            {record.weight.toFixed(1)}%
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => !isEditMode ? (
        <Space size="small">
          <Tooltip title="详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => viewPositionDetail(record)}
            />
          </Tooltip>
          <Tooltip title="K线">
            <Button
              type="text"
              size="small"
              icon={<LineChartOutlined />}
              onClick={() => viewChart(record.symbol)}
            />
          </Tooltip>
        </Space>
      ) : null
    }
  ];

  return (
    <div className="widget-content">
      <div className="widget-header">
        <h4 className="widget-title">持仓明细</h4>
        <div className="widget-actions">
          <Space>
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              总市值: ¥{totalMarketValue.toLocaleString()}
            </span>
            <span style={{ 
              fontSize: '12px', 
              color: totalUnrealizedPnL >= 0 ? '#ff4d4f' : '#52c41a',
              fontWeight: 'bold'
            }}>
              {totalUnrealizedPnL >= 0 ? '+' : ''}¥{totalUnrealizedPnL.toFixed(0)}
              ({totalUnrealizedPnL >= 0 ? '+' : ''}{totalUnrealizedPnLPercent.toFixed(2)}%)
            </span>
            {!isEditMode && (
              <Button 
                type="primary" 
                size="small"
                onClick={() => navigate('/trading')}
              >
                交易
              </Button>
            )}
          </Space>
        </div>
      </div>
      
      <div className="widget-body">
        <Table
          columns={columns}
          dataSource={sortedPositions}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 300 }}
          onChange={(pagination, filters, sorter) => {
            if (sorter.field) {
              handleSort(sorter.field);
            }
          }}
        />
        
        {positions.length === 0 && (
          <div className="widget-empty">
            <div className="widget-empty-text">暂无持仓</div>
            <Button 
              type="link"
              onClick={() => navigate('/trading')}
              disabled={isEditMode}
            >
              开始交易
            </Button>
          </div>
        )}
      </div>

      {/* 持仓详情弹窗 */}
      <Modal
        title={`持仓详情 - ${selectedPosition?.name}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="chart" 
            type="primary"
            icon={<LineChartOutlined />}
            onClick={() => {
              viewChart(selectedPosition?.symbol);
              setDetailModalVisible(false);
            }}
          >
            查看K线
          </Button>
        ]}
        width={600}
      >
        {selectedPosition && (
          <div>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <Statistic 
                  title="持仓数量" 
                  value={selectedPosition.quantity}
                  suffix="股"
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="成本价" 
                  value={selectedPosition.avgPrice}
                  prefix="¥"
                  precision={2}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="现价" 
                  value={selectedPosition.currentPrice}
                  prefix="¥"
                  precision={2}
                  valueStyle={{ 
                    color: selectedPosition.dayChangePercent >= 0 ? '#ff4d4f' : '#52c41a' 
                  }}
                />
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <Statistic 
                  title="市值" 
                  value={selectedPosition.marketValue}
                  prefix="¥"
                  precision={0}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="浮动盈亏" 
                  value={selectedPosition.unrealizedPnL}
                  prefix={selectedPosition.unrealizedPnL >= 0 ? '+¥' : '-¥'}
                  precision={0}
                  valueStyle={{ 
                    color: selectedPosition.unrealizedPnL >= 0 ? '#ff4d4f' : '#52c41a' 
                  }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="盈亏比例" 
                  value={selectedPosition.unrealizedPnLPercent}
                  suffix="%"
                  precision={2}
                  valueStyle={{ 
                    color: selectedPosition.unrealizedPnLPercent >= 0 ? '#ff4d4f' : '#52c41a' 
                  }}
                />
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Statistic 
                  title="今日涨跌" 
                  value={selectedPosition.dayChange}
                  prefix={selectedPosition.dayChange >= 0 ? '+¥' : '-¥'}
                  precision={2}
                  valueStyle={{ 
                    color: selectedPosition.dayChange >= 0 ? '#ff4d4f' : '#52c41a' 
                  }}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="持仓权重" 
                  value={selectedPosition.weight}
                  suffix="%"
                  precision={1}
                />
              </Col>
            </Row>
            
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#fafafa', 
              borderRadius: '6px' 
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>股票代码:</strong> {selectedPosition.symbol}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>所属行业:</strong> 
                <Tag color={getSectorColor(selectedPosition.sector)} style={{ marginLeft: '8px' }}>
                  {selectedPosition.sector}
                </Tag>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>风险等级:</strong> 
                <span style={{ marginLeft: '8px' }}>{getRiskTag(selectedPosition.riskLevel)}</span>
              </div>
              <div>
                <strong>持仓方向:</strong> 
                <Tag color={selectedPosition.position === 'long' ? 'green' : 'red'} style={{ marginLeft: '8px' }}>
                  {selectedPosition.position === 'long' ? '做多' : '做空'}
                </Tag>
              </div>
            </div>
            
            {selectedPosition.weight > 30 && (
              <div style={{ 
                marginTop: '12px', 
                padding: '8px 12px', 
                backgroundColor: '#fff2e8', 
                border: '1px solid #ffbb96',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <ExclamationCircleOutlined style={{ color: '#fa8c16', marginRight: '8px' }} />
                <span style={{ color: '#fa8c16', fontSize: '12px' }}>
                  持仓权重过高，建议适当分散投资风险
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PositionsWidget;