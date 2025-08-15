import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Progress, Tooltip, Modal, message } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, BarChartOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';

const MyStrategiesWidget = ({ isEditMode, lastUpdateTime }) => {
  const [strategies, setStrategies] = useState([
    {
      id: '1',
      name: 'MA均线策略',
      status: 'running',
      return: 12.45,
      maxDrawdown: -5.67,
      sharpeRatio: 1.23,
      winRate: 68.5,
      totalTrades: 156,
      lastUpdate: '2024-01-20 14:30:25'
    },
    {
      id: '2',
      name: 'MACD金叉策略',
      status: 'stopped',
      return: -2.34,
      maxDrawdown: -8.91,
      sharpeRatio: 0.87,
      winRate: 45.2,
      totalTrades: 89,
      lastUpdate: '2024-01-20 09:15:10'
    },
    {
      id: '3',
      name: 'RSI超买超卖',
      status: 'backtesting',
      return: 8.76,
      maxDrawdown: -3.45,
      sharpeRatio: 1.56,
      winRate: 72.3,
      totalTrades: 234,
      lastUpdate: '2024-01-20 13:45:30'
    }
  ]);
  
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  // 状态配置
  const statusConfig = {
    running: { color: 'green', text: '运行中', icon: <PlayCircleOutlined /> },
    stopped: { color: 'red', text: '已停止', icon: <PauseCircleOutlined /> },
    backtesting: { color: 'blue', text: '回测中', icon: <BarChartOutlined /> },
    error: { color: 'orange', text: '异常', icon: <PauseCircleOutlined /> }
  };

  // 切换策略状态
  const toggleStrategyStatus = (strategyId) => {
    setStrategies(prev => prev.map(strategy => {
      if (strategy.id === strategyId) {
        const newStatus = strategy.status === 'running' ? 'stopped' : 'running';
        message.success(`策略已${newStatus === 'running' ? '启动' : '停止'}`);
        return {
          ...strategy,
          status: newStatus,
          lastUpdate: new Date().toLocaleString()
        };
      }
      return strategy;
    }));
  };

  // 运行回测
  const runBacktest = (strategyId) => {
    setStrategies(prev => prev.map(strategy => {
      if (strategy.id === strategyId) {
        message.info('回测已开始，请稍候...');
        return {
          ...strategy,
          status: 'backtesting',
          lastUpdate: new Date().toLocaleString()
        };
      }
      return strategy;
    }));
    
    // 模拟回测完成
    setTimeout(() => {
      setStrategies(prev => prev.map(strategy => {
        if (strategy.id === strategyId) {
          return {
            ...strategy,
            status: 'stopped',
            return: (Math.random() - 0.3) * 20,
            maxDrawdown: -Math.random() * 10,
            sharpeRatio: Math.random() * 2,
            winRate: 40 + Math.random() * 40,
            totalTrades: Math.floor(Math.random() * 200) + 50,
            lastUpdate: new Date().toLocaleString()
          };
        }
        return strategy;
      }));
      message.success('回测完成');
    }, 3000);
  };

  // 查看策略详情
  const viewStrategyDetail = (strategy) => {
    setSelectedStrategy(strategy);
    setDetailModalVisible(true);
  };

  // 编辑策略
  const editStrategy = (strategyId) => {
    message.info('跳转到策略编辑页面...');
    // 这里可以添加路由跳转逻辑
  };

  // 刷新策略数据
  const refreshStrategies = () => {
    if (isEditMode) return;
    
    setStrategies(prev => prev.map(strategy => ({
      ...strategy,
      return: strategy.return + (Math.random() - 0.5) * 2,
      lastUpdate: new Date().toLocaleString()
    })));
  };

  // 自动刷新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(refreshStrategies, 60000); // 1分钟刷新一次
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshStrategies();
    }
  }, [lastUpdateTime, isEditMode]);

  const columns = [
    {
      title: '策略名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: '500', fontSize: '12px' }}>{text}</div>
          <div style={{ color: '#8c8c8c', fontSize: '10px' }}>
            {record.totalTrades} 笔交易
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        const config = statusConfig[status];
        return (
          <Tag color={config.color} icon={config.icon} style={{ fontSize: '10px' }}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '收益率',
      dataIndex: 'return',
      key: 'return',
      width: 80,
      align: 'right',
      render: (value) => {
        const color = value >= 0 ? '#52c41a' : '#ff4d4f';
        return (
          <span style={{ color, fontWeight: '600', fontSize: '12px' }}>
            {value >= 0 ? '+' : ''}{value.toFixed(2)}%
          </span>
        );
      }
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      width: 80,
      render: (value) => (
        <div style={{ fontSize: '11px' }}>
          <Progress 
            percent={value} 
            size="small" 
            showInfo={false}
            strokeColor={value >= 60 ? '#52c41a' : value >= 40 ? '#faad14' : '#ff4d4f'}
          />
          <div style={{ textAlign: 'center', marginTop: '2px' }}>
            {value.toFixed(1)}%
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        !isEditMode && (
          <Space size="small">
            <Tooltip title={record.status === 'running' ? '停止策略' : '启动策略'}>
              <Button
                type="text"
                size="small"
                icon={record.status === 'running' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => toggleStrategyStatus(record.id)}
                disabled={record.status === 'backtesting'}
                style={{ 
                  color: record.status === 'running' ? '#ff4d4f' : '#52c41a'
                }}
              />
            </Tooltip>
            <Tooltip title="运行回测">
              <Button
                type="text"
                size="small"
                icon={<BarChartOutlined />}
                onClick={() => runBacktest(record.id)}
                disabled={record.status === 'backtesting'}
              />
            </Tooltip>
            <Tooltip title="查看详情">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => viewStrategyDetail(record)}
              />
            </Tooltip>
          </Space>
        )
      )
    }
  ];

  return (
    <Card
      title="我的策略"
      size="small"
      extra={
        !isEditMode && (
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => message.info('跳转到策略管理页面...')}
          >
            管理策略
          </Button>
        )
      }
      style={{ height: '100%' }}
      bodyStyle={{ padding: '8px', height: 'calc(100% - 57px)', overflow: 'hidden' }}
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
          我的策略组件 - 编辑模式
        </div>
      ) : (
        <div style={{ height: '100%', overflow: 'auto' }}>
          <Table
            columns={columns}
            dataSource={strategies}
            pagination={false}
            size="small"
            rowKey="id"
            scroll={{ y: 'calc(100% - 32px)' }}
          />
        </div>
      )}

      {/* 策略详情弹窗 */}
      <Modal
        title={`策略详情 - ${selectedStrategy?.name}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button key="edit" type="primary" onClick={() => editStrategy(selectedStrategy?.id)}>
            编辑策略
          </Button>
        ]}
        width={600}
      >
        {selectedStrategy && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Tag color={statusConfig[selectedStrategy.status].color} icon={statusConfig[selectedStrategy.status].icon}>
                {statusConfig[selectedStrategy.status].text}
              </Tag>
              <span style={{ marginLeft: '8px', color: '#8c8c8c', fontSize: '12px' }}>
                最后更新: {selectedStrategy.lastUpdate}
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ marginBottom: '8px', fontWeight: '500' }}>收益指标</div>
                <div style={{ padding: '12px', background: '#fafafa', borderRadius: '4px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span>总收益率: </span>
                    <span style={{ 
                      color: selectedStrategy.return >= 0 ? '#52c41a' : '#ff4d4f',
                      fontWeight: '600'
                    }}>
                      {selectedStrategy.return >= 0 ? '+' : ''}{selectedStrategy.return.toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span>最大回撤: </span>
                    <span style={{ color: '#ff4d4f', fontWeight: '600' }}>
                      {selectedStrategy.maxDrawdown.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span>夏普比率: </span>
                    <span style={{ fontWeight: '600' }}>
                      {selectedStrategy.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <div style={{ marginBottom: '8px', fontWeight: '500' }}>交易指标</div>
                <div style={{ padding: '12px', background: '#fafafa', borderRadius: '4px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span>胜率: </span>
                    <span style={{ fontWeight: '600' }}>
                      {selectedStrategy.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span>总交易次数: </span>
                    <span style={{ fontWeight: '600' }}>
                      {selectedStrategy.totalTrades}
                    </span>
                  </div>
                  <div>
                    <span>盈利交易: </span>
                    <span style={{ fontWeight: '600', color: '#52c41a' }}>
                      {Math.floor(selectedStrategy.totalTrades * selectedStrategy.winRate / 100)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default MyStrategiesWidget;