import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Tabs, Input, Select, Button, Row, Col, Pagination, Spin, message, Card, Avatar, Statistic, Table, Tag, Form } from 'antd';
import { SearchOutlined, FilterOutlined, PlusOutlined, UserOutlined, EditOutlined, TrophyOutlined, LineChartOutlined, BookOutlined, SettingOutlined } from '@ant-design/icons';
import StrategyCard from './StrategyCard';
import UserCard from './UserCard';
import './CommunityPage.css';

const { Content } = Layout;
const { Search } = Input;
const { Option } = Select;

// 模拟策略数据
const mockStrategies = [
    {
      id: 1,
      title: '多因子量化选股策略',
      description: '基于财务指标、技术指标和市场情绪的多因子选股模型，通过机器学习算法优化因子权重，实现稳定的超额收益。',
      author: {
        id: 1,
        name: '量化大师',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        level: 'VIP',
        isFollowing: false
      },
      tags: ['多因子', '机器学习', '选股'],
      backtest: {
        totalReturn: 28.5,
        sharpeRatio: 1.85,
        maxDrawdown: -8.2,
        winRate: 65.4
      },
      stats: {
        likes: 156,
        stars: 89,
        views: 2341,
        comments: 23
      },
      createdAt: '2024-01-15',
      isPublic: true,
      price: 0
    },
    {
      id: 2,
      title: '高频套利策略',
      description: '利用市场微观结构的不完美，通过高频交易捕捉短期价格差异，实现低风险套利收益。',
      author: {
        id: 2,
        name: '套利专家',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
        level: '专家',
        isFollowing: true
      },
      tags: ['高频', '套利', '低风险'],
      backtest: {
        totalReturn: 15.2,
        sharpeRatio: 2.34,
        maxDrawdown: -3.1,
        winRate: 78.9
      },
      stats: {
        likes: 234,
        stars: 145,
        views: 3567,
        comments: 45
      },
      createdAt: '2024-01-20',
      isPublic: false,
      price: 299
    },
    {
      id: 3,
      title: '趋势跟踪策略',
      description: '基于技术分析的趋势跟踪系统，结合多时间框架分析，在趋势明确时进场，有效控制回撤。',
      author: {
        id: 3,
        name: '趋势猎手',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
        level: '高级',
        isFollowing: false
      },
      tags: ['趋势跟踪', '技术分析', '多时间框架'],
      backtest: {
        totalReturn: 42.8,
        sharpeRatio: 1.67,
        maxDrawdown: -12.5,
        winRate: 58.3
      },
      stats: {
        likes: 189,
        stars: 112,
        views: 2890,
        comments: 34
      },
      createdAt: '2024-01-18',
      isPublic: true,
      price: 0
    }
  ];

// 模拟用户数据
const mockUsers = [
    {
      id: 1,
      name: '量化大师',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      level: 'VIP',
      bio: '专注量化投资10年，擅长多因子模型和机器学习应用',
      stats: {
        strategies: 25,
        followers: 1234,
        following: 89,
        points: 8950
      },
      activities: [
        { type: 'publish', content: '发布了新策略：多因子量化选股策略', time: '2小时前' },
        { type: 'comment', content: '评论了策略：高频套利策略', time: '5小时前' }
      ],
      isOnline: true,
      isFollowing: false
    },
    {
      id: 2,
      name: '套利专家',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      level: '专家',
      bio: '高频交易专家，专注于市场微观结构研究',
      stats: {
        strategies: 18,
        followers: 856,
        following: 45,
        points: 6780
      },
      activities: [
        { type: 'like', content: '点赞了策略：趋势跟踪策略', time: '1小时前' },
        { type: 'follow', content: '关注了用户：量化新手', time: '3小时前' }
      ],
      isOnline: false,
      isFollowing: true
    }
  ];

const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState('strategies');
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('hot');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [strategies, setStrategies] = useState([]);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (activeTab === 'strategies') {
        let filteredStrategies = [...mockStrategies];
        
        // 搜索过滤
        if (searchKeyword) {
          filteredStrategies = filteredStrategies.filter(strategy => 
            strategy.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            strategy.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            strategy.tags.some(tag => tag.toLowerCase().includes(searchKeyword.toLowerCase()))
          );
        }
        
        // 分类过滤
        if (filterBy !== 'all') {
          filteredStrategies = filteredStrategies.filter(strategy => {
            switch (filterBy) {
              case 'free':
                return strategy.price === 0;
              case 'paid':
                return strategy.price > 0;
              case 'public':
                return strategy.isPublic;
              case 'private':
                return !strategy.isPublic;
              default:
                return true;
            }
          });
        }
        
        // 排序
        filteredStrategies.sort((a, b) => {
          switch (sortBy) {
            case 'hot':
              return (b.stats.likes + b.stats.views) - (a.stats.likes + a.stats.views);
            case 'latest':
              return new Date(b.createdAt) - new Date(a.createdAt);
            case 'return':
              return b.backtest.totalReturn - a.backtest.totalReturn;
            case 'sharpe':
              return b.backtest.sharpeRatio - a.backtest.sharpeRatio;
            default:
              return 0;
          }
        });
        
        setStrategies(filteredStrategies);
        setTotal(filteredStrategies.length);
      } else {
        let filteredUsers = [...mockUsers];
        
        // 搜索过滤
        if (searchKeyword) {
          filteredUsers = filteredUsers.filter(user => 
            user.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            user.bio.toLowerCase().includes(searchKeyword.toLowerCase())
          );
        }
        
        setUsers(filteredUsers);
        setTotal(filteredUsers.length);
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchKeyword, sortBy, filterBy]);

  useEffect(() => {
    fetchData();
  }, [activeTab, searchKeyword, sortBy, filterBy, currentPage, fetchData]);

  // 处理搜索
  const handleSearch = (value) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  // 处理排序
  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  // 处理过滤
  const handleFilterChange = (value) => {
    setFilterBy(value);
    setCurrentPage(1);
  };

  // 处理分页
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 处理策略操作
  const handleStrategyAction = (action, strategyId) => {
    switch (action) {
      case 'like':
        setStrategies(prev => prev.map(strategy => 
          strategy.id === strategyId 
            ? { ...strategy, stats: { ...strategy.stats, likes: strategy.stats.likes + 1 } }
            : strategy
        ));
        message.success('点赞成功');
        break;
      case 'star':
        setStrategies(prev => prev.map(strategy => 
          strategy.id === strategyId 
            ? { ...strategy, stats: { ...strategy.stats, stars: strategy.stats.stars + 1 } }
            : strategy
        ));
        message.success('收藏成功');
        break;
      case 'view':
        // 跳转到策略详情页
        message.info('跳转到策略详情页');
        break;
      case 'use':
        // 使用策略
        message.info('开始使用策略');
        break;
      default:
        break;
    }
  };

  // 处理用户操作
  const handleUserAction = (action, userId) => {
    switch (action) {
      case 'follow':
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                isFollowing: !user.isFollowing,
                stats: { 
                  ...user.stats, 
                  followers: user.isFollowing ? user.stats.followers - 1 : user.stats.followers + 1 
                }
              }
            : user
        ));
        message.success(users.find(u => u.id === userId)?.isFollowing ? '取消关注成功' : '关注成功');
        break;
      case 'message':
        // 发送私信
        message.info('跳转到私信页面');
        break;
      default:
        break;
    }
  };

  // 标签页配置
  const tabItems = [
    {
      key: 'strategies',
      label: '策略广场',
      children: null
    },
    {
      key: 'users',
      label: '用户推荐',
      children: null
    },
    {
      key: 'articles',
      label: '精选文章',
      children: null
    },
    {
      key: 'discussions',
      label: '讨论区',
      children: null
    }
  ];

  return (
    <Layout className="community-page">
      <Content className="community-content">
        {/* 页面头部 */}
        <div className="community-header">
          <div className="header-title">
            <h1>量化社区</h1>
            <p>发现优质策略，分享投资智慧</p>
          </div>
          <div className="header-actions">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              发布策略
            </Button>
          </div>
        </div>

        {/* 标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="community-tabs"
          size="large"
        />

        {/* 搜索和过滤栏 */}
        <div className="community-filters">
          <div className="filter-left">
            <Search
              placeholder={activeTab === 'strategies' ? '搜索策略名称、描述或标签' : '搜索用户名称或简介'}
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              style={{ width: 400 }}
            />
          </div>
          <div className="filter-right">
            {activeTab === 'strategies' && (
              <>
                <Select
                  value={filterBy}
                  onChange={handleFilterChange}
                  style={{ width: 120 }}
                  size="large"
                  suffixIcon={<FilterOutlined />}
                >
                  <Option value="all">全部</Option>
                  <Option value="free">免费</Option>
                  <Option value="paid">付费</Option>
                  <Option value="public">公开</Option>
                  <Option value="private">私有</Option>
                </Select>
                <Select
                  value={sortBy}
                  onChange={handleSortChange}
                  style={{ width: 120 }}
                  size="large"
                >
                  <Option value="hot">最热门</Option>
                  <Option value="latest">最新</Option>
                  <Option value="return">收益率</Option>
                  <Option value="sharpe">夏普比</Option>
                </Select>
              </>
            )}
            {activeTab === 'users' && (
              <Select
                value={sortBy}
                onChange={handleSortChange}
                style={{ width: 120 }}
                size="large"
              >
                <Option value="hot">最活跃</Option>
                <Option value="followers">粉丝数</Option>
                <Option value="strategies">策略数</Option>
                <Option value="points">积分</Option>
              </Select>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="community-main">
          <Spin spinning={loading}>
            {activeTab === 'strategies' && (
              <Row gutter={[24, 24]}>
                {strategies.map(strategy => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={strategy.id}>
                    <StrategyCard
                      strategy={strategy}
                      onAction={handleStrategyAction}
                    />
                  </Col>
                ))}
              </Row>
            )}
            
            {activeTab === 'users' && (
              <Row gutter={[24, 24]}>
                {users.map(user => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={user.id}>
                    <UserCard
                      user={user}
                      onAction={handleUserAction}
                    />
                  </Col>
                ))}
              </Row>
            )}
            
            {activeTab === 'articles' && (
              <div className="coming-soon">
                <h3>精选文章</h3>
                <p>功能开发中，敬请期待...</p>
              </div>
            )}
            
            {activeTab === 'discussions' && (
              <div className="coming-soon">
                <h3>讨论区</h3>
                <p>功能开发中，敬请期待...</p>
              </div>
            )}
          </Spin>
        </div>

        {/* 分页 */}
        {total > pageSize && (
          <div className="community-pagination">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            />
          </div>
        )}

        {/* 个人中心模块 */}
        <div className="personal-center-section">
          <Card className="personal-center-card" title="个人中心" extra={<Button type="link" icon={<SettingOutlined />}>设置</Button>}>
            <div className="personal-center-content">
              <Row gutter={[24, 24]}>
                {/* 用户信息卡片 */}
                <Col xs={24} md={8}>
                  <Card className="user-info-card">
                    <div className="user-basic-info">
                      <Avatar 
                        size={80} 
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" 
                        icon={<UserOutlined />}
                      />
                      <div className="user-details">
                        <div className="user-name-section">
                          <h3>量化交易者</h3>
                          <Button type="text" icon={<EditOutlined />} size="small" />
                        </div>
                        <p className="user-email">trader@quantmind.com</p>
                        <p className="user-level">高级交易员</p>
                        <p className="user-bio">专注于量化交易策略开发</p>
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* 统计数据 */}
                <Col xs={24} md={8}>
                  <Card className="stats-card">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="总收益率"
                          value={28.5}
                          suffix="%"
                          valueStyle={{ color: '#3f8600' }}
                          prefix={<TrophyOutlined />}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="策略数量"
                          value={12}
                          prefix={<LineChartOutlined />}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="粉丝数"
                          value={156}
                          prefix={<UserOutlined />}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="关注数"
                          value={89}
                          prefix={<BookOutlined />}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* 我的策略 */}
                <Col xs={24} md={8}>
                  <Card className="my-strategies-card" title="我的策略" extra={<Button type="link">查看全部</Button>}>
                    <div className="strategy-list">
                      <div className="strategy-item">
                        <div className="strategy-info">
                          <span className="strategy-name">双均线策略</span>
                          <Tag color="green">运行中</Tag>
                        </div>
                        <span className="strategy-return positive">+15.67%</span>
                      </div>
                      <div className="strategy-item">
                        <div className="strategy-info">
                          <span className="strategy-name">RSI反转策略</span>
                          <Tag color="red">已停止</Tag>
                        </div>
                        <span className="strategy-return negative">-3.24%</span>
                      </div>
                      <div className="strategy-item">
                        <div className="strategy-info">
                          <span className="strategy-name">MACD趋势策略</span>
                          <Tag color="blue">回测中</Tag>
                        </div>
                        <span className="strategy-return positive">+8.91%</span>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default CommunityPage;