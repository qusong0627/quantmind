#!/bin/bash

# QuantMind 优化启动脚本
# 包含监控、安全、性能优化等功能

set -e

echo "🚀 启动 QuantMind 优化版本..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 检查必要的环境变量
if [ ! -f ".env" ]; then
    echo "⚠️  未找到.env文件，使用默认配置"
    cp .env.example .env 2>/dev/null || echo "未找到.env.example文件"
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs
mkdir -p data/mysql/init
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p monitoring/nginx/ssl

# 启动监控服务
echo "📊 启动监控服务..."
docker-compose -f docker-compose.monitoring.yml up -d

# 等待监控服务启动
echo "⏳ 等待监控服务启动..."
sleep 10

# 启动主服务
echo "🔧 启动主服务..."
docker-compose up -d

# 启动Celery工作进程
echo "🔄 启动异步任务队列..."
docker-compose exec -d ai-strategy celery -A backend.shared.celery_app worker --loglevel=info --concurrency=4
docker-compose exec -d data-service celery -A backend.shared.celery_app worker --loglevel=info --concurrency=2
docker-compose exec -d backtest celery -A backend.shared.celery_app worker --loglevel=info --concurrency=2

# 启动Celery Beat调度器
echo "⏰ 启动定时任务调度器..."
docker-compose exec -d ai-strategy celery -A backend.shared.celery_app beat --loglevel=info

# 预热缓存
echo "🔥 预热缓存..."
docker-compose exec data-service python -c "
from backend.shared.cache import CacheWarmup, cache_service
warmup = CacheWarmup(cache_service)
warmup.warmup_popular_stocks()
warmup.warmup_strategy_templates()
warmup.warmup_market_data()
print('缓存预热完成')
"

# 检查服务状态
echo "🔍 检查服务状态..."
sleep 5

# 显示服务状态
echo "📋 服务状态:"
docker-compose ps

# 显示访问信息
echo ""
echo "🌐 访问信息:"
echo "前端应用: http://localhost:3000"
echo "API网关: http://localhost:8000"
echo "API文档: http://localhost:8000/docs"
echo "Grafana监控: http://localhost:3000 (admin/admin)"
echo "Prometheus: http://localhost:9090"
echo "Jaeger追踪: http://localhost:16686"
echo "Kibana日志: http://localhost:5601"

# 健康检查
echo ""
echo "🏥 执行健康检查..."
curl -f http://localhost:8000/health > /dev/null 2>&1 && echo "✅ API网关健康检查通过" || echo "❌ API网关健康检查失败"
curl -f http://localhost:3000 > /dev/null 2>&1 && echo "✅ 前端应用健康检查通过" || echo "❌ 前端应用健康检查失败"

echo ""
echo "🎉 QuantMind 优化版本启动完成!"
echo ""
echo "📊 监控面板:"
echo "  - Grafana: http://localhost:3000"
echo "  - Prometheus: http://localhost:9090"
echo ""
echo "📝 日志查看:"
echo "  - 应用日志: docker-compose logs -f"
echo "  - 特定服务: docker-compose logs -f api-gateway"
echo ""
echo "🛠️  常用命令:"
echo "  - 停止服务: docker-compose down"
echo "  - 重启服务: docker-compose restart"
echo "  - 查看状态: docker-compose ps"
echo "  - 查看日志: docker-compose logs -f [服务名]"