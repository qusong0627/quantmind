import React, { useState } from 'react';
import { Form, Input, Button, Card, Divider, App } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/v1/auth/login', {
        username: values.username,
        password: values.password,
      });

      const { access_token, user_id, username, permissions } = response.data;
      
      // 构建用户信息对象
      const userInfo = {
        user_id,
        username,
        permissions
      };
      
      // 存储token和用户信息
      localStorage.setItem('token', access_token);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      message.success('登录成功！');
      navigate('/strategy/editor');
    } catch (error) {
      console.error('登录失败:', error);
      message.error(error.response?.data?.detail || '登录失败，请检查用户名和密码');
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
                <div className="feature-icon">🤖</div>
                <div className="feature-text">
                  <h3>AI策略生成</h3>
                  <p>自然语言描述，AI自动生成量化策略</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div className="feature-text">
                  <h3>专业回测</h3>
                  <p>高精度历史数据回测，全面风险评估</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🚀</div>
                <div className="feature-text">
                  <h3>一键实盘</h3>
                  <p>策略验证通过，一键部署实盘交易</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="auth-right">
            <Card className="auth-card">
              <div className="auth-header">
                <h2 className="auth-title">欢迎回来</h2>
                <p className="auth-description">登录您的QuantMind账户</p>
              </div>
              
              <Form
                name="login"
                onFinish={onFinish}
                autoComplete="off"
                size="large"
                layout="vertical"
              >
                <Form.Item
                  name="username"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, message: '用户名至少3个字符' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名"
                    className="auth-input"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少6个字符' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    className="auth-input"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="auth-button"
                    block
                  >
                    {loading ? '登录中...' : '登录'}
                  </Button>
                </Form.Item>
              </Form>

              <Divider plain>
                <span className="divider-text">还没有账户？</span>
              </Divider>

              <div className="auth-footer">
                <Link to="/register">
                  <Button type="link" className="link-button">
                    立即注册
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

export default Login;