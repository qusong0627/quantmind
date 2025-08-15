import React, { useState, useEffect } from 'react';
import { Layout, Button, message, Spin } from 'antd';
import { EditOutlined, SaveOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import DashboardWidgets from './components/DashboardWidgets';
import './Dashboard.css';

const { Content } = Layout;

const Dashboard = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  useEffect(() => {
    // 模拟初始化加载
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      message.success('布局已保存');
    } else {
      message.info('进入编辑模式，可拖拽调整组件位置和大小');
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setLastUpdateTime(new Date());
    
    // 模拟刷新数据
    setTimeout(() => {
      setLoading(false);
      message.success('数据已刷新');
    }, 1000);
  };

  const handleSettings = () => {
    message.info('仪表盘设置功能开发中...');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" tip="加载仪表盘数据..." />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>QuantMind 仪表盘</h2>
          <span className="last-update">
            最后更新: {lastUpdateTime.toLocaleTimeString()}
          </span>
        </div>
        <div className="dashboard-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={handleSettings}
          >
            设置
          </Button>
          <Button
            type={isEditMode ? 'primary' : 'default'}
            icon={isEditMode ? <SaveOutlined /> : <EditOutlined />}
            onClick={handleEditToggle}
          >
            {isEditMode ? '保存布局' : '编辑布局'}
          </Button>
        </div>
      </div>
      
      <Content className="dashboard-content">
        <DashboardWidgets 
          isEditMode={isEditMode}
          lastUpdateTime={lastUpdateTime}
        />
      </Content>
    </div>
  );
};

export default Dashboard;