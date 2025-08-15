#!/bin/bash

echo "🔄 QuantMind 项目重置脚本"

read -p "⚠️  此操作将删除所有数据，确定继续吗？(y/N): " confirm

if [[ $confirm != [yY] ]]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo "�� 停止所有服务..."
docker-compose down

echo "🗑️  删除所有容器..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

echo "🗑️  删除所有镜像..."
docker rmi -f $(docker images -q) 2>/dev/null || true

echo "🗑️  删除所有卷..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

echo "🗑️  删除所有网络..."
docker network rm $(docker network ls -q) 2>/dev/null || true

echo "🧹 清理构建缓存..."
docker builder prune -f

echo "📁 清理数据目录..."
rm -rf data/mysql/* data/redis/* data/influxdb/* logs/*

echo "✅ 项目重置完成！"
echo "💡 现在可以重新运行 ./quick_start.sh 启动项目"
