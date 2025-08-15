import React, { useState, useEffect, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Card, Button, Switch, Modal, Tabs, Row, Col, Space, Typography, Divider, message } from 'antd';
import { SettingOutlined, PlusOutlined, DragOutlined } from '@ant-design/icons';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './DashboardWidgets.css';

// 导入所有小组件
import MarketOverviewWidget from './widgets/MarketOverviewWidget';
import WatchlistWidget from './widgets/WatchlistWidget';
import MyStrategiesWidget from './widgets/MyStrategiesWidget';
import PositionOverviewWidget from './widgets/PositionOverviewWidget';
import CommunityFeedWidget from './widgets/CommunityFeedWidget';
import NewsWidget from './widgets/NewsWidget';
import NotificationsWidget from './widgets/NotificationsWidget';
import StrategyPerformanceWidget from './widgets/StrategyPerformanceWidget';
import TopMoversWidget from './widgets/TopMoversWidget';
import BacktestResultsWidget from './widgets/BacktestResultsWidget';
import PositionsWidget from './widgets/PositionsWidget';
import PerformanceWidget from './widgets/PerformanceWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';

const { Title } = Typography;
const ResponsiveGridLayout = WidthProvider(Responsive);

// 可用组件配置
const AVAILABLE_WIDGETS = {
  'market-overview': {
    id: 'market-overview',
    name: '市场概览',
    category: 'market',
    component: MarketOverviewWidget,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    description: '显示主要市场指数实时行情'
  },
  'watchlist': {
    id: 'watchlist',
    name: '自选股',
    category: 'market',
    component: WatchlistWidget,
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 3, h: 4 },
    description: '监控自选股票实时行情'
  },
  'top-movers': {
    id: 'top-movers',
    name: '涨跌排行',
    category: 'market',
    component: TopMoversWidget,
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    description: '显示涨跌幅排行榜'
  },
  'my-strategies': {
    id: 'my-strategies',
    name: '我的策略',
    category: 'strategy',
    component: MyStrategiesWidget,
    defaultSize: { w: 6, h: 7 },
    minSize: { w: 4, h: 5 },
    description: '管理和监控个人策略'
  },
  'strategy-performance': {
    id: 'strategy-performance',
    name: '策略绩效',
    category: 'strategy',
    component: StrategyPerformanceWidget,
    defaultSize: { w: 8, h: 5 },
    minSize: { w: 6, h: 4 },
    description: '展示策略整体表现和收益曲线'
  },
  'backtest-results': {
    id: 'backtest-results',
    name: '回测结果',
    category: 'strategy',
    component: BacktestResultsWidget,
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 4, h: 4 },
    description: '策略回测结果和报告'
  },
  'position-overview': {
    id: 'position-overview',
    name: '持仓概览',
    category: 'trading',
    component: PositionOverviewWidget,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    description: '显示当前持仓状况和盈亏'
  },
  'positions': {
    id: 'positions',
    name: '持仓明细',
    category: 'trading',
    component: PositionsWidget,
    defaultSize: { w: 12, h: 5 },
    minSize: { w: 8, h: 4 },
    description: '当前持仓股票详情'
  },
  'performance': {
    id: 'performance',
    name: '投资表现',
    category: 'analysis',
    component: PerformanceWidget,
    defaultSize: { w: 6, h: 13 },
    minSize: { w: 4, h: 10 },
    description: '投资组合表现分析'
  },
  'community-feed': {
    id: 'community-feed',
    name: '社区动态',
    category: 'community',
    component: CommunityFeedWidget,
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
    description: '社区最新动态和热门内容'
  },
  'news-widget': {
    id: 'news-widget',
    name: '财经资讯',
    category: 'analysis',
    component: NewsWidget,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    description: '重要财经新闻和市场资讯'
  },
  'notifications': {
    id: 'notifications',
    name: '消息通知',
    category: 'personal',
    component: NotificationsWidget,
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    description: '系统消息和重要通知'
  },
  'quick-actions': {
    id: 'quick-actions',
    name: '快速操作',
    category: 'tools',
    component: QuickActionsWidget,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    description: '常用功能快速入口'
  }
};

// 默认布局配置
const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'quick-actions', x: 0, y: 0, w: 6, h: 4 },
    { i: 'market-overview', x: 6, y: 0, w: 6, h: 4 },
    { i: 'performance', x: 0, y: 4, w: 12, h: 13 },
    { i: 'watchlist', x: 6, y: 4, w: 6, h: 6 },
    { i: 'my-strategies', x: 6, y: 10, w: 6, h: 7 },
    { i: 'positions', x: 0, y: 17, w: 12, h: 5 },
    { i: 'backtest-results', x: 0, y: 22, w: 6, h: 5 },
    { i: 'news-widget', x: 6, y: 22, w: 6, h: 6 },
    { i: 'top-movers', x: 0, y: 28, w: 4, h: 4 },
    { i: 'strategy-performance', x: 4, y: 28, w: 8, h: 5 },
    { i: 'position-overview', x: 0, y: 33, w: 6, h: 4 },
    { i: 'community-feed', x: 6, y: 33, w: 6, h: 6 },
    { i: 'notifications', x: 0, y: 37, w: 3, h: 3 }
  ],
  md: [
    { i: 'quick-actions', x: 0, y: 0, w: 5, h: 4 },
    { i: 'market-overview', x: 5, y: 0, w: 5, h: 4 },
    { i: 'performance', x: 0, y: 4, w: 10, h: 13 },
    { i: 'watchlist', x: 5, y: 4, w: 5, h: 6 },
    { i: 'my-strategies', x: 5, y: 10, w: 5, h: 7 },
    { i: 'positions', x: 0, y: 17, w: 10, h: 5 },
    { i: 'backtest-results', x: 0, y: 22, w: 5, h: 5 },
    { i: 'news-widget', x: 5, y: 22, w: 5, h: 6 },
    { i: 'top-movers', x: 0, y: 28, w: 4, h: 4 },
    { i: 'strategy-performance', x: 4, y: 28, w: 6, h: 5 },
    { i: 'position-overview', x: 0, y: 33, w: 5, h: 4 },
    { i: 'community-feed', x: 5, y: 33, w: 5, h: 6 },
    { i: 'notifications', x: 0, y: 37, w: 3, h: 3 }
  ],
  sm: [
    { i: 'quick-actions', x: 0, y: 0, w: 6, h: 4 },
    { i: 'market-overview', x: 0, y: 4, w: 6, h: 4 },
    { i: 'performance', x: 0, y: 8, w: 6, h: 11 },
    { i: 'watchlist', x: 0, y: 19, w: 6, h: 4 },
    { i: 'my-strategies', x: 0, y: 23, w: 6, h: 5 },
    { i: 'positions', x: 0, y: 28, w: 6, h: 5 },
    { i: 'backtest-results', x: 0, y: 33, w: 6, h: 5 },
    { i: 'news-widget', x: 0, y: 38, w: 6, h: 6 },
    { i: 'top-movers', x: 0, y: 44, w: 6, h: 4 },
    { i: 'strategy-performance', x: 0, y: 48, w: 6, h: 5 },
    { i: 'position-overview', x: 0, y: 53, w: 6, h: 4 },
    { i: 'community-feed', x: 0, y: 57, w: 6, h: 6 },
    { i: 'notifications', x: 0, y: 63, w: 6, h: 3 }
  ]
};

// 网格配置
const GRID_CONFIG = {
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  rowHeight: 80,
  margin: [16, 16],
  containerPadding: [16, 16]
};

const DashboardWidgets = () => {
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS);
  const [enabledWidgets, setEnabledWidgets] = useState([
    'quick-actions', 'market-overview', 'performance', 'watchlist', 'my-strategies', 'positions', 'backtest-results', 'news-widget',
    'top-movers', 'strategy-performance', 'position-overview', 'community-feed', 'notifications'
  ]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 组件挂载后设置状态
  useEffect(() => {
    setMounted(true);
    // 从本地存储加载用户配置
    const savedLayouts = localStorage.getItem('dashboard-layouts');
    const savedWidgets = localStorage.getItem('enabled-widgets');
    const defaultLayouts = localStorage.getItem('default-layouts');
    const defaultWidgets = localStorage.getItem('default-enabled-widgets');
    
    // 优先使用用户保存的布局，其次使用用户设定的默认布局，最后使用系统默认布局
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts));
      } catch (e) {
        console.error('Failed to parse saved layouts:', e);
        // 如果解析失败，尝试使用用户默认布局
        if (defaultLayouts) {
          try {
            setLayouts(JSON.parse(defaultLayouts));
          } catch (e2) {
            console.error('Failed to parse default layouts:', e2);
            setLayouts(DEFAULT_LAYOUTS);
          }
        } else {
          setLayouts(DEFAULT_LAYOUTS);
        }
      }
    } else if (defaultLayouts) {
      try {
        setLayouts(JSON.parse(defaultLayouts));
      } catch (e) {
        console.error('Failed to parse default layouts:', e);
        setLayouts(DEFAULT_LAYOUTS);
      }
    } else {
      setLayouts(DEFAULT_LAYOUTS);
    }
    
    // 优先使用用户保存的组件配置，其次使用用户设定的默认组件配置，最后使用全部组件
    if (savedWidgets) {
      try {
        setEnabledWidgets(JSON.parse(savedWidgets));
      } catch (e) {
        console.error('Failed to parse saved widgets:', e);
        // 如果解析失败，尝试使用用户默认组件配置
        if (defaultWidgets) {
          try {
            setEnabledWidgets(JSON.parse(defaultWidgets));
          } catch (e2) {
            console.error('Failed to parse default widgets:', e2);
            setEnabledWidgets(Object.keys(AVAILABLE_WIDGETS));
          }
        } else {
          setEnabledWidgets(Object.keys(AVAILABLE_WIDGETS));
        }
      }
    } else if (defaultWidgets) {
      try {
        setEnabledWidgets(JSON.parse(defaultWidgets));
      } catch (e) {
        console.error('Failed to parse default widgets:', e);
        setEnabledWidgets(Object.keys(AVAILABLE_WIDGETS));
      }
    } else {
      setEnabledWidgets(Object.keys(AVAILABLE_WIDGETS));
    }
  }, []);

  // 保存布局到本地存储
  const saveLayoutsToStorage = (newLayouts) => {
    localStorage.setItem('dashboard-layouts', JSON.stringify(newLayouts));
  };

  // 保存启用的组件到本地存储
  const saveEnabledWidgetsToStorage = (widgets) => {
    localStorage.setItem('enabled-widgets', JSON.stringify(widgets));
  };

  // 处理布局变化
  const handleLayoutChange = (layout, layouts) => {
    setLayouts(layouts);
    if (mounted) {
      saveLayoutsToStorage(layouts);
    }
  };

  // 切换组件启用状态
  const toggleWidget = (widgetId) => {
    const newEnabledWidgets = enabledWidgets.includes(widgetId)
      ? enabledWidgets.filter(id => id !== widgetId)
      : [...enabledWidgets, widgetId];
    
    setEnabledWidgets(newEnabledWidgets);
    saveEnabledWidgetsToStorage(newEnabledWidgets);
  };

  // 添加新组件
  const addWidget = (widgetId) => {
    if (!enabledWidgets.includes(widgetId)) {
      const widget = AVAILABLE_WIDGETS[widgetId];
      const newLayouts = { ...layouts };
      
      // 为每个断点添加新组件
      Object.keys(GRID_CONFIG.cols).forEach(breakpoint => {
        if (!newLayouts[breakpoint]) {
          newLayouts[breakpoint] = [];
        }
        
        // 找到合适的位置放置新组件
        const existingItems = newLayouts[breakpoint];
        let maxY = 0;
        existingItems.forEach(item => {
          maxY = Math.max(maxY, item.y + item.h);
        });
        
        newLayouts[breakpoint].push({
          i: widgetId,
          x: 0,
          y: maxY,
          w: Math.min(widget.defaultSize.w, GRID_CONFIG.cols[breakpoint]),
          h: widget.defaultSize.h
        });
      });
      
      setLayouts(newLayouts);
      setEnabledWidgets([...enabledWidgets, widgetId]);
      saveLayoutsToStorage(newLayouts);
      saveEnabledWidgetsToStorage([...enabledWidgets, widgetId]);
    }
  };

  // 重置布局
  const resetLayout = () => {
    setLayouts(DEFAULT_LAYOUTS);
    setEnabledWidgets(Object.keys(AVAILABLE_WIDGETS));
    saveLayoutsToStorage(DEFAULT_LAYOUTS);
    saveEnabledWidgetsToStorage(Object.keys(AVAILABLE_WIDGETS));
  };

  // 设为默认布局
  const setAsDefaultLayout = () => {
    // 将当前布局保存为默认布局
    localStorage.setItem('default-layouts', JSON.stringify(layouts));
    localStorage.setItem('default-enabled-widgets', JSON.stringify(enabledWidgets));
    
    // 显示成功提示
    message.success('当前布局已设为默认布局');
  };

  // 渲染组件
  const renderWidget = (widgetId) => {
    const widget = AVAILABLE_WIDGETS[widgetId];
    if (!widget) return null;
  
    const WidgetComponent = widget.component;
  
    return (
      <div key={widgetId} className="dashboard-widget">
        <Card 
          className={`widget-card ${isEditMode ? 'edit-mode' : ''}`}
          styles={{ body: { padding: '12px' } }}
          variant="borderless"
        >
          {isEditMode && (
            <div className="widget-drag-handle">
              <DragOutlined />
            </div>
          )}
          <WidgetComponent isEditMode={isEditMode} />
        </Card>
      </div>
    );
  };

  // 按类别分组组件
  const widgetsByCategory = useMemo(() => {
    const categories = {};
    Object.values(AVAILABLE_WIDGETS).forEach(widget => {
      if (!categories[widget.category]) {
        categories[widget.category] = [];
      }
      categories[widget.category].push(widget);
    });
    return categories;
  }, []);

  const categoryNames = {
    market: '市场数据',
    strategy: '策略管理',
    trading: '交易数据',
    community: '社区互动',
    analysis: '数据分析',
    personal: '个人数据',
    tools: '工具'
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-widgets-container">
      {/* 工具栏 */}
      <div className="dashboard-toolbar">
        <div className="toolbar-left">
          <Title level={3} style={{ margin: 0 }}>我的仪表盘</Title>
        </div>
        <div className="toolbar-right">
          <Space>
            <Switch
              checked={isEditMode}
              onChange={setIsEditMode}
              checkedChildren="编辑模式"
              unCheckedChildren="查看模式"
            />
            <Button 
              icon={<SettingOutlined />} 
              onClick={() => setSettingsVisible(true)}
            >
              设置
            </Button>
          </Space>
        </div>
      </div>

      {/* 网格布局 */}
      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        {...GRID_CONFIG}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        useCSSTransforms={mounted}
      >
        {enabledWidgets.map(renderWidget)}
      </ResponsiveGridLayout>

      {/* 设置弹窗 */}
      <Modal
        title="仪表盘设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={[
          <Button key="reset" onClick={resetLayout}>
            重置布局
          </Button>,
          <Button key="cancel" onClick={() => setSettingsVisible(false)}>
            取消
          </Button>,
          <Button key="ok" type="primary" onClick={() => setSettingsVisible(false)}>
            确定
          </Button>
        ]}
        width={800}
      >
        <Tabs 
          defaultActiveKey="widgets"
          items={[
            {
              key: 'widgets',
              label: '组件管理',
              children: (
                <div>
                  {Object.entries(widgetsByCategory).map(([category, widgets]) => (
                    <div key={category} className="widget-category">
                      <Title level={5}>{categoryNames[category]}</Title>
                      <Row gutter={[16, 16]}>
                        {widgets.map(widget => (
                          <Col span={12} key={widget.id}>
                            <Card size="small" className="widget-config-card">
                              <div className="widget-config-header">
                                <div className="widget-info">
                                  <div className="widget-name">{widget.name}</div>
                                  <div className="widget-description">{widget.description}</div>
                                </div>
                                <Switch
                                  checked={enabledWidgets.includes(widget.id)}
                                  onChange={() => toggleWidget(widget.id)}
                                  size="small"
                                />
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                      <Divider />
                    </div>
                  ))}
                </div>
              )
            },
            {
              key: 'layout',
              label: '布局设置',
              children: (
                <div className="layout-settings">
                  <div style={{ marginBottom: 16 }}>
                    <p>拖拽模式下可以调整组件位置和大小</p>
                    <p style={{ color: '#666', fontSize: '12px' }}>
                      • 设为默认布局：将当前布局保存为个人默认布局，下次打开时自动应用<br/>
                      • 恢复默认布局：恢复到系统预设的标准布局
                    </p>
                  </div>
                  <Space>
                    <Button onClick={setAsDefaultLayout} type="primary">
                      设为默认布局
                    </Button>
                    <Button onClick={resetLayout}>
                      恢复默认布局
                    </Button>
                  </Space>
                </div>
              )
            }
          ]}
        />
      </Modal>
    </div>
  );
};

export default DashboardWidgets;