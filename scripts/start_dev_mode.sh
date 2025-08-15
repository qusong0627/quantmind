#!/bin/bash

# QuantMind 开发模式启动脚本
# 启动禁用认证的API网关，方便开发测试

set -e

echo "🚀 启动 QuantMind 开发模式 (禁用认证)..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs
mkdir -p data

# 安装Python依赖
echo "📦 安装Python依赖..."
pip3 install fastapi uvicorn pydantic PyJWT

# 停止可能存在的旧进程
echo "🧹 清理旧进程..."
pkill -f "python3.*main.py" 2>/dev/null || true

# 设置开发模式环境变量
export DEV_MODE=true
export DEV_API_PORT=8000

# 启动开发模式API网关
echo "🔧 启动开发模式API网关 (端口${DEV_API_PORT})..."
export PYTHONPATH="$PWD:$PYTHONPATH"
python3 -m backend.api-gateway.main > logs/dev_api_gateway.log 2>&1 &
DEV_API_GATEWAY_PID=$!  

# 保存进程ID
echo $DEV_API_GATEWAY_PID > .dev_api_gateway.pid

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -s http://localhost:${DEV_API_PORT}/health > /dev/null 2>&1; then
    echo "  ✅ 开发模式API网关运行正常"
else
    echo "  ❌ 开发模式API网关启动失败"
    exit 1
fi

# 检查开发模式状态
DEV_STATUS=$(curl -s http://localhost:${DEV_API_PORT}/dev/status)
echo "  🔐 认证状态: $(echo $DEV_STATUS | grep -o '"auth":"[^"]*"' | cut -d '"' -f 4)"
echo "  👤 默认用户: $(echo $DEV_STATUS | grep -o '"default_user":"[^"]*"' | cut -d '"' -f 4)"

# 测试登录功能
echo "🧪 测试登录功能..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:${DEV_API_PORT}/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "  ✅ 登录功能正常"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d '"' -f 4)
    echo "  🔑 Token: ${TOKEN:0:15}..."
else
    echo "  ❌ 登录功能异常"
    echo "  响应: $LOGIN_RESPONSE"
fi

echo ""
echo "✨ 开发模式已启动，认证已禁用"
echo "📝 访问地址:"
echo "  API网关: http://localhost:${DEV_API_PORT}"
echo "  开发状态: http://localhost:${DEV_API_PORT}/dev/status"
echo ""
echo "👤 测试账号:"
echo "  管理员: admin / admin123"
echo "  普通用户: user / user123"
echo "  注意: 开发模式下，任何账号都会自动登录成功"
echo ""
echo "🛑 停止服务:"
echo "  ./scripts/stop_dev_mode.sh"
echo ""