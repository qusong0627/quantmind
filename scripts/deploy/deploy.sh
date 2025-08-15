#!/bin/bash

echo "🚀 部署QuantMind平台..."

# 检查Docker状态
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 进入项目目录
cd "$(dirname "$0")/../.."

# 检查环境配置文件
if [ ! -f ".env" ]; then
    echo "📝 创建环境配置文件..."
    cp env.example .env
    echo "⚠️  请编辑 .env 文件配置您的环境变量"
fi

# 构建基础镜像
echo "🔨 构建基础镜像..."
docker-compose build python-base

# 构建所有服务
echo "🔨 构建所有服务..."
docker-compose build --no-cache

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 60

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 健康检查
echo "🏥 执行健康检查..."
./scripts/deploy/health_check.sh

echo "✅ 部署完成！"
echo "🌐 前端地址: http://localhost:3000"
echo "🔌 API地址: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
