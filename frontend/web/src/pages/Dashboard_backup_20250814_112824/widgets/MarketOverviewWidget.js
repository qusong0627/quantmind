import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Spin, message } from 'antd';
import { ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const MarketOverviewWidget = ({ isEditMode, lastUpdateTime }) => {
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState([]);
  const [overview, setOverview] = useState(null);

  // 获取最新的调度器数据
  const refreshData = async () => {
    if (isEditMode) return;
    
    setLoading(true);
    try {
      // 优先获取调度器最新数据（10秒频率采集）
      const schedulerResponse = await fetch('/api/v1/scheduler/latest');
      
      if (schedulerResponse.ok) {
        const schedulerResult = await schedulerResponse.json();
        
        if (schedulerResult.success && schedulerResult.data && schedulerResult.data.length > 0) {
          // 使用调度器数据
          const formattedData = schedulerResult.data.map(item => ({
            name: item.name,
            code: item.symbol,
            price: parseFloat(item.current_price) || 0,
            change: parseFloat(item.change_points) || 0,
            changePercent: parseFloat(item.change_percent) || 0
          }));
          
          setMarketData(formattedData);
          
          // 设置概览数据
          setOverview({
            totalIndices: formattedData.length,
            upCount: formattedData.filter(item => item.change > 0).length,
            downCount: formattedData.filter(item => item.change < 0).length,
            flatCount: formattedData.filter(item => item.change === 0).length
          });
          
          message.success('市场数据已更新（来自10秒定时采集）');
          return;
        }
      }
      
      // 如果调度器数据不可用，回退到直接API调用
      const symbols = 'sh000001,sz399001,sz399006,sh000300,sh000016,sz399905';
      const response = await fetch(`/api/v1/market/indices?symbols=${symbols}`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          const formattedData = [];
          
          // 按顺序添加主要指数
          const indexOrder = [
            { name: '上证指数', code: 'sh000001' },
            { name: '深证成指', code: 'sz399001' },
            { name: '创业板指', code: 'sz399006' },
            { name: '沪深300', code: 'sh000300' },
            { name: '上证50', code: 'sh000016' },
            { name: '中证500', code: 'sz399905' }
          ];
          
          indexOrder.forEach(({ name, code }) => {
            const indexData = result.data[code];
            if (indexData) {
              formattedData.push({
                name: name,
                code: code,
                price: parseFloat(indexData.currentPrice) || 0,
                change: parseFloat(indexData.changePoints) || 0,
                changePercent: parseFloat(indexData.changePercent) || 0
              });
            }
          });
          
          setMarketData(formattedData);
          
          // 设置概览数据
          setOverview({
            totalIndices: formattedData.length,
            upCount: formattedData.filter(item => item.change > 0).length,
            downCount: formattedData.filter(item => item.change < 0).length,
            flatCount: formattedData.filter(item => item.change === 0).length
          });
          
          message.success('市场数据已更新（直接API调用）');
        } else {
          throw new Error(result.message || '获取市场数据失败');
        }
      } else {
        throw new Error('API请求失败');
      }
    } catch (error) {
      console.error('获取市场数据失败:', error);
      message.error(`数据更新失败: ${error.message}`);
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

  // 自动刷新 - 与后端10秒采集频率同步
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(() => {
        refreshData();
      }, 10000); // 10秒刷新一次，与后端采集频率同步
      
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshData();
    }
  }, [lastUpdateTime, isEditMode]);

  const formatChange = (change, changePercent) => {
    const isPositive = change >= 0;
    const color = isPositive ? '#52c41a' : '#ff4d4f';
    const icon = isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
    
    return (
      <span style={{ color }}>
        {icon} {Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
      </span>
    );
  };

  return (
    <Card
      title="市场概览"
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
      styles={{ body: { padding: '16px 20px', height: 'calc(100% - 57px)', overflow: 'auto' } }}
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
          市场概览组件 - 编辑模式
        </div>
      ) : (
        <Spin spinning={loading}>
          <Row gutter={[8, 8]}>
            {marketData.map((item, index) => (
              <Col span={8} key={item.code}>
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
                    {item.name}
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#262626',
                    marginBottom: '4px'
                  }}>
                    {item.price.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px' }}>
                    {formatChange(item.change, item.changePercent)}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
          
          {/* 市场统计信息 */}
          {overview && (
            <div style={{ 
              marginTop: '12px', 
              padding: '8px',
              background: '#f0f9ff',
              border: '1px solid #91d5ff',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#1890ff'
            }}>
              📊 市场统计: 上涨 {overview.upCount} | 下跌 {overview.downCount} | 平盘 {overview.flatCount} | 总计 {overview.totalIndices}
            </div>
          )}
          
          <div style={{ 
            marginTop: '8px', 
            padding: '8px',
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#389e0d'
          }}>
            💡 数据每10秒自动更新（腾讯财经实时数据），点击刷新按钮可手动更新
          </div>
        </Spin>
      )}
    </Card>
  );
};

export default MarketOverviewWidget;