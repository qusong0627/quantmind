import React, { useState } from 'react';
import { Card, Button, Space, Modal, message, Form, Input, Select } from 'antd';
import { 
  PlusOutlined, 
  BarChartOutlined, 
  SearchOutlined, 
  BellOutlined,
  SettingOutlined,
  ExportOutlined,
  SyncOutlined,
  RobotOutlined
} from '@ant-design/icons';

const { Option } = Select;

const QuickActionsWidget = ({ isEditMode }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [form] = Form.useForm();

  // 快速操作配置
  const quickActions = [
    {
      id: 'new-strategy',
      title: '新建策略',
      icon: <PlusOutlined />,
      color: '#1890ff',
      description: '创建新的交易策略'
    },
    {
      id: 'run-backtest',
      title: '运行回测',
      icon: <BarChartOutlined />,
      color: '#52c41a',
      description: '对策略进行历史回测'
    },
    {
      id: 'stock-search',
      title: '股票搜索',
      icon: <SearchOutlined />,
      color: '#722ed1',
      description: '搜索和分析股票'
    },
    {
      id: 'price-alert',
      title: '价格提醒',
      icon: <BellOutlined />,
      color: '#fa8c16',
      description: '设置股票价格提醒'
    },
    {
      id: 'ai-analysis',
      title: 'AI分析',
      icon: <RobotOutlined />,
      color: '#eb2f96',
      description: 'AI智能市场分析'
    },
    {
      id: 'export-data',
      title: '导出数据',
      icon: <ExportOutlined />,
      color: '#13c2c2',
      description: '导出交易和策略数据'
    }
  ];

  // 处理快速操作点击
  const handleActionClick = (action) => {
    if (isEditMode) return;
    
    setCurrentAction(action);
    
    switch (action.id) {
      case 'new-strategy':
        message.info('跳转到策略创建页面...');
        // 这里可以添加路由跳转逻辑
        break;
      case 'run-backtest':
        message.info('跳转到回测页面...');
        break;
      case 'stock-search':
        setModalVisible(true);
        break;
      case 'price-alert':
        setModalVisible(true);
        break;
      case 'ai-analysis':
        message.info('启动AI分析...');
        break;
      case 'export-data':
        handleExportData();
        break;
      default:
        message.info(`执行操作: ${action.title}`);
    }
  };

  // 处理数据导出
  const handleExportData = () => {
    message.loading('正在导出数据...', 2);
    setTimeout(() => {
      message.success('数据导出完成');
    }, 2000);
  };

  // 处理股票搜索
  const handleStockSearch = (values) => {
    message.success(`搜索股票: ${values.keyword}`);
    setModalVisible(false);
    form.resetFields();
  };

  // 处理价格提醒设置
  const handlePriceAlert = (values) => {
    message.success(`已设置 ${values.stock} 的价格提醒`);
    setModalVisible(false);
    form.resetFields();
  };

  // 处理弹窗确认
  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (currentAction?.id === 'stock-search') {
        handleStockSearch(values);
      } else if (currentAction?.id === 'price-alert') {
        handlePriceAlert(values);
      }
    });
  };

  // 渲染弹窗内容
  const renderModalContent = () => {
    if (!currentAction) return null;
    
    switch (currentAction.id) {
      case 'stock-search':
        return (
          <Form form={form} layout="vertical">
            <Form.Item
              name="keyword"
              label="搜索关键词"
              rules={[{ required: true, message: '请输入股票代码或名称' }]}
            >
              <Input placeholder="输入股票代码或名称" />
            </Form.Item>
            <Form.Item name="market" label="市场" initialValue="all">
              <Select>
                <Option value="all">全部市场</Option>
                <Option value="sh">上海证券交易所</Option>
                <Option value="sz">深圳证券交易所</Option>
                <Option value="bj">北京证券交易所</Option>
              </Select>
            </Form.Item>
          </Form>
        );
      case 'price-alert':
        return (
          <Form form={form} layout="vertical">
            <Form.Item
              name="stock"
              label="股票代码"
              rules={[{ required: true, message: '请输入股票代码' }]}
            >
              <Input placeholder="如: 000001" />
            </Form.Item>
            <Form.Item
              name="alertType"
              label="提醒类型"
              rules={[{ required: true, message: '请选择提醒类型' }]}
            >
              <Select placeholder="选择提醒类型">
                <Option value="above">价格高于</Option>
                <Option value="below">价格低于</Option>
                <Option value="change">涨跌幅超过</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="threshold"
              label="阈值"
              rules={[{ required: true, message: '请输入阈值' }]}
            >
              <Input placeholder="输入价格或百分比" />
            </Form.Item>
          </Form>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      title="快速操作"
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px 20px', height: 'calc(100% - 57px)', overflow: 'auto' }}
    >
      {isEditMode ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: '#8c8c8c',
          fontSize: '14px'
        }}>
          快速操作组件 - 编辑模式
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '8px',
          height: '100%'
        }}>
          {quickActions.map(action => (
            <Button
              key={action.id}
              type="text"
              onClick={() => handleActionClick(action)}
              style={{
                height: 'auto',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #f0f0f0',
                borderRadius: '6px',
                background: '#fafafa',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = action.color;
                e.target.style.color = 'white';
                e.target.style.borderColor = action.color;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fafafa';
                e.target.style.color = 'rgba(0, 0, 0, 0.85)';
                e.target.style.borderColor = '#f0f0f0';
              }}
            >
              <div style={{ 
                fontSize: '18px', 
                marginBottom: '4px',
                color: action.color
              }}>
                {action.icon}
              </div>
              <div style={{ 
                fontSize: '11px', 
                textAlign: 'center',
                lineHeight: '1.2',
                fontWeight: '500'
              }}>
                {action.title}
              </div>
            </Button>
          ))}
        </div>
      )}

      {/* 操作弹窗 */}
      <Modal
        title={currentAction?.title}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={400}
      >
        {renderModalContent()}
      </Modal>
    </Card>
  );
};

export default QuickActionsWidget;