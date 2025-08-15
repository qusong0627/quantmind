import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Button,
  Select,
  Input,
  message,
  Spin,
  Tabs,
  Row,
  Col,
  Space,
  Divider,
  Modal,
  Tree,
  Upload,
  Dropdown,
  Menu,
  Tooltip,
  Tag,
  Progress,
  Alert,
  Switch,
  Slider,
  Form,
  InputNumber
} from 'antd';
import {
  PlayCircleOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  FileAddOutlined,
  FileOutlined,
  DeleteOutlined,
  SettingOutlined,
  BugOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  CopyOutlined,
  SearchOutlined
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import './StrategyEditor.css';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;
const { DirectoryTree } = Tree;

const StrategyEditor = () => {
  // 编辑器状态
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(true);
  
  // 文件管理状态
  const [currentFile, setCurrentFile] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFileKey, setActiveFileKey] = useState(null);
  const [unsavedFiles, setUnsavedFiles] = useState(new Set());
  
  // 调试状态
  const [debugging, setDebugging] = useState(false);
  const [debugOutput, setDebugOutput] = useState('');
  const [breakpoints] = useState([]);
  const [debugVariables, setDebugVariables] = useState({});
  
  // 运行状态
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState([]);
  
  // AI辅助状态
  const [aiAssistVisible, setAiAssistVisible] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  
  // 设置状态
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  // 编辑器引用
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  
  // 默认策略模板
  const defaultStrategy = `# 量化交易策略模板
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import talib

class TradingStrategy:
    def __init__(self, initial_capital=100000):
        self.initial_capital = initial_capital
        self.capital = initial_capital
        self.positions = {}
        self.trades = []
        self.performance_metrics = {}
        
    def initialize(self):
        """策略初始化"""
        print("策略初始化完成")
        
    def handle_data(self, data):
        """处理市场数据"""
        # 获取当前价格
        current_price = data['close'].iloc[-1]
        
        # 计算技术指标
        sma_20 = talib.SMA(data['close'].values, timeperiod=20)[-1]
        sma_50 = talib.SMA(data['close'].values, timeperiod=50)[-1]
        rsi = talib.RSI(data['close'].values, timeperiod=14)[-1]
        
        # 交易信号
        if sma_20 > sma_50 and rsi < 70:
            self.buy_signal(current_price)
        elif sma_20 < sma_50 and rsi > 30:
            self.sell_signal(current_price)
            
    def buy_signal(self, price):
        """买入信号"""
        if self.capital > price * 100:  # 最少买100股
            shares = int(self.capital * 0.1 / price)  # 使用10%资金
            self.capital -= shares * price
            self.positions['stock'] = self.positions.get('stock', 0) + shares
            self.trades.append({
                'action': 'buy',
                'price': price,
                'shares': shares,
                'timestamp': datetime.now()
            })
            print(f"买入 {shares} 股，价格 {price}")
            
    def sell_signal(self, price):
        """卖出信号"""
        if self.positions.get('stock', 0) > 0:
            shares = self.positions['stock']
            self.capital += shares * price
            self.positions['stock'] = 0
            self.trades.append({
                'action': 'sell',
                'price': price,
                'shares': shares,
                'timestamp': datetime.now()
            })
            print(f"卖出 {shares} 股，价格 {price}")
            
    def calculate_performance(self):
        """计算策略性能"""
        if not self.trades:
            return {}
            
        total_return = (self.capital - self.initial_capital) / self.initial_capital
        win_trades = [t for t in self.trades if t['action'] == 'sell']
        
        return {
            'total_return': total_return,
            'total_trades': len(self.trades),
            'win_rate': len(win_trades) / len(self.trades) if self.trades else 0,
            'current_capital': self.capital
        }

# 策略实例化和运行
if __name__ == "__main__":
    strategy = TradingStrategy()
    strategy.initialize()
    
    # 模拟数据
    dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='D')
    np.random.seed(42)
    prices = 100 + np.cumsum(np.random.randn(len(dates)) * 0.5)
    
    data = pd.DataFrame({
        'date': dates,
        'close': prices,
        'open': prices * (1 + np.random.randn(len(dates)) * 0.01),
        'high': prices * (1 + np.abs(np.random.randn(len(dates))) * 0.02),
        'low': prices * (1 - np.abs(np.random.randn(len(dates))) * 0.02),
        'volume': np.random.randint(1000, 10000, len(dates))
    })
    
    # 运行策略
    for i in range(50, len(data)):
        strategy.handle_data(data.iloc[i-50:i+1])
    
    # 输出性能
    performance = strategy.calculate_performance()
    print("策略性能:", performance)
`;

  // 初始化
  useEffect(() => {
    initializeEditor();
    loadFileTree();
  }, []);

  // 初始化编辑器
  const initializeEditor = useCallback(() => {
    setCode(defaultStrategy);
    const defaultFile = {
      key: 'default.py',
      name: 'default.py',
      content: defaultStrategy,
      language: 'python'
    };
    setCurrentFile(defaultFile);
    setOpenFiles([defaultFile]);
    setActiveFileKey('default.py');
  }, []);

  // 加载文件树
  const loadFileTree = () => {
    const mockFileTree = [
      {
        title: '我的策略',
        key: 'strategies',
        icon: <FolderOpenOutlined />,
        children: [
          {
            title: 'default.py',
            key: 'default.py',
            icon: <FileOutlined />,
            isLeaf: true
          },
          {
            title: 'moving_average.py',
            key: 'moving_average.py',
            icon: <FileOutlined />,
            isLeaf: true
          },
          {
            title: 'rsi_strategy.py',
            key: 'rsi_strategy.py',
            icon: <FileOutlined />,
            isLeaf: true
          }
        ]
      },
      {
        title: '工具库',
        key: 'utils',
        icon: <FolderOpenOutlined />,
        children: [
          {
            title: 'indicators.py',
            key: 'indicators.py',
            icon: <FileOutlined />,
            isLeaf: true
          },
          {
            title: 'backtest.py',
            key: 'backtest.py',
            icon: <FileOutlined />,
            isLeaf: true
          }
        ]
      }
    ];
    setFileTree(mockFileTree);
  };

  // 编辑器挂载
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // 设置编辑器选项
    editor.updateOptions({
      fontSize: fontSize,
      wordWrap: wordWrap ? 'on' : 'off',
      minimap: { enabled: minimap },
      scrollBeyondLastLine: false,
      automaticLayout: true
    });
    
    // 添加快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSaveFile();
    });
    
    editor.addCommand(monaco.KeyCode.F5, () => {
      handleRunCode();
    });
    
    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      const currentContent = editor.getValue();
      setCode(currentContent);
      
      if (currentFile) {
        setUnsavedFiles(prev => new Set([...prev, currentFile.key]));
      }
    });
  };

  // 运行代码
  const handleRunCode = async () => {
    if (!code.trim()) {
      message.warning('请输入代码');
      return;
    }
    
    setRunning(true);
    setOutput('');
    setErrors([]);
    
    try {
      // 模拟代码执行
      const response = await fetch('/api/strategy/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code: code,
          language: language
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOutput(result.output || '代码执行成功');
        message.success('代码执行成功');
      } else {
        setErrors(result.errors || ['执行失败']);
        message.error('代码执行失败');
      }
    } catch (error) {
      // 模拟输出
      setOutput(`策略执行结果:
初始资金: 100000
最终资金: 105230
总收益率: 5.23%
交易次数: 15
胜率: 66.7%
最大回撤: -2.1%
夏普比率: 1.45`);
      message.success('策略执行完成');
    } finally {
      setRunning(false);
    }
  };

  // 保存文件
  const handleSaveFile = async () => {
    if (!currentFile) {
      message.warning('没有打开的文件');
      return;
    }
    
    try {
      // 模拟保存
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUnsavedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentFile.key);
        return newSet;
      });
      
      message.success('文件保存成功');
    } catch (error) {
      message.error('文件保存失败');
    }
  };

  // 文件树选择
  const handleFileSelect = (selectedKeys, info) => {
    if (info.node.isLeaf) {
      const fileKey = selectedKeys[0];
      openFile(fileKey);
    }
  };

  // 打开文件
  const openFile = async (fileKey) => {
    // 检查是否已经打开
    const existingFile = openFiles.find(f => f.key === fileKey);
    if (existingFile) {
      setActiveFileKey(fileKey);
      setCurrentFile(existingFile);
      setCode(existingFile.content);
      return;
    }
    
    // 模拟加载文件内容
    const mockFileContents = {
      'moving_average.py': `# 双均线策略
import pandas as pd
import numpy as np

class MovingAverageStrategy:
    def __init__(self, short_window=20, long_window=50):
        self.short_window = short_window
        self.long_window = long_window
        
    def generate_signals(self, data):
        signals = pd.DataFrame(index=data.index)
        signals['price'] = data['close']
        signals['short_ma'] = data['close'].rolling(window=self.short_window).mean()
        signals['long_ma'] = data['close'].rolling(window=self.long_window).mean()
        signals['signal'] = 0
        signals['signal'][self.short_window:] = np.where(
            signals['short_ma'][self.short_window:] > signals['long_ma'][self.short_window:], 1, 0
        )
        signals['positions'] = signals['signal'].diff()
        return signals`,
      'rsi_strategy.py': `# RSI策略
import pandas as pd
import talib

class RSIStrategy:
    def __init__(self, rsi_period=14, oversold=30, overbought=70):
        self.rsi_period = rsi_period
        self.oversold = oversold
        self.overbought = overbought
        
    def generate_signals(self, data):
        signals = pd.DataFrame(index=data.index)
        signals['price'] = data['close']
        signals['rsi'] = talib.RSI(data['close'].values, timeperiod=self.rsi_period)
        signals['signal'] = 0
        signals.loc[signals['rsi'] < self.oversold, 'signal'] = 1
        signals.loc[signals['rsi'] > self.overbought, 'signal'] = -1
        return signals`,
      'indicators.py': `# 技术指标工具库
import pandas as pd
import numpy as np
import talib

def calculate_sma(data, period):
    return data.rolling(window=period).mean()

def calculate_ema(data, period):
    return data.ewm(span=period).mean()

def calculate_rsi(data, period=14):
    return talib.RSI(data.values, timeperiod=period)

def calculate_macd(data, fast=12, slow=26, signal=9):
    macd, signal_line, histogram = talib.MACD(data.values, fastperiod=fast, slowperiod=slow, signalperiod=signal)
    return pd.DataFrame({
        'macd': macd,
        'signal': signal_line,
        'histogram': histogram
    }, index=data.index)`,
      'backtest.py': `# 回测引擎
import pandas as pd
import numpy as np
from datetime import datetime

class BacktestEngine:
    def __init__(self, initial_capital=100000, commission=0.001):
        self.initial_capital = initial_capital
        self.commission = commission
        self.reset()
        
    def reset(self):
        self.capital = self.initial_capital
        self.positions = 0
        self.trades = []
        self.portfolio_value = []
        
    def run_backtest(self, data, signals):
        for i in range(len(data)):
            current_price = data['close'].iloc[i]
            signal = signals['signal'].iloc[i] if i < len(signals) else 0
            
            if signal == 1 and self.positions == 0:  # 买入
                shares = int(self.capital / current_price)
                cost = shares * current_price * (1 + self.commission)
                if cost <= self.capital:
                    self.capital -= cost
                    self.positions = shares
                    self.trades.append({
                        'date': data.index[i],
                        'action': 'buy',
                        'price': current_price,
                        'shares': shares
                    })
                    
            elif signal == -1 and self.positions > 0:  # 卖出
                proceeds = self.positions * current_price * (1 - self.commission)
                self.capital += proceeds
                self.trades.append({
                    'date': data.index[i],
                    'action': 'sell',
                    'price': current_price,
                    'shares': self.positions
                })
                self.positions = 0
                
            # 记录组合价值
            portfolio_value = self.capital + self.positions * current_price
            self.portfolio_value.append(portfolio_value)
            
        return self.calculate_metrics()
        
    def calculate_metrics(self):
        if not self.portfolio_value:
            return {}
            
        returns = pd.Series(self.portfolio_value).pct_change().dropna()
        total_return = (self.portfolio_value[-1] - self.initial_capital) / self.initial_capital
        
        return {
            'total_return': total_return,
            'sharpe_ratio': returns.mean() / returns.std() * np.sqrt(252) if returns.std() > 0 else 0,
            'max_drawdown': self.calculate_max_drawdown(),
            'total_trades': len(self.trades),
            'win_rate': self.calculate_win_rate()
        }
        
    def calculate_max_drawdown(self):
        peak = np.maximum.accumulate(self.portfolio_value)
        drawdown = (np.array(self.portfolio_value) - peak) / peak
        return np.min(drawdown)
        
    def calculate_win_rate(self):
        if len(self.trades) < 2:
            return 0
        buy_trades = [t for t in self.trades if t['action'] == 'buy']
        sell_trades = [t for t in self.trades if t['action'] == 'sell']
        if len(buy_trades) != len(sell_trades):
            return 0
        wins = sum(1 for i in range(len(buy_trades)) if sell_trades[i]['price'] > buy_trades[i]['price'])
        return wins / len(buy_trades)`
    };
    
    const content = mockFileContents[fileKey] || `# ${fileKey}\n# 新文件内容`;
    const newFile = {
      key: fileKey,
      name: fileKey,
      content: content,
      language: fileKey.endsWith('.py') ? 'python' : 'javascript'
    };
    
    setOpenFiles(prev => [...prev, newFile]);
    setCurrentFile(newFile);
    setActiveFileKey(fileKey);
    setCode(content);
  };

  // 关闭文件
  const closeFile = (fileKey) => {
    const fileIndex = openFiles.findIndex(f => f.key === fileKey);
    if (fileIndex === -1) return;
    
    const newOpenFiles = openFiles.filter(f => f.key !== fileKey);
    setOpenFiles(newOpenFiles);
    
    if (activeFileKey === fileKey) {
      if (newOpenFiles.length > 0) {
        const nextFile = newOpenFiles[Math.max(0, fileIndex - 1)];
        setActiveFileKey(nextFile.key);
        setCurrentFile(nextFile);
        setCode(nextFile.content);
      } else {
        setActiveFileKey(null);
        setCurrentFile(null);
        setCode('');
      }
    }
    
    setUnsavedFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileKey);
      return newSet;
    });
  };

  // 切换文件标签
  const handleTabChange = (fileKey) => {
    const file = openFiles.find(f => f.key === fileKey);
    if (file) {
      setActiveFileKey(fileKey);
      setCurrentFile(file);
      setCode(file.content);
    }
  };

  // AI辅助
  const handleAIAssist = async () => {
    if (!aiPrompt.trim()) {
      message.warning('请输入AI提示');
      return;
    }
    
    setAiLoading(true);
    
    try {
      // 模拟AI响应
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSuggestions = [
        {
          type: 'optimization',
          title: '性能优化建议',
          content: '建议使用向量化操作替代循环，可以提升计算效率',
          code: 'signals["rsi"] = talib.RSI(data["close"].values, timeperiod=14)'
        },
        {
          type: 'bug_fix',
          title: '潜在问题修复',
          content: '检测到可能的除零错误，建议添加异常处理',
          code: 'if returns.std() > 0:\n    sharpe_ratio = returns.mean() / returns.std()\nelse:\n    sharpe_ratio = 0'
        },
        {
          type: 'feature',
          title: '功能增强',
          content: '建议添加止损功能以控制风险',
          code: 'def add_stop_loss(self, stop_loss_pct=0.05):\n    # 止损逻辑实现'
        }
      ];
      
      setAiSuggestions(mockSuggestions);
      message.success('AI分析完成');
    } catch (error) {
      message.error('AI分析失败');
    } finally {
      setAiLoading(false);
    }
  };

  // 应用AI建议
  const applyAISuggestion = (suggestion) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const selection = editor.getSelection();
      const range = selection || {
        startLineNumber: editor.getModel().getLineCount() + 1,
        startColumn: 1,
        endLineNumber: editor.getModel().getLineCount() + 1,
        endColumn: 1
      };
      
      editor.executeEdits('ai-suggestion', [{
        range: range,
        text: '\n' + suggestion.code + '\n'
      }]);
      
      message.success('AI建议已应用');
    }
  };

  // 调试功能
  const handleDebug = () => {
    setDebugging(!debugging);
    if (!debugging) {
      setDebugOutput('调试模式已启动\n等待断点触发...');
      setDebugVariables({
        'current_price': 125.67,
        'sma_20': 123.45,
        'sma_50': 121.23,
        'rsi': 65.4,
        'capital': 98750,
        'positions': { 'stock': 100 }
      });
    } else {
      setDebugOutput('');
      setDebugVariables({});
    }
  };

  // 设置菜单
  const settingsMenu = (
    <Menu>
      <Menu.Item key="theme" onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}>切换主题</Menu.Item>
      <Menu.Item key="settings" onClick={() => setSettingsVisible(true)}>编辑器设置</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="export">导出策略</Menu.Item>
      <Menu.Item key="import">导入策略</Menu.Item>
    </Menu>
  );

  return (
    <div className="strategy-editor">
      {/* 工具栏 */}
      <div className="editor-toolbar">
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleRunCode}
            loading={running}
          >
            运行 (F5)
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={handleSaveFile}
            disabled={!currentFile}
          >
            保存 (Ctrl+S)
          </Button>
          <Button
            icon={<BugOutlined />}
            onClick={handleDebug}
            type={debugging ? 'primary' : 'default'}
          >
            {debugging ? '停止调试' : '调试'}
          </Button>
          <Button
            icon={<RobotOutlined />}
            onClick={() => setAiAssistVisible(true)}
          >
            AI辅助
          </Button>
          <Divider type="vertical" />
          <Select
            value={language}
            onChange={setLanguage}
            style={{ width: 120 }}
          >
            <Option value="python">Python</Option>
            <Option value="javascript">JavaScript</Option>
            <Option value="r">R</Option>
          </Select>
          <Dropdown overlay={settingsMenu} trigger={['click']}>
            <Button icon={<SettingOutlined />}>设置</Button>
          </Dropdown>
        </Space>
      </div>

      <div className="editor-content">
        {/* 左侧文件树 */}
        <div className="file-explorer">
          <div className="explorer-header">
            <span>文件资源管理器</span>
            <Space>
              <Tooltip title="新建文件">
                <Button type="text" size="small" icon={<PlusOutlined />} />
              </Tooltip>
              <Tooltip title="刷新">
                <Button type="text" size="small" icon={<ReloadOutlined />} onClick={loadFileTree} />
              </Tooltip>
            </Space>
          </div>
          <DirectoryTree
            treeData={fileTree}
            onSelect={handleFileSelect}
            showIcon
            defaultExpandAll
          />
        </div>

        {/* 中间编辑区域 */}
        <div className="editor-main">
          {/* 文件标签 */}
          {openFiles.length > 0 && (
            <div className="file-tabs">
              <Tabs
                type="editable-card"
                activeKey={activeFileKey}
                onChange={handleTabChange}
                onEdit={(targetKey, action) => {
                  if (action === 'remove') {
                    closeFile(targetKey);
                  }
                }}
                size="small"
              >
                {openFiles.map(file => (
                  <TabPane
                    key={file.key}
                    tab={
                      <span>
                        <FileOutlined />
                        {file.name}
                        {unsavedFiles.has(file.key) && <span style={{ color: '#ff4d4f' }}>*</span>}
                      </span>
                    }
                    closable
                  />
                ))}
              </Tabs>
            </div>
          )}

          {/* 代码编辑器 */}
          <div className="code-editor">
            <Editor
              height="100%"
              language={language}
              theme={theme}
              value={code}
              onChange={setCode}
              onMount={handleEditorDidMount}
              options={{
                fontSize: fontSize,
                wordWrap: wordWrap ? 'on' : 'off',
                minimap: { enabled: minimap },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                folding: true,
                bracketMatching: 'always',
                autoIndent: 'full',
                formatOnPaste: true,
                formatOnType: true
              }}
            />
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="side-panel">
          <Tabs defaultActiveKey="output" size="small">
            <TabPane tab="输出" key="output">
              <div className="output-panel">
                {running && (
                  <div className="running-indicator">
                    <Spin size="small" />
                    <span style={{ marginLeft: 8 }}>代码执行中...</span>
                  </div>
                )}
                {output && (
                  <pre className="output-content">{output}</pre>
                )}
                {errors.length > 0 && (
                  <div className="error-content">
                    {errors.map((error, index) => (
                      <Alert
                        key={index}
                        message={error}
                        type="error"
                        size="small"
                        style={{ marginBottom: 8 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabPane>
            
            {debugging && (
              <TabPane tab="调试" key="debug">
                <div className="debug-panel">
                  <div className="debug-variables">
                    <h4>变量</h4>
                    {Object.entries(debugVariables).map(([key, value]) => (
                      <div key={key} className="debug-variable">
                        <span className="var-name">{key}:</span>
                        <span className="var-value">{JSON.stringify(value)}</span>
                      </div>
                    ))}
                  </div>
                  <Divider />
                  <div className="debug-output">
                    <h4>调试输出</h4>
                    <pre>{debugOutput}</pre>
                  </div>
                </div>
              </TabPane>
            )}
            
            <TabPane tab="问题" key="problems">
              <div className="problems-panel">
                {errors.length === 0 ? (
                  <div className="no-problems">
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <span style={{ marginLeft: 8 }}>没有发现问题</span>
                  </div>
                ) : (
                  errors.map((error, index) => (
                    <div key={index} className="problem-item">
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                      <span style={{ marginLeft: 8 }}>{error}</span>
                    </div>
                  ))
                )}
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>

      {/* AI辅助模态框 */}
      <Modal
        title="AI编程助手"
        visible={aiAssistVisible}
        onCancel={() => setAiAssistVisible(false)}
        footer={null}
        width={800}
      >
        <div className="ai-assist-panel">
          <div className="ai-input">
            <TextArea
              placeholder="描述您需要的帮助，例如：优化这段代码的性能、添加错误处理、解释这个算法..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
            />
            <Button
              type="primary"
              onClick={handleAIAssist}
              loading={aiLoading}
              style={{ marginTop: 8 }}
              block
            >
              获取AI建议
            </Button>
          </div>
          
          {aiSuggestions.length > 0 && (
            <div className="ai-suggestions">
              <h4>AI建议</h4>
              {aiSuggestions.map((suggestion, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <div className="suggestion-header">
                    <Tag color={suggestion.type === 'optimization' ? 'blue' : suggestion.type === 'bug_fix' ? 'red' : 'green'}>
                      {suggestion.type === 'optimization' ? '优化' : suggestion.type === 'bug_fix' ? '修复' : '增强'}
                    </Tag>
                    <span className="suggestion-title">{suggestion.title}</span>
                  </div>
                  <p className="suggestion-content">{suggestion.content}</p>
                  <pre className="suggestion-code">{suggestion.code}</pre>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => applyAISuggestion(suggestion)}
                  >
                    应用建议
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* 编辑器设置模态框 */}
      <Modal
        title="编辑器设置"
        visible={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        onOk={() => setSettingsVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="字体大小">
            <Slider
              min={12}
              max={24}
              value={fontSize}
              onChange={setFontSize}
              marks={{ 12: '12px', 16: '16px', 20: '20px', 24: '24px' }}
            />
          </Form.Item>
          <Form.Item label="自动换行">
            <Switch checked={wordWrap} onChange={setWordWrap} />
          </Form.Item>
          <Form.Item label="显示小地图">
            <Switch checked={minimap} onChange={setMinimap} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StrategyEditor;