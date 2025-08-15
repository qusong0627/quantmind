import React, { useState, useEffect } from 'react';
import { List, Button, Tag, Progress, Tooltip, Space, Modal, Descriptions } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, EditOutlined, EyeOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const MyStrategiesWidget = ({ isEditMode }) => {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState([
    {
      id: 'strategy_001',
      name: '均线突破策略',
      status: 'running',
      type: '技术分析',
      return: 12.5,
      maxDrawdown: -3.2,
      sharpeRatio: 1.85,
      winRate: 68.5,
      totalTrades: 45,
      createdAt: '2024-01-15',
      lastUpdate: '2024-01-20 14:30:25'
    },
    {
      id: 'strategy_002', 
      name: 'RSI反转策略',
      status: 'stopped',
      type: '技术分析',
      return: -2.1,
      maxDrawdown: -8.7,
      sharpeRatio: 0.45,
      winRate: 42.3,
      totalTrades: 28,
      createdAt: '2024-01-10',
      lastUpdate: '2024-01-18 09:15:42'
    },
    {
      id: 'strategy_003',
      name: '多因子选股',
      status: 'backtesting',
      type: '量化选股',
      return: 8.9,
      maxDrawdown: -5.1,
      sharpeRatio: 1.32,
      winRate: 55.7,
      totalTrades: 67,
      createdAt: '2024-01-12',
      lastUpdate: '2024-01-20 16:45:18'
    }
  ]);
  
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  // 模拟实时数据更新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(() => {
        setStrategies(prev => prev.map(strategy => {
          if (strategy.status === 'running') {
            return {
              ...strategy,
              return: strategy.return + (Math.random() - 0.5) * 0.5,
              lastUpdate: new Date().toLocaleString()
            };
          }
          return strategy;
        }));
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 获取状态标签
  const getStatusTag = (status) => {
    const statusConfig = {
      running: { color: 'green', text: '运行中' },
      stopped: { color: 'red', text: '已停止' },
      backtesting: { color: 'blue', text: '回测中' },
      error: { color: 'orange', text: '异常' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 切换策略状态
  const toggleStrategy = (strategyId) => {
    setStrategies(prev => prev.map(strategy => {
      if (strategy.id === strategyId) {
        const newStatus = strategy.status === 'running' ? 'stopped' : 'running';
        return {
          ...strategy,
          status: newStatus,
          lastUpdate: new Date().toLocaleString()
        };
      }
      return strategy;
    }));
  };

  // 查看策略详情
  const viewStrategyDetail = (strategy) => {
    setSelectedStrategy(strategy);
    setDetailModalVisible(true);
  };

  // 编辑策略
  const editStrategy = (strategyId) => {
    navigate(`/strategy-editor?id=${strategyId}`);
  };

  // 查看回测报告
  const viewBacktestReport = (strategyId) => {
    navigate(`/backtest?strategy=${strategyId}`);
  };

  const renderStrategyItem = (strategy) => {
    const isPositive = strategy.return >= 0;
    const returnColor = isPositive ? '#ff4d4f' : '#52c41a';
    const returnIcon = isPositive ? '+' : '';

    return (
      <List.Item
        key={strategy.id}
        actions={!isEditMode ? [
          <Tooltip title={strategy.status === 'running' ? '停止策略' : '启动策略'}>
            <Button
              type="text"
              size="small"
              icon={strategy.status === 'running' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => toggleStrategy(strategy.id)}
              disabled={strategy.status === 'backtesting'}
              style={{ color: strategy.status === 'running' ? '#52c41a' : '#ff4d4f' }}
            />
          </Tooltip>,
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => viewStrategyDetail(strategy)}
            />
          </Tooltip>,
          <Tooltip title="编辑策略">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => editStrategy(strategy.id)}
            />
          </Tooltip>,
          <Tooltip title="回测报告">
            <Button
              type="text"
              size="small"
              icon={<BarChartOutlined />}
              onClick={() => viewBacktestReport(strategy.id)}
            />
          </Tooltip>
        ] : []}
      >
        <List.Item.Meta
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <span>{strategy.name}</span>
                {getStatusTag(strategy.status)}
              </Space>
              <span style={{ color: returnColor, fontWeight: 'bold' }}>
                {returnIcon}{strategy.return.toFixed(1)}%
              </span>
            </div>
          }
          description={
            <div>
              <div style={{ marginBottom: '8px' }}>
                <Space size="large">
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>类型: {strategy.type}</span>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>胜率: {strategy.winRate}%</span>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>交易: {strategy.totalTrades}次</span>
                </Space>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#8c8c8c', minWidth: '60px' }}>夏普比率:</span>
                <Progress 
                  percent={Math.min(strategy.sharpeRatio * 50, 100)} 
                  size="small" 
                  showInfo={false}
                  strokeColor={strategy.sharpeRatio > 1 ? '#ff4d4f' : '#faad14'}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
                <span style={{ fontSize: '12px', minWidth: '30px' }}>{strategy.sharpeRatio.toFixed(2)}</span>
              </div>
            </div>
          }
        />
      </List.Item>
    );
  };

  const runningCount = strategies.filter(s => s.status === 'running').length;
  const totalCount = strategies.length;

  return (
    <div className="widget-content">
      <div className="widget-header">
        <h4 className="widget-title">我的策略</h4>
        <div className="widget-actions">
          <Space>
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              运行中: {runningCount}/{totalCount}
            </span>
            {!isEditMode && (
              <Button 
                type="primary" 
                size="small"
                onClick={() => navigate('/strategy-editor')}
              >
                新建策略
              </Button>
            )}
          </Space>
        </div>
      </div>
      
      <div className="widget-body">
        <div className="market-grid-center">
          <List
            size="small"
            dataSource={strategies}
            renderItem={renderStrategyItem}
            style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
          />
          
          {strategies.length === 0 && (
            <div className="widget-empty">
              <div className="widget-empty-text">暂无策略</div>
              <Button 
                type="link"
                onClick={() => navigate('/strategy-editor')}
                disabled={isEditMode}
              >
                创建第一个策略
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 策略详情弹窗 */}
      <Modal
        title={`策略详情 - ${selectedStrategy?.name}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="edit" 
            type="primary"
            onClick={() => {
              editStrategy(selectedStrategy?.id);
              setDetailModalVisible(false);
            }}
          >
            编辑策略
          </Button>
        ]}
        width={600}
      >
        {selectedStrategy && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="策略名称" span={2}>
              {selectedStrategy.name}
            </Descriptions.Item>
            <Descriptions.Item label="策略类型">
              {selectedStrategy.type}
            </Descriptions.Item>
            <Descriptions.Item label="当前状态">
              {getStatusTag(selectedStrategy.status)}
            </Descriptions.Item>
            <Descriptions.Item label="总收益率">
              <span style={{ color: selectedStrategy.return >= 0 ? '#ff4d4f' : '#52c41a' }}>
                {selectedStrategy.return >= 0 ? '+' : ''}{selectedStrategy.return.toFixed(2)}%
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="最大回撤">
              <span style={{ color: '#ff4d4f' }}>
                {selectedStrategy.maxDrawdown.toFixed(2)}%
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="夏普比率">
              {selectedStrategy.sharpeRatio.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="胜率">
              {selectedStrategy.winRate.toFixed(1)}%
            </Descriptions.Item>
            <Descriptions.Item label="交易次数">
              {selectedStrategy.totalTrades}次
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {selectedStrategy.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="最后更新" span={2}>
              {selectedStrategy.lastUpdate}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default MyStrategiesWidget;