import React, { useState } from 'react';
import { Form, Switch, Card, Select, TimePicker, Button, message, Divider, Alert, List, Tag } from 'antd';
import { BellOutlined, MailOutlined, MobileOutlined, DesktopOutlined, SoundOutlined, ClockCircleOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;

const NotificationSettings = ({ onSettingsChange, onSave }) => {
  const [loading, setLoading] = useState(false);
  
  // 通知设置状态
  const [notificationSettings, setNotificationSettings] = useState({
    // 系统通知
    systemNotifications: true,
    securityAlerts: true,
    maintenanceNotices: true,
    
    // 交易通知
    tradeExecutions: true,
    priceAlerts: true,
    strategySignals: true,
    portfolioUpdates: false,
    riskWarnings: true,
    
    // 社交通知
    newFollowers: true,
    likes: false,
    comments: true,
    mentions: true,
    privateMessages: true,
    
    // 内容通知
    newStrategies: false,
    strategyUpdates: true,
    communityPosts: false,
    weeklyDigest: true,
    
    // 通知渠道
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    desktopNotifications: true,
    
    // 通知时间设置
    quietHoursEnabled: true,
    quietHoursStart: moment('22:00', 'HH:mm'),
    quietHoursEnd: moment('08:00', 'HH:mm'),
    
    // 频率设置
    emailFrequency: 'immediate', // immediate, hourly, daily, weekly
    digestFrequency: 'weekly', // daily, weekly, monthly
    
    // 声音设置
    soundEnabled: true,
    vibrationEnabled: true
  });

  // 通知历史记录
  const [notificationHistory] = useState([
    {
      id: '1',
      type: 'trade',
      title: '交易执行通知',
      content: '您的策略 "均线突破" 已执行买入操作',
      time: '2024-01-15 14:30:00',
      read: true,
      channel: ['email', 'push']
    },
    {
      id: '2',
      type: 'social',
      title: '新关注者',
      content: '用户 "量化新手" 开始关注您',
      time: '2024-01-15 12:15:00',
      read: false,
      channel: ['push']
    },
    {
      id: '3',
      type: 'system',
      title: '系统维护通知',
      content: '系统将于今晚22:00-24:00进行维护',
      time: '2024-01-15 10:00:00',
      read: true,
      channel: ['email', 'push', 'sms']
    },
    {
      id: '4',
      type: 'content',
      title: '策略更新',
      content: '您关注的策略 "机器学习选股" 已更新',
      time: '2024-01-14 16:45:00',
      read: true,
      channel: ['email']
    }
  ]);

  // 处理设置变化
  const handleSettingChange = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
    onSettingsChange && onSettingsChange();
  };

  // 保存通知设置
  const handleSave = async () => {
    setLoading(true);
    try {
      // 处理时间格式
      const settingsToSave = {
        ...notificationSettings,
        quietHoursStart: notificationSettings.quietHoursStart?.format('HH:mm'),
        quietHoursEnd: notificationSettings.quietHoursEnd?.format('HH:mm')
      };
      
      // 这里应该调用API保存通知设置
      console.log('保存通知设置:', settingsToSave);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      
      message.success('通知设置保存成功');
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 测试通知
  const handleTestNotification = async (type) => {
    try {
      // 这里应该调用API发送测试通知
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success(`${type}测试通知已发送`);
    } catch (error) {
      message.error('发送失败，请重试');
    }
  };

  // 获取通知类型图标
  const getNotificationIcon = (type) => {
    const iconMap = {
      trade: '💰',
      social: '👥',
      system: '⚙️',
      content: '📄'
    };
    return iconMap[type] || '🔔';
  };

  // 获取通知渠道标签
  const getChannelTags = (channels) => {
    const channelMap = {
      email: { color: 'blue', icon: <MailOutlined /> },
      push: { color: 'green', icon: <BellOutlined /> },
      sms: { color: 'orange', icon: <MobileOutlined /> },
      desktop: { color: 'purple', icon: <DesktopOutlined /> }
    };
    
    return channels.map(channel => {
      const config = channelMap[channel];
      return (
        <Tag key={channel} color={config?.color} icon={config?.icon}>
          {channel.toUpperCase()}
        </Tag>
      );
    });
  };

  return (
    <div className="notification-settings">
      {/* 通知渠道设置 */}
      <div className="settings-group">
        <div className="settings-group-title">通知渠道</div>
        <div className="settings-group-description">
          选择您希望接收通知的方式
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <MailOutlined className="setting-icon" />
              <div>
                <div className="setting-title">邮件通知</div>
                <div className="setting-description">通过邮件接收通知</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Switch 
                checked={notificationSettings.emailNotifications}
                onChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
              <Button 
                size="small" 
                type="link"
                onClick={() => handleTestNotification('邮件')}
                disabled={!notificationSettings.emailNotifications}
              >
                测试
              </Button>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <BellOutlined className="setting-icon" />
              <div>
                <div className="setting-title">推送通知</div>
                <div className="setting-description">通过浏览器或移动应用推送</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Switch 
                checked={notificationSettings.pushNotifications}
                onChange={(checked) => handleSettingChange('pushNotifications', checked)}
              />
              <Button 
                size="small" 
                type="link"
                onClick={() => handleTestNotification('推送')}
                disabled={!notificationSettings.pushNotifications}
              >
                测试
              </Button>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <MobileOutlined className="setting-icon" />
              <div>
                <div className="setting-title">短信通知</div>
                <div className="setting-description">通过短信接收重要通知</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Switch 
                checked={notificationSettings.smsNotifications}
                onChange={(checked) => handleSettingChange('smsNotifications', checked)}
              />
              <Button 
                size="small" 
                type="link"
                onClick={() => handleTestNotification('短信')}
                disabled={!notificationSettings.smsNotifications}
              >
                测试
              </Button>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <DesktopOutlined className="setting-icon" />
              <div>
                <div className="setting-title">桌面通知</div>
                <div className="setting-description">在桌面显示通知弹窗</div>
              </div>
            </div>
            <Switch 
              checked={notificationSettings.desktopNotifications}
              onChange={(checked) => handleSettingChange('desktopNotifications', checked)}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 系统通知 */}
      <div className="settings-group">
        <div className="settings-group-title">系统通知</div>
        <div className="settings-group-description">
          系统相关的重要通知
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">系统通知</div>
              <div className="setting-description">系统更新、维护等通知</div>
            </div>
            <Switch 
              checked={notificationSettings.systemNotifications}
              onChange={(checked) => handleSettingChange('systemNotifications', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">安全警报</div>
              <div className="setting-description">账户安全相关的警报</div>
            </div>
            <Switch 
              checked={notificationSettings.securityAlerts}
              onChange={(checked) => handleSettingChange('securityAlerts', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">维护通知</div>
              <div className="setting-description">系统维护和停机通知</div>
            </div>
            <Switch 
              checked={notificationSettings.maintenanceNotices}
              onChange={(checked) => handleSettingChange('maintenanceNotices', checked)}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 交易通知 */}
      <div className="settings-group">
        <div className="settings-group-title">交易通知</div>
        <div className="settings-group-description">
          交易执行和策略相关的通知
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">交易执行</div>
              <div className="setting-description">买入、卖出操作执行通知</div>
            </div>
            <Switch 
              checked={notificationSettings.tradeExecutions}
              onChange={(checked) => handleSettingChange('tradeExecutions', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">价格提醒</div>
              <div className="setting-description">股票价格达到设定条件时提醒</div>
            </div>
            <Switch 
              checked={notificationSettings.priceAlerts}
              onChange={(checked) => handleSettingChange('priceAlerts', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">策略信号</div>
              <div className="setting-description">策略产生买卖信号时通知</div>
            </div>
            <Switch 
              checked={notificationSettings.strategySignals}
              onChange={(checked) => handleSettingChange('strategySignals', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">组合更新</div>
              <div className="setting-description">投资组合变化通知</div>
            </div>
            <Switch 
              checked={notificationSettings.portfolioUpdates}
              onChange={(checked) => handleSettingChange('portfolioUpdates', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">风险警告</div>
              <div className="setting-description">风险指标异常时警告</div>
            </div>
            <Switch 
              checked={notificationSettings.riskWarnings}
              onChange={(checked) => handleSettingChange('riskWarnings', checked)}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 社交通知 */}
      <div className="settings-group">
        <div className="settings-group-title">社交通知</div>
        <div className="settings-group-description">
          社区互动相关的通知
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">新关注者</div>
              <div className="setting-description">有新用户关注您时通知</div>
            </div>
            <Switch 
              checked={notificationSettings.newFollowers}
              onChange={(checked) => handleSettingChange('newFollowers', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">点赞通知</div>
              <div className="setting-description">您的内容被点赞时通知</div>
            </div>
            <Switch 
              checked={notificationSettings.likes}
              onChange={(checked) => handleSettingChange('likes', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">评论通知</div>
              <div className="setting-description">有人评论您的内容时通知</div>
            </div>
            <Switch 
              checked={notificationSettings.comments}
              onChange={(checked) => handleSettingChange('comments', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">提及通知</div>
              <div className="setting-description">有人在内容中提及您时通知</div>
            </div>
            <Switch 
              checked={notificationSettings.mentions}
              onChange={(checked) => handleSettingChange('mentions', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">私信通知</div>
              <div className="setting-description">收到私信时通知</div>
            </div>
            <Switch 
              checked={notificationSettings.privateMessages}
              onChange={(checked) => handleSettingChange('privateMessages', checked)}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 内容通知 */}
      <div className="settings-group">
        <div className="settings-group-title">内容通知</div>
        <div className="settings-group-description">
          新内容和更新相关的通知
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">新策略发布</div>
              <div className="setting-description">有新策略发布时通知</div>
            </div>
            <Switch 
              checked={notificationSettings.newStrategies}
              onChange={(checked) => handleSettingChange('newStrategies', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">策略更新</div>
              <div className="setting-description">您关注的策略有更新时通知</div>
            </div>
            <Switch 
              checked={notificationSettings.strategyUpdates}
              onChange={(checked) => handleSettingChange('strategyUpdates', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">社区动态</div>
              <div className="setting-description">社区有新帖子时通知</div>
            </div>
            <Switch 
              checked={notificationSettings.communityPosts}
              onChange={(checked) => handleSettingChange('communityPosts', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">每周摘要</div>
              <div className="setting-description">每周发送平台动态摘要</div>
            </div>
            <Switch 
              checked={notificationSettings.weeklyDigest}
              onChange={(checked) => handleSettingChange('weeklyDigest', checked)}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 通知时间和频率 */}
      <div className="settings-group">
        <div className="settings-group-title">通知时间和频率</div>
        <div className="settings-group-description">
          控制通知的发送时间和频率
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <ClockCircleOutlined className="setting-icon" />
              <div>
                <div className="setting-title">免打扰时间</div>
                <div className="setting-description">在指定时间段内不接收通知</div>
              </div>
            </div>
            <Switch 
              checked={notificationSettings.quietHoursEnabled}
              onChange={(checked) => handleSettingChange('quietHoursEnabled', checked)}
            />
          </div>
          
          {notificationSettings.quietHoursEnabled && (
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">免打扰时间段</div>
                <div className="setting-description">设置免打扰的开始和结束时间</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <TimePicker 
                  value={notificationSettings.quietHoursStart}
                  onChange={(time) => handleSettingChange('quietHoursStart', time)}
                  format="HH:mm"
                  placeholder="开始时间"
                />
                <span>至</span>
                <TimePicker 
                  value={notificationSettings.quietHoursEnd}
                  onChange={(time) => handleSettingChange('quietHoursEnd', time)}
                  format="HH:mm"
                  placeholder="结束时间"
                />
              </div>
            </div>
          )}
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">邮件通知频率</div>
              <div className="setting-description">控制邮件通知的发送频率</div>
            </div>
            <Select 
              value={notificationSettings.emailFrequency}
              onChange={(value) => handleSettingChange('emailFrequency', value)}
              style={{ width: 120 }}
            >
              <Option value="immediate">立即发送</Option>
              <Option value="hourly">每小时汇总</Option>
              <Option value="daily">每日汇总</Option>
              <Option value="weekly">每周汇总</Option>
            </Select>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">摘要频率</div>
              <div className="setting-description">平台动态摘要的发送频率</div>
            </div>
            <Select 
              value={notificationSettings.digestFrequency}
              onChange={(value) => handleSettingChange('digestFrequency', value)}
              style={{ width: 120 }}
            >
              <Option value="daily">每日</Option>
              <Option value="weekly">每周</Option>
              <Option value="monthly">每月</Option>
            </Select>
          </div>
        </Card>
      </div>

      <Divider />

      {/* 声音和震动 */}
      <div className="settings-group">
        <div className="settings-group-title">声音和震动</div>
        <div className="settings-group-description">
          控制通知的声音和震动效果
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <SoundOutlined className="setting-icon" />
              <div>
                <div className="setting-title">通知声音</div>
                <div className="setting-description">接收通知时播放声音</div>
              </div>
            </div>
            <Switch 
              checked={notificationSettings.soundEnabled}
              onChange={(checked) => handleSettingChange('soundEnabled', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">震动提醒</div>
              <div className="setting-description">在移动设备上震动提醒</div>
            </div>
            <Switch 
              checked={notificationSettings.vibrationEnabled}
              onChange={(checked) => handleSettingChange('vibrationEnabled', checked)}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 通知历史 */}
      <div className="settings-group">
        <div className="settings-group-title">通知历史</div>
        <div className="settings-group-description">
          查看最近的通知记录
        </div>
        
        <Card className="settings-card">
          <List
            dataSource={notificationHistory}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<span style={{ fontSize: 20 }}>{getNotificationIcon(item.type)}</span>}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ opacity: item.read ? 0.7 : 1 }}>{item.title}</span>
                      {!item.read && <Tag color="red" size="small">未读</Tag>}
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>{item.content}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#999', fontSize: 12 }}>{item.time}</span>
                        <div>{getChannelTags(item.channel)}</div>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </div>

      {/* 保存按钮 */}
      <div className="settings-actions">
        <Button 
          type="primary" 
          size="large"
          loading={loading}
          onClick={handleSave}
        >
          保存通知设置
        </Button>
      </div>

      <style jsx>{`
        .settings-actions {
          margin-top: 32px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default NotificationSettings;