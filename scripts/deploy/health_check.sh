#!/bin/bash

echo "🏥 执行健康检查..."

services=(
    "api-gateway:8000"
    "ai-strategy:8003"
    "backtest:8002"
    "data-management:8008"
    "user-service:8001"
    "data-service:8005"
)

all_healthy=true

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    echo "🔍 检查 $name 服务..."
    if curl -f "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $name 服务正常"
    else
        echo "❌ $name 服务异常"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    echo "🎉 所有服务健康检查通过！"
else
    echo "⚠️  部分服务健康检查失败，请查看日志"
    echo "📋 查看服务日志: docker-compose logs -f"
fi

echo "🏥 健康检查完成！"
