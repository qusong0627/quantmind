import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Badge, Drawer } from 'antd';
import {
  MenuOutlined,
  UserOutlined,
  BellOutlined,
  DashboardOutlined,
  RobotOutlined,
  BulbOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  StockOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 菜单项配置
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/strategy/ai',
      icon: <RobotOutlined />,
      label: 'AI策略生成',
    },
    {
      key: '/strategy/editor',
      icon: <BulbOutlined />,
      label: '策略编辑',
    },
    {
      key: '/strategy/backtest',
      icon: <BarChartOutlined />,
      label: '策略回测',
    },
    {
      key: '/data-management',
      icon: <DatabaseOutlined />,
      label: '数据管理',
    },
    {
      key: '/trading',
      icon: <StockOutlined />,
      label: '实盘交易',
    },
    {
      key: '/community',
      icon: <TeamOutlined />,
      label: '策略社区',
    },
    {
      key: '/personal-center',
      icon: <UserOutlined />,
      label: '个人中心',
    },
  ];

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/login');
  }

  const handleMenuClick = ({ key }) => {
    // 个人中心菜单项跳转到 profile 页面
    if (key === '/personal-center') {
      navigate('/profile');
    } else {
      navigate(key);
    }
    if (isMobile) {
      setMobileDrawerVisible(false);
    }
  };

  // 获取用户信息
  const getUserInfo = () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr || userInfoStr === 'undefined') {
        return {};
      }
      return JSON.parse(userInfoStr);
    } catch (error) {
      console.warn('Failed to parse userInfo from localStorage:', error);
      localStorage.removeItem('userInfo'); // 清除无效数据
      return {};
    }
  };
  
  const userInfo = getUserInfo();

  // 获取当前选中的菜单项key
  const getSelectedKeys = () => {
    // 如果当前路径是/profile，则选中个人中心菜单项
    if (location.pathname === '/profile') {
      return ['/personal-center'];
    }
    return [location.pathname];
  };

  // 侧边栏内容
  const siderContent = (
    <div className="sider-content">
      <div className="logo">
        <div className="logo-icon">Q</div>
        {!collapsed && <span className="logo-text">QuantMind</span>}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={getSelectedKeys()}
        items={menuItems}
        onClick={handleMenuClick}
        className="main-menu"
      />
    </div>
  );

  return (
    <Layout className="main-layout">
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="main-sider"
          width={240}
          collapsedWidth={80}
        >
          {siderContent}
        </Sider>
      )}

      {/* 移动端抽屉 */}
      {isMobile && (
        <Drawer
          title={null}
          placement="left"
          closable={false}
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          styles={{ body: { padding: 0 } }}
          width={240}
          className="mobile-drawer"
        >
          {siderContent}
        </Drawer>
      )}

      <Layout className="main-content-layout">
        {/* 顶部导航栏 */}
        <Header className="main-header">
          <div className="header-left">
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileDrawerVisible(true)}
                className="mobile-menu-trigger"
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuOutlined /> : <MenuOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="collapse-trigger"
              />
            )}
            <div className="header-title">
              {menuItems.find(item => item.key === location.pathname)?.label || 'AI策略生成'}
            </div>
          </div>

          <div className="header-right">
            {/* 通知铃铛 */}
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                className="header-action-btn"
              />
            </Badge>

            {/* 用户头像和菜单 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="user-info">
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={userInfo.avatar}
                  className="user-avatar"
                />
                {!isMobile && (
                  <span className="user-name">{userInfo.username || '用户'}</span>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* 主要内容区域 */}
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;