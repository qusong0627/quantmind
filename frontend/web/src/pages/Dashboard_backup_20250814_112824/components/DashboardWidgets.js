import React, { useState, useEffect, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Button, Drawer, Checkbox, Space, Divider, message, Card } from 'antd';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';

// 导入所有小组件
import FundOverviewWidget from '../widgets/FundOverviewWidget';
import WatchlistWidget from '../widgets/WatchlistWidget';
import MyStrategiesWidget from '../widgets/MyStrategiesWidget';
import QuickActionsWidget from '../widgets/QuickActionsWidget';
import PositionOverviewWidget from '../widgets/PositionOverviewWidget';
import PositionsWidget from '../widgets/PositionsWidget';
import PerformanceWidget from '../widgets/PerformanceWidget';
import StrategyPerformanceWidget from '../widgets/StrategyPerformanceWidget';
import BacktestResultsWidget from '../widgets/BacktestResultsWidget';
import TopMoversWidget from '../widgets/TopMoversWidget';
import NewsWidget from '../widgets/NewsWidget';
import CommunityFeedWidget from '../widgets/CommunityFeedWidget';
import NotificationsWidget from '../widgets/NotificationsWidget';
import RiskMonitorWidget from '../widgets/RiskMonitorWidget';
import MarketSentimentWidget from '../widgets/MarketSentimentWidget';
import TradingSignalsWidget from '../widgets/TradingSignalsWidget';
import AIInsightsWidget from '../widgets/AIInsightsWidget';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './DashboardWidgets.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// 网格布局配置
const GRID_CONFIG = {
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  rowHeight: 60,
  margin: [16, 16],
  containerPadding: [16, 16]
};

// 可用组件配置
const AVAILABLE_WIDGETS = {
  'fund-overview': {
    id: 'fund-overview',
    name: '资金概览',
    category: '资金管理',
    component: FundOverviewWidget,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    description: '显示资金状况和投资概览（已暂停大盘API调用）'
  },
  'watchlist': {
    id: 'watchlist',
    name: '自选股',
    category: '市场数据',
    component: WatchlistWidget,
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 4, h: 4 },
    description: '自选股票列表和实时价格监控'
  },
  'my-strategies': {
    id: 'my-strategies',
    name: '我的策略',
    category: '策略管理',
    component: MyStrategiesWidget,
    defaultSize: { w: 8, h: 5 },
    minSize: { w: 6, h: 4 },
    description: '策略列表展示和管理'
  },
  'quick-actions': {
    id: 'quick-actions',
    name: '快速操作',
    category: '工具',
    component: QuickActionsWidget,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    description: '常用功能快速入口'
  },
  'position-overview': {
    id: 'position-overview',
    name: '持仓概览',
    category: '交易数据',
    component: PositionOverviewWidget,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    description: '当前持仓总览和盈亏统计'
  },
  'positions': {
    id: 'positions',
    name: '持仓明细',
    category: '交易数据',
    component: PositionsWidget,
    defaultSize: { w: 12, h: 6 },
    minSize: { w: 8, h: 4 },
    description: '详细持仓列表和分析'
  },
  'performance': {
    id: 'performance',
    name: '投资表现',
    category: '数据分析',
    component: PerformanceWidget,
    defaultSize: { w: 8, h: 5 },
    minSize: { w: 6, h: 4 },
    description: '投资组合整体表现分析'
  },
  'strategy-performance': {
    id: 'strategy-performance',
    name: '策略绩效',
    category: '策略管理',
    component: StrategyPerformanceWidget,
    defaultSize: { w: 8, h: 5 },
    minSize: { w: 6, h: 4 },
    description: '策略整体表现分析'
  },
  'backtest-results': {
    id: 'backtest-results',
    name: '回测结果',
    category: '策略管理',
    component: BacktestResultsWidget,
    defaultSize: { w: 12, h: 6 },
    minSize: { w: 8, h: 4 },
    description: '回测报告展示'
  },
  'top-movers': {
    id: 'top-movers',
    name: '涨跌排行',
    category: '市场数据',
    component: TopMoversWidget,
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 4, h: 4 },
    description: '市场涨跌幅排行榜'
  },
  'news': {
    id: 'news',
    name: '财经资讯',
    category: '数据分析',
    component: NewsWidget,
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
    description: '重要财经新闻展示'
  },
  'community-feed': {
    id: 'community-feed',
    name: '社区动态',
    category: '社区互动',
    component: CommunityFeedWidget,
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
    description: '社区最新动态展示'
  },
  'notifications': {
    id: 'notifications',
    name: '消息通知',
    category: '个人数据',
    component: NotificationsWidget,
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    description: '系统消息和重要通知'
  },
  'risk-monitor': {
    id: 'risk-monitor',
    name: '风险监控',
    category: '风险管理',
    component: RiskMonitorWidget,
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 4, h: 4 },
    description: '实时风险监控和评估'
  },
  'market-sentiment': {
    id: 'market-sentiment',
    name: '市场情绪',
    category: '市场数据',
    component: MarketSentimentWidget,
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 4, h: 4 },
    description: '市场情绪分析和指标'
  },
  'trading-signals': {
    id: 'trading-signals',
    name: '交易信号',
    category: '策略管理',
    component: TradingSignalsWidget,
    defaultSize: { w: 8, h: 6 },
    minSize: { w: 6, h: 4 },
    description: '智能交易信号推荐'
  },
  'ai-insights': {
    id: 'ai-insights',
    name: 'AI洞察',
    category: 'AI分析',
    component: AIInsightsWidget,
    defaultSize: { w: 8, h: 5 },
    minSize: { w: 6, h: 4 },
    description: 'AI驱动的市场洞察分析'
  }
};

// 默认启用的组件
const DEFAULT_ENABLED_WIDGETS = [
  'fund-overview',
  'watchlist',
  'my-strategies',
  'quick-actions',
  'position-overview',
  'performance',
  'news',
  'notifications',
  'risk-monitor',
  'market-sentiment',
  'trading-signals',
  'ai-insights'
];

// 默认布局配置
const getDefaultLayouts = () => {
  const layouts = {
    lg: [
      { i: 'fund-overview', x: 0, y: 0, w: 6, h: 4 },
      { i: 'watchlist', x: 6, y: 0, w: 6, h: 4 },
      { i: 'my-strategies', x: 0, y: 4, w: 8, h: 5 },
      { i: 'quick-actions', x: 8, y: 4, w: 4, h: 3 },
      { i: 'position-overview', x: 0, y: 9, w: 6, h: 4 },
      { i: 'performance', x: 6, y: 9, w: 6, h: 4 },
      { i: 'risk-monitor', x: 0, y: 13, w: 6, h: 5 },
      { i: 'market-sentiment', x: 6, y: 13, w: 6, h: 5 },
      { i: 'trading-signals', x: 0, y: 18, w: 8, h: 6 },
      { i: 'ai-insights', x: 8, y: 18, w: 4, h: 5 },
      { i: 'news', x: 0, y: 24, w: 6, h: 6 },
      { i: 'notifications', x: 6, y: 24, w: 6, h: 4 }
    ],
    md: [
      { i: 'fund-overview', x: 0, y: 0, w: 5, h: 4 },
      { i: 'watchlist', x: 5, y: 0, w: 5, h: 4 },
      { i: 'my-strategies', x: 0, y: 4, w: 7, h: 5 },
      { i: 'quick-actions', x: 7, y: 4, w: 3, h: 3 },
      { i: 'position-overview', x: 0, y: 9, w: 5, h: 4 },
      { i: 'performance', x: 5, y: 9, w: 5, h: 4 },
      { i: 'risk-monitor', x: 0, y: 13, w: 5, h: 5 },
      { i: 'market-sentiment', x: 5, y: 13, w: 5, h: 5 },
      { i: 'trading-signals', x: 0, y: 18, w: 7, h: 6 },
      { i: 'ai-insights', x: 7, y: 18, w: 3, h: 5 },
      { i: 'news', x: 0, y: 24, w: 5, h: 6 },
      { i: 'notifications', x: 5, y: 24, w: 5, h: 4 }
    ],
    sm: [
      { i: 'fund-overview', x: 0, y: 0, w: 6, h: 4 },
      { i: 'watchlist', x: 0, y: 4, w: 6, h: 5 },
      { i: 'my-strategies', x: 0, y: 9, w: 6, h: 5 },
      { i: 'quick-actions', x: 0, y: 14, w: 6, h: 3 },
      { i: 'position-overview', x: 0, y: 17, w: 6, h: 4 },
      { i: 'performance', x: 0, y: 21, w: 6, h: 4 },
      { i: 'risk-monitor', x: 0, y: 25, w: 6, h: 5 },
      { i: 'market-sentiment', x: 0, y: 30, w: 6, h: 5 },
      { i: 'trading-signals', x: 0, y: 35, w: 6, h: 6 },
      { i: 'ai-insights', x: 0, y: 41, w: 6, h: 5 },
      { i: 'news', x: 0, y: 46, w: 6, h: 6 },
      { i: 'notifications', x: 0, y: 52, w: 6, h: 4 }
    ],
    xs: [
      { i: 'fund-overview', x: 0, y: 0, w: 4, h: 4 },
      { i: 'watchlist', x: 0, y: 4, w: 4, h: 5 },
      { i: 'my-strategies', x: 0, y: 9, w: 4, h: 5 },
      { i: 'quick-actions', x: 0, y: 14, w: 4, h: 3 },
      { i: 'position-overview', x: 0, y: 17, w: 4, h: 4 },
      { i: 'performance', x: 0, y: 21, w: 4, h: 4 },
      { i: 'risk-monitor', x: 0, y: 25, w: 4, h: 5 },
      { i: 'market-sentiment', x: 0, y: 30, w: 4, h: 5 },
      { i: 'trading-signals', x: 0, y: 35, w: 4, h: 6 },
      { i: 'ai-insights', x: 0, y: 41, w: 4, h: 5 },
      { i: 'news', x: 0, y: 46, w: 4, h: 6 },
      { i: 'notifications', x: 0, y: 52, w: 4, h: 4 }
    ],
    xxs: [
      { i: 'fund-overview', x: 0, y: 0, w: 2, h: 4 },
      { i: 'watchlist', x: 0, y: 4, w: 2, h: 5 },
      { i: 'my-strategies', x: 0, y: 9, w: 2, h: 5 },
      { i: 'quick-actions', x: 0, y: 14, w: 2, h: 3 },
      { i: 'position-overview', x: 0, y: 17, w: 2, h: 4 },
      { i: 'performance', x: 0, y: 21, w: 2, h: 4 },
      { i: 'risk-monitor', x: 0, y: 25, w: 2, h: 5 },
      { i: 'market-sentiment', x: 0, y: 30, w: 2, h: 5 },
      { i: 'trading-signals', x: 0, y: 35, w: 2, h: 6 },
      { i: 'ai-insights', x: 0, y: 41, w: 2, h: 5 },
      { i: 'news', x: 0, y: 46, w: 2, h: 6 },
      { i: 'notifications', x: 0, y: 52, w: 2, h: 4 }
    ]
  };
  return layouts;
};

const DashboardWidgets = ({ isEditMode, lastUpdateTime }) => {
  const [layouts, setLayouts] = useState(() => {
    const savedLayouts = localStorage.getItem('dashboard_layouts');
    return savedLayouts ? JSON.parse(savedLayouts) : getDefaultLayouts();
  });
  
  const [enabledWidgets, setEnabledWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboard_enabled_widgets');
    return saved ? JSON.parse(saved) : DEFAULT_ENABLED_WIDGETS;
  });
  
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

  // 保存布局到本地存储
  useEffect(() => {
    localStorage.setItem('dashboard_layouts', JSON.stringify(layouts));
  }, [layouts]);

  // 保存启用的组件到本地存储
  useEffect(() => {
    localStorage.setItem('dashboard_enabled_widgets', JSON.stringify(enabledWidgets));
  }, [enabledWidgets]);

  // 处理布局变化
  const handleLayoutChange = (layout, layouts) => {
    if (isEditMode) {
      setLayouts(layouts);
    }
  };

  // 处理断点变化
  const handleBreakpointChange = (breakpoint) => {
    setCurrentBreakpoint(breakpoint);
  };

  // 切换组件启用状态
  const toggleWidget = (widgetId) => {
    setEnabledWidgets(prev => {
      if (prev.includes(widgetId)) {
        return prev.filter(id => id !== widgetId);
      } else {
        return [...prev, widgetId];
      }
    });
  };

  // 重置布局
  const resetLayout = () => {
    setLayouts(getDefaultLayouts());
    message.success('布局已重置为默认设置');
  };

  // 重置组件配置
  const resetWidgets = () => {
    setEnabledWidgets(DEFAULT_ENABLED_WIDGETS);
    message.success('组件配置已重置');
  };

  // 获取当前启用的组件
  const activeWidgets = useMemo(() => {
    return enabledWidgets.map(widgetId => AVAILABLE_WIDGETS[widgetId]).filter(Boolean);
  }, [enabledWidgets]);

  // 按分类分组组件
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

  return (
    <div className={`dashboard-widgets ${isEditMode ? 'edit-mode' : ''}`}>
      {/* 设置按钮 */}
      <div className="dashboard-settings-btn">
        <Button
          icon={<SettingOutlined />}
          onClick={() => setSettingsVisible(true)}
          type="text"
          size="small"
        >
          组件设置
        </Button>
      </div>

      {/* 响应式网格布局 */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        {...GRID_CONFIG}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        useCSSTransforms={true}
      >
        {activeWidgets.map(widget => {
          const WidgetComponent = widget.component;
          return (
            <div key={widget.id} className="widget-container">
              <WidgetComponent
                isEditMode={isEditMode}
                lastUpdateTime={lastUpdateTime}
                widgetId={widget.id}
              />
            </div>
          );
        })}
      </ResponsiveGridLayout>

      {/* 设置抽屉 */}
      <Drawer
        title="仪表盘设置"
        placement="right"
        onClose={() => setSettingsVisible(false)}
        open={settingsVisible}
        width={400}
      >
        <div className="dashboard-settings">
          <div className="settings-section">
            <h4>布局设置</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button onClick={resetLayout} block>
                重置布局
              </Button>
              <div className="current-breakpoint">
                当前断点: <strong>{currentBreakpoint}</strong>
              </div>
            </Space>
          </div>

          <Divider />

          <div className="settings-section">
            <h4>组件管理</h4>
            <div className="widget-controls">
              <Button onClick={resetWidgets} size="small" style={{ marginBottom: 16 }}>
                重置组件
              </Button>
              
              {Object.entries(widgetsByCategory).map(([category, widgets]) => (
                <div key={category} className="widget-category">
                  <h5>{category}</h5>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {widgets.map(widget => (
                      <Card key={widget.id} size="small" className="widget-card">
                        <div className="widget-info">
                          <Checkbox
                            checked={enabledWidgets.includes(widget.id)}
                            onChange={() => toggleWidget(widget.id)}
                          >
                            <strong>{widget.name}</strong>
                          </Checkbox>
                          <div className="widget-description">
                            {widget.description}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Space>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default DashboardWidgets;