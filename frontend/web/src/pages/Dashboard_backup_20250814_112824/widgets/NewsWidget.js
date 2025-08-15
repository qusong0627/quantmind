import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Badge, Tooltip, Avatar } from 'antd';
import { 
  GlobalOutlined, 
  ClockCircleOutlined, 
  EyeOutlined, 
  LikeOutlined,
  ArrowUpOutlined,
  AlertOutlined,
  BankOutlined,
  RocketOutlined
} from '@ant-design/icons';

const NewsWidget = ({ isEditMode, lastUpdateTime }) => {
  const [newsData, setNewsData] = useState([
    {
      id: 1,
      title: 'A股三大指数集体收涨，人工智能板块领涨',
      summary: '今日A股市场表现强劲，上证指数涨1.2%，深证成指涨1.8%，创业板指涨2.1%...',
      source: '财经网',
      time: '2分钟前',
      category: 'market',
      importance: 'high',
      views: 1250,
      likes: 89,
      tags: ['A股', '人工智能', '涨停']
    },
    {
      id: 2,
      title: '央行宣布降准0.25个百分点，释放流动性约5000亿元',
      summary: '中国人民银行决定于2024年1月15日下调金融机构存款准备金率0.25个百分点...',
      source: '新华财经',
      time: '15分钟前',
      category: 'policy',
      importance: 'urgent',
      views: 3200,
      likes: 156,
      tags: ['央行', '降准', '货币政策']
    },
    {
      id: 3,
      title: '比亚迪发布2023年年报，净利润同比增长80.72%',
      summary: '比亚迪股份有限公司发布2023年年度报告，实现营业收入6023.15亿元...',
      source: '证券时报',
      time: '1小时前',
      category: 'company',
      importance: 'medium',
      views: 890,
      likes: 67,
      tags: ['比亚迪', '年报', '新能源']
    },
    {
      id: 4,
      title: '美联储暗示年内可能降息，全球股市普涨',
      summary: '美联储主席鲍威尔在最新讲话中暗示，如果通胀继续回落，年内可能考虑降息...',
      source: '华尔街见闻',
      time: '2小时前',
      category: 'global',
      importance: 'high',
      views: 2100,
      likes: 134,
      tags: ['美联储', '降息', '全球市场']
    },
    {
      id: 5,
      title: '科技股午后拉升，ChatGPT概念股集体走强',
      summary: '午后科技股表现活跃，ChatGPT概念股集体走强，科大讯飞涨停...',
      source: '东方财富',
      time: '3小时前',
      category: 'tech',
      importance: 'medium',
      views: 1560,
      likes: 92,
      tags: ['科技股', 'ChatGPT', '涨停']
    },
    {
      id: 6,
      title: '国家统计局：12月CPI同比下降0.3%',
      summary: '国家统计局今日发布数据显示，12月份全国居民消费价格指数(CPI)同比下降0.3%...',
      source: '中国证券报',
      time: '4小时前',
      category: 'data',
      importance: 'high',
      views: 1890,
      likes: 78,
      tags: ['CPI', '通胀', '经济数据']
    }
  ]);

  // 刷新新闻数据
  const refreshNewsData = () => {
    if (isEditMode) return;
    
    setNewsData(prev => prev.map(news => ({
      ...news,
      views: news.views + Math.floor(Math.random() * 50),
      likes: news.likes + Math.floor(Math.random() * 5)
    })));
  };

  // 自动刷新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(refreshNewsData, 30000); // 30秒刷新一次
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshNewsData();
    }
  }, [lastUpdateTime, isEditMode]);

  const getCategoryIcon = (category) => {
    const iconMap = {
      market: <ArrowUpOutlined />,
      policy: <BankOutlined />,
      company: <RocketOutlined />,
      global: <GlobalOutlined />,
      tech: <RocketOutlined />,
      data: <AlertOutlined />
    };
    return iconMap[category] || <GlobalOutlined />;
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      market: '#52c41a',
      policy: '#1890ff',
      company: '#722ed1',
      global: '#faad14',
      tech: '#13c2c2',
      data: '#f5222d'
    };
    return colorMap[category] || '#8c8c8c';
  };

  const getImportanceColor = (importance) => {
    const colorMap = {
      urgent: '#ff4d4f',
      high: '#faad14',
      medium: '#52c41a',
      low: '#8c8c8c'
    };
    return colorMap[importance] || '#8c8c8c';
  };

  const getImportanceBadge = (importance) => {
    if (importance === 'urgent') {
      return <Badge status="error" text="紧急" />;
    }
    if (importance === 'high') {
      return <Badge status="warning" text="重要" />;
    }
    return null;
  };

  return (
    <Card
      title="新闻资讯"
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px 20px', height: 'calc(100% - 57px)', overflow: 'auto' }}
      extra={
        <Tooltip title="实时资讯">
          <GlobalOutlined style={{ color: '#1890ff' }} />
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
          新闻资讯组件 - 编辑模式
        </div>
      ) : (
        <List
          size="small"
          dataSource={newsData}
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
                {/* 标题和重要性标识 */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  marginBottom: '4px'
                }}>
                  <Avatar 
                    size={16} 
                    icon={getCategoryIcon(item.category)}
                    style={{ 
                      backgroundColor: getCategoryColor(item.category),
                      marginRight: '6px',
                      marginTop: '2px',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '500',
                      lineHeight: '16px',
                      marginBottom: '2px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.title}
                    </div>
                    {getImportanceBadge(item.importance)}
                  </div>
                </div>

                {/* 摘要 */}
                <div style={{ 
                  fontSize: '10px', 
                  color: '#8c8c8c',
                  lineHeight: '14px',
                  marginBottom: '6px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.summary}
                </div>

                {/* 标签 */}
                <div style={{ marginBottom: '6px' }}>
                  {item.tags.map(tag => (
                    <Tag 
                      key={tag} 
                      size="small" 
                      style={{ 
                        fontSize: '9px',
                        padding: '0 4px',
                        margin: '0 2px 2px 0',
                        lineHeight: '16px'
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
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: '10px',
                    color: '#8c8c8c'
                  }}>
                    <span>{item.source}</span>
                    <span style={{ margin: '0 4px' }}>•</span>
                    <ClockCircleOutlined style={{ marginRight: '2px' }} />
                    <span>{item.time}</span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: '10px',
                    color: '#8c8c8c',
                    gap: '8px'
                  }}>
                    <Tooltip title="阅读量">
                      <span>
                        <EyeOutlined style={{ marginRight: '2px' }} />
                        {item.views}
                      </span>
                    </Tooltip>
                    <Tooltip title="点赞数">
                      <span>
                        <LikeOutlined style={{ marginRight: '2px' }} />
                        {item.likes}
                      </span>
                    </Tooltip>
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

export default NewsWidget;