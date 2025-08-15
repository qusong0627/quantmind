import React, { useState } from 'react';
import { Form, Switch, Card, Select, Radio, Slider, Button, message, Divider, ColorPicker, InputNumber } from 'antd';
import { BgColorsOutlined, GlobalOutlined, EyeOutlined, BarChartOutlined, BellOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

const PreferencesSettings = ({ onSettingsChange, onSave }) => {
  const [loading, setLoading] = useState(false);
  
  // 偏好设置状态
  const [preferences, setPreferences] = useState({
    // 界面设置
    theme: 'auto', // light, dark, auto
    language: 'zh-CN',
    fontSize: 14,
    compactMode: false,
    sidebarCollapsed: false,
    showAnimations: true,
    
    // 颜色主题
    primaryColor: '#1890ff',
    accentColor: '#52c41a',
    
    // 数据显示
    defaultTimeRange: '1M', // 1D, 1W, 1M, 3M, 6M, 1Y
    defaultChartType: 'candlestick', // line, candlestick, bar
    showVolume: true,
    showIndicators: true,
    autoRefresh: true,
    refreshInterval: 30, // 秒
    
    // 交易偏好
    defaultOrderType: 'market', // market, limit, stop
    confirmBeforeTrade: true,
    showRiskWarnings: true,
    defaultPositionSize: 10, // 百分比
    
    // 策略偏好
    strategyDisplayMode: 'grid', // grid, list
    showPerformanceMetrics: true,
    defaultSortBy: 'return', // return, sharpe, drawdown, created
    hideUnderperforming: false,
    
    // 通知偏好
    desktopNotifications: true,
    soundNotifications: true,
    notificationPosition: 'topRight', // topLeft, topRight, bottomLeft, bottomRight
    
    // 数据导出
    defaultExportFormat: 'csv', // csv, excel, json
    includeMetadata: true,
    
    // 高级设置
    enableBetaFeatures: false,
    enableDebugMode: false,
    cacheEnabled: true,
    maxCacheSize: 100, // MB
    
    // 键盘快捷键
    keyboardShortcuts: true,
    customShortcuts: {
      'search': 'Ctrl+K',
      'newStrategy': 'Ctrl+N',
      'save': 'Ctrl+S',
      'refresh': 'F5'
    }
  });

  // 处理设置变化
  const handleSettingChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    onSettingsChange && onSettingsChange();
  };

  // 处理嵌套设置变化
  const handleNestedSettingChange = (parentKey, childKey, value) => {
    setPreferences(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
    onSettingsChange && onSettingsChange();
  };

  // 保存偏好设置
  const handleSave = async () => {
    setLoading(true);
    try {
      // 这里应该调用API保存偏好设置
      console.log('保存偏好设置:', preferences);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      
      message.success('偏好设置保存成功');
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 重置为默认设置
  const handleReset = () => {
    const defaultPreferences = {
      theme: 'auto',
      language: 'zh-CN',
      fontSize: 14,
      compactMode: false,
      sidebarCollapsed: false,
      showAnimations: true,
      primaryColor: '#1890ff',
      accentColor: '#52c41a',
      defaultTimeRange: '1M',
      defaultChartType: 'candlestick',
      showVolume: true,
      showIndicators: true,
      autoRefresh: true,
      refreshInterval: 30,
      defaultOrderType: 'market',
      confirmBeforeTrade: true,
      showRiskWarnings: true,
      defaultPositionSize: 10,
      strategyDisplayMode: 'grid',
      showPerformanceMetrics: true,
      defaultSortBy: 'return',
      hideUnderperforming: false,
      desktopNotifications: true,
      soundNotifications: true,
      notificationPosition: 'topRight',
      defaultExportFormat: 'csv',
      includeMetadata: true,
      enableBetaFeatures: false,
      enableDebugMode: false,
      cacheEnabled: true,
      maxCacheSize: 100,
      keyboardShortcuts: true,
      customShortcuts: {
        'search': 'Ctrl+K',
        'newStrategy': 'Ctrl+N',
        'save': 'Ctrl+S',
        'refresh': 'F5'
      }
    };
    
    setPreferences(defaultPreferences);
    onSettingsChange && onSettingsChange();
    message.success('已重置为默认设置');
  };

  return (
    <div className="preferences-settings">
      {/* 界面设置 */}
      <div className="settings-group">
        <div className="settings-group-title">界面设置</div>
        <div className="settings-group-description">
          自定义界面外观和行为
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <BgColorsOutlined className="setting-icon" />
              <div>
                <div className="setting-title">主题模式</div>
                <div className="setting-description">选择界面主题</div>
              </div>
            </div>
            <Radio.Group 
              value={preferences.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <Radio.Button value="light">浅色</Radio.Button>
              <Radio.Button value="dark">深色</Radio.Button>
              <Radio.Button value="auto">自动</Radio.Button>
            </Radio.Group>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <GlobalOutlined className="setting-icon" />
              <div>
                <div className="setting-title">语言</div>
                <div className="setting-description">选择界面语言</div>
              </div>
            </div>
            <Select 
              value={preferences.language}
              onChange={(value) => handleSettingChange('language', value)}
              style={{ width: 120 }}
            >
              <Option value="zh-CN">简体中文</Option>
              <Option value="zh-TW">繁體中文</Option>
              <Option value="en-US">English</Option>
              <Option value="ja-JP">日本語</Option>
            </Select>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">字体大小</div>
              <div className="setting-description">调整界面字体大小</div>
            </div>
            <div style={{ width: 200 }}>
              <Slider 
                min={12}
                max={18}
                value={preferences.fontSize}
                onChange={(value) => handleSettingChange('fontSize', value)}
                marks={{
                  12: '小',
                  14: '中',
                  16: '大',
                  18: '特大'
                }}
              />
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">紧凑模式</div>
              <div className="setting-description">减少界面元素间距</div>
            </div>
            <Switch 
              checked={preferences.compactMode}
              onChange={(checked) => handleSettingChange('compactMode', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">侧边栏默认收起</div>
              <div className="setting-description">页面加载时收起侧边栏</div>
            </div>
            <Switch 
              checked={preferences.sidebarCollapsed}
              onChange={(checked) => handleSettingChange('sidebarCollapsed', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">显示动画</div>
              <div className="setting-description">启用界面过渡动画</div>
            </div>
            <Switch 
              checked={preferences.showAnimations}
              onChange={(checked) => handleSettingChange('showAnimations', checked)}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 颜色主题 */}
      <div className="settings-group">
        <div className="settings-group-title">颜色主题</div>
        <div className="settings-group-description">
          自定义界面颜色
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">主色调</div>
              <div className="setting-description">界面主要颜色</div>
            </div>
            <ColorPicker 
              value={preferences.primaryColor}
              onChange={(color) => handleSettingChange('primaryColor', color.toHexString())}
              showText
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">强调色</div>
              <div className="setting-description">用于突出显示的颜色</div>
            </div>
            <ColorPicker 
              value={preferences.accentColor}
              onChange={(color) => handleSettingChange('accentColor', color.toHexString())}
              showText
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 数据显示 */}
      <div className="settings-group">
        <div className="settings-group-title">数据显示</div>
        <div className="settings-group-description">
          控制图表和数据的显示方式
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <BarChartOutlined className="setting-icon" />
              <div>
                <div className="setting-title">默认时间范围</div>
                <div className="setting-description">图表默认显示的时间范围</div>
              </div>
            </div>
            <Select 
              value={preferences.defaultTimeRange}
              onChange={(value) => handleSettingChange('defaultTimeRange', value)}
              style={{ width: 100 }}
            >
              <Option value="1D">1天</Option>
              <Option value="1W">1周</Option>
              <Option value="1M">1月</Option>
              <Option value="3M">3月</Option>
              <Option value="6M">6月</Option>
              <Option value="1Y">1年</Option>
            </Select>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">默认图表类型</div>
              <div className="setting-description">新建图表时的默认类型</div>
            </div>
            <Select 
              value={preferences.defaultChartType}
              onChange={(value) => handleSettingChange('defaultChartType', value)}
              style={{ width: 120 }}
            >
              <Option value="line">折线图</Option>
              <Option value="candlestick">K线图</Option>
              <Option value="bar">柱状图</Option>
            </Select>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">显示成交量</div>
              <div className="setting-description">在图表中显示成交量</div>
            </div>
            <Switch 
              checked={preferences.showVolume}
              onChange={(checked) => handleSettingChange('showVolume', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">显示技术指标</div>
              <div className="setting-description">在图表中显示技术指标</div>
            </div>
            <Switch 
              checked={preferences.showIndicators}
              onChange={(checked) => handleSettingChange('showIndicators', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">自动刷新</div>
              <div className="setting-description">自动刷新数据</div>
            </div>
            <Switch 
              checked={preferences.autoRefresh}
              onChange={(checked) => handleSettingChange('autoRefresh', checked)}
            />
          </div>
          
          {preferences.autoRefresh && (
            <div className="setting-item">
              <div className="setting-info">
                <ClockCircleOutlined className="setting-icon" />
                <div>
                  <div className="setting-title">刷新间隔</div>
                  <div className="setting-description">自动刷新的时间间隔（秒）</div>
                </div>
              </div>
              <InputNumber 
                min={5}
                max={300}
                value={preferences.refreshInterval}
                onChange={(value) => handleSettingChange('refreshInterval', value)}
                addonAfter="秒"
              />
            </div>
          )}
        </Card>
      </div>

      <Divider />

      {/* 交易偏好 */}
      <div className="settings-group">
        <div className="settings-group-title">交易偏好</div>
        <div className="settings-group-description">
          设置交易相关的默认选项
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">默认订单类型</div>
              <div className="setting-description">新建订单时的默认类型</div>
            </div>
            <Select 
              value={preferences.defaultOrderType}
              onChange={(value) => handleSettingChange('defaultOrderType', value)}
              style={{ width: 120 }}
            >
              <Option value="market">市价单</Option>
              <Option value="limit">限价单</Option>
              <Option value="stop">止损单</Option>
            </Select>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">交易前确认</div>
              <div className="setting-description">执行交易前显示确认对话框</div>
            </div>
            <Switch 
              checked={preferences.confirmBeforeTrade}
              onChange={(checked) => handleSettingChange('confirmBeforeTrade', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">显示风险警告</div>
              <div className="setting-description">在高风险操作时显示警告</div>
            </div>
            <Switch 
              checked={preferences.showRiskWarnings}
              onChange={(checked) => handleSettingChange('showRiskWarnings', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">默认仓位大小</div>
              <div className="setting-description">新建订单时的默认仓位大小（占总资金比例）</div>
            </div>
            <div style={{ width: 200 }}>
              <Slider 
                min={1}
                max={100}
                value={preferences.defaultPositionSize}
                onChange={(value) => handleSettingChange('defaultPositionSize', value)}
                marks={{
                  1: '1%',
                  25: '25%',
                  50: '50%',
                  75: '75%',
                  100: '100%'
                }}
                tooltip={{ formatter: (value) => `${value}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      <Divider />

      {/* 策略偏好 */}
      <div className="settings-group">
        <div className="settings-group-title">策略偏好</div>
        <div className="settings-group-description">
          设置策略显示和排序偏好
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <EyeOutlined className="setting-icon" />
              <div>
                <div className="setting-title">策略显示模式</div>
                <div className="setting-description">策略列表的显示方式</div>
              </div>
            </div>
            <Radio.Group 
              value={preferences.strategyDisplayMode}
              onChange={(e) => handleSettingChange('strategyDisplayMode', e.target.value)}
            >
              <Radio.Button value="grid">网格</Radio.Button>
              <Radio.Button value="list">列表</Radio.Button>
            </Radio.Group>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">显示性能指标</div>
              <div className="setting-description">在策略卡片中显示详细性能指标</div>
            </div>
            <Switch 
              checked={preferences.showPerformanceMetrics}
              onChange={(checked) => handleSettingChange('showPerformanceMetrics', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">默认排序方式</div>
              <div className="setting-description">策略列表的默认排序方式</div>
            </div>
            <Select 
              value={preferences.defaultSortBy}
              onChange={(value) => handleSettingChange('defaultSortBy', value)}
              style={{ width: 120 }}
            >
              <Option value="return">收益率</Option>
              <Option value="sharpe">夏普比率</Option>
              <Option value="drawdown">最大回撤</Option>
              <Option value="created">创建时间</Option>
            </Select>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">隐藏表现不佳的策略</div>
              <div className="setting-description">自动隐藏收益率为负的策略</div>
            </div>
            <Switch 
              checked={preferences.hideUnderperforming}
              onChange={(checked) => handleSettingChange('hideUnderperforming', checked)}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 通知偏好 */}
      <div className="settings-group">
        <div className="settings-group-title">通知偏好</div>
        <div className="settings-group-description">
          设置通知的显示方式
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <BellOutlined className="setting-icon" />
              <div>
                <div className="setting-title">桌面通知</div>
                <div className="setting-description">启用桌面通知</div>
              </div>
            </div>
            <Switch 
              checked={preferences.desktopNotifications}
              onChange={(checked) => handleSettingChange('desktopNotifications', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">声音通知</div>
              <div className="setting-description">通知时播放声音</div>
            </div>
            <Switch 
              checked={preferences.soundNotifications}
              onChange={(checked) => handleSettingChange('soundNotifications', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">通知位置</div>
              <div className="setting-description">通知弹窗的显示位置</div>
            </div>
            <Select 
              value={preferences.notificationPosition}
              onChange={(value) => handleSettingChange('notificationPosition', value)}
              style={{ width: 120 }}
            >
              <Option value="topLeft">左上角</Option>
              <Option value="topRight">右上角</Option>
              <Option value="bottomLeft">左下角</Option>
              <Option value="bottomRight">右下角</Option>
            </Select>
          </div>
        </Card>
      </div>

      <Divider />

      {/* 数据导出 */}
      <div className="settings-group">
        <div className="settings-group-title">数据导出</div>
        <div className="settings-group-description">
          设置数据导出的默认选项
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">默认导出格式</div>
              <div className="setting-description">数据导出时的默认文件格式</div>
            </div>
            <Select 
              value={preferences.defaultExportFormat}
              onChange={(value) => handleSettingChange('defaultExportFormat', value)}
              style={{ width: 120 }}
            >
              <Option value="csv">CSV</Option>
              <Option value="excel">Excel</Option>
              <Option value="json">JSON</Option>
            </Select>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">包含元数据</div>
              <div className="setting-description">导出时包含创建时间、来源等元数据</div>
            </div>
            <Switch 
              checked={preferences.includeMetadata}
              onChange={(checked) => handleSettingChange('includeMetadata', checked)}
            />
          </div>
        </Card>
      </div>

      <Divider />

      {/* 高级设置 */}
      <div className="settings-group">
        <div className="settings-group-title">高级设置</div>
        <div className="settings-group-description">
          开发者和高级用户选项
        </div>
        
        <Card className="settings-card">
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">启用测试功能</div>
              <div className="setting-description">启用正在开发中的新功能</div>
            </div>
            <Switch 
              checked={preferences.enableBetaFeatures}
              onChange={(checked) => handleSettingChange('enableBetaFeatures', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">调试模式</div>
              <div className="setting-description">启用调试信息和日志</div>
            </div>
            <Switch 
              checked={preferences.enableDebugMode}
              onChange={(checked) => handleSettingChange('enableDebugMode', checked)}
            />
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">启用缓存</div>
              <div className="setting-description">缓存数据以提高加载速度</div>
            </div>
            <Switch 
              checked={preferences.cacheEnabled}
              onChange={(checked) => handleSettingChange('cacheEnabled', checked)}
            />
          </div>
          
          {preferences.cacheEnabled && (
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">最大缓存大小</div>
                <div className="setting-description">缓存占用的最大存储空间（MB）</div>
              </div>
              <InputNumber 
                min={10}
                max={1000}
                value={preferences.maxCacheSize}
                onChange={(value) => handleSettingChange('maxCacheSize', value)}
                addonAfter="MB"
              />
            </div>
          )}
          
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">键盘快捷键</div>
              <div className="setting-description">启用键盘快捷键</div>
            </div>
            <Switch 
              checked={preferences.keyboardShortcuts}
              onChange={(checked) => handleSettingChange('keyboardShortcuts', checked)}
            />
          </div>
        </Card>
      </div>

      {/* 操作按钮 */}
      <div className="settings-actions">
        <Button 
          type="primary" 
          size="large"
          loading={loading}
          onClick={handleSave}
          style={{ marginRight: 16 }}
        >
          保存偏好设置
        </Button>
        <Button 
          size="large"
          onClick={handleReset}
        >
          重置为默认
        </Button>
      </div>

      <style jsx>{`
        .settings-actions {
          margin-top: 32px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default PreferencesSettings;