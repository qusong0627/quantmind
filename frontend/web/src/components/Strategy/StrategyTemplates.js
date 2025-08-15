import React, { useState } from 'react';
import {
  Modal,
  Card,
  Row,
  Col,
  Tag,
  Button,
  Input,
  Space,
  Tooltip,
  Typography,
  Divider
} from 'antd';
import {
  ArrowUpOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  RocketOutlined,
  SearchOutlined
} from '@ant-design/icons';
import './StrategyTemplates.css';

const { Search } = Input;
const { Title, Text } = Typography;

const StrategyTemplates = ({ visible, onClose, onSelectTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 策略模板数据
  const strategyTemplates = [
    {
      id: 'rsi_macd',
      name: 'RSI+MACD双重确认策略',
      category: 'technical',
      difficulty: 'medium',
      riskLevel: 3,
      description: '结合RSI超买超卖信号和MACD趋势确认，提高交易信号的准确性',
      features: ['技术指标组合', '趋势跟踪', '风险控制'],
      template: `基于RSI和MACD的双重确认策略：\n\n买入条件：\n- RSI指标低于30（超卖区域）\n- MACD出现金叉信号\n- 成交量放大确认\n\n卖出条件：\n- RSI指标高于70（超买区域）\n- MACD出现死叉信号\n- 设置2%止损和5%止盈`,
      icon: <LineChartOutlined />,
      color: '#1890ff'
    },
    {
      id: 'bollinger_bands',
      name: '布林带均值回归策略',
      category: 'technical',
      difficulty: 'easy',
      riskLevel: 2,
      description: '利用布林带的统计特性，在价格偏离均值时进行反向交易',
      features: ['均值回归', '统计套利', '低风险'],
      template: `布林带均值回归策略：\n\n买入条件：\n- 价格触及布林带下轨\n- RSI低于30确认超卖\n- 成交量萎缩显示抛压减弱\n\n卖出条件：\n- 价格触及布林带上轨\n- RSI高于70确认超买\n- 设置1.5%止损保护`,
      icon: <BarChartOutlined />,
      color: '#52c41a'
    },
    {
      id: 'momentum_breakout',
      name: '动量突破策略',
      category: 'momentum',
      difficulty: 'hard',
      riskLevel: 4,
      description: '捕捉价格突破关键阻力位后的强势动量，适合趋势市场',
      features: ['突破交易', '动量跟踪', '高收益潜力'],
      template: `动量突破策略：\n\n买入条件：\n- 价格突破20日高点\n- 成交量较前5日平均放大2倍以上\n- MACD处于零轴上方\n- ATR指标显示波动率上升\n\n卖出条件：\n- 价格跌破10日均线\n- 成交量萎缩\n- 设置3%止损和8%止盈`,
      icon: <RocketOutlined />,
      color: '#fa541c'
    },
    {
      id: 'grid_trading',
      name: '网格交易策略',
      category: 'quantitative',
      difficulty: 'medium',
      riskLevel: 3,
      description: '在震荡市场中通过网格化交易获取稳定收益',
      features: ['网格交易', '震荡市场', '稳定收益'],
      template: `网格交易策略：\n\n策略参数：\n- 网格间距：2%\n- 网格数量：10层\n- 基准价格：当前价格\n\n交易规则：\n- 价格下跌到网格线时买入\n- 价格上涨到网格线时卖出\n- 每次交易固定金额\n- 动态调整网格中心`,
      icon: <PieChartOutlined />,
      color: '#722ed1'
    },
    {
      id: 'pairs_trading',
      name: '配对交易策略',
      category: 'arbitrage',
      difficulty: 'hard',
      riskLevel: 2,
      description: '通过相关性分析，对冲交易相关资产的价差',
      features: ['统计套利', '市场中性', '风险对冲'],
      template: `配对交易策略：\n\n选股条件：\n- 选择相关系数>0.8的股票对\n- 计算价差的Z-Score\n- 设定开仓和平仓阈值\n\n交易规则：\n- Z-Score > 2时：做空强势股，做多弱势股\n- Z-Score < -2时：做多强势股，做空弱势股\n- Z-Score回归到0附近时平仓`,
      icon: <ThunderboltOutlined />,
      color: '#13c2c2'
    },
    {
      id: 'risk_parity',
      name: '风险平价策略',
      category: 'portfolio',
      difficulty: 'hard',
      riskLevel: 1,
      description: '基于风险贡献度的资产配置策略，实现风险的均衡分散',
      features: ['资产配置', '风险管理', '长期投资'],
      template: `风险平价策略：\n\n资产选择：\n- 股票、债券、商品、REITs\n- 计算各资产的风险贡献度\n- 动态调整权重使风险贡献相等\n\n再平衡规则：\n- 月度检查权重偏离\n- 偏离超过5%时进行再平衡\n- 考虑交易成本和税收影响`,
      icon: <SafetyOutlined />,
      color: '#eb2f96'
    }
  ];

  // 分类配置
  const categories = [
    { key: 'all', label: '全部', count: strategyTemplates.length },
    { key: 'technical', label: '技术分析', count: strategyTemplates.filter(t => t.category === 'technical').length },
    { key: 'momentum', label: '动量策略', count: strategyTemplates.filter(t => t.category === 'momentum').length },
    { key: 'quantitative', label: '量化交易', count: strategyTemplates.filter(t => t.category === 'quantitative').length },
    { key: 'arbitrage', label: '套利策略', count: strategyTemplates.filter(t => t.category === 'arbitrage').length },
    { key: 'portfolio', label: '组合管理', count: strategyTemplates.filter(t => t.category === 'portfolio').length }
  ];

  // 难度标签配置
  const difficultyConfig = {
    easy: { label: '简单', color: 'green' },
    medium: { label: '中等', color: 'orange' },
    hard: { label: '困难', color: 'red' }
  };

  // 风险等级配置
  const riskConfig = {
    1: { label: '极低风险', color: '#52c41a' },
    2: { label: '低风险', color: '#73d13d' },
    3: { label: '中等风险', color: '#faad14' },
    4: { label: '高风险', color: '#ff7a45' },
    5: { label: '极高风险', color: '#ff4d4f' }
  };

  // 过滤模板
  const filteredTemplates = strategyTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 选择模板
  const handleSelectTemplate = (template) => {
    onSelectTemplate(template.template);
    onClose();
  };

  return (
    <Modal
      title="策略模板库"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
      className="strategy-templates-modal"
      centered
    >
      <div className="templates-header">
        <div className="search-section">
          <Search
            placeholder="搜索策略模板..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
        </div>
        
        <div className="category-section">
          <Space wrap>
            {categories.map(category => (
              <Button
                key={category.key}
                type={selectedCategory === category.key ? 'primary' : 'default'}
                onClick={() => setSelectedCategory(category.key)}
                className="category-btn"
              >
                {category.label} ({category.count})
              </Button>
            ))}
          </Space>
        </div>
      </div>

      <Divider />

      <div className="templates-content">
        {filteredTemplates.length === 0 ? (
          <div className="empty-templates">
            <SearchOutlined className="empty-icon" />
            <p>未找到匹配的策略模板</p>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredTemplates.map(template => (
              <Col xs={24} lg={12} key={template.id}>
                <Card
                  className="template-card"
                  hoverable
                  actions={[
                    <Button
                      type="primary"
                      onClick={() => handleSelectTemplate(template)}
                      block
                    >
                      使用此模板
                    </Button>
                  ]}
                >
                  <div className="template-header">
                    <div className="template-icon" style={{ color: template.color }}>
                      {template.icon}
                    </div>
                    <div className="template-info">
                      <Title level={4} className="template-title">
                        {template.name}
                      </Title>
                      <Text type="secondary" className="template-description">
                        {template.description}
                      </Text>
                    </div>
                  </div>

                  <div className="template-meta">
                    <Space wrap>
                      <Tag color={difficultyConfig[template.difficulty].color}>
                        {difficultyConfig[template.difficulty].label}
                      </Tag>
                      <Tag color={riskConfig[template.riskLevel].color}>
                        {riskConfig[template.riskLevel].label}
                      </Tag>
                    </Space>
                  </div>

                  <div className="template-features">
                    <Text strong>特点：</Text>
                    <div className="features-list">
                      {template.features.map((feature, index) => (
                        <Tag key={index} className="feature-tag">
                          {feature}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  <div className="template-preview">
                    <Text strong>策略概要：</Text>
                    <div className="preview-content">
                      <Text className="preview-text">
                        {template.template.substring(0, 100)}...
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </Modal>
  );
};

export default StrategyTemplates;