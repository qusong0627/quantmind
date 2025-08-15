import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

// 页面组件
import Layout from './components/Layout/MainLayout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

import Dashboard from './pages/Dashboard/Dashboard';
import StrategyEditor from './pages/Strategy/StrategyEditor';
import AIStrategyGenerator from './pages/Strategy/AIStrategyGenerator';
import StrategyBacktest from './pages/Strategy/StrategyBacktest';

import DataManagement from './pages/DataManagement/DataManagement';
import LiveTrading from './components/LiveTrading/LiveTrading';
import Community from './pages/Community/Community';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';

// 样式
import './App.css';

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
});

// 主题配置函数
const getThemeConfig = () => ({
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#667eea',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 12,
    },
  },
});

// 路由保护组件
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// 公共路由组件（已登录用户不能访问）
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/strategy/editor" replace />;
};

function App() {
  const themeConfig = getThemeConfig();
  
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider 
        locale={zhCN} 
        theme={themeConfig}
      >
        <AntdApp>
          <Router>
            <div className="App">
              <Routes>
              {/* 公共路由 */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />
              
              {/* 受保护的路由 */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                {/* 仪表盘路由 */}
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* 策略相关路由 */}
                <Route path="strategy">
                  <Route path="editor" element={<StrategyEditor />} />
                  <Route path="ai" element={<AIStrategyGenerator />} />
                  <Route path="backtest" element={<StrategyBacktest />} />
                </Route>
                

                
                {/* 数据管理路由 */}
                <Route path="data-management" element={<DataManagement />} />
                
                {/* 实盘交易路由 */}
                <Route path="trading" element={<LiveTrading />} />
                
                {/* 社区路由 */}
                <Route path="community" element={<Community />} />
                
                {/* 个人中心路由 */}
                <Route path="profile" element={<Profile />} />
                
                {/* 设置页面路由 */}
                <Route path="settings" element={<Settings />} />
              </Route>
              
                {/* 404 页面 */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </Router>
          
          {/* React Query 开发工具 */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;