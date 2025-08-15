import React, { useState } from 'react';
import { Form, Input, Button, Switch, Card, List, Tag, Modal, message, Space, Divider, Alert } from 'antd';
import { LockOutlined, SafetyOutlined, MobileOutlined, MailOutlined, KeyOutlined, ExclamationCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import moment from 'moment';

const SecuritySettings = ({ onSettingsChange, onSave }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotificationEnabled, setEmailNotificationEnabled] = useState(true);
  const [smsNotificationEnabled, setSmsNotificationEnabled] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // 模拟登录会话数据
  const [loginSessions] = useState([
    {
      id: '1',
      device: 'Chrome on Windows',
      location: '上海, 中国',
      ip: '192.168.1.100',
      lastActive: '2024-01-15 14:30:00',
      current: true
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: '上海, 中国',
      ip: '192.168.1.101',
      lastActive: '2024-01-15 10:15:00',
      current: false
    },
    {
      id: '3',
      device: 'Chrome on MacOS',
      location: '北京, 中国',
      ip: '10.0.0.50',
      lastActive: '2024-01-14 16:45:00',
      current: false
    }
  ]);

  // 模拟API密钥数据
  const [apiKeys] = useState([
    {
      id: '1',
      name: '交易机器人API',
      key: 'ak_1234567890abcdef',
      permissions: ['读取', '交易'],
      created: '2024-01-10',
      lastUsed: '2024-01-15 09:30:00'
    },
    {
      id: '2',
      name: '数据分析API',
      key: 'ak_abcdef1234567890',
      permissions: ['读取'],
      created: '2024-01-05',
      lastUsed: '2024-01-14 15:20:00'
    }
  ]);

  // 处理设置变化
  const handleSettingsChange = () => {
    onSettingsChange && onSettingsChange();
  };

  // 修改密码
  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      // 这里应该调用API修改密码
      console.log('修改密码:', values);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      
      message.success('密码修改成功');
      setShowPasswordModal(false);
      form.resetFields();
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      message.error('密码修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 切换双因素认证
  const handleTwoFactorToggle = (checked) => {
    if (checked) {
      setShowTwoFactorModal(true);
    } else {
      Modal.confirm({
        title: '确认关闭双因素认证？',
        content: '关闭双因素认证会降低您账户的安全性，确定要继续吗？',
        icon: <ExclamationCircleOutlined />,
        onOk: async () => {
          try {
            // 这里应该调用API关闭双因素认证
            await new Promise(resolve => setTimeout(resolve, 500));
            setTwoFactorEnabled(false);
            handleSettingsChange();
            message.success('双因素认证已关闭');
          } catch (error) {
            message.error('操作失败，请重试');
          }
        }
      });
    }
  };

  // 启用双因素认证
  const handleEnableTwoFactor = async (values) => {
    setLoading(true);
    try {
      // 这里应该调用API启用双因素认证
      console.log('启用双因素认证:', values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTwoFactorEnabled(true);
      setShowTwoFactorModal(false);
      handleSettingsChange();
      message.success('双因素认证已启用');
    } catch (error) {
      message.error('启用失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 终止会话
  const handleTerminateSession = (sessionId) => {
    Modal.confirm({
      title: '确认终止会话？',
      content: '终止会话后，该设备将需要重新登录。',
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          // 这里应该调用API终止会话
          await new Promise(resolve => setTimeout(resolve, 500));
          message.success('会话已终止');
        } catch (error) {
          message.error('操作失败，请重试');
        }
      }
    });
  };

  // 删除API密钥
  const handleDeleteApiKey = (keyId) => {
    Modal.confirm({
      title: '确认删除API密钥？',
      content: '删除后，使用此密钥的应用将无法访问您的账户。此操作不可撤销。',
      icon: <ExclamationCircleOutlined />,
      okType: 'danger',
      onOk: async () => {
        try {
          // 这里应该调用API删除密钥
          await new Promise(resolve => setTimeout(resolve, 500));
          message.success('API密钥已删除');
        } catch (error) {
          message.error('删除失败，请重试');
        }
      }
    });
  };

  return (
    <div className="security-settings">
      {/* 密码安全 */}
      <div className="settings-group">
        <div className="settings-group-title">密码安全</div>
        <div className="settings-group-description">
          定期更新密码可以提高账户安全性
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <LockOutlined className="setting-icon" />
              <div>
                <div className="setting-title">登录密码</div>
                <div className="setting-description">上次修改时间：2024-01-01</div>
              </div>
            </div>
            <Button onClick={() => setShowPasswordModal(true)}>修改密码</Button>
          </div>
        </Card>
      </div>

      <Divider />

      {/* 双因素认证 */}
      <div className="settings-group">
        <div className="settings-group-title">双因素认证</div>
        <div className="settings-group-description">
          启用双因素认证可以大大提高账户安全性
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <SafetyOutlined className="setting-icon" />
              <div>
                <div className="setting-title">双因素认证 (2FA)</div>
                <div className="setting-description">
                  {twoFactorEnabled ? '已启用 - 您的账户受到额外保护' : '未启用 - 建议启用以提高安全性'}
                </div>
              </div>
            </div>
            <Switch 
              checked={twoFactorEnabled} 
              onChange={handleTwoFactorToggle}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 通知设置 */}
      <div className="settings-group">
        <div className="settings-group-title">安全通知</div>
        <div className="settings-group-description">
          当检测到可疑活动时，我们会通过以下方式通知您
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <MailOutlined className="setting-icon" />
              <div>
                <div className="setting-title">邮件通知</div>
                <div className="setting-description">通过邮件接收安全警报</div>
              </div>
            </div>
            <Switch 
              checked={emailNotificationEnabled} 
              onChange={(checked) => {
                setEmailNotificationEnabled(checked);
                handleSettingsChange();
              }}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <MobileOutlined className="setting-icon" />
              <div>
                <div className="setting-title">短信通知</div>
                <div className="setting-description">通过短信接收安全警报</div>
              </div>
            </div>
            <Switch 
              checked={smsNotificationEnabled} 
              onChange={(checked) => {
                setSmsNotificationEnabled(checked);
                handleSettingsChange();
              }}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 登录会话 */}
      <div className="settings-group">
        <div className="settings-group-title">登录会话</div>
        <div className="settings-group-description">
          管理您在不同设备上的登录会话
        </div>
        
        <Card className="settings-card">
          <List
            dataSource={loginSessions}
            renderItem={(session) => (
              <List.Item
                actions={[
                  session.current ? (
                    <Tag color="green">当前会话</Tag>
                  ) : (
                    <Button 
                      type="link" 
                      danger
                      onClick={() => handleTerminateSession(session.id)}
                    >
                      终止会话
                    </Button>
                  )
                ]}
              >
                <List.Item.Meta
                  title={session.device}
                  description={
                    <div>
                      <div>位置: {session.location}</div>
                      <div>IP: {session.ip}</div>
                      <div>最后活动: {session.lastActive}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </div>

      <Divider />

      {/* API密钥管理 */}
      <div className="settings-group">
        <div className="settings-group-title">API密钥管理</div>
        <div className="settings-group-description">
          管理用于程序化访问的API密钥
        </div>
        
        <Card className="settings-card">
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<KeyOutlined />}>
              创建新密钥
            </Button>
          </div>
          
          <List
            dataSource={apiKeys}
            renderItem={(apiKey) => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteApiKey(apiKey.id)}
                  >
                    删除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={apiKey.name}
                  description={
                    <div>
                      <div>密钥: {apiKey.key}***</div>
                      <div>权限: {apiKey.permissions.map(p => <Tag key={p}>{p}</Tag>)}</div>
                      <div>创建时间: {apiKey.created}</div>
                      <div>最后使用: {apiKey.lastUsed}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </div>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={showPasswordModal}
        onCancel={() => setShowPasswordModal(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Alert
            message="密码安全提示"
            description="新密码应包含至少8个字符，包括大小写字母、数字和特殊字符。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[
              { required: true, message: '请输入当前密码' }
            ]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码长度至少8个字符' },
              { 
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
                message: '密码必须包含大小写字母、数字和特殊字符' 
              }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              })
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认修改
              </Button>
              <Button onClick={() => setShowPasswordModal(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 启用双因素认证弹窗 */}
      <Modal
        title="启用双因素认证"
        open={showTwoFactorModal}
        onCancel={() => setShowTwoFactorModal(false)}
        footer={null}
        width={500}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Alert
            message="设置双因素认证"
            description="请使用Google Authenticator或类似应用扫描下方二维码，然后输入6位验证码。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          {/* 这里应该显示二维码 */}
          <div style={{ 
            width: 200, 
            height: 200, 
            border: '1px dashed #d9d9d9', 
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            二维码占位符
          </div>
          
          <Form onFinish={handleEnableTwoFactor}>
            <Form.Item
              name="verificationCode"
              rules={[
                { required: true, message: '请输入验证码' },
                { len: 6, message: '验证码为6位数字' }
              ]}
            >
              <Input 
                placeholder="请输入6位验证码" 
                maxLength={6}
                style={{ textAlign: 'center', fontSize: 18 }}
              />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  启用双因素认证
                </Button>
                <Button onClick={() => setShowTwoFactorModal(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default SecuritySettings;