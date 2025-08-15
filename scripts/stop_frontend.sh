#!/bin/bash

# 停止 QuantMind 前端服务

echo "🛑 停止 QuantMind 前端服务..."

# 停止前端服务
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "  停止前端服务..."
        kill $FRONTEND_PID
        rm .frontend.pid
    fi
fi

# 清理可能的残留进程
echo "🧹 清理残留进程..."
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "webpack-dev-server" 2>/dev/null || true

# 清理端口占用
if lsof -i :3000 > /dev/null 2>&1; then
    echo "  清理端口3000..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
fi

echo "✅ 前端服务已停止" 