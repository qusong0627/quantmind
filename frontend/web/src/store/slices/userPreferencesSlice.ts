// 用户偏好设置状态管理 Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserPreferences } from '../../types/dashboard';

// 初始状态
const initialState: UserPreferences = {
  defaultLayout: 'default',
  theme: 'light',
  autoRefresh: true,
  refreshInterval: 30000, // 30秒
  notifications: true,
  compactMode: false,
};

// 从本地存储加载偏好设置
const loadPreferencesFromStorage = (): UserPreferences => {
  try {
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...initialState, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load user preferences from localStorage:', error);
  }
  return initialState;
};

// 保存偏好设置到本地存储
const savePreferencesToStorage = (preferences: UserPreferences) => {
  try {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save user preferences to localStorage:', error);
  }
};

// 异步 thunks
export const loadUserPreferences = createAsyncThunk(
  'userPreferences/load',
  async () => {
    // 从本地存储或服务器加载用户偏好
    const preferences = loadPreferencesFromStorage();
    return preferences;
  }
);

export const saveUserPreferences = createAsyncThunk(
  'userPreferences/save',
  async (preferences: UserPreferences) => {
    // 保存到本地存储和服务器
    savePreferencesToStorage(preferences);
    
    // 这里可以添加保存到服务器的逻辑
    // await api.saveUserPreferences(preferences);
    
    return preferences;
  }
);

// User Preferences Slice
const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState: loadPreferencesFromStorage(),
  reducers: {
    // 设置默认布局
    setDefaultLayout: (state, action: PayloadAction<string>) => {
      state.defaultLayout = action.payload;
      savePreferencesToStorage(state);
    },
    
    // 设置主题
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
      savePreferencesToStorage(state);
    },
    
    // 切换主题
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      savePreferencesToStorage(state);
    },
    
    // 设置自动刷新
    setAutoRefresh: (state, action: PayloadAction<boolean>) => {
      state.autoRefresh = action.payload;
      savePreferencesToStorage(state);
    },
    
    // 切换自动刷新
    toggleAutoRefresh: (state) => {
      state.autoRefresh = !state.autoRefresh;
      savePreferencesToStorage(state);
    },
    
    // 设置刷新间隔
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
      savePreferencesToStorage(state);
    },
    
    // 设置通知
    setNotifications: (state, action: PayloadAction<boolean>) => {
      state.notifications = action.payload;
      savePreferencesToStorage(state);
    },
    
    // 切换通知
    toggleNotifications: (state) => {
      state.notifications = !state.notifications;
      savePreferencesToStorage(state);
    },
    
    // 设置紧凑模式
    setCompactMode: (state, action: PayloadAction<boolean>) => {
      state.compactMode = action.payload;
      savePreferencesToStorage(state);
    },
    
    // 切换紧凑模式
    toggleCompactMode: (state) => {
      state.compactMode = !state.compactMode;
      savePreferencesToStorage(state);
    },
    
    // 批量更新偏好设置
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      Object.assign(state, action.payload);
      savePreferencesToStorage(state);
    },
    
    // 重置偏好设置
    resetPreferences: (state) => {
      Object.assign(state, initialState);
      savePreferencesToStorage(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserPreferences.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
      })
      .addCase(saveUserPreferences.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
      });
  },
});

// 导出 actions
export const {
  setDefaultLayout,
  setTheme,
  toggleTheme,
  setAutoRefresh,
  toggleAutoRefresh,
  setRefreshInterval,
  setNotifications,
  toggleNotifications,
  setCompactMode,
  toggleCompactMode,
  updatePreferences,
  resetPreferences,
} = userPreferencesSlice.actions;

// 导出 reducer
export default userPreferencesSlice.reducer;

// 选择器
export const selectUserPreferences = (state: { userPreferences: UserPreferences }) => state.userPreferences;
export const selectTheme = (state: { userPreferences: UserPreferences }) => state.userPreferences.theme;
export const selectDefaultLayout = (state: { userPreferences: UserPreferences }) => state.userPreferences.defaultLayout;
export const selectAutoRefresh = (state: { userPreferences: UserPreferences }) => state.userPreferences.autoRefresh;
export const selectRefreshInterval = (state: { userPreferences: UserPreferences }) => state.userPreferences.refreshInterval;
export const selectNotifications = (state: { userPreferences: UserPreferences }) => state.userPreferences.notifications;
export const selectCompactMode = (state: { userPreferences: UserPreferences }) => state.userPreferences.compactMode;
export const selectGridMargin = (state: { userPreferences: UserPreferences }) => [10, 10]; // 默认网格边距
export const selectGridPadding = (state: { userPreferences: UserPreferences }) => [10, 10]; // 默认网格内边距