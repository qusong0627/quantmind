import React, { useState, useEffect } from 'react';
import { List, Button, Tag, Progress, Tooltip, Space, Modal, Statistic, Row, Col } from 'antd';
import { EyeOutlined, BarChartOutlined, ShareAltOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const BacktestResultsWidget = ({ isEditMode }) => {
  const navigate = useNavigate();
  const [backtests, setBacktests] = useState([
    {
      id: 'bt_001',
      strategyName: '均线突破策略',
      status: 'completed',
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      totalReturn: 15.8,
      annualReturn: 15.8,
      maxDrawdown: -8.2,
      sharpeRatio: 1.65,
      winRate: 62.5,
      totalTrades: 89,
      avgHoldingDays: 12.5,
      createdAt: '2024-01-18 10:30:00',
      duration: '365天'
    },
    {
      id: 'bt_002',
      strategyName: 'RSI反转策略',
      status: 'running',
      startDate: '2023-06-01',
      endDate: '2023-12-31',
      totalReturn: 8.3,
      annualReturn: 14.2,
      maxDrawdown: -12.1,
      sharpeRatio: 0.98,
      winRate: 48.7,
      totalTrades: 156,
      avgHoldingDays: 5.2,
      createdAt: '2024-01-19 14:15:00',
      duration: '214天',
      progress: 75
    },
    {
      id: 'bt_003',
      strategyName: '多因子选股',
      status: 'failed',
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      totalReturn: 0,
      annualReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
      totalTrades: 0,
      avgHoldingDays: 0,
      createdAt: '2024-01-20 09:45:00',
      duration: '365天',
      errorMessage: '数据源连接失败'
    }
  ]);
  
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBacktest, setSelectedBacktest] = useState(null);

  // 模拟运行中的回测进度更新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(() => {
        setBacktests(prev => prev.map(bt => {
          if (bt.status === 'running' && bt.progress < 100) {
            const newProgress = Math.min(bt.progress + Math.random() * 5, 100);
            const newStatus = newProgress >= 100 ? 'completed' : 'running';
            return {
              ...bt,
              progress: newProgress,
              status: newStatus,
              ...(newStatus === 'completed' && {
                totalReturn: 8.3 + Math.random() * 5,
                annualReturn: 14.2 + Math.random() * 3,
                maxDrawdown: -12.1 - Math.random() * 2,
                sharpeRatio: 0.98 + Math.random() * 0.5,
                winRate: 48.7 + Math.random() * 10,
                totalTrades: 156 + Math.floor(Math.random() * 20)
              })
            };
          }
          return bt;
        }));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 获取状态标签
  const getStatusTag = (status) => {
    const statusConfig = {
      completed: { color: 'green', text: '已完成' },
      running: { color: 'blue', text: '运行中' },
      failed: { color: 'red', text: '失败' },
      queued: { color: 'orange', text: '排队中' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 查看回测详情
  const viewBacktestDetail = (backtest) => {
    setSelectedBacktest(backtest);
    setDetailModalVisible(true);
  };

  // 查看完整报告
  const viewFullReport = (backtestId) => {
    navigate(`/backtest/report/${backtestId}`);
  };

  // 分享回测结果
  const shareBacktest = (backtestId) => {
    // 模拟分享功能
    navigator.clipboard.writeText(`${window.location.origin}/backtest/share/${backtestId}`);
    // 这里可以添加消息提示
  };

  // 删除回测结果
  const deleteBacktest = (backtestId) => {
    setBacktests(prev => prev.filter(bt => bt.id !== backtestId));
  };

  const renderBacktestItem = (backtest) => {
    const isPositive = backtest.totalReturn >= 0;
    const returnColor = isPositive ? '#ff4d4f' : '#52c41a';
    const returnIcon = isPositive ? '+' : '';

    return (
      <List.Item
        key={backtest.id}
        actions={!isEditMode ? [
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => viewBacktestDetail(backtest)}
            />
          </Tooltip>,
          ...(backtest.status === 'completed' ? [
            <Tooltip title="完整报告">
              <Button
                type="text"
                size="small"
                icon={<BarChartOutlined />}
                onClick={() => viewFullReport(backtest.id)}
              />
            </Tooltip>,
            <Tooltip title="分享结果">
              <Button
                type="text"
                size="small"
                icon={<ShareAltOutlined />}
                onClick={() => shareBacktest(backtest.id)}
              />
            </Tooltip>
          ] : []),
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => deleteBacktest(backtest.id)}
              danger
            />
          </Tooltip>
        ] : []}
      >
        <List.Item.Meta
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <span>{backtest.strategyName}</span>
                {getStatusTag(backtest.status)}
              </Space>
              {backtest.status === 'completed' && (
                <span style={{ color: returnColor, fontWeight: 'bold' }}>
                  {returnIcon}{backtest.totalReturn.toFixed(1)}%
                </span>
              )}
            </div>
          }
          description={
            <div>
              <div style={{ marginBottom: '8px' }}>
                <Space size="large">
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>周期: {backtest.duration}</span>
                  {backtest.status === 'completed' && (
                    <>
                      <span style={{ fontSize: '12px', color: '#8c8c8c' }}>胜率: {backtest.winRate.toFixed(1)}%</span>
                      <span style={{ fontSize: '12px', color: '#8c8c8c' }}>交易: {backtest.totalTrades}次</span>
                    </>
                  )}
                </Space>
              </div>
              
              {backtest.status === 'running' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c', minWidth: '60px' }}>进度:</span>
                  <Progress 
                    percent={backtest.progress} 
                    size="small" 
                    style={{ flex: 1, maxWidth: '150px' }}
                  />
                  <span style={{ fontSize: '12px', minWidth: '40px' }}>{backtest.progress.toFixed(0)}%</span>
                </div>
              )}
              
              {backtest.status === 'completed' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c', minWidth: '60px' }}>夏普比率:</span>
                  <Progress 
                    percent={Math.min(backtest.sharpeRatio * 50, 100)} 
                    size="small" 
                    showInfo={false}
                    strokeColor={backtest.sharpeRatio > 1 ? '#ff4d4f' : '#faad14'}
                    style={{ flex: 1, maxWidth: '100px' }}
                  />
                  <span style={{ fontSize: '12px', minWidth: '30px' }}>{backtest.sharpeRatio.toFixed(2)}</span>
                </div>
              )}
              
              {backtest.status === 'failed' && (
                <div style={{ color: '#ff4d4f', fontSize: '12px' }}>
                  错误: {backtest.errorMessage}
                </div>
              )}
              
              <div style={{ fontSize: '12px', color: '#bfbfbf', marginTop: '4px' }}>
                创建时间: {backtest.createdAt}
              </div>
            </div>
          }
        />
      </List.Item>
    );
  };

  const completedCount = backtests.filter(bt => bt.status === 'completed').length;
  const runningCount = backtests.filter(bt => bt.status === 'running').length;
  const totalCount = backtests.length;

  return (
    <div className="widget-content">
      <div className="widget-header">
        <h4 className="widget-title">回测结果</h4>
        <div className="widget-actions">
          <Space>
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              完成: {completedCount} | 运行: {runningCount} | 总计: {totalCount}
            </span>
            {!isEditMode && (
              <Button 
                type="primary" 
                size="small"
                onClick={() => navigate('/backtest')}
              >
                新建回测
              </Button>
            )}
          </Space>
        </div>
      </div>
      
      <div className="widget-body">
        <div className="market-grid-center">
          <List
            size="small"
            dataSource={backtests}
            renderItem={renderBacktestItem}
            style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
          />
          
          {backtests.length === 0 && (
            <div className="widget-empty">
              <div className="widget-empty-text">暂无回测记录</div>
              <Button 
                type="link"
                onClick={() => navigate('/backtest')}
                disabled={isEditMode}
              >
                开始第一次回测
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 回测详情弹窗 */}
      <Modal
        title={`回测详情 - ${selectedBacktest?.strategyName}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          ...(selectedBacktest?.status === 'completed' ? [
            <Button 
              key="report" 
              type="primary"
              onClick={() => {
                viewFullReport(selectedBacktest?.id);
                setDetailModalVisible(false);
              }}
            >
              查看完整报告
            </Button>
          ] : [])
        ]}
        width={700}
      >
        {selectedBacktest && (
          <div>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <Statistic 
                  title="总收益率" 
                  value={selectedBacktest.totalReturn} 
                  suffix="%"
                  valueStyle={{ color: selectedBacktest.totalReturn >= 0 ? '#ff4d4f' : '#52c41a' }}
                  precision={2}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="年化收益率" 
                  value={selectedBacktest.annualReturn} 
                  suffix="%"
                  valueStyle={{ color: selectedBacktest.annualReturn >= 0 ? '#ff4d4f' : '#52c41a' }}
                  precision={2}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="最大回撤" 
                  value={selectedBacktest.maxDrawdown} 
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                  precision={2}
                />
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <Statistic 
                  title="夏普比率" 
                  value={selectedBacktest.sharpeRatio}
                  precision={2}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="胜率" 
                  value={selectedBacktest.winRate} 
                  suffix="%"
                  precision={1}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="交易次数" 
                  value={selectedBacktest.totalTrades}
                />
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic 
                  title="平均持仓天数" 
                  value={selectedBacktest.avgHoldingDays}
                  suffix="天"
                  precision={1}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="回测周期" 
                  value={selectedBacktest.duration}
                />
              </Col>
            </Row>
            
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
              <div><strong>回测时间范围:</strong> {selectedBacktest.startDate} 至 {selectedBacktest.endDate}</div>
              <div style={{ marginTop: '8px' }}><strong>创建时间:</strong> {selectedBacktest.createdAt}</div>
              <div style={{ marginTop: '8px' }}><strong>状态:</strong> {getStatusTag(selectedBacktest.status)}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BacktestResultsWidget;