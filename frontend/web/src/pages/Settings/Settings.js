import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Menu, Card, Breadcrumb, Button, message } from 'antd';
import {
  UserOutlined,
  SafetyOutlined,
  EyeOutlined,
  BellOutlined,
  SettingOutlined,
  HomeOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

// 设置子组件
import AccountSettings from './AccountSettings';
import SecuritySettings from './SecuritySettings';
import PrivacySettings from './PrivacySettings';
import NotificationSettings from './NotificationSettings';
import PreferencesSettings from './PreferencesSettings';

import './Settings.css';

const { Content, Sider } = Layout;

const Settings = () => {
  const [activeKey, setActiveKey] = useState('account');
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 菜单项配置
  const menuItems = useMemo(() => [
    {
      key: 'account',
      icon: <UserOutlined />,
      label: '账户设置',
      component: AccountSettings
    },
    {
      key: 'security',
      icon: <SafetyOutlined />,
      label: '安全设置',
      component: SecuritySettings
    },
    {
      key: 'privacy',
      icon: <EyeOutlined />,
      label: '隐私设置',
      component: PrivacySettings
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '通知设置',
      component: NotificationSettings
    },
    {
      key: 'preferences',
      icon: <SettingOutlined />,
      label: '偏好设置',
      component: PreferencesSettings
    }
  ], []);

  // 从URL参数获取当前设置页面
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab && menuItems.find(item => item.key === tab)) {
      setActiveKey(tab);
    }
  }, [location.search]);

  // 切换设置页面
  const handleMenuClick = (e) => {
    if (hasChanges) {
      // 如果有未保存的更改，提示用户
      const confirmed = window.confirm('您有未保存的更改，确定要离开吗？');
      if (!confirmed) {
        return;
      }
    }
    
    setActiveKey(e.key);
    setHasChanges(false);
    
    // 更新URL参数
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', e.key);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  // 保存所有设置
  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // 这里应该调用API保存所有设置
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      message.success('设置保存成功');
      setHasChanges(false);
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 重置设置
  const handleReset = () => {
    const confirmed = window.confirm('确定要重置当前页面的所有设置吗？此操作不可撤销。');
    if (confirmed) {
      // 这里应该调用API重置设置
      message.info('设置已重置');
      setHasChanges(false);
    }
  };

  // 获取当前活动组件
  const getCurrentComponent = () => {
    const currentItem = menuItems.find(item => item.key === activeKey);
    if (currentItem) {
      const Component = currentItem.component;
      return (
        <Component 
          onSettingsChange={() => setHasChanges(true)}
          onSave={handleSaveAll}
        />
      );
    }
    return null;
  };

  // 获取当前页面标题
  const getCurrentTitle = () => {
    const currentItem = menuItems.find(item => item.key === activeKey);
    return currentItem ? currentItem.label : '设置';
  };

  return (
    <div className="settings-container">
      {/* 面包屑导航 */}
      <div className="settings-breadcrumb">
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => navigate('/strategy/editor')}>首页</Breadcrumb.Item>
          <Breadcrumb.Item>设置</Breadcrumb.Item>
          <Breadcrumb.Item>{getCurrentTitle()}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Layout className="settings-layout">
        {/* 左侧菜单 */}
        <Sider 
          width={240} 
          className="settings-sider"
          theme="light"
        >
          <div className="settings-menu-header">
            <h3>设置中心</h3>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            onClick={handleMenuClick}
            className="settings-menu"
          >
            {menuItems.map(item => (
              <Menu.Item key={item.key} icon={item.icon}>
                {item.label}
              </Menu.Item>
            ))}
          </Menu>
        </Sider>

        {/* 右侧内容区域 */}
        <Layout className="settings-content-layout">
          <Content className="settings-content">
            <Card 
              className="settings-card"
              title={
                <div className="settings-card-header">
                  <span>{getCurrentTitle()}</span>
                  <div className="settings-actions">
                    {hasChanges && (
                      <Button 
                        type="primary" 
                        icon={<SaveOutlined />}
                        onClick={handleSaveAll}
                        loading={loading}
                        className="save-button"
                      >
                        保存更改
                      </Button>
                    )}
                    <Button 
                      icon={<ReloadOutlined />}
                      onClick={handleReset}
                      className="reset-button"
                    >
                      重置
                    </Button>
                  </div>
                </div>
              }
              bordered={false}
            >
              {getCurrentComponent()}
            </Card>
          </Content>
        </Layout>
      </Layout>

      {/* 未保存更改提示 */}
      {hasChanges && (
        <div className="unsaved-changes-indicator">
          <div className="unsaved-changes-content">
            <span>您有未保存的更改</span>
            <Button 
              type="primary" 
              size="small" 
              onClick={handleSaveAll}
              loading={loading}
            >
              保存
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;