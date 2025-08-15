import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Badge, Tooltip, Button, Modal, Descriptions } from 'antd';
import { 
  SignalFilled,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  BellOutlined,
  MinusOutlined
} from '@ant-design/icons';

const TradingSignalsWidget = ({ isEditMode, lastUpdateTime }) => {
  const [signalsData, setSignalsData] = useState([
    {
      id: 1,
      symbol: '000001',
      name: '平安银行',
      signal: 'buy',
      strength: 'strong',
      price: 12.85,
      targetPrice: 14.50,
      stopLoss: 11.80,
      confidence: 85,
      strategy: 'MA金叉',
      time: '09:30',
      reason: 'MA5上穿MA20，成交量放大，MACD金叉',
      isNew: true
    },
    {
      id: 2,
      symbol: '600519',
      name: '贵州茅台',
      signal: 'sell',
      strength: 'medium',
      price: 1680.00,
      targetPrice: 1580.00,
      stopLoss: 1720.00,
      confidence: 72,
      strategy: 'RSI超买',
      time: '10:15',
      reason: 'RSI指标超买，价格触及阻力位',
      isNew: false
    },
    {
      id: 3,
      symbol: '300750',
      name: '宁德时代',
      signal: 'buy',
      strength: 'weak',
      price: 185.50,
      targetPrice: 200.00,
      stopLoss: 175.00,
      confidence: 68,
      strategy: '布林带突破',
      time: '11:20',
      reason: '价格突破布林带上轨，成交量温和放大',
      isNew: false
    },
    {
      id: 4,
      symbol: '002415',
      name: '海康威视',
      signal: 'hold',
      strength: 'medium',
      price: 32.80,
      targetPrice: 35.00,
      stopLoss: 30.50,
      confidence: 75,
      strategy: '趋势跟踪',
      time: '13:45',
      reason: '价格在上升趋势线附近，建议持有观望',
      isNew: false
    },
    {
      id: 5,
      symbol: '000858',
      name: '五粮液',
      signal: 'sell',
      strength: 'strong',
      price: 145.20,
      targetPrice: 135.00,
      stopLoss: 150.00,
      confidence: 88,
      strategy: '头肩顶',
      time: '14:30',
      reason: '形成头肩顶形态，成交量萎缩',
      isNew: true
    }
  ]);

  const [selectedSignal, setSelectedSignal] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 刷新信号数据
  const refreshSignalsData = () => {
    if (isEditMode) return;
    
    setSignalsData(prev => prev.map(signal => ({
      ...signal,
      price: signal.price + (Math.random() - 0.5) * 2,
      confidence: Math.max(50, Math.min(95, signal.confidence + (Math.random() - 0.5) * 10)),
      isNew: Math.random() > 0.8
    })));
  };

  // 自动刷新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(refreshSignalsData, 25000); // 25秒刷新一次
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshSignalsData();
    }
  }, [lastUpdateTime, isEditMode]);

  const getSignalIcon = (signal) => {
    const iconMap = {
      buy: <ArrowUpOutlined style={{ color: '#52c41a' }} />,
      sell: <ArrowDownOutlined style={{ color: '#ff4d4f' }} />,
      hold: <MinusOutlined style={{ color: '#faad14' }} />
    };
    return iconMap[signal] || <MinusOutlined />;
  };

  const getSignalColor = (signal) => {
    const colorMap = {
      buy: '#52c41a',
      sell: '#ff4d4f',
      hold: '#faad14'
    };
    return colorMap[signal] || '#8c8c8c';
  };

  const getSignalText = (signal) => {
    const textMap = {
      buy: '买入',
      sell: '卖出',
      hold: '持有'
    };
    return textMap[signal] || '观望';
  };

  const getStrengthColor = (strength) => {
    const colorMap = {
      strong: '#ff4d4f',
      medium: '#faad14',
      weak: '#52c41a'
    };
    return colorMap[strength] || '#8c8c8c';
  };

  const getStrengthText = (strength) => {
    const textMap = {
      strong: '强',
      medium: '中',
      weak: '弱'
    };
    return textMap[strength] || '中';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#52c41a';
    if (confidence >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const showSignalDetail = (signal) => {
    setSelectedSignal(signal);
    setDetailModalVisible(true);
  };

  return (
    <>
      <Card
        title="交易信号"
        size="small"
        style={{ height: '100%' }}
        bodyStyle={{ padding: '0', height: 'calc(100% - 57px)', overflow: 'auto' }}
        extra={
          <Tooltip title="实时交易信号">
            <SignalFilled style={{ color: '#1890ff' }} />
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
            交易信号组件 - 编辑模式
          </div>
        ) : (
          <List
            size="small"
            style={{ padding: '16px 20px' }}
            dataSource={signalsData}
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
                onClick={() => showSignalDetail(item)}
              >
                <div style={{ width: '100%' }}>
                  {/* 股票信息和信号 */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '500' }}>
                        {item.name}
                      </span>
                      <span style={{ 
                        fontSize: '10px', 
                        color: '#8c8c8c',
                        marginLeft: '4px'
                      }}>
                        {item.symbol}
                      </span>
                      {item.isNew && (
                        <Badge 
                          status="processing" 
                          text="新" 
                          style={{ marginLeft: '6px', fontSize: '9px' }}
                        />
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Tag 
                        color={getSignalColor(item.signal)}
                        style={{ 
                          margin: 0,
                          fontSize: '10px',
                          padding: '0 4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {getSignalIcon(item.signal)}
                        <span style={{ marginLeft: '2px' }}>{getSignalText(item.signal)}</span>
                      </Tag>
                      
                      <Tag 
                        color={getStrengthColor(item.strength)}
                        style={{ 
                          margin: 0,
                          fontSize: '9px',
                          padding: '0 3px'
                        }}
                      >
                        {getStrengthText(item.strength)}
                      </Tag>
                    </div>
                  </div>

                  {/* 价格信息 */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                      当前: ¥{parseFloat(item.price).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                      目标: ¥{parseFloat(item.targetPrice).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                      止损: ¥{parseFloat(item.stopLoss).toFixed(2)}
                    </div>
                  </div>

                  {/* 策略和置信度 */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#8c8c8c' }}>
                        策略: {item.strategy}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#8c8c8c', marginRight: '4px' }}>
                        置信度:
                      </span>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '500',
                        color: getConfidenceColor(item.confidence)
                      }}>
                        {parseFloat(item.confidence).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* 时间和操作 */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '10px', color: '#8c8c8c' }}>
                      {item.time}
                    </span>
                    
                    <Tooltip title="查看详情">
                      <InfoCircleOutlined 
                        style={{ 
                          fontSize: '12px', 
                          color: '#1890ff',
                          cursor: 'pointer'
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 信号详情弹窗 */}
      <Modal
        title="交易信号详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button key="notify" type="primary" icon={<BellOutlined />}>
            设置提醒
          </Button>
        ]}
        width={500}
      >
        {selectedSignal && (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="股票代码" span={1}>
              {selectedSignal.symbol}
            </Descriptions.Item>
            <Descriptions.Item label="股票名称" span={1}>
              {selectedSignal.name}
            </Descriptions.Item>
            <Descriptions.Item label="信号类型" span={1}>
              <Tag color={getSignalColor(selectedSignal.signal)}>
                {getSignalIcon(selectedSignal.signal)} {getSignalText(selectedSignal.signal)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="信号强度" span={1}>
              <Tag color={getStrengthColor(selectedSignal.strength)}>
                {getStrengthText(selectedSignal.strength)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="当前价格" span={1}>
              ¥{parseFloat(selectedSignal.price).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="目标价格" span={1}>
              ¥{parseFloat(selectedSignal.targetPrice).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="止损价格" span={1}>
              ¥{parseFloat(selectedSignal.stopLoss).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="置信度" span={1}>
              <span style={{ color: getConfidenceColor(selectedSignal.confidence) }}>
                {selectedSignal.confidence}%
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="策略名称" span={1}>
              {selectedSignal.strategy}
            </Descriptions.Item>
            <Descriptions.Item label="生成时间" span={1}>
              {selectedSignal.time}
            </Descriptions.Item>
            <Descriptions.Item label="信号原因" span={2}>
              {selectedSignal.reason}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default TradingSignalsWidget;