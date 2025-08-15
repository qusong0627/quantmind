import React, { useState } from 'react';
import { Form, Input, Button, Card, Divider, Checkbox, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axios.post('/api/v1/auth/register', {
        username: values.username,
        email: values.email,
        password: values.password,
      });
      
      message.success('注册成功！请登录您的账户');
      navigate('/login');
    } catch (error) {
      console.error('注册失败:', error);
      message.error(error.response?.data?.detail || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-overlay"></div>
        <div className="auth-content">
          <div className="auth-left">
            <div className="auth-brand">
              <h1 className="brand-title">QuantMind</h1>
              <p className="brand-subtitle">智能量化投资平台</p>
            </div>
            <div className="auth-features">
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <div className="feature-text">
                  <h3>零门槛入门</h3>
                  <p>无需编程基础，拖拽即可创建策略</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔬</div>
                <div className="feature-text">
                  <h3>科学回测</h3>
                  <p>真实市场数据，精准模拟交易环境</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🤝</div>
                <div className="feature-text">
                  <h3>策略社区</h3>
                  <p>与投资者交流，分享成功策略</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="auth-right">
            <Card className="auth-card">
              <div className="auth-header">
                <h2 className="auth-title">创建账户</h2>
                <p className="auth-description">加入QuantMind，开启智能投资之旅</p>
              </div>
              
              <Form
                name="register"
                onFinish={onFinish}
                autoComplete="off"
                size="large"
                layout="vertical"
              >
                <Form.Item
                  name="username"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, message: '用户名至少3个字符' },
                    { max: 20, message: '用户名最多20个字符' },
                    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名"
                    className="auth-input"
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="邮箱地址"
                    className="auth-input"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少6个字符' },
                    { max: 50, message: '密码最多50个字符' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    className="auth-input"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="确认密码"
                    className="auth-input"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item
                  name="agreement"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                        value ? Promise.resolve() : Promise.reject(new Error('请同意用户协议和隐私政策')),
                    },
                  ]}
                >
                  <Checkbox>
                    我已阅读并同意
                    <a href="#" style={{ color: '#667eea', marginLeft: 4 }}>
                      《用户协议》
                    </a>
                    和
                    <a href="#" style={{ color: '#667eea', marginLeft: 4 }}>
                      《隐私政策》
                    </a>
                  </Checkbox>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="auth-button"
                    block
                  >
                    {loading ? '注册中...' : '立即注册'}
                  </Button>
                </Form.Item>
              </Form>

              <Divider plain>
                <span className="divider-text">已有账户？</span>
              </Divider>

              <div className="auth-footer">
                <Link to="/login">
                  <Button type="link" className="link-button">
                    立即登录
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;