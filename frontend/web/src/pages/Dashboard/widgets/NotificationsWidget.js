import React, { useState, useEffect } from 'react';
import { List, Badge, Button, Space, Avatar, Typography, Tooltip, Tag } from 'antd';
import { 
  BellOutlined, 
  CheckOutlined, 
  InfoCircleOutlined, 
  WarningOutlined, 
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  EyeOutlined
} from '@ant-design/icons';
import '../DashboardWidgets.css';

const NotificationsWidget = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 模拟获取通知数据
    const fetchNotifications = () => {
      setTimeout(() => {
        const notificationData = [
          {
            id: 1,
            type: 'success',
            title: '策略执行成功',
            message: '量化策略A已成功买入AAPL 100股',
            timestamp: '5分钟前',
            read: false
          },
          {
            id: 2,
            type: 'warning',
            title: '风险提醒',
            message: '持仓集中度过高，建议分散投资',
            timestamp: '15分钟前',
            read: false
          },
          {
            id: 3,
            type: 'info',
            title: '市场资讯',
            message: '美联储会议纪要将于今晚公布',
            timestamp: '1小时前',
            read: true
          },
          {
            id: 4,
            type: 'error',
            title: '策略异常',
            message: '策略B执行失败，请检查参数设置',
            timestamp: '2小时前',
            read: false
          },
          {
            id: 5,
            type: 'info',
            title: '系统维护',
            message: '系统将于今晚23:00-01:00进行维护',
            timestamp: '3小时前',
            read: true
          }
        ];
        
        setNotifications(notificationData);
        setUnreadCount(notificationData.filter(n => !n.read).length);
        setLoading(false);
      }, 800);
    };

    fetchNotifications();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'info':
        return <InfoCircleOutlined />;
      case 'warning':
        return <WarningOutlined />;
      case 'error':
        return <ExclamationCircleOutlined />;
      case 'success':
        return <CheckCircleOutlined />;
      case 'system':
        return <SyncOutlined />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const getTypeTag = (type) => {
    const typeMap = {
      'info': { text: '信息', color: 'blue' },
      'warning': { text: '警告', color: 'orange' },
      'error': { text: '错误', color: 'red' },
      'success': { text: '成功', color: 'green' },
      'system': { text: '系统', color: 'purple' }
    };
    const config = typeMap[type] || typeMap['info'];
    return <Tag color={config.color} size="small">{config.text}</Tag>;
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id 
        ? { ...notification, read: true }
        : notification
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => 
      ({ ...notification, read: true })
    ));
    setUnreadCount(0);
  };

  return (
    <div className="widget-content notifications-widget">
      <div className="widget-header">
        <div className="widget-title">
          <Space>
            <BellOutlined className="widget-icon" />
            <span>通知中心</span>
            {unreadCount > 0 && (
              <Badge 
                count={unreadCount} 
                size="small" 
                className="notification-badge"
              />
            )}
          </Space>
        </div>
        <div className="widget-actions">
          <Space>
            {unreadCount > 0 && (
              <Tooltip title="标记全部为已读">
                <Button 
                  type="link" 
                  size="small" 
                  icon={<CheckOutlined />}
                  onClick={markAllAsRead}
                  className="action-button"
                >
                  全部已读
                </Button>
              </Tooltip>
            )}
            <Button 
              type="link" 
              size="small" 
              icon={<EyeOutlined />}
              className="action-button"
            >
              查看全部
            </Button>
          </Space>
        </div>
      </div>
      
      <div className="widget-body notifications-scroll-body">
        <div className="notification-list-container">
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            loading={loading}
            size="small"
            className="notification-list notifications-list-scroll"
            renderItem={item => (
              <List.Item
                key={item.id}
                className={`notification-item ${!item.read ? 'unread' : 'read'} ${item.type}`}
                onClick={() => !item.read && markAsRead(item.id)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      size={32}
                      className={`notification-avatar ${item.type}`}
                      icon={getNotificationIcon(item.type)}
                    />
                  }
                  title={
                    <div className="notification-title">
                      <span className="title-text">{item.title}</span>
                      {getTypeTag(item.type)}
                      {!item.read && (
                        <Badge status="processing" text="新" className="new-badge" />
                      )}
                    </div>
                  }
                  description={
                    <div className="notification-description">
                      <Typography.Text className="message-text">
                        {item.message}
                      </Typography.Text>
                      <Typography.Text className="timestamp-text">
                        {item.timestamp}
                      </Typography.Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
          
          {notifications.length === 0 && !loading && (
            <div className="empty-state">
              暂无通知消息
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsWidget;