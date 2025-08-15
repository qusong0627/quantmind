import React, { useState } from 'react';
import { Button, Space, Modal, Form, Input, Select, InputNumber, message, Tooltip, Badge } from 'antd';
import { 
  PlusOutlined, 
  PlayCircleOutlined, 
  BarChartOutlined, 
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

const QuickActionsWidget = ({ isEditMode }) => {
  const navigate = useNavigate();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 快速操作配置
  const quickActions = [
    {
      key: 'new-strategy',
      title: '新建策略',
      icon: <PlusOutlined />,
      color: '#1890ff',
      description: '创建新的交易策略',
      action: () => navigate('/strategy-editor')
    },
    {
      key: 'run-backtest',
      title: '运行回测',
      icon: <PlayCircleOutlined />,
      color: '#52c41a',
      description: '对策略进行历史回测',
      action: () => showModal('backtest')
    },
    {
      key: 'market-analysis',
      title: '市场分析',
      icon: <BarChartOutlined />,
      color: '#722ed1',
      description: '查看市场分析报告',
      action: () => navigate('/market-analysis')
    },
    {
      key: 'stock-search',
      title: '股票搜索',
      icon: <SearchOutlined />,
      color: '#fa8c16',
      description: '搜索和分析股票',
      action: () => showModal('search')
    },
    {
      key: 'price-alert',
      title: '价格提醒',
      icon: <BellOutlined />,
      color: '#eb2f96',
      description: '设置股票价格提醒',
      action: () => showModal('alert'),
      badge: 3
    },
    {
      key: 'portfolio-settings',
      title: '组合设置',
      icon: <SettingOutlined />,
      color: '#13c2c2',
      description: '调整投资组合配置',
      action: () => navigate('/portfolio/settings')
    },
    {
      key: 'export-report',
      title: '导出报告',
      icon: <DownloadOutlined />,
      color: '#a0d911',
      description: '导出投资分析报告',
      action: () => showModal('export')
    },
    {
      key: 'sync-data',
      title: '同步数据',
      icon: <SyncOutlined />,
      color: '#fadb14',
      description: '同步最新市场数据',
      action: () => handleSyncData()
    }
  ];

  const showModal = (type) => {
    setModalType(type);
    setModalVisible(true);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (modalType) {
        case 'backtest':
          message.success('回测任务已提交，请在回测结果中查看进度');
          break;
        case 'search':
          navigate(`/search?q=${values.keyword}`);
          break;
        case 'alert':
          message.success('价格提醒设置成功');
          break;
        case 'export':
          message.success('报告导出任务已提交，完成后将通过邮件发送');
          break;
        default:
          message.success('操作完成');
      }
      
      setModalVisible(false);
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncData = async () => {
    setLoading(true);
    try {
      // 模拟数据同步
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('数据同步完成');
    } catch (error) {
      message.error('数据同步失败');
    } finally {
      setLoading(false);
    }
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'backtest':
        return (
          <Form form={form} layout="vertical">
            <Form.Item
              name="strategy"
              label="选择策略"
              rules={[{ required: true, message: '请选择策略' }]}
            >
              <Select placeholder="请选择要回测的策略">
                <Option value="strategy1">均线突破策略</Option>
                <Option value="strategy2">RSI反转策略</Option>
                <Option value="strategy3">多因子选股策略</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="startDate"
              label="开始日期"
              rules={[{ required: true, message: '请输入开始日期' }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="endDate"
              label="结束日期"
              rules={[{ required: true, message: '请输入结束日期' }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="initialCapital"
              label="初始资金"
              rules={[{ required: true, message: '请输入初始资金' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入初始资金"
                min={10000}
                max={10000000}
                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/¥\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Form>
        );
        
      case 'search':
        return (
          <Form form={form} layout="vertical">
            <Form.Item
              name="keyword"
              label="搜索关键词"
              rules={[{ required: true, message: '请输入搜索关键词' }]}
            >
              <Input placeholder="输入股票代码、名称或关键词" />
            </Form.Item>
            <Form.Item name="searchType" label="搜索类型" initialValue="all">
              <Select>
                <Option value="all">全部</Option>
                <Option value="stock">股票</Option>
                <Option value="fund">基金</Option>
                <Option value="bond">债券</Option>
              </Select>
            </Form.Item>
          </Form>
        );
        
      case 'alert':
        return (
          <Form form={form} layout="vertical">
            <Form.Item
              name="symbol"
              label="股票代码"
              rules={[{ required: true, message: '请输入股票代码' }]}
            >
              <Input placeholder="如：000001.SZ" />
            </Form.Item>
            <Form.Item
              name="alertType"
              label="提醒类型"
              rules={[{ required: true, message: '请选择提醒类型' }]}
            >
              <Select placeholder="请选择提醒类型">
                <Option value="price_above">价格高于</Option>
                <Option value="price_below">价格低于</Option>
                <Option value="change_above">涨幅超过</Option>
                <Option value="change_below">跌幅超过</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="threshold"
              label="阈值"
              rules={[{ required: true, message: '请输入阈值' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入阈值"
                min={0}
              />
            </Form.Item>
            <Form.Item name="note" label="备注">
              <TextArea rows={3} placeholder="可选的备注信息" />
            </Form.Item>
          </Form>
        );
        
      case 'export':
        return (
          <Form form={form} layout="vertical">
            <Form.Item
              name="reportType"
              label="报告类型"
              rules={[{ required: true, message: '请选择报告类型' }]}
            >
              <Select placeholder="请选择要导出的报告类型">
                <Option value="portfolio">投资组合报告</Option>
                <Option value="performance">业绩分析报告</Option>
                <Option value="risk">风险分析报告</Option>
                <Option value="transaction">交易记录报告</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="format"
              label="导出格式"
              rules={[{ required: true, message: '请选择导出格式' }]}
            >
              <Select placeholder="请选择导出格式">
                <Option value="pdf">PDF</Option>
                <Option value="excel">Excel</Option>
                <Option value="word">Word</Option>
              </Select>
            </Form.Item>
            <Form.Item name="email" label="邮箱地址">
              <Input placeholder="报告完成后发送到此邮箱（可选）" type="email" />
            </Form.Item>
          </Form>
        );
        
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    const titles = {
      'backtest': '快速回测',
      'search': '股票搜索',
      'alert': '设置价格提醒',
      'export': '导出报告'
    };
    return titles[modalType] || '快速操作';
  };

  return (
    <div className="widget-content">
      <div className="widget-header">
        <h4 className="widget-title">快速操作</h4>
      </div>
      
      <div className="widget-body" style={{ padding: '12px 0' }}>
        <div className="market-grid-center">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px'
          }}>
            {quickActions.map(action => (
              <Tooltip key={action.key} title={action.description} placement="top">
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px 8px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    cursor: isEditMode ? 'default' : 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#fff',
                    position: 'relative'
                  }}
                  className="quick-action-item"
                  onClick={() => !isEditMode && action.action()}
                  onMouseEnter={(e) => {
                    if (!isEditMode) {
                      e.currentTarget.style.borderColor = action.color;
                      e.currentTarget.style.boxShadow = `0 2px 8px ${action.color}20`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isEditMode) {
                      e.currentTarget.style.borderColor = '#f0f0f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {action.badge && (
                    <Badge 
                      count={action.badge} 
                      size="small"
                      style={{ 
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 1
                      }}
                    />
                  )}
                  
                  <div style={{
                    fontSize: '24px',
                    color: action.color,
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: `${action.color}10`
                  }}>
                    {action.icon}
                  </div>
                  
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    textAlign: 'center',
                    color: '#262626',
                    lineHeight: '1.2'
                  }}>
                    {action.title}
                  </div>
                </div>
              </Tooltip>
            ))}
          </div>
          
          {/* 最近操作 */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>最近操作</div>
            <Space size="small" wrap>
              <Button size="small" type="text" icon={<FileTextOutlined />}>
                策略回测报告.pdf
              </Button>
              <Button size="small" type="text" icon={<ShareAltOutlined />}>
                分享投资组合
              </Button>
              <Button size="small" type="text" icon={<BellOutlined />}>
                平安银行价格提醒
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* 操作弹窗 */}
      <Modal
        title={getModalTitle()}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={500}
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
};

export default QuickActionsWidget;