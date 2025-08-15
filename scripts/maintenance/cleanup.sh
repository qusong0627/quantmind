#!/bin/bash

echo "🧹 清理Docker资源..."

# 停止所有服务
echo "🛑 停止所有服务..."
docker-compose down

# 清理未使用的镜像
echo "🗑️  清理未使用的镜像..."
docker image prune -f

# 清理未使用的容器
echo "🗑️  清理未使用的容器..."
docker container prune -f

# 清理未使用的网络
echo "🗑️  清理未使用的网络..."
docker network prune -f

# 清理未使用的卷
echo "🗑️  清理未使用的卷..."
docker volume prune -f

# 清理构建缓存
echo "🗑️  清理构建缓存..."
docker builder prune -f

echo "✅ 清理完成！"
echo "💡 提示: 使用 'docker system df' 查看Docker磁盘使用情况"
