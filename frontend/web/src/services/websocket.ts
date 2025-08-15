// WebSocket 服务
import { store } from '../store';
import { handleRealTimeUpdate } from '../store/slices/moduleDataSlice';
import { WebSocketMessage, RealTimeUpdate } from '../types/dashboard';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private isConnecting = false;
  private messageQueue: WebSocketMessage[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private url: string;

  constructor(url: string = 'ws://localhost:8080/ws') {
    this.url = url;
  }

  // 连接WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.processMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // 断开连接
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.reconnectAttempts = this.maxReconnectAttempts;
  }

  // 发送消息
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // 如果连接未建立，将消息加入队列
      this.messageQueue.push(message);
      if (!this.isConnecting) {
        this.connect().catch(console.error);
      }
    }
  }

  // 处理接收到的消息
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'realtime_update':
          this.handleRealTimeUpdate(message.payload);
          break;
        case 'heartbeat':
          // 心跳响应，不需要特殊处理
          break;
        case 'error':
          console.error('WebSocket server error:', message.payload);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  // 处理实时数据更新
  private handleRealTimeUpdate(payload: any): void {
    const update: RealTimeUpdate = {
      type: payload.type || 'data_update',
      moduleId: payload.moduleId,
      updateType: payload.updateType,
      data: payload.data,
      timestamp: payload.timestamp || Date.now(),
      source: 'websocket'
    };

    // 分发到Redux store
    store.dispatch(handleRealTimeUpdate(update));
  }

  // 处理重连
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // 处理消息队列
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  // 开始心跳
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          payload: { timestamp: Date.now() },
          timestamp: Date.now()
        });
      }
    }, 30000); // 30秒心跳
  }

  // 停止心跳
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 获取连接状态
  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  // 检查是否已连接
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 创建全局WebSocket服务实例
export const webSocketService = new WebSocketService();

// 导出WebSocket服务类
export default WebSocketService;