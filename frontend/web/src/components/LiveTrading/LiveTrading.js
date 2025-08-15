import React, { useState } from 'react';
import { Card, Button, Row, Col, Typography, Space, Tag, Modal, message, Divider } from 'antd';
import {
  CloudOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  CheckOutlined,
  StarOutlined,
  SafetyOutlined,
  RocketOutlined,
  TeamOutlined,
  DollarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import './LiveTrading.css';

const { Title, Paragraph, Text } = Typography;

const LiveTrading = () => {
  const [downloadModal, setDownloadModal] = useState({ visible: false, type: '', title: '' });
  const [downloading, setDownloading] = useState({ cloud: false, qtm: false });

  const handleDownload = (type, title) => {
    setDownloadModal({ visible: true, type, title });
  };

  const confirmDownload = async () => {
    const { type } = downloadModal;
    setDownloading({ ...downloading, [type]: true });
    
    setTimeout(() => {
      setDownloading({ ...downloading, [type]: false });
      setDownloadModal({ visible: false, type: '', title: '' });
      message.success(`${downloadModal.title}下载已开始`);
    }, 2000);
  };

  const products = [
    {
      id: 'cloud',
      title: '云端智能版',
      subtitle: '基于AI的智能交易系统',
      icon: <CloudOutlined />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      tag: { text: '推荐新手', color: '#52c41a' },
      price: '免费使用',
      features: [
        { text: '零门槛开通', icon: <CheckOutlined /> },
        { text: '无资金限制', icon: <CheckOutlined /> },
        { text: '支持多券商', icon: <CheckOutlined /> },
        { text: '智能风控', icon: <CheckOutlined /> },
        { text: '云端部署', icon: <CheckOutlined /> }
      ],
      highlights: ['适合新手', '操作简单', '风险可控'],
      userTypes: ['个人投资者', '量化初学者', '小资金用户']
    },
    {
      id: 'qtm',
      title: 'QTM专业版',
      subtitle: '高频量化交易系统',
      icon: <ThunderboltOutlined />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      tag: { text: '专业版', color: '#fa8c16' },
      price: '专业定制',
      features: [
        { text: '毫秒级执行', icon: <CheckOutlined /> },
        { text: '高频交易', icon: <CheckOutlined /> },
        { text: '直连券商', icon: <CheckOutlined /> },
        { text: '极低延迟', icon: <CheckOutlined /> },
        { text: '专业支持', icon: <CheckOutlined /> }
      ],
      highlights: ['执行极快', '稳定可靠', '专业级'],
      userTypes: ['专业投资者', '机构用户', '高频交易者']
    }
  ];

  return (
    <div className="live-trading-container">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <Title level={1} className="main-title">
            实盘交易系统
          </Title>
          <Paragraph className="main-subtitle">
            选择适合您的量化交易解决方案，开启智能投资之旅
          </Paragraph>
        </div>
      </div>

      {/* 产品卡片 */}
      <div className="products-section">
        <Row gutter={[32, 32]} justify="center">
          {products.map((product) => (
            <Col key={product.id} xs={24} lg={12} xl={10}>
              <Card className="product-card" hoverable>
                {/* 卡片头部 */}
                <div className="card-header" style={{ background: product.gradient }}>
                  <div className="header-icon">
                    {product.icon}
                  </div>
                  <div className="header-info">
                    <Title level={3} className="product-title">
                      {product.title}
                    </Title>
                    <Text className="product-subtitle">
                      {product.subtitle}
                    </Text>
                  </div>
                  <Tag 
                    className="product-tag" 
                    style={{ backgroundColor: product.tag.color, border: 'none' }}
                  >
                    {product.tag.text}
                  </Tag>
                </div>

                {/* 价格信息 */}
                <div className="price-section">
                  <DollarOutlined className="price-icon" />
                  <Text className="price-text">{product.price}</Text>
                </div>

                {/* 产品特性 */}
                <div className="features-section">
                  <Title level={5} className="section-title">
                    <StarOutlined /> 核心特性
                  </Title>
                  <div className="features-grid">
                    {product.features.map((feature, index) => (
                      <div key={index} className="feature-item">
                        <span className="feature-icon">{feature.icon}</span>
                        <span className="feature-text">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 产品亮点 */}
                <div className="highlights-section">
                  <div className="highlights-list">
                    {product.highlights.map((highlight, index) => (
                      <Tag key={index} className="highlight-tag">
                        {highlight}
                      </Tag>
                    ))}
                  </div>
                </div>

                {/* 适用人群 */}
                <div className="users-section">
                  <Title level={5} className="section-title">
                    <TeamOutlined /> 适用人群
                  </Title>
                  <div className="user-tags">
                    {product.userTypes.map((userType, index) => (
                      <Tag key={index} className="user-tag">
                        {userType}
                      </Tag>
                    ))}
                  </div>
                </div>

                {/* 下载按钮 */}
                <div className="card-footer">
                  <Button
                    type="primary"
                    size="large"
                    icon={<DownloadOutlined />}
                    loading={downloading[product.id]}
                    onClick={() => handleDownload(product.id, product.title)}
                    className={`download-btn ${product.id}-btn`}
                    block
                  >
                    立即下载
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 对比说明 */}
      <div className="comparison-section">
        <Card className="comparison-card">
          <div className="comparison-header">
            <SafetyOutlined className="comparison-icon" />
            <Title level={3} className="comparison-title">
              版本对比与选择建议
            </Title>
          </div>
          
          <Row gutter={[32, 24]}>
            <Col xs={24} md={12}>
              <div className="comparison-item cloud-comparison">
                <div className="comparison-header-mini">
                  <CloudOutlined className="mini-icon" />
                  <Title level={4}>云端智能版</Title>
                </div>
                <div className="comparison-content">
                  <div className="pros-cons">
                    <div className="pros">
                      <Text strong className="pros-title">✅ 优势</Text>
                      <ul>
                        <li>零门槛，即开即用</li>
                        <li>智能风控保护</li>
                        <li>多券商支持</li>
                        <li>适合策略验证</li>
                      </ul>
                    </div>
                    <div className="suitable">
                      <Text strong className="suitable-title">🎯 适合场景</Text>
                      <p>量化交易入门、策略测试、小资金投资</p>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col xs={24} md={12}>
              <div className="comparison-item qtm-comparison">
                <div className="comparison-header-mini">
                  <ThunderboltOutlined className="mini-icon" />
                  <Title level={4}>QTM专业版</Title>
                </div>
                <div className="comparison-content">
                  <div className="pros-cons">
                    <div className="pros">
                      <Text strong className="pros-title">🚀 优势</Text>
                      <ul>
                        <li>毫秒级执行速度</li>
                        <li>支持高频策略</li>
                        <li>直连券商系统</li>
                        <li>专业技术支持</li>
                      </ul>
                    </div>
                    <div className="suitable">
                      <Text strong className="suitable-title">🎯 适合场景</Text>
                      <p>专业量化交易、高频策略、大资金运作</p>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* 下载确认弹窗 */}
      <Modal
        title={`下载 ${downloadModal.title}`}
        open={downloadModal.visible}
        onOk={confirmDownload}
        onCancel={() => setDownloadModal({ visible: false, type: '', title: '' })}
        okText="确认下载"
        cancelText="取消"
        confirmLoading={downloading[downloadModal.type]}
        className="download-modal"
      >
        <div className="modal-content">
          <div className="modal-icon">
            <DownloadOutlined />
          </div>
          <Paragraph className="modal-text">
            您即将下载 <Text strong>{downloadModal.title}</Text> 实盘交易系统。
          </Paragraph>
          <Paragraph className="modal-description">
            请确保您已了解该版本的特点和使用要求。
          </Paragraph>
          {downloadModal.type === 'qtm' && (
            <div className="modal-warning">
              <SafetyOutlined className="warning-icon" />
              <Text type="warning">
                注意：QTM版需要您的券商账户已开通QTM权限。
              </Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default LiveTrading;