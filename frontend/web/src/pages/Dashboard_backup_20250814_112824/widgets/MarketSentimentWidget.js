import React, { useState, useEffect } from 'react';
import { Card, Progress, Row, Col, Tooltip, Tag } from 'antd';
import { 
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  HeartOutlined,
  FireOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';

const MarketSentimentWidget = ({ isEditMode, lastUpdateTime }) => {
  const [sentimentData, setSentimentData] = useState({
    overall: {
      score: 72,
      level: 'positive', // negative, neutral, positive
      change: 5.2
    },
    indicators: {
      fear_greed: {
        value: 68,
        level: 'greed',
        description: '贪婪'
      },
      vix: {
        value: 18.5,
        level: 'low',
        description: '低波动'
      },
      put_call: {
        value: 0.85,
        level: 'neutral',
        description: '中性'
      },
      margin_debt: {
        value: 78.2,
        level: 'high',
        description: '高杠杆'
      }
    },
    sectors: [
      { name: '科技', sentiment: 85, change: 8.5 },
      { name: '金融', sentiment: 65, change: -2.1 },
      { name: '消费', sentiment: 72, change: 3.8 },
      { name: '医药', sentiment: 58, change: -5.2 },
      { name: '能源', sentiment: 45, change: -8.9 },
      { name: '工业', sentiment: 68, change: 1.2 }
    ],
    social: {
      bullish_posts: 1250,
      bearish_posts: 680,
      neutral_posts: 420,
      trending_topics: ['人工智能', '新能源', '芯片', '医药创新', '绿色金融']
    }
  });

  // 刷新情绪数据
  const refreshSentimentData = () => {
    if (isEditMode) return;
    
    setSentimentData(prev => ({
      ...prev,
      overall: {
        ...prev.overall,
        score: Math.max(10, Math.min(90, prev.overall.score + (Math.random() - 0.5) * 10)),
        change: (Math.random() - 0.5) * 10
      },
      indicators: {
        ...prev.indicators,
        fear_greed: {
          ...prev.indicators.fear_greed,
          value: Math.max(10, Math.min(90, prev.indicators.fear_greed.value + (Math.random() - 0.5) * 8))
        },
        vix: {
          ...prev.indicators.vix,
          value: Math.max(10, Math.min(40, prev.indicators.vix.value + (Math.random() - 0.5) * 3))
        }
      },
      sectors: prev.sectors.map(sector => ({
        ...sector,
        sentiment: Math.max(20, Math.min(90, sector.sentiment + (Math.random() - 0.5) * 8)),
        change: (Math.random() - 0.5) * 10
      })),
      social: {
        ...prev.social,
        bullish_posts: prev.social.bullish_posts + Math.floor((Math.random() - 0.5) * 100),
        bearish_posts: prev.social.bearish_posts + Math.floor((Math.random() - 0.5) * 50)
      }
    }));
  };

  // 自动刷新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(refreshSentimentData, 22000); // 22秒刷新一次
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshSentimentData();
    }
  }, [lastUpdateTime, isEditMode]);

  const getSentimentIcon = (score) => {
    if (score >= 70) return <SmileOutlined style={{ color: '#52c41a' }} />;
    if (score >= 40) return <MehOutlined style={{ color: '#faad14' }} />;
    return <FrownOutlined style={{ color: '#ff4d4f' }} />;
  };

  const getSentimentColor = (score) => {
    if (score >= 70) return '#52c41a';
    if (score >= 40) return '#faad14';
    return '#ff4d4f';
  };

  const getSentimentText = (score) => {
    if (score >= 80) return '极度乐观';
    if (score >= 70) return '乐观';
    if (score >= 60) return '偏乐观';
    if (score >= 40) return '中性';
    if (score >= 30) return '偏悲观';
    if (score >= 20) return '悲观';
    return '极度悲观';
  };

  const getChangeIcon = (change) => {
    return change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
  };

  const getChangeColor = (change) => {
    return change >= 0 ? '#52c41a' : '#ff4d4f';
  };

  const getFearGreedColor = (value) => {
    if (value >= 75) return '#ff4d4f'; // 极度贪婪
    if (value >= 55) return '#faad14'; // 贪婪
    if (value >= 45) return '#52c41a'; // 中性
    if (value >= 25) return '#faad14'; // 恐惧
    return '#ff4d4f'; // 极度恐惧
  };

  const getFearGreedText = (value) => {
    if (value >= 75) return '极度贪婪';
    if (value >= 55) return '贪婪';
    if (value >= 45) return '中性';
    if (value >= 25) return '恐惧';
    return '极度恐惧';
  };

  const getVixColor = (value) => {
    if (value >= 30) return '#ff4d4f'; // 高波动
    if (value >= 20) return '#faad14'; // 中波动
    return '#52c41a'; // 低波动
  };

  const getVixText = (value) => {
    if (value >= 30) return '高波动';
    if (value >= 20) return '中波动';
    return '低波动';
  };

  return (
    <Card
      title="市场情绪"
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px 20px', height: 'calc(100% - 57px)', overflow: 'auto' }}
      extra={
        <Tooltip title="市场情绪指数">
          {getSentimentIcon(sentimentData.overall.score)}
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
          市场情绪组件 - 编辑模式
        </div>
      ) : (
        <div style={{ height: '100%' }}>
          {/* 整体情绪 */}
          <div style={{ 
            padding: '8px',
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>
              {getSentimentIcon(sentimentData.overall.score)} 整体情绪
            </div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600',
              color: getSentimentColor(sentimentData.overall.score),
              marginBottom: '2px'
            }}>
              {parseFloat(sentimentData.overall.score).toFixed(1)}
            </div>
            <div style={{ 
              fontSize: '10px',
              color: getSentimentColor(sentimentData.overall.score),
              marginBottom: '4px'
            }}>
              {getSentimentText(sentimentData.overall.score)}
            </div>
            <div style={{ 
              fontSize: '9px',
              color: getChangeColor(sentimentData.overall.change)
            }}>
              {getChangeIcon(sentimentData.overall.change)} 
              {sentimentData.overall.change >= 0 ? '+' : ''}{parseFloat(sentimentData.overall.change).toFixed(2)}
            </div>
            <Progress 
              percent={sentimentData.overall.score} 
              size="small" 
              showInfo={false}
              strokeColor={getSentimentColor(sentimentData.overall.score)}
              style={{ marginTop: '6px' }}
            />
          </div>

          {/* 关键指标 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '6px' }}>
              关键指标
            </div>
            <Row gutter={[6, 6]}>
              <Col span={12}>
                <div style={{ 
                  padding: '6px',
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: '3px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '9px', color: '#8c8c8c', marginBottom: '2px' }}>
                    恐惧贪婪指数
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: getFearGreedColor(sentimentData.indicators.fear_greed.value),
                    marginBottom: '2px'
                  }}>
                    {sentimentData.indicators.fear_greed.value}
                  </div>
                  <div style={{ 
                    fontSize: '8px',
                    color: getFearGreedColor(sentimentData.indicators.fear_greed.value)
                  }}>
                    {getFearGreedText(sentimentData.indicators.fear_greed.value)}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ 
                  padding: '6px',
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: '3px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '9px', color: '#8c8c8c', marginBottom: '2px' }}>
                    VIX指数
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: getVixColor(sentimentData.indicators.vix.value),
                    marginBottom: '2px'
                  }}>
                    {parseFloat(sentimentData.indicators.vix.value).toFixed(1)}
                  </div>
                  <div style={{ 
                    fontSize: '8px',
                    color: getVixColor(sentimentData.indicators.vix.value)
                  }}>
                    {getVixText(sentimentData.indicators.vix.value)}
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 板块情绪 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '6px' }}>
              板块情绪
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sentimentData.sectors.slice(0, 4).map((sector, index) => (
                <div key={sector.name} style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  padding: '4px 6px',
                  background: '#fafafa',
                  borderRadius: '3px'
                }}>
                  <span style={{ fontSize: '10px', width: '30px', flexShrink: 0 }}>
                    {sector.name}
                  </span>
                  <Progress 
                    percent={sector.sentiment} 
                    size="small" 
                    showInfo={false}
                    strokeColor={getSentimentColor(sector.sentiment)}
                    style={{ flex: 1, marginRight: '6px' }}
                  />
                  <span style={{ 
                    fontSize: '9px', 
                    fontWeight: '500',
                    color: getSentimentColor(sector.sentiment),
                    width: '20px',
                    textAlign: 'right',
                    marginRight: '4px'
                  }}>
                    {parseFloat(sector.sentiment).toFixed(1)}
                  </span>
                  <span style={{ 
                    fontSize: '8px',
                    color: getChangeColor(sector.change),
                    width: '25px',
                    textAlign: 'right'
                  }}>
                    {sector.change >= 0 ? '+' : ''}{parseFloat(sector.change).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 社交媒体情绪 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '6px' }}>
              社交媒体
            </div>
            <Row gutter={[4, 4]} style={{ marginBottom: '6px' }}>
              <Col span={8}>
                <div style={{ 
                  padding: '4px',
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: '3px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '8px', color: '#8c8c8c' }}>看涨</div>
                  <div style={{ fontSize: '10px', fontWeight: '500', color: '#52c41a' }}>
                    {sentimentData.social.bullish_posts}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ 
                  padding: '4px',
                  background: '#fff2f0',
                  border: '1px solid #ffccc7',
                  borderRadius: '3px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '8px', color: '#8c8c8c' }}>看跌</div>
                  <div style={{ fontSize: '10px', fontWeight: '500', color: '#ff4d4f' }}>
                    {sentimentData.social.bearish_posts}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ 
                  padding: '4px',
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: '3px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '8px', color: '#8c8c8c' }}>中性</div>
                  <div style={{ fontSize: '10px', fontWeight: '500', color: '#8c8c8c' }}>
                    {sentimentData.social.neutral_posts}
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 热门话题 */}
          <div>
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '6px' }}>
              <FireOutlined /> 热门话题
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {sentimentData.social.trending_topics.map((topic, index) => (
                <Tag 
                  key={topic}
                  size="small"
                  color={index < 2 ? 'red' : index < 4 ? 'orange' : 'blue'}
                  style={{ 
                    fontSize: '8px',
                    padding: '0 4px',
                    margin: 0,
                    lineHeight: '16px'
                  }}
                >
                  {topic}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MarketSentimentWidget;