import React, { useState } from 'react';
import { Card, Row, Col, Avatar, Button, Tabs, Table, Tag, Statistic, Form, Input, App } from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  TrophyOutlined,
  LineChartOutlined,
  BookOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const { TabPane } = Tabs;
const { TextArea } = Input;

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const navigate = useNavigate();

  // 模拟用户数据
  const userInfo = {
    name: '量化交易者',
    email: 'trader@quantmind.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    level: '高级交易员',
    joinDate: '2023-06-15',
    bio: '专注于量化交易策略开发，擅长机器学习和技术分析相结合的策略设计。',
    stats: {
      totalReturn: 28.5,
      strategies: 12,
      followers: 156,
      following: 89
    }
  };

  // 模拟策略数据
  const myStrategies = [
    {
      key: '1',
      name: '双均线策略',
      status: '运行中',
      return: 15.67,
      createTime: '2024-01-15',
      lastUpdate: '2024-01-20'
    },
    {
      key: '2',
      name: 'RSI反转策略',
      status: '已停止',
      return: -3.24,
      createTime: '2024-01-10',
      lastUpdate: '2024-01-18'
    },
    {
      key: '3',
      name: 'MACD趋势策略',
      status: '回测中',
      return: 8.91,
      createTime: '2024-01-08',
      lastUpdate: '2024-01-19'
    }
  ];

  const strategyColumns = [
    {
      title: '策略名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          '运行中': 'green',
          '已停止': 'red',
          '回测中': 'blue'
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      }
    },
    {
      title: '收益率',
      dataIndex: 'return',
      key: 'return',
      render: (value) => (
        <span className={value >= 0 ? 'positive-return' : 'negative-return'}>
          {value >= 0 ? '+' : ''}{value}%
        </span>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div className="action-buttons">
          <Button size="small">查看</Button>
          <Button size="small">编辑</Button>
          <Button size="small" danger>删除</Button>
        </div>
      ),
    },
  ];

  const handleEdit = () => {
    setEditing(true);
    form.setFieldsValue({
      name: userInfo.name,
      email: userInfo.email,
      bio: userInfo.bio
    });
  };

  const handleSave = async (values) => {
    try {
      // 这里应该调用API保存用户信息
      console.log('保存用户信息:', values);
      message.success('个人信息更新成功');
      setEditing(false);
    } catch (error) {
      message.error('更新失败，请重试');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    form.resetFields();
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <Card className="user-info-card">
          <div className="user-basic-info">
            <Avatar size={80} src={userInfo.avatar} icon={<UserOutlined />} />
            <div className="user-details">
              <div className="user-name-section">
                <h2>{userInfo.name}</h2>
                <Tag color="blue">{userInfo.level}</Tag>
                <div className="user-actions">
                  {!editing && (
                    <Button 
                      type="text" 
                      icon={<EditOutlined />} 
                      onClick={handleEdit}
                      className="edit-btn"
                    >
                      编辑
                    </Button>
                  )}
                  <Button 
                    type="text" 
                    icon={<SettingOutlined />} 
                    onClick={() => navigate('/settings')}
                    className="settings-btn"
                  >
                    设置
                  </Button>
                </div>
              </div>
              <p className="user-email">{userInfo.email}</p>
              <p className="join-date">加入时间：{userInfo.joinDate}</p>
              {!editing ? (
                <p className="user-bio">{userInfo.bio}</p>
              ) : (
                <Form form={form} onFinish={handleSave} className="edit-form">
                  <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                    <Input placeholder="姓名" />
                  </Form.Item>
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
                    <Input placeholder="邮箱" />
                  </Form.Item>
                  <Form.Item name="bio">
                    <TextArea rows={3} placeholder="个人简介" />
                  </Form.Item>
                  <div className="form-actions">
                    <Button type="primary" htmlType="submit">保存</Button>
                    <Button onClick={handleCancel}>取消</Button>
                  </div>
                </Form>
              )}
            </div>
          </div>

          <div className="user-stats">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="总收益率"
                  value={userInfo.stats.totalReturn}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="策略数量"
                  value={userInfo.stats.strategies}
                  prefix={<BookOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="粉丝"
                  value={userInfo.stats.followers}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="关注"
                  value={userInfo.stats.following}
                />
              </Col>
            </Row>
          </div>
        </Card>
      </div>

      <div className="profile-content">
        <Card className="content-card">
          <Tabs defaultActiveKey="strategies">
            <TabPane 
              tab={
                <span>
                  <LineChartOutlined />
                  我的策略
                </span>
              } 
              key="strategies"
            >
              <Table
                columns={strategyColumns}
                dataSource={myStrategies}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                }}
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <TrophyOutlined />
                  交易记录
                </span>
              } 
              key="trades"
            >
              <div className="coming-soon">
                <TrophyOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <p>交易记录功能即将上线</p>
              </div>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <SettingOutlined />
                  账户设置
                </span>
              } 
              key="settings"
            >
              <div className="settings-section">
                <h3>通知设置</h3>
                <div className="setting-item">
                  <span>策略运行通知</span>
                  <Button size="small">开启</Button>
                </div>
                <div className="setting-item">
                  <span>收益报告</span>
                  <Button size="small">开启</Button>
                </div>
                
                <h3>安全设置</h3>
                <div className="setting-item">
                  <span>修改密码</span>
                  <Button size="small">修改</Button>
                </div>
                <div className="setting-item">
                  <span>两步验证</span>
                  <Button size="small">设置</Button>
                </div>
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Profile;