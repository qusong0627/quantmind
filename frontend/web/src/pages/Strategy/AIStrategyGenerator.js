import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Select,
  Form,
  Row,
  Col,
  Typography,
  Space,
  Spin,
  Alert,
  Divider,
  Tag,
  message
} from 'antd';
import {
  RobotOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  CodeOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import './AIStrategyGenerator.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AIStrategyGenerator = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState(null);
  const [selectedModel, setSelectedModel] = useState('qwen');
  const [description, setDescription] = useState('');
  const [strategyParams, setStrategyParams] = useState({
    riskLevel: 'medium',
    timeframe: '1d',
    maxPositions: 5,
    stopLoss: 5,
    takeProfit: 10,
    capital: 100000
  });

  // 可用的AI模型
  const availableModels = [
    {
      id: 'qwen',
      name: '通义千问',
      description: '阿里云自研大模型，中文理解能力强，策略质量优秀',
      tag: '推荐',
      tagColor: 'gold'
    },
    {
      id: 'gemini',
      name: 'Gemini 2.0 Flash',
      description: 'Google最新模型，多模态能力强，支持中英文策略生成',
      tag: '新锐',
      tagColor: 'purple'
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: '通用AI模型，策略质量较高',
      tag: '备选',
      tagColor: 'blue'
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: '快速响应，适合简单策略生成',
      tag: '快速',
      tagColor: 'green'
    }
  ];

  // 策略模板
  const strategyTemplates = [
    {
      name: '均线策略',
      description: '基于移动平均线的经典策略，适合趋势跟踪',
      prompt: '请生成一个基于双均线交叉的量化交易策略，包含5日和20日移动平均线'
    },
    {
      name: 'RSI策略',
      description: '基于相对强弱指标的反转策略',
      prompt: '请生成一个基于RSI指标的量化交易策略，RSI超买超卖阈值为70和30'
    },
    {
      name: 'MACD策略',
      description: '基于MACD指标的趋势策略',
      prompt: '请生成一个基于MACD指标的量化交易策略，包含金叉死叉信号'
    },
    {
      name: '布林带策略',
      description: '基于布林带的均值回归策略',
      prompt: '请生成一个基于布林带的量化交易策略，包含上下轨突破信号'
    }
  ];

  const handleGenerate = async () => {
    if (!description.trim()) {
      message.warning('请输入策略描述');
      return;
    }

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const riskLevelMap = { low: '低风险', medium: '中等风险', high: '高风险' };
      const timeframeMap = { '1m': '1分钟', '5m': '5分钟', '15m': '15分钟', '1h': '1小时', '1d': '日线', '1w': '周线' };
      
      const mockStrategy = {
        name: '智能生成策略',
        description: description,
        model: selectedModel,
        params: strategyParams,
        code: `# AI生成的量化策略\n# 模型: ${availableModels.find(m => m.id === selectedModel)?.name}\n# 描述: ${description}\n# 风险等级: ${riskLevelMap[strategyParams.riskLevel]}\n# 时间周期: ${timeframeMap[strategyParams.timeframe]}\n# 最大持仓: ${strategyParams.maxPositions}个\n# 初始资金: ${(strategyParams.capital/10000).toFixed(0)}万\n# 止损比例: ${strategyParams.stopLoss}%\n# 止盈比例: ${strategyParams.takeProfit}%\n\nimport pandas as pd\nimport numpy as np\nfrom datetime import datetime\n\nclass AIGeneratedStrategy:\n    def __init__(self):\n        self.name = "AI生成策略"\n        self.description = "${description}"\n        self.risk_level = "${strategyParams.riskLevel}"\n        self.timeframe = "${strategyParams.timeframe}"\n        self.max_positions = ${strategyParams.maxPositions}\n        self.initial_capital = ${strategyParams.capital}\n        self.stop_loss = ${strategyParams.stopLoss / 100}\n        self.take_profit = ${strategyParams.takeProfit / 100}\n        \n    def initialize(self, context):\n        # 初始化策略参数\n        context.stocks = ['000001.XSHE', '000002.XSHE']\n        context.benchmark = '000300.XSHG'\n        context.max_positions = self.max_positions\n        context.stop_loss = self.stop_loss\n        context.take_profit = self.take_profit\n        \n    def handle_data(self, context, data):\n        # 策略主逻辑\n        for stock in context.stocks:\n            current_price = data.current(stock, 'price')\n            # 风险控制逻辑\n            if len(context.portfolio.positions) >= context.max_positions:\n                continue\n            # 这里添加具体的交易逻辑\n            pass\n            \n    def before_trading_start(self, context, data):\n        # 开盘前处理\n        pass\n        \n    def after_trading_end(self, context, data):\n        # 收盘后处理\n        pass`,
        performance: {
          annualReturn: '15.6%',
          sharpeRatio: '1.23',
          maxDrawdown: '8.9%',
          winRate: '62.3%'
        },
        generatedAt: new Date().toLocaleString()
      };
      
      setGeneratedStrategy(mockStrategy);
      message.success('策略生成成功！');
    } catch (error) {
      message.error('策略生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    message.success('策略已保存到策略库');
  };

  const handleBacktest = () => {
    message.info('正在启动回测...');
  };

  const handleTemplateSelect = (template) => {
    setDescription(template.prompt);
    form.setFieldsValue({ description: template.prompt });
  };

  return (
    <div className="ai-strategy-generator">
      <div className="generator-header">
        <Title level={2}>
          <RobotOutlined /> AI策略生成器
        </Title>
        <Paragraph type="secondary">
          选择AI模型，描述您的策略想法，让AI为您生成专业的量化交易策略
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧：配置区域 */}
        <Col xs={24} lg={12}>
          <Card title="策略配置" className="config-card">
            <Form form={form} layout="vertical">
              {/* AI模型选择 */}
              <Form.Item label="选择AI模型" required>
                <div className="model-selection">
                  {availableModels.map(model => (
                    <Card
                      key={model.id}
                      size="small"
                      className={`model-card ${
                        selectedModel === model.id ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedModel(model.id)}
                      hoverable
                    >
                      <div className="model-header">
                        <Text strong>{model.name}</Text>
                        <Tag color={model.tagColor}>{model.tag}</Tag>
                      </div>
                      <Text type="secondary" className="model-desc">
                        {model.description}
                      </Text>
                    </Card>
                  ))}
                </div>
              </Form.Item>

              {/* 策略模板 */}
              <Form.Item label="快速模板">
                <div className="template-selection">
                  {strategyTemplates.map((template, index) => (
                    <Button
                      key={index}
                      size="small"
                      onClick={() => handleTemplateSelect(template)}
                      className="template-btn"
                    >
                      <BulbOutlined /> {template.name}
                    </Button>
                  ))}
                </div>
              </Form.Item>

              {/* 策略描述 */}
              <Form.Item 
                label="策略描述" 
                name="description"
                required
                rules={[{ required: true, message: '请输入策略描述' }]}
              >
                <TextArea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请详细描述您想要的交易策略，例如：基于技术指标的策略、基于基本面的策略、或者您的具体交易思路..."
                  rows={6}
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              {/* 生成按钮 */}
              <Form.Item>
                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltOutlined />}
                  onClick={handleGenerate}
                  loading={loading}
                  disabled={!description.trim()}
                  block
                >
                  {loading ? '正在生成策略...' : '生成AI策略'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 右侧：参数设置和结果区域 */}
        <Col xs={24} lg={12}>
          {/* 参数设置模块 */}
          <Card title={<><SettingOutlined /> 策略参数</>} className="params-card" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item label="风险等级">
                  <Select
                    value={strategyParams.riskLevel}
                    onChange={(value) => setStrategyParams({...strategyParams, riskLevel: value})}
                    style={{ width: '100%' }}
                  >
                    <Option value="low">低风险</Option>
                    <Option value="medium">中等风险</Option>
                    <Option value="high">高风险</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="时间周期">
                  <Select
                    value={strategyParams.timeframe}
                    onChange={(value) => setStrategyParams({...strategyParams, timeframe: value})}
                    style={{ width: '100%' }}
                  >
                    <Option value="1m">1分钟</Option>
                    <Option value="5m">5分钟</Option>
                    <Option value="15m">15分钟</Option>
                    <Option value="1h">1小时</Option>
                    <Option value="1d">日线</Option>
                    <Option value="1w">周线</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="最大持仓数">
                  <Select
                    value={strategyParams.maxPositions}
                    onChange={(value) => setStrategyParams({...strategyParams, maxPositions: value})}
                    style={{ width: '100%' }}
                  >
                    <Option value={1}>1个</Option>
                    <Option value={3}>3个</Option>
                    <Option value={5}>5个</Option>
                    <Option value={10}>10个</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="初始资金">
                  <Select
                    value={strategyParams.capital}
                    onChange={(value) => setStrategyParams({...strategyParams, capital: value})}
                    style={{ width: '100%' }}
                  >
                    <Option value={50000}>5万</Option>
                    <Option value={100000}>10万</Option>
                    <Option value={500000}>50万</Option>
                    <Option value={1000000}>100万</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="止损比例(%)">
                  <Select
                    value={strategyParams.stopLoss}
                    onChange={(value) => setStrategyParams({...strategyParams, stopLoss: value})}
                    style={{ width: '100%' }}
                  >
                    <Option value={2}>2%</Option>
                    <Option value={3}>3%</Option>
                    <Option value={5}>5%</Option>
                    <Option value={8}>8%</Option>
                    <Option value={10}>10%</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="止盈比例(%)">
                  <Select
                    value={strategyParams.takeProfit}
                    onChange={(value) => setStrategyParams({...strategyParams, takeProfit: value})}
                    style={{ width: '100%' }}
                  >
                    <Option value={5}>5%</Option>
                    <Option value={8}>8%</Option>
                    <Option value={10}>10%</Option>
                    <Option value={15}>15%</Option>
                    <Option value={20}>20%</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>
          
          <Card title="生成结果" className="result-card">
            {loading && (
              <div className="loading-container">
                <Spin size="large" />
                <div className="loading-text">
                  <Text>AI正在分析您的需求...</Text>
                  <br />
                  <Text type="secondary">使用模型: {availableModels.find(m => m.id === selectedModel)?.name}</Text>
                </div>
              </div>
            )}

            {!loading && !generatedStrategy && (
              <div className="empty-result">
                <RobotOutlined className="empty-icon" />
                <Text type="secondary">请配置策略参数并点击生成</Text>
              </div>
            )}

            {!loading && generatedStrategy && (
              <div className="strategy-result">
                <div className="result-header">
                  <Title level={4}>{generatedStrategy.name}</Title>
                  <Text type="secondary">生成时间: {generatedStrategy.generatedAt}</Text>
                  <br />
                  <Text type="secondary">使用模型: {availableModels.find(m => m.id === generatedStrategy.model)?.name}</Text>
                </div>

                <Divider />

                {/* 性能指标 */}
                <div className="performance-metrics">
                  <Title level={5}>预期性能</Title>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div className="metric-item">
                        <Text type="secondary">年化收益率</Text>
                        <br />
                        <Text strong className="metric-value positive">
                          {generatedStrategy.performance.annualReturn}
                        </Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="metric-item">
                        <Text type="secondary">夏普比率</Text>
                        <br />
                        <Text strong className="metric-value">
                          {generatedStrategy.performance.sharpeRatio}
                        </Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="metric-item">
                        <Text type="secondary">最大回撤</Text>
                        <br />
                        <Text strong className="metric-value negative">
                          {generatedStrategy.performance.maxDrawdown}
                        </Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="metric-item">
                        <Text type="secondary">胜率</Text>
                        <br />
                        <Text strong className="metric-value">
                          {generatedStrategy.performance.winRate}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </div>

                <Divider />

                {/* 策略代码预览 */}
                <div className="code-preview">
                  <Title level={5}>
                    <CodeOutlined /> 策略代码
                  </Title>
                  <pre className="code-block">
                    {generatedStrategy.code}
                  </pre>
                </div>

                <Divider />

                {/* 操作按钮 */}
                <Space size="middle" className="action-buttons">
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                  >
                    保存策略
                  </Button>
                  <Button 
                    icon={<PlayCircleOutlined />}
                    onClick={handleBacktest}
                  >
                    开始回测
                  </Button>
                </Space>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AIStrategyGenerator;