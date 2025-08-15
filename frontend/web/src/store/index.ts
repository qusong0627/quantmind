// Redux Toolkit Store 配置
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import moduleDataReducer from './slices/moduleDataSlice';
import userPreferencesReducer from './slices/userPreferencesSlice';

// 配置 Redux Store
export const store = configureStore({
  reducer: {
    moduleData: moduleDataReducer,
    userPreferences: userPreferencesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略这些 action types 的序列化检查
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // 忽略这些字段的序列化检查
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 类型化的 hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// 默认导出 store
export default store;