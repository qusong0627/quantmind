import React, { useState, useEffect } from 'react';
import { List, Tag, Button, Space, Modal, Typography, Divider } from 'antd';
import { EyeOutlined, ShareAltOutlined, HeartOutlined, HeartFilled, ClockCircleOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

const NewsWidget = ({ isEditMode }) => {
  const [news, setNews] = useState([
    {
      id: 'news_001',
      title: 'A股三大指数集体收涨，创业板指涨超2%',
      summary: '今日A股市场表现强劲，上证指数涨1.2%，深证成指涨1.8%，创业板指涨2.3%。科技股领涨，新能源板块活跃。',
      content: '今日A股市场表现强劲，三大指数集体收涨。截至收盘，上证指数报3245.12点，涨幅1.2%；深证成指报12456.78点，涨幅1.8%；创业板指报2678.90点，涨幅2.3%。\n\n从板块表现来看，科技股领涨市场，人工智能、芯片、新能源汽车等板块涨幅居前。其中，比亚迪涨5.2%，宁德时代涨4.8%，海康威视涨3.6%。\n\n成交量方面，沪深两市合计成交8956亿元，较昨日放量明显。北向资金净流入45.6亿元，连续三日净流入。\n\n分析师认为，当前市场情绪回暖，政策预期向好，建议关注科技创新和新兴产业投资机会。',
      category: '市场动态',
      source: '财经日报',
      publishTime: '2024-01-20 16:30:00',
      readCount: 1256,
      likeCount: 89,
      isLiked: false,
      sentiment: 'positive',
      tags: ['A股', '指数', '科技股', '新能源']
    },
    {
      id: 'news_002',
      title: '央行降准0.5个百分点，释放流动性约1万亿元',
      summary: '中国人民银行决定于1月25日下调金融机构存款准备金率0.5个百分点，此次降准将释放长期资金约1万亿元。',
      content: '中国人民银行今日宣布，为保持银行体系流动性合理充裕，支持实体经济发展，决定于2024年1月25日下调金融机构存款准备金率0.5个百分点（不含已执行5%存款准备金率的金融机构）。\n\n此次降准为全面降准，除已执行5%存款准备金率的部分县域法人金融机构外，对其他金融机构普遍下调存款准备金率0.5个百分点。本次降准共释放长期资金约1万亿元。\n\n央行有关负责人表示，此次降准有利于保持流动性合理充裕，促进货币信贷合理增长，支持实体经济发展。银行可运用降准释放的资金加大小微企业、科技创新、aceeDownloads等领域的支持力度。',
      category: '货币政策',
      source: '央行官网',
      publishTime: '2024-01-20 15:45:00',
      readCount: 2341,
      likeCount: 156,
      isLiked: true,
      sentiment: 'positive',
      tags: ['央行', '降准', '流动性', '货币政策']
    },
    {
      id: 'news_003',
      title: '美联储暗示年内可能降息，全球股市普涨',
      summary: '美联储主席鲍威尔在最新讲话中暗示，如果通胀持续回落，年内可能考虑降息。消息传出后，全球股市普遍上涨。',
      content: '美联储主席鲍威尔在达沃斯世界经济论坛上发表讲话，暗示如果通胀数据持续改善，美联储年内可能考虑降息。这一表态引发了全球金融市场的积极反应。\n\n鲍威尔表示，美国通胀率已从峰值显著回落，劳动力市场趋于平衡，经济增长保持韧性。如果这些趋势持续，美联储将有空间调整货币政策立场。\n\n消息传出后，美股三大指数期货大幅上涨，道指期货涨1.2%，纳指期货涨1.8%。欧洲股市也普遍收涨，德国DAX指数涨1.5%，英国富时100指数涨1.1%。\n\n分析师认为，美联储政策转向预期将提振全球风险资产，新兴市场和成长股有望受益。',
      category: '国际市场',
      source: '路透社',
      publishTime: '2024-01-20 14:20:00',
      readCount: 1876,
      likeCount: 134,
      isLiked: false,
      sentiment: 'positive',
      tags: ['美联储', '降息', '全球股市', '货币政策']
    },
    {
      id: 'news_004',
      title: '新能源汽车销量创新高，产业链公司业绩亮眼',
      summary: '2023年新能源汽车销量达到949.5万辆，同比增长37.9%。产业链上下游公司业绩表现亮眼，多家公司预告业绩大幅增长。',
      content: '中国汽车工业协会发布数据显示，2023年新能源汽车产销分别完成958.7万辆和949.5万辆，同比分别增长35.8%和37.9%，市场占有率达到31.6%。\n\n从细分市场看，纯电动汽车产销分别完成748.9万辆和741.8万辆，同比分别增长34.3%和36.2%；插电式混合动力汽车产销分别完成209.8万辆和207.7万辆，同比分别增长41.4%和43.3%。\n\n受益于新能源汽车销量高增长，产业链公司业绩表现亮眼。宁德时代预告2023年净利润同比增长38%-48%，比亚迪预告净利润同比增长74%-86%。\n\n分析师表示，随着技术进步和成本下降，新能源汽车渗透率将持续提升，相关产业链公司仍有较大发展空间。',
      category: '行业动态',
      source: '汽车之家',
      publishTime: '2024-01-20 13:15:00',
      readCount: 987,
      likeCount: 67,
      isLiked: false,
      sentiment: 'positive',
      tags: ['新能源汽车', '销量', '产业链', '业绩']
    },
    {
      id: 'news_005',
      title: '人工智能芯片需求激增，相关概念股大涨',
      summary: 'ChatGPT等AI应用推动芯片需求激增，英伟达、AMD等公司股价创新高。国内AI芯片概念股也表现强劲。',
      content: '随着ChatGPT、文心一言等大型语言模型的快速发展，人工智能芯片需求激增。英伟达、AMD等芯片巨头股价屡创新高，国内相关概念股也表现强劲。\n\n英伟达最新财报显示，数据中心业务收入同比增长409%，主要受AI芯片需求推动。公司预计未来几个季度AI相关收入将继续高增长。\n\nA股市场上，寒武纪、海光信息、景嘉微等AI芯片概念股近期表现活跃。寒武纪涨停，海光信息涨8.5%，景嘉微涨6.2%。\n\n机构分析认为，AI大模型训练和推理对算力需求巨大，将推动AI芯片市场快速增长。建议关注在AI芯片领域有技术积累和产品布局的公司。',
      category: '科技前沿',
      source: '科技日报',
      publishTime: '2024-01-20 12:30:00',
      readCount: 1543,
      likeCount: 112,
      isLiked: true,
      sentiment: 'positive',
      tags: ['人工智能', 'AI芯片', '概念股', '英伟达']
    }
  ]);
  
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [filter, setFilter] = useState('all');

  // 模拟实时数据更新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(() => {
        setNews(prev => prev.map(item => ({
          ...item,
          readCount: item.readCount + Math.floor(Math.random() * 10),
          likeCount: item.likeCount + Math.floor(Math.random() * 3)
        })));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 获取情感标签
  const getSentimentTag = (sentiment) => {
    const sentimentConfig = {
      positive: { color: 'green', text: '利好' },
      negative: { color: 'red', text: '利空' },
      neutral: { color: 'blue', text: '中性' }
    };
    
    const config = sentimentConfig[sentiment] || { color: 'default', text: '未知' };
    return <Tag color={config.color} size="small">{config.text}</Tag>;
  };

  // 获取分类标签颜色
  const getCategoryColor = (category) => {
    const colorMap = {
      '市场动态': 'blue',
      '货币政策': 'green',
      '国际市场': 'purple',
      '行业动态': 'orange',
      '科技前沿': 'cyan',
      '公司公告': 'magenta'
    };
    return colorMap[category] || 'default';
  };

  // 切换点赞状态
  const toggleLike = (newsId) => {
    setNews(prev => prev.map(item => {
      if (item.id === newsId) {
        return {
          ...item,
          isLiked: !item.isLiked,
          likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1
        };
      }
      return item;
    }));
  };

  // 查看新闻详情
  const viewNewsDetail = (newsItem) => {
    setSelectedNews(newsItem);
    setDetailModalVisible(true);
    // 增加阅读数
    setNews(prev => prev.map(item => 
      item.id === newsItem.id ? { ...item, readCount: item.readCount + 1 } : item
    ));
  };

  // 分享新闻
  const shareNews = (newsId) => {
    navigator.clipboard.writeText(`${window.location.origin}/news/${newsId}`);
    // 这里可以添加消息提示
  };

  // 格式化时间
  const formatTime = (timeStr) => {
    const now = new Date();
    const publishTime = new Date(timeStr);
    const diffMs = now - publishTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else {
      return publishTime.toLocaleDateString();
    }
  };

  // 过滤新闻
  const filteredNews = filter === 'all' ? news : news.filter(item => item.category === filter);
  const categories = ['all', ...new Set(news.map(item => item.category))];

  const renderNewsItem = (newsItem) => {
    return (
      <List.Item
        key={newsItem.id}
        actions={!isEditMode ? [
          <Button
            type="text"
            size="small"
            icon={newsItem.isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={() => toggleLike(newsItem.id)}
          >
            {newsItem.likeCount}
          </Button>,
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewNewsDetail(newsItem)}
          >
            {newsItem.readCount}
          </Button>,
          <Button
            type="text"
            size="small"
            icon={<ShareAltOutlined />}
            onClick={() => shareNews(newsItem.id)}
          />
        ] : []}
      >
        <List.Item.Meta
          title={
            <div 
              style={{ cursor: isEditMode ? 'default' : 'pointer' }}
              onClick={() => !isEditMode && viewNewsDetail(newsItem)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Tag color={getCategoryColor(newsItem.category)} size="small">
                  {newsItem.category}
                </Tag>
                {getSentimentTag(newsItem.sentiment)}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.4' }}>
                {newsItem.title}
              </div>
            </div>
          }
          description={
            <div>
              <div style={{ 
                fontSize: '13px', 
                color: '#666', 
                lineHeight: '1.4',
                marginBottom: '8px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {newsItem.summary}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                    {formatTime(newsItem.publishTime)}
                  </span>
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    来源: {newsItem.source}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {newsItem.tags.slice(0, 3).map(tag => (
                    <Tag key={tag} size="small" style={{ margin: 0, fontSize: '11px' }}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <div className="widget-content">
      <div className="widget-header">
        <h4 className="widget-title">新闻资讯</h4>
        <div className="widget-actions">
          <Space>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ 
                fontSize: '12px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '4px',
                padding: '2px 6px',
                backgroundColor: '#fff'
              }}
              disabled={isEditMode}
            >
              <option value="all">全部</option>
              {categories.slice(1).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </Space>
        </div>
      </div>
      
      <div className="widget-body">
        <List
          size="small"
          dataSource={filteredNews}
          renderItem={renderNewsItem}
          style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
        />
        
        {filteredNews.length === 0 && (
          <div className="widget-empty">
            <div className="widget-empty-text">暂无新闻</div>
          </div>
        )}
      </div>

      {/* 新闻详情弹窗 */}
      <Modal
        title={null}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="share" 
            type="primary"
            icon={<ShareAltOutlined />}
            onClick={() => {
              shareNews(selectedNews?.id);
              setDetailModalVisible(false);
            }}
          >
            分享
          </Button>
        ]}
        width={800}
        style={{ top: 20 }}
      >
        {selectedNews && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Space style={{ marginBottom: '8px' }}>
                <Tag color={getCategoryColor(selectedNews.category)}>
                  {selectedNews.category}
                </Tag>
                {getSentimentTag(selectedNews.sentiment)}
              </Space>
              
              <h2 style={{ margin: '8px 0 16px 0', fontSize: '20px', lineHeight: '1.4' }}>
                {selectedNews.title}
              </h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Space>
                  <Text type="secondary">
                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                    {selectedNews.publishTime}
                  </Text>
                  <Text type="secondary">来源: {selectedNews.source}</Text>
                </Space>
                
                <Space>
                  <Button
                    type="text"
                    size="small"
                    icon={selectedNews.isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                    onClick={() => toggleLike(selectedNews.id)}
                  >
                    {selectedNews.likeCount}
                  </Button>
                  <Text type="secondary">
                    <EyeOutlined style={{ marginRight: '4px' }} />
                    {selectedNews.readCount}
                  </Text>
                </Space>
              </div>
            </div>
            
            <Divider />
            
            <div style={{ marginBottom: '16px' }}>
              <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                {selectedNews.content.split('\n').map((paragraph, index) => (
                  <div key={index} style={{ marginBottom: paragraph ? '12px' : '6px' }}>
                    {paragraph}
                  </div>
                ))}
              </Paragraph>
            </div>
            
            <Divider />
            
            <div>
              <Text strong>标签: </Text>
              <Space wrap>
                {selectedNews.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NewsWidget;