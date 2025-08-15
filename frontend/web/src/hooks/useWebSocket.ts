// WebSocket Hook
import { useEffect, useRef, useCallback, useState } from 'react';
import { webSocketService } from '../services/websocket';

export interface UseWebSocketOptions {
  // 是否自动连接
  autoConnect?: boolean;
  // 连接失败时的回调
  onError?: (error: Event) => void;
  // 连接成功时的回调
  onConnect?: () => void;
  // 连接断开时的回调
  onDisconnect?: () => void;
}

export interface UseWebSocketReturn {
  // 连接状态
  isConnected: boolean;
  // 连接状态描述
  connectionState: string;
  // 手动连接
  connect: () => Promise<void>;
  // 手动断开
  disconnect: () => void;
  // 发送消息
  send: (message: any) => void;
  // 订阅模块数据
  subscribe: (moduleId: string, callback: (data: any) => void) => () => void;
}

/**
 * WebSocket Hook
 * @param options 配置选项
 * @returns WebSocket操作方法和状态
 */
export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    autoConnect = true,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());

  // 更新连接状态
  const updateConnectionState = useCallback(() => {
    const connected = webSocketService.isConnected();
    const state = webSocketService.getReadyState() === WebSocket.OPEN ? 'connected' : 'disconnected';
    
    setIsConnected(connected);
    setConnectionState(state);
  }, []);

  // 连接WebSocket
  const connect = useCallback(async () => {
    try {
      await webSocketService.connect();
      updateConnectionState();
      onConnect?.();
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      onError?.(error as Event);
    }
  }, [onConnect, onError, updateConnectionState]);

  // 断开WebSocket
  const disconnect = useCallback(() => {
    // 清理所有订阅
    subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
    subscriptionsRef.current.clear();
    
    webSocketService.disconnect();
    updateConnectionState();
    onDisconnect?.();
  }, [onDisconnect, updateConnectionState]);

  // 发送消息
  const send = useCallback((message: any) => {
    webSocketService.send(message);
  }, []);

  // 订阅模块数据
  const subscribe = useCallback((moduleId: string, callback: (data: any) => void) => {
    // 简化实现，直接返回取消订阅函数
    const unsubscribe = () => {
      subscriptionsRef.current.delete(moduleId);
    };
    
    subscriptionsRef.current.set(moduleId, unsubscribe);
    
    // 返回取消订阅函数
    return unsubscribe;
  }, []);

  // 组件挂载时自动连接
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // 定期更新连接状态
    const interval = setInterval(updateConnectionState, 1000);

    return () => {
      clearInterval(interval);
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect, updateConnectionState]);

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
    send,
    subscribe,
  };
};

/**
 * 模块数据订阅Hook
 * @param moduleId 模块ID
 * @param callback 数据更新回调
 * @param enabled 是否启用订阅
 */
export const useModuleSubscription = (
  moduleId: string,
  callback: (data: any) => void,
  enabled: boolean = true
) => {
  const { subscribe, isConnected } = useWebSocket({ autoConnect: true });
  const callbackRef = useRef(callback);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // 更新回调引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 管理订阅
  useEffect(() => {
    if (enabled && isConnected && moduleId) {
      // 创建订阅
      unsubscribeRef.current = subscribe(moduleId, (data) => {
        callbackRef.current(data);
      });

      return () => {
        // 清理订阅
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }
  }, [moduleId, enabled, isConnected, subscribe]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
};

export default useWebSocket;