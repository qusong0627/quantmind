import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Button, Tag, Avatar, Tabs, Statistic, Progress, Table, message, Modal, Input } from 'antd';
import { 
  LikeOutlined, 
  StarOutlined, 
  EyeOutlined, 
  MessageOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  TrophyOutlined,
  LineChartOutlined,
  BarChartOutlined,
  LikeFilled,
  StarFilled
} from '@ant-design/icons';
import CommentList from './CommentList';
import './StrategyDetail.css';

const { Content } = Layout;
const { TextArea } = Input;

const StrategyDetail = ({ strategyId, onClose }) => {
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLiked, setIsLiked] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [useNote, setUseNote] = useState('');

  // 模拟策略详情数据
  const mockStrategy = {
    id: strategyId,
    title: '多因子量化选股策略',
    description: '基于财务指标、技术指标和市场情绪的多因子选股模型，通过机器学习算法优化因子权重，实现稳定的超额收益。该策略结合了价值因子、成长因子、质量因子和动量因子，通过历史数据训练得出最优权重配置。',
    author: {
      id: 1,
      name: '量化大师',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      level: 'VIP',
      bio: '专注量化投资10年，擅长多因子模型和机器学习应用',
      followers: 1234,
      strategies: 25,
      isFollowing: false
    },
    tags: ['多因子', '机器学习', '选股', '量化投资'],
    backtest: {
      totalReturn: 28.5,
      annualReturn: 18.2,
      sharpeRatio: 1.85,
      maxDrawdown: -8.2,
      winRate: 65.4,
      volatility: 12.3,
      beta: 0.85,
      alpha: 0.12,
      informationRatio: 1.45,
      calmarRatio: 2.21
    },
    stats: {
      likes: 156,
      stars: 89,
      views: 2341,
      comments: 23,
      uses: 45
    },
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    isPublic: true,
    price: 0,
    category: '股票策略',
    riskLevel: '中等',
    minCapital: 100000,
    tradingFrequency: '日频',
    backtestPeriod: '2020-01-01 至 2024-01-01',
    performance: {
      monthlyReturns: [
        { month: '2023-01', return: 2.3 },
        { month: '2023-02', return: -1.2 },
        { month: '2023-03', return: 4.1 },
        { month: '2023-04', return: 1.8 },
        { month: '2023-05', return: -0.5 },
        { month: '2023-06', return: 3.2 },
        { month: '2023-07', return: 2.7 },
        { month: '2023-08', return: -2.1 },
        { month: '2023-09', return: 1.9 },
        { month: '2023-10', return: 3.5 },
        { month: '2023-11', return: 2.1 },
        { month: '2023-12', return: 1.6 }
      ],
      yearlyReturns: [
        { year: '2020', return: 15.2 },
        { year: '2021', return: 22.8 },
        { year: '2022', return: -5.3 },
        { year: '2023', return: 18.9 }
      ]
    },
    holdings: [
      { symbol: '000001.SZ', name: '平安银行', weight: 5.2, return: 12.3 },
      { symbol: '000002.SZ', name: '万科A', weight: 4.8, return: -2.1 },
      { symbol: '600036.SH', name: '招商银行', weight: 4.5, return: 15.7 },
      { symbol: '600519.SH', name: '贵州茅台', weight: 4.2, return: 8.9 },
      { symbol: '000858.SZ', name: '五粮液', weight: 3.9, return: 6.4 }
    ],
    code: `# 多因子量化选股策略
# 作者：量化大师
# 创建时间：2024-01-15

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

class MultiFactorStrategy:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.factors = ['pe_ratio', 'pb_ratio', 'roe', 'roa', 'debt_ratio', 
                       'revenue_growth', 'profit_growth', 'momentum_20d', 
                       'momentum_60d', 'volatility_20d']
    
    def prepare_factors(self, data):
        """准备因子数据"""
        factor_data = data[self.factors].fillna(0)
        return self.scaler.fit_transform(factor_data)
    
    def train_model(self, X, y):
        """训练模型"""
        self.model.fit(X, y)
        return self.model.score(X, y)
    
    def predict_returns(self, X):
        """预测收益率"""
        return self.model.predict(X)
    
    def select_stocks(self, data, top_n=50):
        """选股"""
        X = self.prepare_factors(data)
        predictions = self.predict_returns(X)
        
        # 选择预测收益率最高的股票
        top_indices = np.argsort(predictions)[-top_n:]
        return data.iloc[top_indices]
    
    def calculate_weights(self, selected_stocks):
        """计算权重"""
        # 等权重配置
        n_stocks = len(selected_stocks)
        return np.ones(n_stocks) / n_stocks

# 策略使用示例
strategy = MultiFactorStrategy()
# 加载数据并训练模型
# selected_stocks = strategy.select_stocks(stock_data)
# weights = strategy.calculate_weights(selected_stocks)`
  };

  useEffect(() => {
    // 模拟加载策略详情
    const loadStrategy = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setStrategy(mockStrategy);
      } catch (error) {
        message.error('加载策略详情失败');
      } finally {
        setLoading(false);
      }
    };

    loadStrategy();
  }, [strategyId]);

  // 处理点赞
  const handleLike = () => {
    setIsLiked(!isLiked);
    setStrategy(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        likes: isLiked ? prev.stats.likes - 1 : prev.stats.likes + 1
      }
    }));
    message.success(isLiked ? '取消点赞' : '点赞成功');
  };

  // 处理收藏
  const handleStar = () => {
    setIsStarred(!isStarred);
    setStrategy(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        stars: isStarred ? prev.stats.stars - 1 : prev.stats.stars + 1
      }
    }));
    message.success(isStarred ? '取消收藏' : '收藏成功');
  };

  // 处理分享
  const handleShare = () => {
    setShowShareModal(true);
  };

  // 处理使用策略
  const handleUse = () => {
    setShowUseModal(true);
  };

  // 确认使用策略
  const confirmUse = () => {
    setStrategy(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        uses: prev.stats.uses + 1
      }
    }));
    setShowUseModal(false);
    setUseNote('');
    message.success('策略已添加到您的策略库');
  };

  // 处理关注作者
  const handleFollow = () => {
    setStrategy(prev => ({
      ...prev,
      author: {
        ...prev.author,
        isFollowing: !prev.author.isFollowing,
        followers: prev.author.isFollowing ? prev.author.followers - 1 : prev.author.followers + 1
      }
    }));
    message.success(strategy.author.isFollowing ? '取消关注成功' : '关注成功');
  };

  if (loading || !strategy) {
    return <div className="strategy-detail-loading">加载中...</div>;
  }

  // 持仓表格列配置
  const holdingsColumns = [
    {
      title: '股票代码',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120
    },
    {
      title: '股票名称',
      dataIndex: 'name',
      key: 'name',
      width: 120
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      width: 80,
      render: (weight) => `${weight}%`
    },
    {
      title: '收益率',
      dataIndex: 'return',
      key: 'return',
      width: 100,
      render: (ret) => (
        <span className={ret >= 0 ? 'positive-return' : 'negative-return'}>
          {ret >= 0 ? '+' : ''}{ret}%
        </span>
      )
    }
  ];

  // 标签页配置
  const tabItems = [
    {
      key: 'overview',
      label: '策略概览',
      children: (
        <div className="overview-content">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card title="策略描述" className="description-card">
                <p>{strategy.description}</p>
                <div className="strategy-meta">
                  <div className="meta-item">
                    <span className="meta-label">策略分类：</span>
                    <Tag color="blue">{strategy.category}</Tag>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">风险等级：</span>
                    <Tag color={strategy.riskLevel === '低' ? 'green' : strategy.riskLevel === '中等' ? 'orange' : 'red'}>
                      {strategy.riskLevel}
                    </Tag>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">最小资金：</span>
                    <span>{(strategy.minCapital / 10000).toFixed(0)}万元</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">交易频率：</span>
                    <span>{strategy.tradingFrequency}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">回测期间：</span>
                    <span>{strategy.backtestPeriod}</span>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="核心指标" className="metrics-card">
                <div className="metrics-grid">
                  <Statistic
                    title="总收益率"
                    value={strategy.backtest.totalReturn}
                    suffix="%"
                    valueStyle={{ color: '#3f8600' }}
                  />
                  <Statistic
                    title="年化收益率"
                    value={strategy.backtest.annualReturn}
                    suffix="%"
                    valueStyle={{ color: '#3f8600' }}
                  />
                  <Statistic
                    title="夏普比率"
                    value={strategy.backtest.sharpeRatio}
                    precision={2}
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Statistic
                    title="最大回撤"
                    value={Math.abs(strategy.backtest.maxDrawdown)}
                    suffix="%"
                    valueStyle={{ color: '#cf1322' }}
                  />
                  <Statistic
                    title="胜率"
                    value={strategy.backtest.winRate}
                    suffix="%"
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <Statistic
                    title="波动率"
                    value={strategy.backtest.volatility}
                    suffix="%"
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'performance',
      label: '业绩分析',
      children: (
        <div className="performance-content">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="年度收益" className="yearly-returns-card">
                <div className="returns-list">
                  {strategy.performance.yearlyReturns.map(item => (
                    <div key={item.year} className="return-item">
                      <span className="year">{item.year}年</span>
                      <div className="return-bar">
                        <Progress
                          percent={Math.abs(item.return)}
                          strokeColor={item.return >= 0 ? '#52c41a' : '#ff4d4f'}
                          showInfo={false}
                        />
                        <span className={`return-value ${item.return >= 0 ? 'positive' : 'negative'}`}>
                          {item.return >= 0 ? '+' : ''}{item.return}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="风险指标" className="risk-metrics-card">
                <div className="risk-metrics">
                  <div className="metric-item">
                    <span className="metric-name">Beta系数</span>
                    <span className="metric-value">{strategy.backtest.beta}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-name">Alpha系数</span>
                    <span className="metric-value">{strategy.backtest.alpha}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-name">信息比率</span>
                    <span className="metric-value">{strategy.backtest.informationRatio}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-name">卡玛比率</span>
                    <span className="metric-value">{strategy.backtest.calmarRatio}</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'holdings',
      label: '持仓明细',
      children: (
        <div className="holdings-content">
          <Card title="当前持仓" className="holdings-card">
            <Table
              columns={holdingsColumns}
              dataSource={strategy.holdings}
              rowKey="symbol"
              pagination={false}
              size="middle"
            />
          </Card>
        </div>
      )
    },
    {
      key: 'code',
      label: '策略代码',
      children: (
        <div className="code-content">
          <Card 
            title="策略源码" 
            className="code-card"
            extra={
              <Button icon={<DownloadOutlined />} size="small">
                下载代码
              </Button>
            }
          >
            <pre className="strategy-code">
              <code>{strategy.code}</code>
            </pre>
          </Card>
        </div>
      )
    },
    {
      key: 'comments',
      label: `评论 (${strategy.stats.comments})`,
      children: (
        <CommentList 
          targetId={strategy.id}
          targetType="strategy"
        />
      )
    }
  ];

  return (
    <Layout className="strategy-detail">
      <Content className="strategy-detail-content">
        {/* 策略头部 */}
        <div className="strategy-header">
          <div className="header-main">
            <div className="strategy-info">
              <h1 className="strategy-title">{strategy.title}</h1>
              <div className="strategy-tags">
                {strategy.tags.map(tag => (
                  <Tag key={tag} color="blue" size="large">{tag}</Tag>
                ))}
              </div>
              <div className="strategy-stats">
                <div className="stat-item">
                  <EyeOutlined />
                  <span>{strategy.stats.views}</span>
                </div>
                <div className="stat-item">
                  <LikeOutlined />
                  <span>{strategy.stats.likes}</span>
                </div>
                <div className="stat-item">
                  <StarOutlined />
                  <span>{strategy.stats.stars}</span>
                </div>
                <div className="stat-item">
                  <MessageOutlined />
                  <span>{strategy.stats.comments}</span>
                </div>
                <div className="stat-item">
                  <PlayCircleOutlined />
                  <span>{strategy.stats.uses}</span>
                </div>
              </div>
            </div>
            <div className="strategy-actions">
              <Button 
                type={isLiked ? 'primary' : 'default'}
                icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
                onClick={handleLike}
                size="large"
              >
                {isLiked ? '已点赞' : '点赞'}
              </Button>
              <Button 
                type={isStarred ? 'primary' : 'default'}
                icon={isStarred ? <StarFilled /> : <StarOutlined />}
                onClick={handleStar}
                size="large"
              >
                {isStarred ? '已收藏' : '收藏'}
              </Button>
              <Button 
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                size="large"
              >
                分享
              </Button>
              <Button 
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleUse}
                size="large"
              >
                使用策略
              </Button>
            </div>
          </div>
          
          {/* 作者信息 */}
          <div className="author-section">
            <div className="author-info">
              <Avatar src={strategy.author.avatar} size={48} />
              <div className="author-details">
                <div className="author-name">{strategy.author.name}</div>
                <div className="author-meta">
                  <Tag color="gold">{strategy.author.level}</Tag>
                  <span>{strategy.author.followers} 粉丝</span>
                  <span>{strategy.author.strategies} 策略</span>
                </div>
                <div className="author-bio">{strategy.author.bio}</div>
              </div>
            </div>
            <div className="author-actions">
              <Button 
                type={strategy.author.isFollowing ? 'default' : 'primary'}
                icon={<UserOutlined />}
                onClick={handleFollow}
              >
                {strategy.author.isFollowing ? '已关注' : '关注'}
              </Button>
            </div>
          </div>
        </div>

        {/* 策略内容 */}
        <div className="strategy-content">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            className="strategy-tabs"
          />
        </div>

        {/* 分享模态框 */}
        <Modal
          title="分享策略"
          open={showShareModal}
          onCancel={() => setShowShareModal(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowShareModal(false)}>
              取消
            </Button>,
            <Button key="copy" type="primary" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              message.success('链接已复制到剪贴板');
              setShowShareModal(false);
            }}>
              复制链接
            </Button>
          ]}
        >
          <p>分享这个优秀的策略给更多人：</p>
          <Input.Group compact>
            <Input
              style={{ width: 'calc(100% - 80px)' }}
              value={window.location.href}
              readOnly
            />
            <Button 
              type="primary"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                message.success('链接已复制');
              }}
            >
              复制
            </Button>
          </Input.Group>
        </Modal>

        {/* 使用策略模态框 */}
        <Modal
          title="使用策略"
          open={showUseModal}
          onOk={confirmUse}
          onCancel={() => {
            setShowUseModal(false);
            setUseNote('');
          }}
          okText="确认使用"
          cancelText="取消"
        >
          <p>将策略添加到您的策略库，您可以基于此策略进行修改和优化。</p>
          <div style={{ marginTop: 16 }}>
            <label>备注（可选）：</label>
            <TextArea
              rows={3}
              value={useNote}
              onChange={(e) => setUseNote(e.target.value)}
              placeholder="添加一些备注信息..."
              style={{ marginTop: 8 }}
            />
          </div>
        </Modal>
      </Content>
    </Layout>
  );
};

export default StrategyDetail;