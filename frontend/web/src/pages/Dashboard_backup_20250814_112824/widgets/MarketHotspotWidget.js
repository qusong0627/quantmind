import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Progress, Tooltip, Badge } from 'antd';
import { FireOutlined, TrophyOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const MarketHotspotWidget = ({ isEditMode, lastUpdateTime }) => {
  const [hotspotData, setHotspotData] = useState({
    sectors: [
      {
        id: 1,
        name: '人工智能',
        change: 8.5,
        volume: '1250亿',
        leadingStock: '科大讯飞',
        leadingChange: 10.02,
        heat: 95,
        trend: 'up',
        news: 3
      },
      {
        id: 2,
        name: '新能源汽车',
        change: 6.2,
        volume: '980亿',
        leadingStock: '比亚迪',
        leadingChange: 7.8,
        heat: 88,
        trend: 'up',
        news: 5
      },
      {
        id: 3,
        name: '半导体',
        change: -2.1,
        volume: '750亿',
        leadingStock: '中芯国际',
        leadingChange: -1.5,
        heat: 72,
        trend: 'down',
        news: 2
      },
      {
        id: 4,
        name: '医药生物',
        change: 3.8,
        volume: '680亿',
        leadingStock: '恒瑞医药',
        leadingChange: 4.2,
        heat: 65,
        trend: 'up',
        news: 1
      },
      {
        id: 5,
        name: '军工',
        change: 5.1,
        volume: '520亿',
        leadingStock: '中航沈飞',
        leadingChange: 6.8,
        heat: 58,
        trend: 'up',
        news: 4
      }
    ],
    concepts: [
      { name: 'ChatGPT', change: 12.5, count: 45 },
      { name: '数字经济', change: 8.9, count: 38 },
      { name: '储能', change: 7.2, count: 32 },
      { name: '机器人', change: 6.8, count: 28 },
      { name: '氢能源', change: -3.2, count: 25 }
    ]
  });

  // 刷新热点数据
  const refreshHotspotData = () => {
    if (isEditMode) return;
    
    setHotspotData(prev => ({
      ...prev,
      sectors: prev.sectors.map(sector => ({
        ...sector,
        change: sector.change + (Math.random() - 0.5) * 2,
        leadingChange: sector.leadingChange + (Math.random() - 0.5) * 2,
        heat: Math.max(30, Math.min(100, sector.heat + (Math.random() - 0.5) * 10))
      })),
      concepts: prev.concepts.map(concept => ({
        ...concept,
        change: concept.change + (Math.random() - 0.5) * 2
      }))
    }));
  };

  // 自动刷新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(refreshHotspotData, 20000); // 20秒刷新一次
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshHotspotData();
    }
  }, [lastUpdateTime, isEditMode]);

  const getChangeColor = (change) => {
    return change >= 0 ? '#52c41a' : '#ff4d4f';
  };

  const getChangeIcon = (change) => {
    return change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
  };

  const getHeatColor = (heat) => {
    if (heat >= 80) return '#ff4d4f';
    if (heat >= 60) return '#faad14';
    return '#52c41a';
  };

  return (
    <Card
      title="市场热点"
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '0', height: 'calc(100% - 57px)', overflow: 'auto' }}
      extra={
        <Tooltip title="热度指数">
          <FireOutlined style={{ color: '#faad14' }} />
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
          市场热点组件 - 编辑模式
        </div>
      ) : (
        <div style={{ height: '100%', padding: '16px 20px' }}>
          {/* 热门板块 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#8c8c8c', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <TrophyOutlined style={{ marginRight: '4px' }} />
              热门板块
            </div>
            <List
              size="small"
              dataSource={hotspotData.sectors}
              renderItem={(item) => (
                <List.Item style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>{item.name}</span>
                        {item.news > 0 && (
                          <Badge 
                            count={item.news} 
                            size="small" 
                            style={{ marginLeft: '6px' }}
                          />
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '12px', 
                          fontWeight: '600',
                          color: getChangeColor(item.change)
                        }}>
                          {getChangeIcon(item.change)} {parseFloat(item.change).toFixed(2)}%
                        </div>
                        <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                          {item.volume}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: '10px', color: '#8c8c8c' }}>
                        龙头: {item.leadingStock}
                      </span>
                      <span style={{ 
                        fontSize: '8px', 
                        color: getChangeColor(item.leadingChange)
                      }}>
                        {parseFloat(item.leadingChange).toFixed(2)}%
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '8px', color: '#8c8c8c', marginRight: '6px' }}>
                        热度
                      </span>
                      <Progress 
                        percent={item.heat} 
                        size="small" 
                        showInfo={false}
                        strokeColor={getHeatColor(item.heat)}
                        style={{ flex: 1, marginRight: '6px' }}
                      />
                      <span style={{ 
                        fontSize: '8px', 
                        color: getHeatColor(item.heat),
                        fontWeight: '500'
                      }}>
                        {parseFloat(item.heat).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>

          {/* 概念股 */}
          <div>
            <div style={{ 
              fontSize: '12px', 
              color: '#8c8c8c', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <FireOutlined style={{ marginRight: '4px' }} />
              热门概念
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {hotspotData.concepts.map((concept, index) => (
                <Tooltip 
                  key={concept.name}
                  title={`${concept.count}只相关股票`}
                >
                  <Tag 
                    color={concept.change >= 0 ? 'green' : 'red'}
                    style={{ 
                      margin: 0,
                      fontSize: '10px',
                      padding: '2px 6px',
                      cursor: 'pointer'
                    }}
                  >
                    {concept.name} {parseFloat(concept.change).toFixed(2)}%
                  </Tag>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MarketHotspotWidget;