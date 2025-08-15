import React, { useState, useEffect } from 'react';
import { Card, List, Space, Tag, Tabs, Badge, Tooltip, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, FireOutlined, TrophyOutlined, ThunderboltOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';

const { Text } = Typography;

function TopMoversWidget({ isEditMode }) {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [volume, setVolume] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟获取涨跌排行数据
    const fetchData = () => {
      setTimeout(() => {
        // 涨幅榜
        setGainers([
          {
            id: 1,
            symbol: '000858.SZ',
            name: '五粮液',
            price: 179.18,
            change: 8.56,
            changePercent: 5.02,
            volume: '28.5万手'
          },
          {
            id: 2,
            symbol: '600519.SH',
            name: '贵州茅台',
            price: 1680.56,
            change: 79.80,
            changePercent: 4.98,
            volume: '12.3万手'
          },
          {
            id: 3,
            symbol: '000002.SZ',
            name: '万科A',
            price: 18.74,
            change: 0.85,
            changePercent: 4.75,
            volume: '89.6万手'
          },
          {
            id: 4,
            symbol: '600036.SH',
            name: '招商银行',
            price: 45.28,
            change: 1.98,
            changePercent: 4.57,
            volume: '65.2万手'
          },
          {
            id: 5,
            symbol: '002415.SZ',
            name: '海康威视',
            price: 32.73,
            change: 1.38,
            changePercent: 4.40,
            volume: '31.7万手'
          }
        ]);
        
        // 跌幅榜
        setLosers([
          {
            id: 1,
            symbol: '000001.SZ',
            name: '平安银行',
            price: 12.71,
            change: -0.68,
            changePercent: -5.08,
            volume: '18.9万手'
          },
          {
            id: 2,
            symbol: '300059.SZ',
            name: '东方财富',
            price: 18.79,
            change: -0.94,
            changePercent: -4.76,
            volume: '12.4万手'
          },
          {
            id: 3,
            symbol: '000300.SZ',
            name: '美的集团',
            price: 68.87,
            change: -3.15,
            changePercent: -4.37,
            volume: '25.8万手'
          },
          {
            id: 4,
            symbol: '002594.SZ',
            name: '比亚迪',
            price: 285.60,
            change: -11.40,
            changePercent: -3.84,
            volume: '33.5万手'
          },
          {
            id: 5,
            symbol: '000725.SZ',
            name: '京东方A',
            price: 4.28,
            change: -0.15,
            changePercent: -3.39,
            volume: '8.7万手'
          }
        ]);
        
        // 成交量榜
        setVolume([
          {
            id: 1,
            symbol: '000002.SZ',
            name: '万科A',
            price: 18.74,
            change: 0.85,
            changePercent: 4.75,
            volume: '189.3万手',
            volumeRatio: 2.1
          },
          {
            id: 2,
            symbol: '600036.SH',
            name: '招商银行',
            price: 45.28,
            change: 1.98,
            changePercent: 4.57,
            volume: '165.2万手',
            volumeRatio: 1.8
          },
          {
            id: 3,
            symbol: '002415.SZ',
            name: '海康威视',
            price: 32.73,
            change: 1.38,
            changePercent: 4.40,
            volume: '142.1万手',
            volumeRatio: 1.9
          },
          {
            id: 4,
            symbol: '000001.SZ',
            name: '平安银行',
            price: 12.71,
            change: -0.68,
            changePercent: -5.08,
            volume: '133.5万手',
            volumeRatio: 1.3
          },
          {
            id: 5,
            symbol: '000858.SZ',
            name: '五粮液',
            price: 179.18,
            change: 8.56,
            changePercent: 5.02,
            volume: '131.7万手',
            volumeRatio: 1.5
          }
        ]);
        
        setLoading(false);
      }, 1000);
    };

    fetchData();
  }, []);

  const renderStockItem = (item, index, showVolumeRatio = false) => {
    const isPositive = item.change >= 0;
    const changeColor = isPositive ? '#ff4d4f' : '#52c41a';
    const changeIcon = isPositive ? <RiseOutlined /> : <FallOutlined />;
    
    return (
      <List.Item
        key={item.id}
        style={{ 
          padding: '16px',
          margin: '8px 0',
          borderRadius: '8px',
          border: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        className="top-mover-item"
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%'
        }}>
          {/* 左侧：排名和股票信息 */}
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '6px', 
              backgroundColor: index < 3 ? '#1890ff' : '#d9d9d9',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              marginRight: '12px'
            }}>
              {index < 3 ? <TrophyOutlined /> : index + 1}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <Text strong style={{ fontSize: '16px', marginRight: '8px' }}>
                  {item.symbol}
                </Text>
                {index < 3 && (
                  <Badge 
                    count={index === 0 ? '冠军' : index === 1 ? '亚军' : '季军'} 
                    style={{ 
                      backgroundColor: index === 0 ? '#f50' : index === 1 ? '#faad14' : '#52c41a',
                      fontSize: '10px'
                    }} 
                  />
                )}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {item.name}
              </Text>
            </div>
          </div>
          
          {/* 中间：价格 */}
          <div style={{ textAlign: 'center', minWidth: '80px' }}>
            <Text strong style={{ fontSize: '16px', display: 'block' }}>
                ¥{item.price.toFixed(2)}
              </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              成交量: {item.volume}
            </Text>
          </div>
          
          {/* 右侧：涨跌幅 */}
          <div style={{ textAlign: 'right', minWidth: '80px' }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginBottom: '4px'
            }}>
              <Tag 
                color={isPositive ? 'success' : 'error'}
                icon={changeIcon}
                style={{ 
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: 'none'
                }}
              >
                {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
              </Tag>
            </div>
            <Text 
              style={{ 
                fontSize: '11px', 
                color: changeColor,
                fontWeight: '500'
              }}
            >
              {isPositive ? '+' : ''}¥{item.change.toFixed(2)}
            </Text>
            {showVolumeRatio && (
              <div style={{ marginTop: '4px' }}>
                <Tag 
                  size="small" 
                  color={item.volumeRatio >= 2 ? 'red' : item.volumeRatio >= 1.5 ? 'orange' : 'blue'}
                  style={{ fontSize: '10px' }}
                >
                  量比: {item.volumeRatio.toFixed(1)}
                </Tag>
              </div>
            )}
          </div>
        </div>
      </List.Item>
    );
  };

  return (
    <div className="widget-content">
      <div className="widget-header">
        <Space>
          <TrophyOutlined style={{ color: '#1890ff' }} />
          <h4 className="widget-title">涨跌排行</h4>
          <Badge count={gainers.length + losers.length} style={{ backgroundColor: '#1890ff' }} />
        </Space>
      </div>
      
      <div className="widget-body">
        <Tabs
          defaultActiveKey="gainers"
          size="small"
          centered
          style={{ height: '100%' }}
          items={[
            {
              key: 'gainers',
              label: (
                <Space>
                  <RiseOutlined style={{ color: '#ff4d4f' }} />
                  <span>涨幅榜</span>
                  <Badge count={gainers.length} size="small" style={{ backgroundColor: '#ff4d4f' }} />
                </Space>
              ),
              children: (
                <List
                  dataSource={gainers}
                  loading={loading}
                  size="small"
                  className="top-movers-scroll"
                  renderItem={(item, index) => renderStockItem(item, index)}
                />
              )
            },
            {
              key: 'losers',
              label: (
                <Space>
                  <FallOutlined style={{ color: '#52c41a' }} />
                  <span>跌幅榜</span>
                  <Badge count={losers.length} size="small" style={{ backgroundColor: '#52c41a' }} />
                </Space>
              ),
              children: (
                <List
                  dataSource={losers}
                  loading={loading}
                  size="small"
                  className="top-movers-scroll"
                  renderItem={(item, index) => renderStockItem(item, index)}
                />
              )
            },
            {
              key: 'volume',
              label: (
                <Space>
                  <FireOutlined style={{ color: '#faad14' }} />
                  <span>成交量</span>
                  <Badge count={volume.length} size="small" style={{ backgroundColor: '#faad14' }} />
                </Space>
              ),
              children: (
                <List
                  dataSource={volume}
                  loading={loading}
                  size="small"
                  className="top-movers-scroll"
                  renderItem={(item, index) => renderStockItem(item, index, true)}
                />
              )
            }
          ]}
        />
      </div>
    </div>
  );
};

export default TopMoversWidget;