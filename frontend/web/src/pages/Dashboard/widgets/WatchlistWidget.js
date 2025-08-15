import React, { useState, useEffect } from 'react';
import { List, Button, Tag, Popconfirm, Input, Modal, Select, message } from 'antd';
import { PlusOutlined, DeleteOutlined, BellOutlined, SearchOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

function WatchlistWidget({ isEditMode }) {
  const [watchlist, setWatchlist] = useState([
    {
      id: '000001',
      name: '平安银行',
      code: '000001.SZ',
      price: 12.45,
      change: 0.23,
      changePercent: 1.88,
      volume: '1.2亿',
      hasAlert: true
    },
    {
      id: '000002',
      name: '万科A',
      code: '000002.SZ', 
      price: 18.67,
      change: -0.45,
      changePercent: -2.35,
      volume: '8900万',
      hasAlert: false
    },
    {
      id: '600036',
      name: '招商银行',
      code: '600036.SH',
      price: 45.23,
      change: 1.12,
      changePercent: 2.54,
      volume: '2.1亿',
      hasAlert: true
    },
    {
      id: '000858',
      name: '五粮液',
      code: '000858.SZ',
      price: 178.90,
      change: -2.34,
      changePercent: -1.29,
      volume: '5600万',
      hasAlert: false
    },
    {
      id: '600519',
      name: '贵州茅台',
      code: '600519.SH',
      price: 1680.50,
      change: 15.30,
      changePercent: 0.92,
      volume: '3200万',
      hasAlert: true
    },
    {
      id: '000300',
      name: '美的集团',
      code: '000300.SZ',
      price: 68.45,
      change: -1.25,
      changePercent: -1.79,
      volume: '1.8亿',
      hasAlert: false
    },
    {
      id: '002415',
      name: '海康威视',
      code: '002415.SZ',
      price: 32.45,
      change: 0.85,
      changePercent: 2.69,
      volume: '2.5亿',
      hasAlert: true
    },
    {
      id: '300059',
      name: '东方财富',
      code: '300059.SZ',
      price: 18.67,
      change: -0.33,
      changePercent: -1.74,
      volume: '4.2亿',
      hasAlert: false
    }
  ]);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // 模拟实时价格更新
  useEffect(() => {
    if (!isEditMode) {
      const interval = setInterval(() => {
        setWatchlist(prev => prev.map(stock => ({
          ...stock,
          price: stock.price + (Math.random() - 0.5) * 0.5,
          change: (Math.random() - 0.5) * 2,
          changePercent: (Math.random() - 0.5) * 4
        })));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isEditMode]);

  // 搜索股票
  const handleSearch = async (value) => {
    if (!value.trim()) return;
    
    setSearching(true);
    try {
      // 模拟搜索API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟搜索结果
      const mockResults = [
        { code: '600519.SH', name: '贵州茅台', price: 1680.50 },
        { code: '000858.SZ', name: '五粮液', price: 178.90 },
        { code: '002415.SZ', name: '海康威视', price: 32.45 },
        { code: '300059.SZ', name: '东方财富', price: 18.67 }
      ].filter(item => 
        item.name.includes(value) || 
        item.code.includes(value.toUpperCase())
      );
      
      setSearchResults(mockResults);
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setSearching(false);
    }
  };

  // 添加股票到自选
  const addToWatchlist = (stock) => {
    const exists = watchlist.find(item => item.code === stock.code);
    if (exists) {
      message.warning('该股票已在自选列表中');
      return;
    }

    const newStock = {
      id: stock.code.split('.')[0],
      name: stock.name,
      code: stock.code,
      price: stock.price,
      change: 0,
      changePercent: 0,
      volume: '0',
      hasAlert: false
    };

    setWatchlist(prev => [...prev, newStock]);
    setAddModalVisible(false);
    setSearchKeyword('');
    setSearchResults([]);
    message.success('添加成功');
  };

  // 删除股票
  const removeFromWatchlist = (stockId) => {
    setWatchlist(prev => prev.filter(item => item.id !== stockId));
    message.success('删除成功');
  };

  // 切换价格提醒
  const toggleAlert = (stockId) => {
    setWatchlist(prev => prev.map(item => 
      item.id === stockId ? { ...item, hasAlert: !item.hasAlert } : item
    ));
  };

  const renderStockItem = (stock) => {
    const isPositive = stock.change >= 0;
    const changeColor = isPositive ? '#ff4d4f' : '#52c41a';
    const changeIcon = isPositive ? '+' : '';

    return (
      <List.Item
        key={stock.id}
        actions={!isEditMode ? [
          <Button
            type="text"
            size="small"
            icon={<BellOutlined />}
            onClick={() => toggleAlert(stock.id)}
            style={{ color: stock.hasAlert ? '#1890ff' : '#d9d9d9' }}
          />,
          <Popconfirm
            title="确定删除这只股票？"
            onConfirm={() => removeFromWatchlist(stock.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
            />
          </Popconfirm>
        ] : []}
      >
        <List.Item.Meta
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{stock.name}</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                ¥{stock.price.toFixed(2)}
              </span>
            </div>
          }
          description={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                {stock.code}
              </span>
              <span style={{ color: changeColor, fontSize: '12px' }}>
                {changeIcon}{stock.change.toFixed(2)} ({changeIcon}{stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <div className="widget-content">
      <div className="widget-header">
        <h4 className="widget-title">自选股</h4>
        <div className="widget-actions">
          {!isEditMode && (
            <Button 
              type="text" 
              size="small" 
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
            />
          )}
        </div>
      </div>
      
      {/* 这里覆盖 .widget-body 的对齐方式，避免内容按内容宽度居中 */}
      <div className="widget-body">
        <List
          className="watchlist-scroll"
          size="small"
          dataSource={watchlist}
          renderItem={renderStockItem}
        />
        {/* 空状态 */}
        {watchlist.length === 0 && (
          <div className="widget-empty">
            <div className="widget-empty-text">暂无自选股票</div>
            <Button 
              type="link" 
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
              disabled={isEditMode}
            >
              添加股票
            </Button>
          </div>
        )}
      </div>

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
        <Search
          placeholder="输入股票代码或名称"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={handleSearch}
          loading={searching}
          style={{ marginBottom: 16 }}
        />
        
        {searchResults.length > 0 && (
          <List
            size="small"
            dataSource={searchResults}
            renderItem={(stock) => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => addToWatchlist(stock)}
                  >
                    添加
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={stock.name}
                  description={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{stock.code}</span>
                      <span>¥{stock.price.toFixed(2)}</span>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default WatchlistWidget;