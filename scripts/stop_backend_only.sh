#!/bin/bash

# 停止 QuantMind 后端服务

echo "🛑 停止 QuantMind 后端服务..."

# 停止API网关
if [ -f .api_gateway.pid ]; then
    API_GATEWAY_PID=$(cat .api_gateway.pid)
    if kill -0 $API_GATEWAY_PID 2>/dev/null; then
        echo "  停止API网关..."
        kill $API_GATEWAY_PID
        rm .api_gateway.pid
    fi
fi

# 清理可能的残留进程
echo "🧹 清理残留进程..."
pkill -f "python3.*simple_main.py" 2>/dev/null || true

echo "✅ 后端服务已停止" 