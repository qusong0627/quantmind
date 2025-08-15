#!/bin/bash

echo "🚀 QuantMind 快速启动脚本"

# 检查Docker状态
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 检查环境配置
if [ ! -f ".env" ]; then
    echo "📝 创建环境配置文件..."
    cp env.example .env
    echo "⚠️  请编辑 .env 文件配置您的环境变量"
    echo "按任意键继续..."
    read -n 1
fi

# 构建基础镜像
echo "🔨 构建基础镜像..."
docker-compose build python-base

# 启动核心服务
echo "🚀 启动核心服务..."
docker-compose up -d mysql redis influxdb

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 30

# 启动后端服务
echo "🔧 启动后端服务..."
docker-compose up -d api-gateway ai-strategy backtest data-management user-service data-service

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 启动前端
echo "🌐 启动前端服务..."
docker-compose up -d web-frontend

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

echo "✅ 启动完成！"
echo "🌐 前端地址: http://localhost:3000"
echo "🔌 API地址: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
echo "🏥 健康检查: http://localhost:8000/health"
