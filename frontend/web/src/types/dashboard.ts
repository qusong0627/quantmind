// Dashboard 相关类型定义

// 用户偏好设置接口
export interface UserPreferences {
  defaultLayout: string;
  theme: 'light' | 'dark' | 'auto';
  autoRefresh: boolean;
  refreshInterval: number;
  notifications: boolean;
  compactMode: boolean;
}

// 小组件配置接口
export interface WidgetConfig {
  id: string;
  title: string;
  component: string;
  defaultSize: {
    w: number;
    h: number;
  };
  minSize?: {
    w: number;
    h: number;
  };
  maxSize?: {
    w: number;
    h: number;
  };
  category: string;
  description: string;
  icon?: string;
  isResizable?: boolean;
  isDraggable?: boolean;
}

// 布局项接口
export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

// 响应式布局接口
export interface ResponsiveLayouts {
  lg: LayoutItem[];
  md: LayoutItem[];
  sm: LayoutItem[];
  xs?: LayoutItem[];
  xxs?: LayoutItem[];
}

// 仪表盘状态接口
export interface DashboardState {
  layouts: ResponsiveLayouts;
  widgets: WidgetConfig[];
  activeWidgets: string[];
  isEditing: boolean;
  loading: boolean;
  error: string | null;
}

// 市场数据接口
export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

// 策略性能数据接口
export interface StrategyPerformance {
  strategyId: string;
  name: string;
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  lastUpdated: number;
}

// 回测摘要接口
export interface BacktestSummary {
  id: string;
  strategyName: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalValue: number;
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  status: 'completed' | 'running' | 'failed';
  createdAt: string;
}

// AI策略洞察接口
export interface AIStrategyInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: 'trend' | 'risk' | 'opportunity' | 'alert';
  impact: 'high' | 'medium' | 'low';
  timestamp: number;
  actionable: boolean;
  relatedSymbols?: string[];
}

// 交易信号接口
export interface TradingSignal {
  id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'hold';
  strength: number;
  price: number;
  timestamp: number;
  reason: string;
  confidence: number;
}

// 风险指标接口
export interface RiskMetrics {
  portfolioValue: number;
  dailyVaR: number;
  beta: number;
  correlation: number;
  volatility: number;
  exposure: {
    long: number;
    short: number;
    net: number;
  };
}

// 新闻数据接口
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevantSymbols: string[];
  impact: 'high' | 'medium' | 'low';
}

// 快速操作接口
export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  category: 'strategy' | 'trading' | 'analysis' | 'settings';
  shortcut?: string;
}

// 图表数据接口
export interface ChartData {
  timestamp: number;
  value: number;
  label?: string;
}

// 时间序列数据接口
export interface TimeSeriesData {
  data: ChartData[];
  symbol?: string;
  timeframe: string;
  lastUpdated: number;
}

// 组合持仓接口
export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  weight: number;
}

// 组合概览接口
export interface PortfolioOverview {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  positions: PortfolioPosition[];
  cash: number;
  lastUpdated: number;
}

// 系统状态接口
export interface SystemStatus {
  dataFeed: 'connected' | 'disconnected' | 'error';
  trading: 'active' | 'inactive' | 'error';
  strategy: 'running' | 'stopped' | 'error';
  lastHeartbeat: number;
  uptime: number;
  version: string;
}

// 通知接口
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

// 模块数据状态接口
export interface ModuleDataState {
  [key: string]: any;
}

// 实时更新接口
export interface RealTimeUpdate {
  type: string;
  moduleId: string;
  updateType: string;
  data: any;
  timestamp: number;
  source?: string;
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: number;
  code?: number;
}

// WebSocket消息接口
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id?: string;
}

// 所有类型已通过interface和export声明导出