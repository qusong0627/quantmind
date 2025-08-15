import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Modal, message, Tag, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, StarOutlined, StarFilled } from '@ant-design/icons';

const WatchlistWidget = ({ isEditMode, lastUpdateTime }) => {
  const [watchlist, setWatchlist] = useState([
    {
      id: '1',
      code: '000001',
      name: '平安银行',
      price: 12.45,
      change: 0.23,
      changePercent: 1.88,
      volume: '1.2亿'
    },
    {
      id: '2',
      code: '000002',
      name: '万科A',
      price: 35.67,
      change: -0.45,
      changePercent: -1.24,
      volume: '8956万'
    },
    {
      id: '3',
      code: '600036',
      name: '招商银行',
      price: 42.18,
      change: 0.67,
      changePercent: 1.61,
      volume: '2.1亿'
    }
  ]);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // 模拟搜索股票
  const searchStocks = async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockResults = [
        { code: '600519', name: '贵州茅台', price: 1678.50 },
        { code: '000858', name: '五粮液', price: 156.78 },
        { code: '002415', name: '海康威视', price: 32.45 },
        { code: '300059', name: '东方财富', price: 18.67 }
      ].filter(item => 
        item.code.includes(keyword) || 
        item.name.includes(keyword)
      );
      
      setSearchResults(mockResults);
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setSearching(false);
    }
  };

  // 添加到自选股
  const addToWatchlist = (stock) => {
    const exists = watchlist.find(item => item.code === stock.code);
    if (exists) {
      message.warning('该股票已在自选股中');
      return;
    }
    
    const newStock = {
      id: Date.now().toString(),
      code: stock.code,
      name: stock.name,
      price: stock.price,
      change: (Math.random() - 0.5) * 2,
      changePercent: (Math.random() - 0.5) * 4,
      volume: `${(Math.random() * 5 + 0.5).toFixed(1)}亿`
    };
    
    setWatchlist(prev => [...prev, newStock]);
    message.success(`${stock.name} 已添加到自选股`);
    setAddModalVisible(false);
    setSearchKeyword('');
    setSearchResults([]);
  };

  // 从自选股移除
  const removeFromWatchlist = (id) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
    message.success('已从自选股移除');
  };

  // 刷新价格数据
  const refreshPrices = () => {
    if (isEditMode) return;
    
    setWatchlist(prev => prev.map(item => ({
      ...item,
      price: item.price + (Math.random() - 0.5) * 2,
      change: (Math.random() - 0.5) * 2,
      changePercent: (Math.random() - 0.5) * 4
    })));
  };

  // 自动刷新价格
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(refreshPrices, 10000); // 10秒刷新一次
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 响应外部刷新
  useEffect(() => {
    if (!isEditMode && lastUpdateTime) {
      refreshPrices();
    }
  }, [lastUpdateTime, isEditMode]);

  const columns = [
    {
      title: '股票',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: '500', fontSize: '12px' }}>{text}</div>
          <div style={{ color: '#8c8c8c', fontSize: '10px' }}>{record.code}</div>
        </div>
      )
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 60,
      align: 'right',
      render: (price) => (
        <span style={{ fontWeight: '600', fontSize: '12px' }}>
          {price.toFixed(2)}
        </span>
      )
    },
    {
      title: '涨跌',
      dataIndex: 'change',
      key: 'change',
      width: 80,
      align: 'right',
      render: (change, record) => {
        const isPositive = change >= 0;
        const color = isPositive ? '#52c41a' : '#ff4d4f';
        return (
          <div style={{ color, fontSize: '11px' }}>
            <div>{isPositive ? '+' : ''}{change.toFixed(2)}</div>
            <div>{isPositive ? '+' : ''}{record.changePercent.toFixed(2)}%</div>
          </div>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 40,
      render: (_, record) => (
        !isEditMode && (
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => removeFromWatchlist(record.id)}
            style={{ color: '#ff4d4f' }}
          />
        )
      )
    }
  ];

  return (
    <Card
      title={
        <Space>
          <StarFilled style={{ color: '#faad14' }} />
          自选股
        </Space>
      }
      size="small"
      extra={
        !isEditMode && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={() => setAddModalVisible(true)}
          >
            添加
          </Button>
        )
      }
      style={{ height: '100%' }}
      bodyStyle={{ padding: '8px', height: 'calc(100% - 57px)', overflow: 'hidden' }}
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
          自选股组件 - 编辑模式
        </div>
      ) : (
        <div style={{ height: '100%', overflow: 'auto' }}>
          <Table
            columns={columns}
            dataSource={watchlist}
            pagination={false}
            size="small"
            rowKey="id"
            scroll={{ y: 'calc(100% - 32px)' }}
            style={{ fontSize: '11px' }}
          />
          
          {watchlist.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#8c8c8c'
            }}>
              <StarOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
              <div>暂无自选股</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>点击添加按钮添加股票</div>
            </div>
          )}
        </div>
      )}

      {/* 添加股票弹窗 */}
      <Modal
        title="添加自选股"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          setSearchKeyword('');
          setSearchResults([]);
        }}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: '16px' }}>
          <Input.Search
            placeholder="输入股票代码或名称"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={searchStocks}
            loading={searching}
            enterButton={<SearchOutlined />}
          />
        </div>
        
        {searchResults.length > 0 && (
          <div>
            <div style={{ marginBottom: '8px', color: '#8c8c8c', fontSize: '12px' }}>
              搜索结果：
            </div>
            {searchResults.map(stock => (
              <div
                key={stock.code}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => addToWatchlist(stock)}
              >
                <div>
                  <div style={{ fontWeight: '500' }}>{stock.name}</div>
                  <div style={{ color: '#8c8c8c', fontSize: '12px' }}>{stock.code}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600' }}>¥{stock.price.toFixed(2)}</div>
                  <Button type="link" size="small" icon={<PlusOutlined />}>
                    添加
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {searchKeyword && searchResults.length === 0 && !searching && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c' }}>
            未找到相关股票
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default WatchlistWidget;