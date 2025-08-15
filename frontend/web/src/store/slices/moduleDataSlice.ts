// 模块数据状态管理 Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ModuleDataState, RealTimeUpdate, ApiResponse } from '../../types/dashboard';

// 初始状态
const initialState: ModuleDataState = {};

// 异步 thunks
export const fetchModuleData = createAsyncThunk(
  'moduleData/fetchData',
  async ({ moduleId, params }: { moduleId: string; params?: any }) => {
    // 这里应该根据模块ID调用相应的API
    // 暂时返回模拟数据
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟网络延迟
    
    let mockData: any;
    
    switch (moduleId) {
      case 'market-overview':
        mockData = {
          indices: [
            { name: '上证指数', value: 3245.67, change: 12.34, changePercent: 0.38 },
            { name: '深证成指', value: 12456.78, change: -23.45, changePercent: -0.19 },
            { name: '创业板指', value: 2567.89, change: 45.67, changePercent: 1.81 },
          ],
          summary: {
            totalMarketCap: '45.6万亿',
            tradingVolume: '8,234亿',
            activeStocks: 4567,
          }
        };
        break;
        
      case 'portfolio-summary':
        mockData = {
          totalValue: 1234567.89,
          totalReturn: 123456.78,
          totalReturnPercent: 11.23,
          dayChange: 5678.90,
          dayChangePercent: 0.46,
          positions: [
            { symbol: 'AAPL', name: '苹果', value: 234567, weight: 18.9 },
            { symbol: 'MSFT', name: '微软', value: 198765, weight: 16.1 },
            { symbol: 'GOOGL', name: '谷歌', value: 156789, weight: 12.7 },
          ]
        };
        break;
        
      case 'trading-signals':
        mockData = {
          signals: [
            {
              id: '1',
              symbol: 'TSLA',
              name: '特斯拉',
              signal: 'BUY',
              confidence: 0.85,
              price: 245.67,
              targetPrice: 280.00,
              reason: '技术指标显示突破阻力位',
              timestamp: new Date().toISOString(),
            },
            {
              id: '2',
              symbol: 'NVDA',
              name: '英伟达',
              signal: 'HOLD',
              confidence: 0.72,
              price: 456.78,
              targetPrice: 480.00,
              reason: '等待财报发布',
              timestamp: new Date().toISOString(),
            },
          ]
        };
        break;
        
      case 'market-news':
        mockData = {
          news: [
            {
              id: '1',
              title: '美联储宣布维持利率不变',
              summary: '美联储在最新的货币政策会议上决定维持基准利率不变...',
              source: '财经新闻',
              publishTime: new Date(Date.now() - 3600000).toISOString(),
              impact: 'high',
            },
            {
              id: '2',
              title: '科技股集体上涨，AI概念股领涨',
              summary: '今日科技股表现强劲，人工智能相关概念股涨幅居前...',
              source: '市场快讯',
              publishTime: new Date(Date.now() - 7200000).toISOString(),
              impact: 'medium',
            },
          ]
        };
        break;
        
      default:
        mockData = { message: '暂无数据' };
    }
    
    return { moduleId, data: mockData };
  }
);

export const refreshModuleData = createAsyncThunk(
  'moduleData/refreshData',
  async (moduleId: string) => {
    // 刷新特定模块的数据
    return await fetchModuleData({ moduleId });
  }
);

export const refreshAllModules = createAsyncThunk(
  'moduleData/refreshAll',
  async (moduleIds: string[]) => {
    // 批量刷新多个模块的数据
    const promises = moduleIds.map(moduleId => 
      fetchModuleData({ moduleId })
    );
    
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);
  }
);

// Module Data Slice
const moduleDataSlice = createSlice({
  name: 'moduleData',
  initialState,
  reducers: {
    // 设置模块数据
    setModuleData: (state, action: PayloadAction<{ moduleId: string; data: any }>) => {
      const { moduleId, data } = action.payload;
      
      if (!state[moduleId]) {
        state[moduleId] = {
          data: null,
          loading: false,
          error: null,
          lastFetched: null,
        };
      }
      
      state[moduleId].data = data;
      state[moduleId].lastFetched = new Date().toISOString();
      state[moduleId].error = null;
    },
    
    // 设置模块加载状态
    setModuleLoading: (state, action: PayloadAction<{ moduleId: string; loading: boolean }>) => {
      const { moduleId, loading } = action.payload;
      
      if (!state[moduleId]) {
        state[moduleId] = {
          data: null,
          loading: false,
          error: null,
          lastFetched: null,
        };
      }
      
      state[moduleId].loading = loading;
    },
    
    // 设置模块错误
    setModuleError: (state, action: PayloadAction<{ moduleId: string; error: string }>) => {
      const { moduleId, error } = action.payload;
      
      if (!state[moduleId]) {
        state[moduleId] = {
          data: null,
          loading: false,
          error: null,
          lastFetched: null,
        };
      }
      
      state[moduleId].error = error;
      state[moduleId].loading = false;
    },
    
    // 清除模块错误
    clearModuleError: (state, action: PayloadAction<string>) => {
      const moduleId = action.payload;
      if (state[moduleId]) {
        state[moduleId].error = null;
      }
    },
    
    // 处理实时数据更新
    handleRealTimeUpdate: (state, action: PayloadAction<RealTimeUpdate>) => {
      const { moduleId, data, updateType } = action.payload;
      
      if (!state[moduleId]) {
        state[moduleId] = {
          data: null,
          loading: false,
          error: null,
          lastFetched: null,
        };
      }
      
      switch (updateType) {
        case 'full':
          // 完全替换数据
          state[moduleId].data = data;
          break;
          
        case 'partial':
          // 部分更新数据
          if (state[moduleId].data && typeof state[moduleId].data === 'object') {
            state[moduleId].data = { ...state[moduleId].data, ...data };
          } else {
            state[moduleId].data = data;
          }
          break;
          
        case 'append':
          // 追加数据（适用于列表类型）
          if (Array.isArray(state[moduleId].data)) {
            state[moduleId].data.push(...(Array.isArray(data) ? data : [data]));
          } else if (state[moduleId].data && typeof state[moduleId].data === 'object') {
            // 如果是对象，尝试合并数组字段
            Object.keys(data).forEach(key => {
              if (Array.isArray(data[key]) && Array.isArray(state[moduleId].data[key])) {
                state[moduleId].data[key].push(...data[key]);
              } else {
                state[moduleId].data[key] = data[key];
              }
            });
          } else {
            state[moduleId].data = data;
          }
          break;
      }
      
      state[moduleId].lastFetched = new Date().toISOString();
    },
    
    // 移除模块数据
    removeModuleData: (state, action: PayloadAction<string>) => {
      const moduleId = action.payload;
      delete state[moduleId];
    },
    
    // 清空所有模块数据
    clearAllModuleData: (state) => {
      return {};
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取模块数据
      .addCase(fetchModuleData.pending, (state, action) => {
        const moduleId = action.meta.arg.moduleId;
        
        if (!state[moduleId]) {
          state[moduleId] = {
            data: null,
            loading: false,
            error: null,
            lastFetched: null,
          };
        }
        
        state[moduleId].loading = true;
        state[moduleId].error = null;
      })
      .addCase(fetchModuleData.fulfilled, (state, action) => {
        const { moduleId, data } = action.payload;
        
        state[moduleId].loading = false;
        state[moduleId].data = data;
        state[moduleId].lastFetched = new Date().toISOString();
        state[moduleId].error = null;
      })
      .addCase(fetchModuleData.rejected, (state, action) => {
        const moduleId = action.meta.arg.moduleId;
        
        if (state[moduleId]) {
          state[moduleId].loading = false;
          state[moduleId].error = action.error.message || '获取数据失败';
        }
      })
      
      // 刷新所有模块数据
      .addCase(refreshAllModules.fulfilled, (state, action) => {
        action.payload.forEach(({ moduleId, data }) => {
          if (state[moduleId]) {
            state[moduleId].data = data;
            state[moduleId].lastFetched = new Date().toISOString();
            state[moduleId].error = null;
          }
        });
      });
  },
});

// 导出 actions
export const {
  setModuleData,
  setModuleLoading,
  setModuleError,
  clearModuleError,
  handleRealTimeUpdate,
  removeModuleData,
  clearAllModuleData,
} = moduleDataSlice.actions;

// 导出 reducer
export default moduleDataSlice.reducer;

// 选择器
export const selectModuleData = (moduleId: string) => 
  (state: { moduleData: ModuleDataState }) => state.moduleData[moduleId];

export const selectAllModuleData = (state: { moduleData: ModuleDataState }) => state.moduleData;

export const selectModuleLoading = (moduleId: string) => 
  (state: { moduleData: ModuleDataState }) => state.moduleData[moduleId]?.loading || false;

export const selectModuleError = (moduleId: string) => 
  (state: { moduleData: ModuleDataState }) => state.moduleData[moduleId]?.error || null;

export const selectModuleLastFetched = (moduleId: string) => 
  (state: { moduleData: ModuleDataState }) => state.moduleData[moduleId]?.lastFetched || null;