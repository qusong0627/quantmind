import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Space, Tag, Statistic, Progress, Tabs, Input, Select, DatePicker, Modal, Form, Upload, message } from 'antd';
import {
  DatabaseOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  SyncOutlined,
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import './DataManagement.css';

const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const DataManagement = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stock-data');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();

  // 模拟股票数据
  const [stockData] = useState([
    {
      key: '1',
      symbol: '000001.SZ',
      name: '平安银行',
      market: '深交所',
      dataType: '日线数据',
      startDate: '2020-01-01',
      endDate: '2024-01-15',
      records: 1024,
      size: '2.5MB',
      lastUpdate: '2024-01-15 09:30:00',
      status: 'active'
    },
    {
      key: '2',
      symbol: '600036.SH',
      name: '招商银行',
      market: '上交所',
      dataType: '日线数据',
      startDate: '2020-01-01',
      endDate: '2024-01-15',
      records: 1024,
      size: '2.8MB',
      lastUpdate: '2024-01-15 09:30:00',
      status: 'active'
    },
    {
      key: '3',
      symbol: '000858.SZ',
      name: '五粮液',
      market: '深交所',
      dataType: '分钟数据',
      startDate: '2024-01-01',
      endDate: '2024-01-15',
      records: 15360,
      size: '12.3MB',
      lastUpdate: '2024-01-15 15:00:00',
      status: 'syncing'
    }
  ]);

  // 模拟数据源配置
  const [dataSources] = useState([
    {
      key: '1',
      name: 'Tushare',
      type: 'API',
      status: 'connected',
      lastSync: '2024-01-15 09:30:00',
      description: '专业的金融数据接口'
    },
    {
      key: '2',
      name: '同花顺',
      type: 'API',
      status: 'connected',
      lastSync: '2024-01-15 09:25:00',
      description: '实时行情数据源'
    },
    {
      key: '3',
      name: '通用数据源',
      type: 'API',
      status: 'error',
      lastSync: '2024-01-14 16:30:00',
      description: '免费行情数据源'
    }
  ]);

  // 股票数据表格列配置
  const stockColumns = [
    {
      title: '股票代码',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120,
      render: (text) => <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{text}</span>
    },
    {
      title: '股票名称',
      dataIndex: 'name',
      key: 'name',
      width: 120
    },
    {
      title: '市场',
      dataIndex: 'market',
      key: 'market',
      width: 80,
      render: (text) => (
        <Tag color={text === '上交所' ? 'red' : 'green'}>{text}</Tag>
      )
    },
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 100
    },
    {
      title: '数据范围',
      key: 'dateRange',
      width: 200,
      render: (_, record) => `${record.startDate} ~ ${record.endDate}`
    },
    {
      title: '记录数',
      dataIndex: 'records',
      key: 'records',
      width: 100,
      render: (text) => text.toLocaleString()
    },
    {
      title: '数据大小',
      dataIndex: 'size',
      key: 'size',
      width: 100
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
      width: 150
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          active: { color: 'green', text: '正常' },
          syncing: { color: 'blue', text: '同步中' },
          error: { color: 'red', text: '错误' }
        };
        const config = statusConfig[status] || statusConfig.active;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>
            查看
          </Button>
          <Button type="link" size="small" icon={<SyncOutlined />}>
            同步
          </Button>
          <Button type="link" size="small" icon={<DeleteOutlined />} danger>
            删除
          </Button>
        </Space>
      )
    }
  ];

  // 数据源表格列配置
  const dataSourceColumns = [
    {
      title: '数据源名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (text) => <Tag>{text}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          connected: { color: 'green', text: '已连接' },
          disconnected: { color: 'orange', text: '未连接' },
          error: { color: 'red', text: '连接错误' }
        };
        const config = statusConfig[status] || statusConfig.disconnected;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '最后同步',
      dataIndex: 'lastSync',
      key: 'lastSync',
      width: 150
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<SettingOutlined />}>
            配置
          </Button>
          <Button type="link" size="small" icon={<SyncOutlined />}>
            测试连接
          </Button>
          <Button type="link" size="small" icon={<DeleteOutlined />} danger>
            删除
          </Button>
        </Space>
      )
    }
  ];

  // 处理批量操作
  const handleBatchOperation = (operation) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的数据');
      return;
    }
    
    Modal.confirm({
      title: `确认${operation}`,
      content: `确定要${operation}选中的 ${selectedRowKeys.length} 条数据吗？`,
      onOk: () => {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setSelectedRowKeys([]);
          message.success(`${operation}成功`);
        }, 2000);
      }
    });
  };

  // 处理数据上传
  const handleUpload = (values) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setUploadModalVisible(false);
      form.resetFields();
      message.success('数据上传成功');
    }, 2000);
  };

  // 处理数据同步
  const handleSync = (values) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSyncModalVisible(false);
      message.success('数据同步任务已启动');
    }, 1000);
  };

  return (
    <div className="data-management-container">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">
              <DatabaseOutlined /> 数据管理
            </h1>
            <p className="page-description">管理和维护量化交易所需的各类数据</p>
          </div>
          <div className="header-right">
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                导入数据
              </Button>
              <Button 
                icon={<SyncOutlined />}
                onClick={() => setSyncModalVisible(true)}
              >
                数据同步
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* 数据概览卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="股票数据"
              value={stockData.length}
              suffix="只"
              prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总记录数"
              value={stockData.reduce((sum, item) => sum + item.records, 0)}
              suffix="条"
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="数据大小"
              value={17.6}
              suffix="MB"
              prefix={<CloudDownloadOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="数据源"
              value={dataSources.length}
              suffix="个"
              prefix={<SyncOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <Card className="main-content-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="股票数据" key="stock-data">
            <div className="table-toolbar">
              <div className="toolbar-left">
                <Space>
                  <Search
                    placeholder="搜索股票代码或名称"
                    style={{ width: 250 }}
                    prefix={<SearchOutlined />}
                  />
                  <Select placeholder="选择市场" style={{ width: 120 }}>
                    <Option value="all">全部市场</Option>
                    <Option value="sh">上交所</Option>
                    <Option value="sz">深交所</Option>
                  </Select>
                  <Select placeholder="数据类型" style={{ width: 120 }}>
                    <Option value="all">全部类型</Option>
                    <Option value="daily">日线数据</Option>
                    <Option value="minute">分钟数据</Option>
                  </Select>
                  <Button icon={<FilterOutlined />}>筛选</Button>
                </Space>
              </div>
              <div className="toolbar-right">
                <Space>
                  <Button 
                    icon={<SyncOutlined />}
                    onClick={() => handleBatchOperation('同步')}
                    disabled={selectedRowKeys.length === 0}
                  >
                    批量同步
                  </Button>
                  <Button 
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleBatchOperation('删除')}
                    disabled={selectedRowKeys.length === 0}
                  >
                    批量删除
                  </Button>
                  <Button icon={<ReloadOutlined />}>刷新</Button>
                </Space>
              </div>
            </div>
            
            <Table
              columns={stockColumns}
              dataSource={stockData}
              loading={loading}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              pagination={{
                total: stockData.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }}
              scroll={{ x: 1200 }}
            />
          </TabPane>

          <TabPane tab="数据源管理" key="data-sources">
            <div className="table-toolbar">
              <div className="toolbar-left">
                <Space>
                  <Search
                    placeholder="搜索数据源名称"
                    style={{ width: 250 }}
                    prefix={<SearchOutlined />}
                  />
                  <Select placeholder="选择状态" style={{ width: 120 }}>
                    <Option value="all">全部状态</Option>
                    <Option value="connected">已连接</Option>
                    <Option value="disconnected">未连接</Option>
                    <Option value="error">连接错误</Option>
                  </Select>
                </Space>
              </div>
              <div className="toolbar-right">
                <Space>
                  <Button type="primary" icon={<PlusOutlined />}>
                    添加数据源
                  </Button>
                  <Button icon={<ReloadOutlined />}>刷新</Button>
                </Space>
              </div>
            </div>
            
            <Table
              columns={dataSourceColumns}
              dataSource={dataSources}
              loading={loading}
              pagination={{
                total: dataSources.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }}
            />
          </TabPane>

          <TabPane tab="数据质量" key="data-quality">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="数据完整性检查" size="small">
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>平安银行 (000001.SZ)</span>
                      <span>98.5%</span>
                    </div>
                    <Progress percent={98.5} status="active" />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>招商银行 (600036.SH)</span>
                      <span>99.2%</span>
                    </div>
                    <Progress percent={99.2} status="active" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>五粮液 (000858.SZ)</span>
                      <span>95.8%</span>
                    </div>
                    <Progress percent={95.8} status="active" />
                  </div>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="数据更新状态" size="small">
                  <div style={{ marginBottom: 16 }}>
                    <Tag color="green">实时更新</Tag>
                    <span style={{ marginLeft: 8 }}>2 个数据源</span>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Tag color="orange">延迟更新</Tag>
                    <span style={{ marginLeft: 8 }}>0 个数据源</span>
                  </div>
                  <div>
                    <Tag color="red">更新异常</Tag>
                    <span style={{ marginLeft: 8 }}>1 个数据源</span>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* 数据上传模态框 */}
      <Modal
        title="导入数据"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item
            name="dataType"
            label="数据类型"
            rules={[{ required: true, message: '请选择数据类型' }]}
          >
            <Select placeholder="请选择数据类型">
              <Option value="stock">股票数据</Option>
              <Option value="index">指数数据</Option>
              <Option value="fund">基金数据</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="file"
            label="数据文件"
            rules={[{ required: true, message: '请上传数据文件' }]}
          >
            <Upload.Dragger
              name="file"
              multiple={false}
              accept=".csv,.xlsx,.json"
              beforeUpload={() => false}
            >
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 CSV、Excel、JSON 格式文件
              </p>
            </Upload.Dragger>
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setUploadModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                开始导入
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 数据同步模态框 */}
      <Modal
        title="数据同步"
        open={syncModalVisible}
        onCancel={() => setSyncModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form layout="vertical" onFinish={handleSync}>
          <Form.Item
            name="dataSource"
            label="数据源"
            rules={[{ required: true, message: '请选择数据源' }]}
          >
            <Select placeholder="请选择数据源">
              <Option value="tushare">Tushare</Option>
              <Option value="tonghuashun">同花顺</Option>
              <Option value="general">通用数据源</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="symbols"
            label="股票代码"
            rules={[{ required: true, message: '请输入股票代码' }]}
          >
            <Input.TextArea
              placeholder="请输入股票代码，多个代码用逗号分隔\n例如：000001.SZ,600036.SH"
              rows={4}
            />
          </Form.Item>
          
          <Form.Item
            name="dateRange"
            label="时间范围"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setSyncModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                开始同步
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataManagement;