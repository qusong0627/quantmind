import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, Avatar, Select, DatePicker, message, Divider, Space } from 'antd';
import { UserOutlined, CameraOutlined, SaveOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

const AccountSettings = ({ onSettingsChange, onSave }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // 模拟用户数据
  const [userInfo, setUserInfo] = useState({
    username: 'quanttrader',
    email: 'trader@quantmind.com',
    nickname: '量化交易者',
    real_name: '张三',
    phone: '13800138000',
    bio: '专注于量化交易策略开发，擅长机器学习和技术分析相结合的策略设计。',
    location: '上海',
    website: 'https://github.com/quanttrader',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    trading_experience: '高级',
    risk_preference: '积极',
    investment_style: '量化交易',
    birthday: '1990-01-01'
  });

  useEffect(() => {
    // 初始化表单数据
    form.setFieldsValue({
      ...userInfo,
      birthday: userInfo.birthday ? moment(userInfo.birthday) : null
    });
    setAvatarUrl(userInfo.avatar_url);
  }, [form, userInfo]);

  // 处理表单值变化
  const handleValuesChange = () => {
    onSettingsChange && onSettingsChange();
  };

  // 处理头像上传
  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    if (info.file.status === 'done') {
      // 获取上传结果
      const url = info.file.response?.url || URL.createObjectURL(info.file.originFileObj);
      setAvatarUrl(url);
      setUploading(false);
      onSettingsChange && onSettingsChange();
      message.success('头像上传成功');
    }
    if (info.file.status === 'error') {
      setUploading(false);
      message.error('头像上传失败');
    }
  };

  // 头像上传前的检查
  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!');
      return false;
    }
    return true;
  };

  // 保存账户信息
  const handleSave = async (values) => {
    setLoading(true);
    try {
      // 处理生日字段
      const formData = {
        ...values,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
        avatar_url: avatarUrl
      };
      
      // 这里应该调用API保存用户信息
      console.log('保存账户信息:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      
      setUserInfo({ ...userInfo, ...formData });
      message.success('账户信息保存成功');
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-settings">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        onValuesChange={handleValuesChange}
        className="settings-form"
      >
        {/* 头像设置 */}
        <div className="settings-group">
          <div className="settings-group-title">头像设置</div>
          <div className="settings-group-description">
            上传您的个人头像，支持 JPG、PNG 格式，文件大小不超过 2MB
          </div>
          
          <div className="avatar-upload-section">
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              action="/api/v1/upload/avatar" // 这里应该是实际的上传接口
              beforeUpload={beforeUpload}
              onChange={handleAvatarChange}
            >
              {avatarUrl ? (
                <Avatar src={avatarUrl} size={80} />
              ) : (
                <div>
                  <CameraOutlined style={{ fontSize: 24, color: '#999' }} />
                  <div style={{ marginTop: 8, color: '#999' }}>上传头像</div>
                </div>
              )}
            </Upload>
            {uploading && <div className="upload-loading">上传中...</div>}
          </div>
        </div>

        <Divider />

        {/* 基础信息 */}
        <div className="settings-group">
          <div className="settings-group-title">基础信息</div>
          <div className="settings-group-description">
            这些信息将显示在您的个人资料中，部分信息可能对其他用户可见
          </div>
          
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 20, message: '用户名长度为3-20个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
            ]}
          >
            <Input placeholder="请输入用户名" disabled />
          </Form.Item>

          <Form.Item
            label="邮箱地址"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>

          <Form.Item
            label="昵称"
            name="nickname"
            rules={[
              { max: 50, message: '昵称不能超过50个字符' }
            ]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item
            label="真实姓名"
            name="real_name"
            rules={[
              { max: 20, message: '姓名不能超过20个字符' }
            ]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            label="手机号码"
            name="phone"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
            ]}
          >
            <Input placeholder="请输入手机号码" />
          </Form.Item>

          <Form.Item
            label="生日"
            name="birthday"
          >
            <DatePicker 
              placeholder="请选择生日" 
              style={{ width: '100%' }}
              disabledDate={(current) => current && current > moment().endOf('day')}
            />
          </Form.Item>
        </div>

        <Divider />

        {/* 个人简介 */}
        <div className="settings-group">
          <div className="settings-group-title">个人简介</div>
          <div className="settings-group-description">
            简单介绍一下您自己，让其他用户更好地了解您
          </div>
          
          <Form.Item
            label="个人简介"
            name="bio"
            rules={[
              { max: 500, message: '个人简介不能超过500个字符' }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder="请输入个人简介" 
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="所在地区"
            name="location"
            rules={[
              { max: 100, message: '地区不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入所在地区" />
          </Form.Item>

          <Form.Item
            label="个人网站"
            name="website"
            rules={[
              { type: 'url', message: '请输入有效的网址' }
            ]}
          >
            <Input placeholder="请输入个人网站地址" />
          </Form.Item>
        </div>

        <Divider />

        {/* 交易偏好 */}
        <div className="settings-group">
          <div className="settings-group-title">交易偏好</div>
          <div className="settings-group-description">
            这些信息有助于为您提供更个性化的策略推荐
          </div>
          
          <Form.Item
            label="交易经验"
            name="trading_experience"
            rules={[
              { required: true, message: '请选择交易经验' }
            ]}
          >
            <Select placeholder="请选择交易经验">
              <Option value="新手">新手 - 刚开始接触交易</Option>
              <Option value="初级">初级 - 有一定基础知识</Option>
              <Option value="中级">中级 - 有实际交易经验</Option>
              <Option value="高级">高级 - 经验丰富的交易者</Option>
              <Option value="专家">专家 - 专业交易人士</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="风险偏好"
            name="risk_preference"
            rules={[
              { required: true, message: '请选择风险偏好' }
            ]}
          >
            <Select placeholder="请选择风险偏好">
              <Option value="保守">保守 - 追求稳定收益</Option>
              <Option value="稳健">稳健 - 平衡风险与收益</Option>
              <Option value="积极">积极 - 追求较高收益</Option>
              <Option value="激进">激进 - 愿意承担高风险</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="投资风格"
            name="investment_style"
          >
            <Select placeholder="请选择投资风格">
              <Option value="价值投资">价值投资</Option>
              <Option value="技术分析">技术分析</Option>
              <Option value="量化交易">量化交易</Option>
              <Option value="趋势跟踪">趋势跟踪</Option>
              <Option value="套利交易">套利交易</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
        </div>

        {/* 保存按钮 */}
        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
              size="large"
            >
              保存账户信息
            </Button>
            <Button 
              onClick={() => form.resetFields()}
              size="large"
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <style jsx>{`
        .avatar-upload-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 16px 0;
        }
        
        .avatar-uploader {
          display: inline-block;
        }
        
        .avatar-uploader .ant-upload {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 2px dashed #d9d9d9;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.3s;
        }
        
        .avatar-uploader .ant-upload:hover {
          border-color: #1890ff;
        }
        
        .upload-loading {
          color: #1890ff;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default AccountSettings;