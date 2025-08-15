import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Spin, message, Progress, Tooltip, Tabs } from 'antd';
import { ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, BankOutlined, FundOutlined, PieChartOutlined, LineChartOutlined, BarChartOutlined } from '@ant-design/icons';

const FundOverviewWidget = ({ isEditMode, lastUpdateTime }) => {
  const [loading, setLoading] = useState(false);
  const [fundData, setFundData] = useState({
    totalAssets: 1000000.00,
    availableFunds: 250000.00,
    marketValue: 750000.00,
    todayPnL: 5000.00,
    todayPnLPercent: 0.67,
    totalPnL: 150000.00,
    totalPnLPercent: 17.65,
    positionCount: 8,
    riskLevel: 'medium',
    // 新增字段
    frozenFunds: 15000.00,
    marginUsed: 50000.00,
    cashFlow: {
      inflow: 25000.00,
      outflow: 18000.00
    },
    assetAllocation: {
      stocks: 60,
      bonds: 20,
      funds: 15,
      cash: 5
    },
    monthlyReturn: [
      { month: '1月', return: 2.5 },
      { month: '2月', return: -1.2 },
      { month: '3月', return: 3.8 },
      { month: '4月', return: 1.5 },
      { month: '5月', return: -0.8 },
      { month: '6月', return: 2.1 }
    ]
  });

  // 模拟获取资金数据（暂停大盘API调用）
  const refreshData = async () => {
    if (isEditMode) return;
    
    setLoading(true);
    try {
      // 暂停大盘API调用，使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟
      
      // 模拟资金数据更新
      const mockFundData = {
        totalAssets: 1000000.00 + (Math.random() - 0.5) * 10000,
        availableFunds: 250000.00 + (Math.random() - 0.5) * 5000,
        marketValue: 750000.00 + (Math.random() - 0.5) * 8000,
        todayPnL: (Math.random() - 0.5) * 10000,
        todayPnLPercent: (Math.random() - 0.5) * 2,
        totalPnL: 150000.00 + (Math.random() - 0.5) * 20000,
        totalPnLPercent: 17.65 + (Math.random() - 0.5) * 5,
        positionCount: Math.floor(Math.random() * 5) + 6,
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        // 新增字段的模拟数据
        frozenFunds: 15000.00 + (Math.random() - 0.5) * 2000,
        marginUsed: 50000.00 + (Math.random() - 0.5) * 5000,
        cashFlow: {
          inflow: 25000.00 + (Math.random() - 0.5) * 3000,
          outflow: 18000.00 + (Math.random() - 0.5) * 2000
        },
        assetAllocation: {
          stocks: 60 + Math.floor((Math.random() - 0.5) * 10),
          bonds: 20 + Math.floor((Math.random() - 0.5) * 6),
          funds: 15 + Math.floor((Math.random() - 0.5) * 4),
          cash: 5 + Math.floor((Math.random() - 0.5) * 3)
        },
        monthlyReturn: fundData.monthlyReturn.map(item => ({
          ...item,
          return: item.return + (Math.random() - 0.5) * 0.5
        }))
      };
      
      setFundData(mockFundData);
      message.success('资金数据已更新（模拟数据）');
      
    } catch (error) {
      console.error('获取资金数据失败:', error);
      message.error(`资金数据更新失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 组件初始化时加载数据
  useEffect(() => {
    if (!isEditMode) {
      refreshData();
    }
  }, []);

  // 自动刷新 - 降低频率到30秒
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(() => {
        refreshData();
      }, 30000); // 30秒刷新一次
      
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshData();
    }
  }, [lastUpdateTime, isEditMode]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercent = (percent) => {
    const isPositive = percent >= 0;
    const color = isPositive ? '#52c41a' : '#ff4d4f';
    const icon = isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
    
    return (
      <span style={{ color }}>
        {icon} {Math.abs(percent).toFixed(2)}%
      </span>
    );
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low': return '#52c41a';
      case 'medium': return '#faad14';
      case 'high': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  };

  const getRiskLevelText = (level) => {
    switch (level) {
      case 'low': return '低风险';
      case 'medium': return '中风险';
      case 'high': return '高风险';
      default: return '未知';
    }
  };

  const getAssetAllocationColor = (type) => {
    switch (type) {
      case 'stocks': return '#1890ff';
      case 'bonds': return '#52c41a';
      case 'funds': return '#faad14';
      case 'cash': return '#8c8c8c';
      default: return '#d9d9d9';
    }
  };

  const getAssetAllocationName = (type) => {
    switch (type) {
      case 'stocks': return '股票';
      case 'bonds': return '债券';
      case 'funds': return '基金';
      case 'cash': return '现金';
      default: return '其他';
    }
  };

  const getCashFlowNet = () => {
    return fundData.cashFlow.inflow - fundData.cashFlow.outflow;
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <BankOutlined /> 概览
        </span>
      ),
      children: (
        <Row gutter={[8, 8]}>
          {/* 总资产 */}
          <Col span={8}>
            <div style={{ 
              padding: '8px',
              background: '#f0f9ff',
              borderRadius: '4px',
              border: '1px solid #91d5ff'
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#1890ff', 
                marginBottom: '4px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <BankOutlined /> 总资产
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#262626',
                marginBottom: '4px'
              }}>
                {formatCurrency(fundData.totalAssets)}
              </div>
              <div style={{ fontSize: '11px' }}>
                {formatPercent(fundData.totalPnLPercent)}
              </div>
            </div>
          </Col>
          
          {/* 可用资金 */}
          <Col span={8}>
            <div style={{ 
              padding: '8px',
              background: '#f6ffed',
              borderRadius: '4px',
              border: '1px solid #b7eb8f'
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#389e0d', 
                marginBottom: '4px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <DollarOutlined /> 可用资金
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#262626',
                marginBottom: '4px'
              }}>
                {formatCurrency(fundData.availableFunds)}
              </div>
              <div style={{ fontSize: '11px', color: '#389e0d' }}>
                可投资金额
              </div>
            </div>
          </Col>
          
          {/* 持仓市值 */}
          <Col span={8}>
            <div style={{ 
              padding: '8px',
              background: '#fff7e6',
              borderRadius: '4px',
              border: '1px solid #ffd591'
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#d48806', 
                marginBottom: '4px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <FundOutlined /> 持仓市值
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#262626',
                marginBottom: '4px'
              }}>
                {formatCurrency(fundData.marketValue)}
              </div>
              <div style={{ fontSize: '11px', color: '#d48806' }}>
                {fundData.positionCount} 个持仓
              </div>
            </div>
          </Col>
          
          {/* 今日盈亏 */}
          <Col span={12}>
            <div style={{ 
              padding: '8px',
              background: fundData.todayPnL >= 0 ? '#f6ffed' : '#fff2f0',
              borderRadius: '4px',
              border: `1px solid ${fundData.todayPnL >= 0 ? '#b7eb8f' : '#ffccc7'}`
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: fundData.todayPnL >= 0 ? '#389e0d' : '#cf1322', 
                marginBottom: '4px',
                fontWeight: '500'
              }}>
                今日盈亏
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: fundData.todayPnL >= 0 ? '#389e0d' : '#cf1322',
                marginBottom: '4px'
              }}>
                {formatCurrency(fundData.todayPnL)}
              </div>
              <div style={{ fontSize: '11px' }}>
                {formatPercent(fundData.todayPnLPercent)}
              </div>
            </div>
          </Col>
          
          {/* 风险等级 */}
          <Col span={12}>
            <div style={{ 
              padding: '8px',
              background: '#fafafa',
              borderRadius: '4px',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#8c8c8c', 
                marginBottom: '4px',
                fontWeight: '500'
              }}>
                风险等级
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: getRiskLevelColor(fundData.riskLevel),
                marginBottom: '4px'
              }}>
                {getRiskLevelText(fundData.riskLevel)}
              </div>
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                投资风险评估
              </div>
            </div>
          </Col>
        </Row>
      )
    },
    {
      key: 'allocation',
      label: (
        <span>
          <PieChartOutlined /> 资产配置
        </span>
      ),
      children: (
        <div>
          <Row gutter={[8, 8]}>
            {Object.entries(fundData.assetAllocation).map(([type, percentage]) => (
              <Col span={12} key={type}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {getAssetAllocationName(type)}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>
                      {percentage}%
                    </span>
                  </div>
                  <Progress 
                    percent={percentage} 
                    strokeColor={getAssetAllocationColor(type)}
                    size="small"
                    showInfo={false}
                  />
                </div>
              </Col>
            ))}
          </Row>
          
          {/* 资产配置统计 */}
          <div style={{ 
            marginTop: '12px', 
            padding: '8px',
            background: '#f0f9ff',
            border: '1px solid #91d5ff',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#1890ff'
          }}>
            📊 配置分析: 股票占比 {fundData.assetAllocation.stocks}% | 债券 {fundData.assetAllocation.bonds}% | 基金 {fundData.assetAllocation.funds}% | 现金 {fundData.assetAllocation.cash}%
          </div>
        </div>
      )
    },
    {
      key: 'cashflow',
      label: (
        <span>
          <BarChartOutlined /> 现金流
        </span>
      ),
      children: (
        <div>
          <Row gutter={[8, 8]}>
            {/* 资金流入 */}
            <Col span={8}>
              <div style={{ 
                padding: '8px',
                background: '#f6ffed',
                borderRadius: '4px',
                border: '1px solid #b7eb8f',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#389e0d', marginBottom: '4px' }}>
                  资金流入
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#389e0d' }}>
                  {formatCurrency(fundData.cashFlow.inflow)}
                </div>
              </div>
            </Col>
            
            {/* 资金流出 */}
            <Col span={8}>
              <div style={{ 
                padding: '8px',
                background: '#fff2f0',
                borderRadius: '4px',
                border: '1px solid #ffccc7',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#cf1322', marginBottom: '4px' }}>
                  资金流出
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#cf1322' }}>
                  {formatCurrency(fundData.cashFlow.outflow)}
                </div>
              </div>
            </Col>
            
            {/* 净流入 */}
            <Col span={8}>
              <div style={{ 
                padding: '8px',
                background: getCashFlowNet() >= 0 ? '#f6ffed' : '#fff2f0',
                borderRadius: '4px',
                border: `1px solid ${getCashFlowNet() >= 0 ? '#b7eb8f' : '#ffccc7'}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: getCashFlowNet() >= 0 ? '#389e0d' : '#cf1322', marginBottom: '4px' }}>
                  净流入
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: getCashFlowNet() >= 0 ? '#389e0d' : '#cf1322' }}>
                  {formatCurrency(getCashFlowNet())}
                </div>
              </div>
            </Col>
          </Row>
          
          {/* 其他资金信息 */}
          <Row gutter={[8, 8]} style={{ marginTop: '8px' }}>
            <Col span={12}>
              <div style={{ 
                padding: '8px',
                background: '#fff7e6',
                borderRadius: '4px',
                border: '1px solid #ffd591'
              }}>
                <div style={{ fontSize: '12px', color: '#d48806', marginBottom: '4px' }}>
                  冻结资金
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#262626' }}>
                  {formatCurrency(fundData.frozenFunds)}
                </div>
              </div>
            </Col>
            
            <Col span={12}>
              <div style={{ 
                padding: '8px',
                background: '#f0f9ff',
                borderRadius: '4px',
                border: '1px solid #91d5ff'
              }}>
                <div style={{ fontSize: '12px', color: '#1890ff', marginBottom: '4px' }}>
                  保证金占用
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#262626' }}>
                  {formatCurrency(fundData.marginUsed)}
                </div>
              </div>
            </Col>
          </Row>
          
          {/* 现金流统计 */}
          <div style={{ 
            marginTop: '12px', 
            padding: '8px',
            background: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#d48806'
          }}>
            💰 现金流分析: 本期净流入 {formatCurrency(getCashFlowNet())} | 冻结资金 {formatCurrency(fundData.frozenFunds)} | 保证金占用 {formatCurrency(fundData.marginUsed)}
          </div>
        </div>
      )
    }
  ];

  return (
    <Card
      title="资金概览"
      size="small"
      extra={
        !isEditMode && (
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={refreshData}
            loading={loading}
            size="small"
          />
        )
      }
      style={{ height: '100%' }}
      styles={{ body: { padding: '12px 16px', height: 'calc(100% - 57px)', overflow: 'auto' } }}
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
          资金概览组件 - 编辑模式
        </div>
      ) : (
        <Spin spinning={loading}>
          <Tabs 
            defaultActiveKey="overview" 
            size="small"
            items={tabItems}
            style={{ height: '100%' }}
          />
          
          {/* 全局提示信息 */}
          <div style={{ 
            marginTop: '8px', 
            padding: '6px 8px',
            background: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#d48806',
            textAlign: 'center'
          }}>
            ⚠️ 模拟数据模式 - 每30秒自动更新 | 资金使用率: {((fundData.marketValue / fundData.totalAssets) * 100).toFixed(1)}%
          </div>
        </Spin>
      )}
    </Card>
  );
};

export default FundOverviewWidget;