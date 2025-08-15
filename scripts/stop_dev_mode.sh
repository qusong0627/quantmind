#!/bin/bash

# QuantMind 开发模式停止脚本

echo "🛑 停止 QuantMind 开发模式服务..."

# 停止开发模式API网关
if [ -f .dev_api_gateway.pid ]; then
    PID=$(cat .dev_api_gateway.pid)
    if ps -p $PID > /dev/null; then
        echo "  停止开发模式API网关 (PID: $PID)..."
        kill $PID
        rm .dev_api_gateway.pid
        echo "  ✅ 开发模式API网关已停止"
    else
        echo "  ⚠️ 开发模式API网关进程不存在 (PID: $PID)"
        rm .dev_api_gateway.pid
    fi
else
    echo "  ⚠️ 未找到开发模式API网关PID文件"
    # 尝试通过进程名查找并停止
    pkill -f "python3.*dev_main.py" 2>/dev/null && echo "  ✅ 已停止开发模式API网关进程" || echo "  ℹ️ 未找到开发模式API网关进程"
fi

echo "✅ 所有开发模式服务已停止"