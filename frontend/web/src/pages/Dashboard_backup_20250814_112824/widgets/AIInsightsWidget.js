import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Progress, Tooltip, Button, Avatar } from 'antd';
import { 
  RobotOutlined,
  BulbOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  StarOutlined,
  ThunderboltOutlined,
  BarChartOutlined
} from '@ant-design/icons';

const AIInsightsWidget = ({ isEditMode, lastUpdateTime }) => {
  const [insightsData, setInsightsData] = useState([
    {
      id: 1,
      type: 'opportunity',
      title: '科技股反弹机会',
      content: 'AI模型检测到科技股板块技术指标出现积极信号，建议关注龙头股票',
      confidence: 85,
      impact: 'high',
      timeframe: '1-3天',
      tags: ['科技股', '反弹', '技术分析'],
      time: '5分钟前',
      isNew: true,
      aiModel: 'TrendAnalyzer v2.1'
    },
    {
      id: 2,
      type: 'risk',
      title: '市场波动性上升',
      content: '多个指标显示市场波动性可能在未来几日增加，建议适当降低仓位',
      confidence: 78,
      impact: 'medium',
      timeframe: '3-5天',
      tags: ['波动性', '风险管理', '仓位控制'],
      time: '15分钟前',
      isNew: false,
      aiModel: 'RiskPredictor v1.8'
    },
    {
      id: 3,
      type: 'insight',
      title: '行业轮动信号',
      content: '资金流向分析显示，资金正从消费板块流向新能源板块',
      confidence: 72,
      impact: 'medium',
      timeframe: '1-2周',
      tags: ['行业轮动', '资金流向', '板块分析'],
      time: '30分钟前',
      isNew: false,
      aiModel: 'SectorRotation v1.5'
    },
    {
      id: 4,
      type: 'strategy',
      title: '量化策略优化建议',
      content: '基于历史回测，建议调整MA策略参数以提高夏普比率',
      confidence: 88,
      impact: 'high',
      timeframe: '立即执行',
      tags: ['策略优化', '参数调整', '回测分析'],
      time: '1小时前',
      isNew: false,
      aiModel: 'StrategyOptimizer v3.0'
    },
    {
      id: 5,
      type: 'alert',
      title: '异常交易模式检测',
      content: '检测到某些股票出现异常交易模式，可能存在内幕交易风险',
      confidence: 92,
      impact: 'high',
      timeframe: '实时监控',
      tags: ['异常检测', '合规风险', '交易监控'],
      time: '2小时前',
      isNew: false,
      aiModel: 'AnomalyDetector v2.3'
    }
  ]);

  // 刷新AI洞察数据
  const refreshInsightsData = () => {
    if (isEditMode) return;
    
    setInsightsData(prev => prev.map(insight => ({
      ...insight,
      confidence: Math.max(60, Math.min(95, insight.confidence + (Math.random() - 0.5) * 8)),
      isNew: Math.random() > 0.85
    })));
  };

  // 自动刷新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(refreshInsightsData, 35000); // 35秒刷新一次
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshInsightsData();
    }
  }, [lastUpdateTime, isEditMode]);

  const getTypeIcon = (type) => {
    const iconMap = {
      opportunity: <ArrowUpOutlined style={{ color: '#52c41a' }} />,
      risk: <ArrowDownOutlined style={{ color: '#ff4d4f' }} />,
      insight: <BulbOutlined style={{ color: '#faad14' }} />,
      strategy: <BarChartOutlined style={{ color: '#1890ff' }} />,
      alert: <ThunderboltOutlined style={{ color: '#f5222d' }} />
    };
    return iconMap[type] || <BulbOutlined />;
  };

  const getTypeColor = (type) => {
    const colorMap = {
      opportunity: '#52c41a',
      risk: '#ff4d4f',
      insight: '#faad14',
      strategy: '#1890ff',
      alert: '#f5222d'
    };
    return colorMap[type] || '#8c8c8c';
  };

  const getTypeText = (type) => {
    const textMap = {
      opportunity: '机会',
      risk: '风险',
      insight: '洞察',
      strategy: '策略',
      alert: '警报'
    };
    return textMap[type] || '未知';
  };

  const getImpactColor = (impact) => {
    const colorMap = {
      high: '#ff4d4f',
      medium: '#faad14',
      low: '#52c41a'
    };
    return colorMap[impact] || '#8c8c8c';
  };

  const getImpactText = (impact) => {
    const textMap = {
      high: '高影响',
      medium: '中影响',
      low: '低影响'
    };
    return textMap[impact] || '未知';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return '#52c41a';
    if (confidence >= 70) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <Card
      title="AI洞察"
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px 20px', height: 'calc(100% - 57px)', overflow: 'auto' }}
      extra={
        <Tooltip title="AI智能分析">
          <RobotOutlined style={{ color: '#722ed1' }} />
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
          AI洞察组件 - 编辑模式
        </div>
      ) : (
        <List
          size="small"
          dataSource={insightsData}
          renderItem={(item) => (
            <List.Item 
              style={{ 
                padding: '8px 0', 
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fafafa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ width: '100%' }}>
                {/* 标题和类型 */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <Avatar 
                    size={16} 
                    icon={getTypeIcon(item.type)}
                    style={{ 
                      backgroundColor: getTypeColor(item.type),
                      marginRight: '6px',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: '500',
                      lineHeight: '14px',
                      marginBottom: '2px'
                    }}>
                      {item.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Tag 
                        color={getTypeColor(item.type)}
                        size="small"
                        style={{ 
                          fontSize: '8px',
                          padding: '0 3px',
                          margin: 0,
                          lineHeight: '14px'
                        }}
                      >
                        {getTypeText(item.type)}
                      </Tag>
                      <Tag 
                        color={getImpactColor(item.impact)}
                        size="small"
                        style={{ 
                          fontSize: '8px',
                          padding: '0 3px',
                          margin: 0,
                          lineHeight: '14px'
                        }}
                      >
                        {getImpactText(item.impact)}
                      </Tag>
                      {item.isNew && (
                        <Tag 
                          color="processing"
                          size="small"
                          style={{ 
                            fontSize: '8px',
                            padding: '0 3px',
                            margin: 0,
                            lineHeight: '14px'
                          }}
                        >
                          新
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>

                {/* 内容 */}
                <div style={{ 
                  fontSize: '10px', 
                  color: '#8c8c8c',
                  lineHeight: '14px',
                  marginBottom: '6px',
                  paddingLeft: '22px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.content}
                </div>

                {/* 置信度 */}
                <div style={{ 
                  paddingLeft: '22px',
                  marginBottom: '6px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginBottom: '2px'
                  }}>
                    <span style={{ fontSize: '9px', color: '#8c8c8c', marginRight: '4px' }}>
                      置信度:
                    </span>
                    <span style={{ 
                      fontSize: '9px', 
                      fontWeight: '500',
                      color: getConfidenceColor(item.confidence)
                    }}>
                      {parseFloat(item.confidence).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    percent={item.confidence} 
                    size="small" 
                    showInfo={false}
                    strokeColor={getConfidenceColor(item.confidence)}
                    style={{ height: '4px' }}
                  />
                </div>

                {/* 标签 */}
                <div style={{ 
                  paddingLeft: '22px',
                  marginBottom: '4px'
                }}>
                  {item.tags.map(tag => (
                    <Tag 
                      key={tag} 
                      size="small" 
                      style={{ 
                        fontSize: '8px',
                        padding: '0 3px',
                        margin: '0 2px 2px 0',
                        lineHeight: '14px'
                      }}
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>

                {/* 底部信息 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingLeft: '22px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: '8px',
                    color: '#bfbfbf'
                  }}>
                    <RobotOutlined style={{ marginRight: '2px' }} />
                    <span>{item.aiModel}</span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: '8px',
                    color: '#bfbfbf',
                    gap: '6px'
                  }}>
                    <span>{item.timeframe}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default AIInsightsWidget;