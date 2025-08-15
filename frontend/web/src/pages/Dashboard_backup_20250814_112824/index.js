import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Button, Tooltip, message } from 'antd';
import { 
  ReloadOutlined,
  SettingOutlined,
  FullscreenOutlined,
  CompressOutlined,
  EditOutlined,
  SaveOutlined
} from '@ant-design/icons';
import './Dashboard.css';

// 导入所有组件
import MarketOverviewWidget from './widgets/MarketOverviewWidget';
import MarketHotspotWidget from './widgets/MarketHotspotWidget';
import NewsWidget from './widgets/NewsWidget';
import TradingSignalsWidget from './widgets/TradingSignalsWidget';
import PerformanceWidget from './widgets/PerformanceWidget';
import RiskMonitorWidget from './widgets/RiskMonitorWidget';
import AIInsightsWidget from './widgets/AIInsightsWidget';
import MarketSentimentWidget from './widgets/MarketSentimentWidget';
import PortfolioWidget from './widgets/PortfolioWidget';
import BacktestWidget from './widgets/BacktestWidget';

const { Content } = Layout;

const Dashboard = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [layout, setLayout] = useState({
    // 默认布局配置
    widgets: [
      { id: 'market-overview', component: 'MarketOverviewWidget', position: { x: 0, y: 0, w: 8, h: 6 }, visible: true },
      { id: 'market-hotspot', component: 'MarketHotspotWidget', position: { x: 8, y: 0, w: 8, h: 6 }, visible: true },
      { id: 'news', component: 'NewsWidget', position: { x: 16, y: 0, w: 8, h: 6 }, visible: true },
      { id: 'trading-signals', component: 'TradingSignalsWidget', position: { x: 0, y: 6, w: 8, h: 6 }, visible: true },
      { id: 'performance', component: 'PerformanceWidget', position: { x: 8, y: 6, w: 8, h: 6 }, visible: true },
      { id: 'risk-monitor', component: 'RiskMonitorWidget', position: { x: 16, y: 6, w: 8, h: 6 }, visible: true },
      { id: 'ai-insights', component: 'AIInsightsWidget', position: { x: 0, y: 12, w: 8, h: 6 }, visible: true },
      { id: 'market-sentiment', component: 'MarketSentimentWidget', position: { x: 8, y: 12, w: 8, h: 6 }, visible: true },
      { id: 'portfolio', component: 'PortfolioWidget', position: { x: 16, y: 12, w: 8, h: 6 }, visible: true },
      { id: 'backtest', component: 'BacktestWidget', position: { x: 0, y: 18, w: 12, h: 6 }, visible: true }
    ]
  });

  // 组件映射
  const componentMap = {
    MarketOverviewWidget,
    MarketHotspotWidget,
    NewsWidget,
    TradingSignalsWidget,
    PerformanceWidget,
    RiskMonitorWidget,
    AIInsightsWidget,
    MarketSentimentWidget,
    PortfolioWidget,
    BacktestWidget
  };

  // 刷新所有组件数据
  const handleRefresh = () => {
    setLastUpdateTime(new Date().getTime());
    message.success('数据已刷新');
  };

  // 切换编辑模式
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      message.info('进入编辑模式，可以调整组件布局');
    } else {
      message.success('已保存布局设置');
    }
  };

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 自动刷新
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isEditMode) {
        setLastUpdateTime(new Date().getTime());
      }
    }, 60000); // 每分钟自动刷新一次

    return () => clearInterval(interval);
  }, [isEditMode]);

  return (
    <Layout className="dashboard-layout">
      <Content className="dashboard-content">
        {/* 工具栏 */}
        <div className="dashboard-toolbar">
          <div className="toolbar-left">
            <h2 className="dashboard-title">量化交易仪表盘</h2>
            <span className="last-update">
              最后更新: {lastUpdateTime ? new Date(lastUpdateTime).toLocaleTimeString('zh-CN') : '未更新'}
            </span>
          </div>
          <div className="toolbar-right">
            <Tooltip title="刷新数据">
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={false}
              />
            </Tooltip>
            <Tooltip title={isEditMode ? '保存布局' : '编辑布局'}>
              <Button 
                type="text" 
                icon={isEditMode ? <SaveOutlined /> : <EditOutlined />} 
                onClick={toggleEditMode}
                className={isEditMode ? 'edit-mode-active' : ''}
              />
            </Tooltip>
            <Tooltip title="设置">
              <Button 
                type="text" 
                icon={<SettingOutlined />} 
                onClick={() => message.info('设置功能开发中...')}
              />
            </Tooltip>
            <Tooltip title={isFullscreen ? '退出全屏' : '全屏显示'}>
              <Button 
                type="text" 
                icon={isFullscreen ? <CompressOutlined /> : <FullscreenOutlined />} 
                onClick={toggleFullscreen}
              />
            </Tooltip>
          </div>
        </div>

        {/* 仪表盘网格 */}
        <div className="dashboard-grid">
          <Row gutter={[16, 16]}>
            {/* 第一行 */}
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <div className="widget-container">
                <MarketOverviewWidget 
                  isEditMode={isEditMode} 
                  lastUpdateTime={lastUpdateTime}
                />
              </div>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <div className="widget-container">
                <MarketHotspotWidget 
                  isEditMode={isEditMode} 
                  lastUpdateTime={lastUpdateTime}
                />
              </div>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <div className="widget-container">
                <NewsWidget 
                  isEditMode={isEditMode} 
                  lastUpdateTime={lastUpdateTime}
                />
              </div>
            </Col>

            {/* 第二行 */}
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <div className="widget-container">
                <TradingSignalsWidget 
                  isEditMode={isEditMode} 
                  lastUpdateTime={lastUpdateTime}
                />
              </div>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <div className="widget-container">
                <PerformanceWidget 
                  isEditMode={isEditMode} 
                  lastUpdateTime={lastUpdateTime}
                />
              </div>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <div className="widget-container">
                <RiskMonitorWidget 
                  isEditMode={isEditMode} 
                  lastUpdateTime={lastUpdateTime}
                />
              </div>
            </Col>

            {/* 第三行 */}
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <div className="widget-container">
                <AIInsightsWidget 
                  isEditMode={isEditMode} 
                  lastUpdateTime={lastUpdateTime}
                />
              </div>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <div className="widget-container">
                <MarketSentimentWidget 
                  isEditMode={isEditMode} 
                  lastUpdateTime={lastUpdateTime}
                />
              </div>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <div className="widget-container">
                <PortfolioWidget 
                  isEditMode={isEditMode} 
                  lastUpdateTime={lastUpdateTime}
                />
              </div>
            </Col>

            {/* 第四行 */}
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <div className="widget-container">
                <BacktestWidget 
                  isEditMode={isEditMode} 
                  lastUpdateTime={lastUpdateTime}
                />
              </div>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <div className="widget-container placeholder-widget">
                <div className="placeholder-content">
                  <SettingOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <p style={{ color: '#8c8c8c', fontSize: '14px' }}>预留扩展位置</p>
                  <p style={{ color: '#bfbfbf', fontSize: '12px' }}>可添加更多组件</p>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default Dashboard;