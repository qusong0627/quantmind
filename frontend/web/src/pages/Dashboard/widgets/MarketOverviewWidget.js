import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Spin, Button, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined, WifiOutlined } from '@ant-design/icons';
import TencentFinanceService from '../../../services/tencentFinanceService';

function MarketOverviewWidget({ isEditMode }) {
  const [loading, setLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [dataSource, setDataSource] = useState('tencent'); // 仅使用腾讯财经数据源
  const [marketData, setMarketData] = useState({
    shanghai: {
      name: '上证指数',
      code: '000001',
      price: 3245.67,
      change: 15.23,
      changePercent: 0.47
    },
    shenzhen: {
      name: '深证成指',
      code: '399001', 
      price: 12456.78,
      change: -23.45,
      changePercent: -0.19
    },
    chinext: {
      name: '创业板指',
      code: '399006',
      price: 2567.89,
      change: 8.91,
      changePercent: 0.35
    },
    sz50: {
      name: '上证50',
      code: '000016',
      price: 1234.56,
      change: 12.34,
      changePercent: 1.01
    },
    csi500: {
      name: '中证500',
      code: '000905',
      price: 6789.12,
      change: -45.67,
      changePercent: -0.67
    },
    hs300: {
      name: '沪深300',
      code: '000300',
      price: 4321.98,
      change: 23.45,
      changePercent: 0.55
    }
  });







  // 使用腾讯财经API获取市场数据（降级方案）
  // 在组件内部：fetchFromTencent 方法（修正中证500映射）
  const fetchFromTencent = async () => {
    try {
      const tencentService = new TencentFinanceService();
      const result = await tencentService.getAllMajorIndices();
      
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const symbolMapping = {
          'sh000001': 'shanghai',
          'sz399001': 'shenzhen', 
          'sz399006': 'chinext',
          'sh000016': 'sz50',
          'sh000905': 'csi500',   // 修复：中证500正确代码
          'sz399905': 'csi500',   // 兼容：如果其他路径仍返回旧代码
          'sh000300': 'hs300'
        };
        
        const newMarketData = { ...marketData };
        let updatedCount = 0;
        
        result.data.forEach((indexData) => {
          const key = symbolMapping[indexData.symbol];
          if (key && newMarketData[key] && indexData.current_price !== undefined) {
            const price = parseFloat(indexData.current_price);
            const change = parseFloat(indexData.change_points);
            const changePercent = parseFloat(indexData.change_percent);
            
            if (!isNaN(price) && price > 0) {
              newMarketData[key] = {
                ...newMarketData[key],
                price: price,
                change: isNaN(change) ? 0 : change,
                changePercent: isNaN(changePercent) ? 0 : changePercent
              };
              updatedCount++;
            }
          }
        });
        
        if (updatedCount > 0) {
          setMarketData(newMarketData);
          setDataSource('tencent');
          setLastUpdateTime(new Date());
          console.log(`腾讯财经API成功更新 ${updatedCount} 个指数数据`);
          return true;
        } else {
          console.warn('腾讯财经API返回数据但无有效指数更新');
          return false;
        }
      } else {
        console.warn('腾讯财经API返回数据格式无效或为空');
        return false;
      }
    } catch (error) {
      console.error('腾讯财经API获取失败:', error.message || error);
      return false;
    }
  };

  // 使用后端API获取市场数据（降级方案）
  // 在组件内部：fetchFromBackend 函数
  const fetchFromBackend = async () => {
    try {
      const response = await fetch('/api/market/indices');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const symbolMapping = {
          'sh000001': 'shanghai',
          'sz399001': 'shenzhen', 
          'sz399006': 'chinext',
          'sh000016': 'sz50',
          'sh000905': 'csi500',
          'sh000300': 'hs300'
        };
        
        const newMarketData = { ...marketData };
        let updatedCount = 0;
        
        result.data.forEach((indexData) => {
          const key = symbolMapping[indexData.symbol];
          if (key && newMarketData[key] && indexData.current_price !== undefined) {
            // 数据验证：确保数值有效
            const price = parseFloat(indexData.current_price);
            const change = parseFloat(indexData.change_points);
            const changePercent = parseFloat(indexData.change_percent);
            
            if (!isNaN(price) && price > 0) {
              newMarketData[key] = {
                ...newMarketData[key],
                price: price,
                change: isNaN(change) ? 0 : change,
                changePercent: isNaN(changePercent) ? 0 : changePercent
              };
              updatedCount++;
            }
          }
        });
        
        if (updatedCount > 0) {
          setMarketData(newMarketData);
          setDataSource('backend');
          setLastUpdateTime(new Date());
          console.log(`后端API成功更新 ${updatedCount} 个指数数据`);
          return true;
        } else {
          console.warn('后端API返回数据但无有效指数更新');
          return false;
        }
      } else {
        console.warn('后端API返回数据格式无效或为空');
        return false;
      }
    } catch (error) {
      console.error('后端API获取失败:', error.message || error);
      return false;
    }
  };

  // 获取市场数据（带降级机制）
  // 获取市场数据（仅腾讯财经）
  const fetchMarketData = async () => {
    setLoading(true);
  
    // 仅使用腾讯财经数据源
    const tencentSuccess = await fetchFromTencent();
    if (tencentSuccess) {
      setLoading(false);
      return;
    }
  
    // 腾讯失败：保留回退到模拟数据（不再调用沧海或后端）
    console.warn('所有数据源失败，使用模拟数据');
    setDataSource('mock');
    setLastUpdateTime(new Date());
    setLoading(false);
  };

  // 获取数据源状态图标和颜色
  const getDataSourceStatus = () => {
    switch (dataSource) {

      case 'tencent':
        return { icon: <WifiOutlined />, color: '#1890ff', text: '腾讯财经' };
      case 'backend':
        return { icon: <WifiOutlined />, color: '#faad14', text: '后端API' };
      case 'mock':
        return { icon: <WifiOutlined />, color: '#ff4d4f', text: '模拟数据' };
      default:
        return { icon: <WifiOutlined />, color: '#d9d9d9', text: '未知' };
    }
  };

  // 初始化数据获取
  useEffect(() => {
    if (!isEditMode) {
      fetchMarketData(); // 组件加载时立即获取数据
    }
  }, [isEditMode]);

  // 自动刷新数据
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(fetchMarketData, 10000); // 10秒更新一次
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 方法：renderIndexCard
  const renderIndexCard = (key, data) => {
    const isPositive = data.change >= 0;
    const icon = isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
    const valueStyle = { color: isPositive ? '#ff4d4f' : '#52c41a' };
  
    return (
      <Col xs={12} sm={12} md={8} lg={8} xl={8} xxl={8} key={key}>
        <div className="market-index-item" style={{ textAlign: 'center' }}>
          <div className="index-name" style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            {data.name}
          </div>
          <div className="index-price" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
            {data.price.toFixed(2)}
          </div>
          <div className="index-change" style={{ ...valueStyle, fontSize: '12px', fontWeight: '500' }}>
            {icon} {data.change > 0 ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
          </div>
        </div>
      </Col>
    );
  };

  return (
    <div className="widget-content market-overview-widget">
      {/* 移除内联 <style>，统一用 DashboardWidgets.css 中的工具类 */}
      <div className="widget-header">
        <h4 className="widget-title">市场概览</h4>
        <div className="widget-actions">
          <Button 
            type="text" 
            size="small" 
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchMarketData}
            disabled={isEditMode}
          />
        </div>
      </div>
      
      <div className="widget-body">
        <Spin spinning={loading}>
          <div className="market-grid market-grid-center">
            <Row gutter={[0, 16]} justify="center">
              {Object.entries(marketData).map(([key, data]) => renderIndexCard(key, data))}
            </Row>
            <div className="market-summary" style={{ marginTop: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>
                最后更新: {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : '未更新'}
              </div>
              <div style={{ fontSize: '11px', color: getDataSourceStatus().color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                {getDataSourceStatus().icon}
                <span>数据源: {getDataSourceStatus().text}</span>
              </div>
            </div>
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default MarketOverviewWidget;