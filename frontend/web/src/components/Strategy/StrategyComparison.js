import React, { useState } from 'react';
import {
  Modal,
  Tabs,
  Card,
  Row,
  Col,
  Tag,
  Progress,
  Button,
  Space,
  Divider,
  Tooltip,
  Typography,
  List,
  Statistic
} from 'antd';
import {
  CodeOutlined,
  StarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './StrategyComparison.css';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;

const StrategyComparison = ({ visible, onClose, strategies, bestStrategy }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  // 模型配置
  const modelConfigs = {
    qwen: {
      name: '通义千问',
      icon: '🤖',
      color: '#722ed1',
      description: '阿里云大语言模型'
    },
    gemini: {
      name: 'Gemini 2.0 Flash',
      icon: '✨',
      color: '#1890ff',
      description: 'Google最新多模态模型'
    }
  };

  // 复制代码
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    Modal.success({
      title: '复制成功',
      content: '代码已复制到剪贴板',
      centered: true,
    });
  };

  // 下载代码
  const handleDownloadCode = (strategy) => {
    const blob = new Blob([strategy.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modelConfigs[strategy.model].name}_strategy.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 获取策略评分颜色
  const getScoreColor = (score) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#faad14';
    return '#ff4d4f';
  };

  // 获取策略复杂度标签
  const getComplexityTag = (complexity) => {
    const complexityMap = {
      low: { color: 'green', text: '简单' },
      medium: { color: 'orange', text: '中等' },
      high: { color: 'red', text: '复杂' }
    };
    return complexityMap[complexity] || { color: 'default', text: '未知' };
  };

  if (!strategies || strategies.length === 0) {
    return null;
  }

  return (
    <Modal
      title="策略对比分析"
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      className="strategy-comparison-modal"
      centered
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="comparison-tabs">
        <TabPane tab="总览对比" key="overview">
          <Row gutter={[16, 16]}>
            {strategies.map((strategy, index) => (
              <Col xs={24} lg={12} key={index}>
                <Card
                  className={`strategy-overview-card ${
                    bestStrategy && bestStrategy.model === strategy.model ? 'best-strategy' : ''
                  }`}
                  title={
                    <div className="strategy-card-header">
                      <span className="model-info">
                        <span className="model-icon">{modelConfigs[strategy.model].icon}</span>
                        <span className="model-name">{modelConfigs[strategy.model].name}</span>
                      </span>
                      {bestStrategy && bestStrategy.model === strategy.model && (
                        <Tag color="gold" icon={<StarOutlined />}>推荐</Tag>
                      )}
                    </div>
                  }
                  extra={
                    <Button
                      type="link"
                      onClick={() => setSelectedStrategy(strategy)}
                    >
                      查看详情
                    </Button>
                  }
                >
                  <div className="strategy-metrics">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="置信度"
                          value={Math.round(strategy.confidence_score * 100)}
                          suffix="%"
                          valueStyle={{ color: getScoreColor(strategy.confidence_score) }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="生成时间"
                          value={strategy.execution_time}
                          suffix="ms"
                        />
                      </Col>
                    </Row>
                    
                    <Divider />
                    
                    <div className="strategy-tags">
                      <Space wrap>
                        <Tag color={getComplexityTag(strategy.complexity).color}>
                          {getComplexityTag(strategy.complexity).text}
                        </Tag>
                        <Tag icon={<CodeOutlined />}>
                          {strategy.parameters?.length || 0} 参数
                        </Tag>
                        <Tag icon={<ClockCircleOutlined />}>
                          {strategy.code.split('\n').length} 行代码
                        </Tag>
                      </Space>
                    </div>
                    
                    <div className="strategy-features">
                      <Title level={5}>策略特点</Title>
                      <List
                        size="small"
                        dataSource={strategy.features || []}
                        renderItem={(item) => (
                          <List.Item>
                            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                            {item}
                          </List.Item>
                        )}
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>

        <TabPane tab="代码对比" key="code">
          <Row gutter={16}>
            {strategies.map((strategy, index) => (
              <Col xs={24} lg={12} key={index}>
                <Card
                  title={
                    <div className="code-card-header">
                      <span>{modelConfigs[strategy.model].name}</span>
                      <Space>
                        <Tooltip title="复制代码">
                          <Button
                            type="text"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyCode(strategy.code)}
                          />
                        </Tooltip>
                        <Tooltip title="下载代码">
                          <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownloadCode(strategy)}
                          />
                        </Tooltip>
                      </Space>
                    </div>
                  }
                  className="code-comparison-card"
                >
                  <div className="code-container">
                    <SyntaxHighlighter
                      language="python"
                      style={tomorrow}
                      customStyle={{
                        margin: 0,
                        borderRadius: '8px',
                        fontSize: '12px',
                        maxHeight: '400px',
                        overflow: 'auto'
                      }}
                    >
                      {strategy.code}
                    </SyntaxHighlighter>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>

        <TabPane tab="性能分析" key="performance">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="性能对比" className="performance-card">
                <Row gutter={16}>
                  {strategies.map((strategy, index) => (
                    <Col xs={24} md={12} lg={8} key={index}>
                      <div className="performance-item">
                        <div className="performance-header">
                          <span className="model-badge">
                            {modelConfigs[strategy.model].icon} {modelConfigs[strategy.model].name}
                          </span>
                        </div>
                        
                        <div className="performance-metrics">
                          <div className="metric-item">
                            <Text type="secondary">置信度评分</Text>
                            <Progress
                              percent={Math.round(strategy.confidence_score * 100)}
                              strokeColor={getScoreColor(strategy.confidence_score)}
                              size="small"
                            />
                          </div>
                          
                          <div className="metric-item">
                            <Text type="secondary">代码质量</Text>
                            <Progress
                              percent={Math.round((strategy.code_quality || 0.8) * 100)}
                              strokeColor={getScoreColor(strategy.code_quality || 0.8)}
                              size="small"
                            />
                          </div>
                          
                          <div className="metric-item">
                            <Text type="secondary">可读性</Text>
                            <Progress
                              percent={Math.round((strategy.readability || 0.75) * 100)}
                              strokeColor={getScoreColor(strategy.readability || 0.75)}
                              size="small"
                            />
                          </div>
                          
                          <div className="metric-item">
                            <Text type="secondary">执行效率</Text>
                            <Progress
                              percent={Math.round(Math.max(0, 100 - strategy.execution_time / 10))}
                              strokeColor={getScoreColor(Math.max(0, (100 - strategy.execution_time / 10) / 100))}
                              size="small"
                            />
                          </div>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* 策略详情模态框 */}
      {selectedStrategy && (
        <Modal
          title={`${modelConfigs[selectedStrategy.model].name} 策略详情`}
          open={!!selectedStrategy}
          onCancel={() => setSelectedStrategy(null)}
          width={800}
          footer={[
            <Button key="copy" icon={<CopyOutlined />} onClick={() => handleCopyCode(selectedStrategy.code)}>
              复制代码
            </Button>,
            <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => handleDownloadCode(selectedStrategy)}>
              下载代码
            </Button>
          ]}
        >
          <div className="strategy-detail">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="策略参数" size="small">
                  {selectedStrategy.parameters && selectedStrategy.parameters.length > 0 ? (
                    <List
                      size="small"
                      dataSource={selectedStrategy.parameters}
                      renderItem={(param) => (
                        <List.Item>
                          <List.Item.Meta
                            title={param.name}
                            description={`${param.description} (默认值: ${param.default_value})`}
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Text type="secondary">暂无参数信息</Text>
                  )}
                </Card>
              </Col>
              
              <Col span={24}>
                <Card title="完整代码" size="small">
                  <SyntaxHighlighter
                    language="python"
                    style={tomorrow}
                    customStyle={{
                      margin: 0,
                      borderRadius: '8px',
                      fontSize: '12px',
                      maxHeight: '300px'
                    }}
                  >
                    {selectedStrategy.code}
                  </SyntaxHighlighter>
                </Card>
              </Col>
            </Row>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default StrategyComparison;