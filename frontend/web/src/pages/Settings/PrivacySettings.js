import React, { useState } from 'react';
import { Form, Switch, Card, Select, Radio, Button, Modal, message, Divider, Alert, List } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, GlobalOutlined, LockOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

const PrivacySettings = ({ onSettingsChange, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // 隐私设置状态
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public', // public, friends, private
    strategyVisibility: 'public',
    tradingRecordsVisibility: 'private',
    contactInfoVisibility: 'friends',
    activityVisibility: 'public',
    searchable: true,
    allowMessages: true,
    allowFollows: true,
    showOnlineStatus: true,
    dataCollection: true,
    marketingEmails: false,
    analyticsTracking: true,
    thirdPartySharing: false
  });

  // 数据使用记录
  const [dataUsageLog] = useState([
    {
      id: '1',
      action: '策略浏览记录',
      description: '记录您浏览的策略以提供个性化推荐',
      lastUpdated: '2024-01-15 14:30:00',
      dataType: '行为数据'
    },
    {
      id: '2',
      action: '交易偏好分析',
      description: '分析您的交易偏好以优化策略推荐',
      lastUpdated: '2024-01-15 10:15:00',
      dataType: '偏好数据'
    },
    {
      id: '3',
      action: '设备信息收集',
      description: '收集设备信息以提供更好的用户体验',
      lastUpdated: '2024-01-14 16:45:00',
      dataType: '技术数据'
    }
  ]);

  // 处理设置变化
  const handleSettingChange = (key, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
    onSettingsChange && onSettingsChange();
  };

  // 保存隐私设置
  const handleSave = async () => {
    setLoading(true);
    try {
      // 这里应该调用API保存隐私设置
      console.log('保存隐私设置:', privacySettings);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      
      message.success('隐私设置保存成功');
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除账户
  const handleDeleteAccount = () => {
    Modal.confirm({
      title: '确认删除账户？',
      content: (
        <div>
          <Alert
            message="警告：此操作不可撤销"
            description="删除账户后，您的所有数据将被永久删除，包括策略、交易记录、关注关系等。请确认您真的要删除账户。"
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <p>如果您确定要删除账户，请在下方输入框中输入 "DELETE" 来确认：</p>
        </div>
      ),
      icon: <ExclamationCircleOutlined />,
      okType: 'danger',
      okText: '确认删除',
      cancelText: '取消',
      width: 500,
      onOk: async () => {
        try {
          // 这里应该调用API删除账户
          await new Promise(resolve => setTimeout(resolve, 1000));
          message.success('账户删除请求已提交，我们会在24小时内处理');
        } catch (error) {
          message.error('删除失败，请重试');
        }
      }
    });
  };

  // 清除数据
  const handleClearData = (dataType) => {
    Modal.confirm({
      title: `确认清除${dataType}？`,
      content: `清除后，相关的个性化功能可能会受到影响。`,
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          // 这里应该调用API清除数据
          await new Promise(resolve => setTimeout(resolve, 500));
          message.success(`${dataType}已清除`);
        } catch (error) {
          message.error('清除失败，请重试');
        }
      }
    });
  };

  const visibilityOptions = [
    { label: '公开', value: 'public', icon: <GlobalOutlined /> },
    { label: '仅关注者', value: 'friends', icon: <EyeOutlined /> },
    { label: '私密', value: 'private', icon: <LockOutlined /> }
  ];

  return (
    <div className="privacy-settings">
      {/* 个人资料可见性 */}
      <div className="settings-group">
        <div className="settings-group-title">个人资料可见性</div>
        <div className="settings-group-description">
          控制其他用户可以看到您的哪些信息
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">个人资料</div>
              <div className="setting-description">控制谁可以查看您的基本信息</div>
            </div>
            <Select 
              value={privacySettings.profileVisibility}
              onChange={(value) => handleSettingChange('profileVisibility', value)}
              style={{ width: 120 }}
            >
              {visibilityOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">策略列表</div>
              <div className="setting-description">控制谁可以查看您创建的策略</div>
            </div>
            <Select 
              value={privacySettings.strategyVisibility}
              onChange={(value) => handleSettingChange('strategyVisibility', value)}
              style={{ width: 120 }}
            >
              {visibilityOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">交易记录</div>
              <div className="setting-description">控制谁可以查看您的交易记录</div>
            </div>
            <Select 
              value={privacySettings.tradingRecordsVisibility}
              onChange={(value) => handleSettingChange('tradingRecordsVisibility', value)}
              style={{ width: 120 }}
            >
              {visibilityOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">联系信息</div>
              <div className="setting-description">控制谁可以查看您的邮箱和电话</div>
            </div>
            <Select 
              value={privacySettings.contactInfoVisibility}
              onChange={(value) => handleSettingChange('contactInfoVisibility', value)}
              style={{ width: 120 }}
            >
              {visibilityOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">活动动态</div>
              <div className="setting-description">控制谁可以看到您的点赞、评论等活动</div>
            </div>
            <Select 
              value={privacySettings.activityVisibility}
              onChange={(value) => handleSettingChange('activityVisibility', value)}
              style={{ width: 120 }}
            >
              {visibilityOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Option>
              ))}
            </Select>
          </div>
        </Card>
      </div>

      <Divider />

      {/* 互动设置 */}
      <div className="settings-group">
        <div className="settings-group-title">互动设置</div>
        <div className="settings-group-description">
          控制其他用户如何与您互动
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">允许搜索</div>
              <div className="setting-description">允许其他用户通过搜索找到您</div>
            </div>
            <Switch 
              checked={privacySettings.searchable}
              onChange={(checked) => handleSettingChange('searchable', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">允许私信</div>
              <div className="setting-description">允许其他用户向您发送私信</div>
            </div>
            <Switch 
              checked={privacySettings.allowMessages}
              onChange={(checked) => handleSettingChange('allowMessages', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">允许关注</div>
              <div className="setting-description">允许其他用户关注您</div>
            </div>
            <Switch 
              checked={privacySettings.allowFollows}
              onChange={(checked) => handleSettingChange('allowFollows', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">显示在线状态</div>
              <div className="setting-description">让其他用户看到您是否在线</div>
            </div>
            <Switch 
              checked={privacySettings.showOnlineStatus}
              onChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 数据使用设置 */}
      <div className="settings-group">
        <div className="settings-group-title">数据使用设置</div>
        <div className="settings-group-description">
          控制我们如何使用您的数据来改善服务
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">数据收集</div>
              <div className="setting-description">允许收集使用数据以改善产品体验</div>
            </div>
            <Switch 
              checked={privacySettings.dataCollection}
              onChange={(checked) => handleSettingChange('dataCollection', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">营销邮件</div>
              <div className="setting-description">接收产品更新和营销信息</div>
            </div>
            <Switch 
              checked={privacySettings.marketingEmails}
              onChange={(checked) => handleSettingChange('marketingEmails', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">分析追踪</div>
              <div className="setting-description">允许分析您的使用行为以优化功能</div>
            </div>
            <Switch 
              checked={privacySettings.analyticsTracking}
              onChange={(checked) => handleSettingChange('analyticsTracking', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">第三方数据共享</div>
              <div className="setting-description">允许与合作伙伴共享匿名数据</div>
            </div>
            <Switch 
              checked={privacySettings.thirdPartySharing}
              onChange={(checked) => handleSettingChange('thirdPartySharing', checked)}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 数据管理 */}
      <div className="settings-group">
        <div className="settings-group-title">数据管理</div>
        <div className="settings-group-description">
          查看和管理我们收集的您的数据
        </div>
        
        <Card className="settings-card">
          <div style={{ marginBottom: 16 }}>
            <Alert
              message="数据透明度"
              description="我们致力于保护您的隐私。您可以随时查看、下载或删除我们收集的数据。"
              type="info"
              showIcon
            />
          </div>
          
          <List
            dataSource={dataUsageLog}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    type="link"
                    onClick={() => handleClearData(item.action)}
                  >
                    清除数据
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={item.action}
                  description={
                    <div>
                      <div>{item.description}</div>
                      <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                        数据类型: {item.dataType} | 最后更新: {item.lastUpdated}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
          
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button type="primary" ghost>
              下载我的数据
            </Button>
          </div>
        </Card>
      </div>

      <Divider />

      {/* 危险区域 */}
      <div className="settings-group">
        <div className="settings-group-title danger-zone-title">危险区域</div>
        <div className="settings-group-description">
          这些操作是不可逆的，请谨慎操作
        </div>
        
        <Card className="settings-card danger-zone">
          <div className="setting-item">
            <div className="setting-info">
              <DeleteOutlined className="setting-icon danger" />
              <div>
                <div className="setting-title danger">删除账户</div>
                <div className="setting-description">
                  永久删除您的账户和所有相关数据。此操作不可撤销。
                </div>
              </div>
            </div>
            <Button 
              danger 
              onClick={handleDeleteAccount}
            >
              删除账户
            </Button>
          </div>
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
          保存隐私设置
        </Button>
      </div>

      <style jsx>{`
        .danger-zone-title {
          color: #ff4d4f !important;
        }
        
        .danger-zone {
          border-color: #ff4d4f;
        }
        
        .setting-icon.danger {
          color: #ff4d4f;
        }
        
        .setting-title.danger {
          color: #ff4d4f;
        }
        
        .settings-actions {
          margin-top: 32px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default PrivacySettings;