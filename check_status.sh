#!/bin/bash

echo "🔍 QuantMind 项目状态检查"

echo "=== Docker服务状态 ==="
docker-compose ps

echo -e "\n=== 系统资源使用 ==="
echo "内存使用:"
free -h

echo -e "\n磁盘使用:"
df -h

echo -e "\n=== 容器资源使用 ==="
docker stats --no-stream

echo -e "\n=== 网络端口监听 ==="
netstat -tulpn | grep -E ':(3000|8000|8001|8002|8003|8005|8008|3306|6379|8086)'

echo -e "\n=== 服务健康检查 ==="
services=(
    "api-gateway:8000"
    "ai-strategy:8003"
    "backtest:8002"
    "data-management:8008"
    "user-service:8001"
    "data-service:8005"
)

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f1)
    
    if curl -f "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $name: 正常"
    else
        echo "❌ $name: 异常"
    fi
done

echo -e "\n=== 日志文件大小 ==="
find logs/ -name "*.log" -exec ls -lh {} \; 2>/dev/null || echo "无日志文件"

echo -e "\n检查完成！"
