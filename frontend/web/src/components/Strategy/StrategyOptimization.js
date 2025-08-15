import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Progress,
  List,
  Avatar,
  Tooltip,
  Alert,
  Tabs,
  Statistic,
  Timeline,
  Badge,
  Space,
  Divider,
  Typography,
  Rate,
  Modal
} from 'antd';
import {
  BulbOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SettingOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  StarOutlined,
  FireOutlined,
  SafetyOutlined,
  DollarOutlined,
  LineChartOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import './StrategyOptimization.css';

const { TabPane } = Tabs;
const { Text, Title, Paragraph } = Typography;

const StrategyOptimization = ({ visible, onClose, strategyData }) => {
  const [loading, setLoading] = useState(false);
  const [optimizationData, setOptimizationData] = useState(null);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [applyingOptimization, setApplyingOptimization] = useState(false);

  // 模拟优化建议数据
  const mockOptimizationData = {
    overallScore: 78,
    riskLevel: 'medium',
    suggestions: [
      {
        id: 1,
        type: 'performance',
        priority: 'high',
        title: '优化止损策略',
        description: '当前固定止损可能过于保守，建议采用动态止损或ATR止损',
        impact: '预计可提升收益率2-3%',
        difficulty: 'medium',
        estimatedTime: '2-3小时',
        category: '风险管理',
        icon: <SafetyOutlined />,
        color: '#f5222d',
        details: {
          currentIssue: '固定2%止损在高波动市场中可能过早触发',
          solution: '使用ATR(14)的1.5倍作为动态止损距离',
          expectedImprovement: '减少假突破损失，提高持仓效率',
          codeExample: `# 动态止损示例\nif position > 0:\n    stop_loss = entry_price - atr * 1.5\nelse:\n    stop_loss = entry_price + atr * 1.5`
        }
      },
      {
        id: 2,
        type: 'signal',
        priority: 'high',
        title: '增加成交量确认',
        description: '当前策略缺少成交量确认，可能产生虚假信号',
        impact: '预计可减少15-20%的虚假信号',
        difficulty: 'easy',
        estimatedTime: '1小时',
        category: '信号质量',
        icon: <BarChartOutlined />,
        color: '#1890ff',
        details: {
          currentIssue: '仅依赖价格指标可能导致虚假突破',
          solution: '添加成交量放大确认，要求成交量超过20日均量1.5倍',
          expectedImprovement: '提高信号准确率，减少噪音交易',
          codeExample: `# 成交量确认示例\nvolume_ma20 = volume.rolling(20).mean()\nvolume_confirm = volume > volume_ma20 * 1.5`
        }
      },
      {
        id: 3,
        type: 'timing',
        priority: 'medium',
        title: '优化入场时机',
        description: '建议在信号出现后等待回调确认，避免追高',
        impact: '预计可改善入场价格1-2%',
        difficulty: 'medium',
        estimatedTime: '2小时',
        category: '入场优化',
        icon: <ArrowUpOutlined />,
        color: '#52c41a',
        details: {
          currentIssue: '信号出现后立即入场可能买在高点',
          solution: '等待价格回调至5日均线附近再入场',
          expectedImprovement: '改善入场成本，提高盈利空间',
          codeExample: `# 回调入场示例\nif signal and price <= ma5 * 1.02:\n    enter_position()`
        }
      },
      {
        id: 4,
        type: 'risk',
        priority: 'medium',
        title: '添加市场环境过滤',
        description: '在震荡市场中暂停交易，只在趋势明确时操作',
        impact: '预计可减少30%的震荡市损失',
        difficulty: 'hard',
        estimatedTime: '4-5小时',
        category: '市场适应',
        icon: <LineChartOutlined />,
        color: '#722ed1',
        details: {
          currentIssue: '策略在震荡市场中表现不佳',
          solution: '使用ADX指标判断趋势强度，ADX>25时才交易',
          expectedImprovement: '避免震荡市频繁止损，提高整体胜率',
          codeExample: `# 趋势过滤示例\nadx = calculate_adx(high, low, close, 14)\ntrend_filter = adx > 25`
        }
      },
      {
        id: 5,
        type: 'position',
        priority: 'low',
        title: '优化仓位管理',
        description: '根据波动率动态调整仓位大小',
        impact: '预计可提升风险调整收益10%',
        difficulty: 'hard',
        estimatedTime: '3-4小时',
        category: '仓位管理',
        icon: <DollarOutlined />,
        color: '#fa8c16',
        details: {
          currentIssue: '固定仓位无法适应市场波动变化',
          solution: '使用ATR计算动态仓位，高波动时减仓',
          expectedImprovement: '在保持收益的同时降低风险',
          codeExample: `# 动态仓位示例\nbase_position = 1000\natr_ratio = atr / price\nposition_size = base_position / atr_ratio`
        }
      }
    ],
    optimizationHistory: [
      {
        date: '2024-03-15',
        action: '应用动态止损优化',
        result: '收益率提升2.1%',
        status: 'success'
      },
      {
        date: '2024-03-10',
        action: '添加成交量确认',
        result: '虚假信号减少18%',
        status: 'success'
      },
      {
        date: '2024-03-05',
        action: '优化参数设置',
        result: '夏普比率提升0.15',
        status: 'success'
      }
    ],
    performanceMetrics: {
      beforeOptimization: {
        totalReturn: 12.5,
        sharpeRatio: 1.2,
        maxDrawdown: 8.5,
        winRate: 65
      },
      afterOptimization: {
        totalReturn: 15.8,
        sharpeRatio: 1.45,
        maxDrawdown: 6.2,
        winRate: 72
      }
    },
    aiInsights: [
      {
        type: 'trend',
        title: '市场趋势分析',
        content: '当前市场处于上升趋势，建议增加做多信号权重',
        confidence: 85,
        source: 'Gemini AI'
      },
      {
        type: 'risk',
        title: '风险预警',
        content: '检测到波动率上升，建议降低仓位或收紧止损',
        confidence: 78,
        source: '通义千问'
      },
      {
        type: 'opportunity',
        title: '机会识别',
        content: '科技股板块显示强势信号，可考虑增加相关标的权重',
        confidence: 92,
        source: 'Gemini AI'
      }
    ]
  };

  useEffect(() => {
    if (visible) {
      loadOptimizationData();
    }
  }, [visible]);

  const loadOptimizationData = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      setOptimizationData(mockOptimizationData);
    } catch (error) {
      console.error('加载优化建议失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyOptimization = async (suggestionId) => {
    setApplyingOptimization(true);
    try {
      // 模拟应用优化
      await new Promise(resolve => setTimeout(resolve, 2000));
      Modal.success({
        title: '优化应用成功',
        content: '策略优化已应用，建议进行回测验证效果。'
      });
    } catch (error) {
      Modal.error({
        title: '优化应用失败',
        content: '请稍后重试或联系技术支持。'
      });
    } finally {
      setApplyingOptimization(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f5222d';
      case 'medium': return '#fa8c16';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getDifficultyTag = (difficulty) => {
    const configs = {
      easy: { color: 'green', text: '简单' },
      medium: { color: 'orange', text: '中等' },
      hard: { color: 'red', text: '困难' }
    };
    const config = configs[difficulty] || configs.medium;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const renderSuggestionsTab = () => {
    if (!optimizationData) return null;

    return (
      <div className="suggestions-content">
        <div className="optimization-header">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card className="score-card">
                <div className="score-content">
                  <div className="score-circle">
                    <Progress
                      type="circle"
                      percent={optimizationData.overallScore}
                      size={80}
                      strokeColor={{
                        '0%': '#ff4d4f',
                        '50%': '#faad14',
                        '100%': '#52c41a',
                      }}
                      format={percent => (
                        <div className="score-text">
                          <div className="score-number">{percent}</div>
                          <div className="score-label">分</div>
                        </div>
                      )}
                    />
                  </div>
                  <div className="score-info">
                    <Title level={5}>策略评分</Title>
                    <Text type="secondary">综合评估结果</Text>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="risk-card">
                <Statistic
                  title="风险等级"
                  value={optimizationData.riskLevel === 'medium' ? '中等' : optimizationData.riskLevel}
                  prefix={<SafetyOutlined />}
                  valueStyle={{ 
                    color: optimizationData.riskLevel === 'high' ? '#f5222d' : 
                           optimizationData.riskLevel === 'medium' ? '#fa8c16' : '#52c41a'
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="suggestions-count-card">
                <Statistic
                  title="优化建议"
                  value={optimizationData.suggestions.length}
                  suffix="条"
                  prefix={<BulbOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        <Card title="优化建议列表" className="suggestions-list-card">
          <List
            itemLayout="vertical"
            dataSource={optimizationData.suggestions}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                className="suggestion-item"
                actions={[
                  <Button 
                    type="primary" 
                    size="small"
                    loading={applyingOptimization}
                    onClick={() => handleApplyOptimization(item.id)}
                  >
                    应用优化
                  </Button>,
                  <Button size="small">查看详情</Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={item.icon} 
                      style={{ backgroundColor: item.color }}
                      size={48}
                    />
                  }
                  title={
                    <div className="suggestion-title">
                      <span>{item.title}</span>
                      <div className="suggestion-tags">
                        <Tag color={getPriorityColor(item.priority)}>
                          {item.priority === 'high' ? '高优先级' : 
                           item.priority === 'medium' ? '中优先级' : '低优先级'}
                        </Tag>
                        {getDifficultyTag(item.difficulty)}
                        <Tag>{item.category}</Tag>
                      </div>
                    </div>
                  }
                  description={
                    <div className="suggestion-description">
                      <Paragraph>{item.description}</Paragraph>
                      <div className="suggestion-metrics">
                        <Space split={<Divider type="vertical" />}>
                          <Text strong>预期影响: <Text type="success">{item.impact}</Text></Text>
                          <Text strong>预估时间: <Text type="secondary">{item.estimatedTime}</Text></Text>
                        </Space>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    );
  };

  const renderHistoryTab = () => {
    if (!optimizationData) return null;

    return (
      <div className="history-content">
        <Card title="优化历史" className="history-card">
          <Timeline>
            {optimizationData.optimizationHistory.map((item, index) => (
              <Timeline.Item
                key={index}
                dot={
                  item.status === 'success' ? 
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                    <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
                }
              >
                <div className="history-item">
                  <div className="history-header">
                    <Text strong>{item.action}</Text>
                    <Text type="secondary">{item.date}</Text>
                  </div>
                  <div className="history-result">
                    <Badge 
                      status={item.status === 'success' ? 'success' : 'error'} 
                      text={item.result}
                    />
                  </div>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      </div>
    );
  };

  const renderPerformanceTab = () => {
    if (!optimizationData) return null;

    const { beforeOptimization, afterOptimization } = optimizationData.performanceMetrics;

    return (
      <div className="performance-content">
        <Alert
          message="性能对比"
          description="以下数据展示了应用优化建议前后的策略性能对比"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="优化前" className="performance-card before">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="总收益率"
                    value={beforeOptimization.totalReturn}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#8c8c8c' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="夏普比率"
                    value={beforeOptimization.sharpeRatio}
                    precision={2}
                    valueStyle={{ color: '#8c8c8c' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="最大回撤"
                    value={beforeOptimization.maxDrawdown}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#8c8c8c' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="胜率"
                    value={beforeOptimization.winRate}
                    suffix="%"
                    valueStyle={{ color: '#8c8c8c' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="优化后" className="performance-card after">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="总收益率"
                    value={afterOptimization.totalReturn}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<ArrowUpOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="夏普比率"
                    value={afterOptimization.sharpeRatio}
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<ArrowUpOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="最大回撤"
                    value={afterOptimization.maxDrawdown}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<ArrowDownOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="胜率"
                    value={afterOptimization.winRate}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<ArrowUpOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderAIInsightsTab = () => {
    if (!optimizationData) return null;

    return (
      <div className="ai-insights-content">
        <Card title="AI智能洞察" className="insights-card">
          <List
            itemLayout="horizontal"
            dataSource={optimizationData.aiInsights}
            renderItem={(item) => (
              <List.Item className="insight-item">
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={
                        item.type === 'trend' ? <ArrowUpOutlined /> :
                        item.type === 'risk' ? <ExclamationCircleOutlined /> :
                        <StarOutlined />
                      }
                      style={{
                        backgroundColor: 
                          item.type === 'trend' ? '#1890ff' :
                          item.type === 'risk' ? '#f5222d' :
                          '#52c41a'
                      }}
                    />
                  }
                  title={
                    <div className="insight-title">
                      <span>{item.title}</span>
                      <div className="insight-meta">
                        <Tag color="blue">{item.source}</Tag>
                        <Tooltip title="AI置信度">
                          <Rate 
                            disabled 
                            count={5} 
                            value={Math.round(item.confidence / 20)} 
                            style={{ fontSize: 12 }}
                          />
                          <Text type="secondary" style={{ marginLeft: 4 }}>
                            {item.confidence}%
                          </Text>
                        </Tooltip>
                      </div>
                    </div>
                  }
                  description={item.content}
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      title={
        <div className="optimization-modal-title">
          <SettingOutlined style={{ marginRight: 8 }} />
          策略优化建议
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      className="strategy-optimization-modal"
    >
      <div className="optimization-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="优化建议" key="suggestions">
            {renderSuggestionsTab()}
          </TabPane>
          <TabPane tab="优化历史" key="history">
            {renderHistoryTab()}
          </TabPane>
          <TabPane tab="性能对比" key="performance">
            {renderPerformanceTab()}
          </TabPane>
          <TabPane tab="AI洞察" key="insights">
            {renderAIInsightsTab()}
          </TabPane>
        </Tabs>
      </div>
    </Modal>
  );
};

export default StrategyOptimization;