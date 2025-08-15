#!/bin/bash

# QuantMind 仅后端启动脚本
# 不依赖前端，直接通过API测试功能

set -e

echo "🚀 启动 QuantMind 后端服务..."

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
pkill -f "python3.*simple_main.py" 2>/dev/null || true

# 启动API网关
echo "🔧 启动API网关 (端口8000)..."
cd backend/api-gateway
python3 simple_main.py > ../../logs/api_gateway.log 2>&1 &
API_GATEWAY_PID=$!
cd ../..

# 保存进程ID
echo $API_GATEWAY_PID > .api_gateway.pid

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "  ✅ API网关运行正常"
else
    echo "  ❌ API网关启动失败"
    exit 1
fi

# 测试登录功能
echo "🧪 测试登录功能..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "  ✅ 登录功能正常"
else
    echo "  ❌ 登录功能异常"
    echo "  响应: $LOGIN_RESPONSE"
fi

echo ""
echo "🌐 服务信息:"
echo "API网关: http://localhost:8000"
echo "API文档: http://localhost:8000/docs"
echo "健康检查: http://localhost:8000/health"
echo ""
echo "👤 测试账号:"
echo "  用户名: admin, 密码: admin123"
echo "  用户名: user, 密码: user123"
echo ""
echo "🧪 API测试命令:"
echo ""
echo "# 测试登录"
echo "curl -X POST http://localhost:8000/v1/auth/login \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"username\": \"admin\", \"password\": \"admin123\"}'"
echo ""
echo "# 测试健康检查"
echo "curl http://localhost:8000/health"
echo ""
echo "# 获取用户信息 (需要token)"
echo "curl -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "  http://localhost:8000/api/v1/user/profile"
echo ""
echo "📝 日志查看:"
echo "  tail -f logs/api_gateway.log"
echo ""
echo "🛠️  停止服务:"
echo "  ./scripts/stop_backend_only.sh"
echo ""
echo "🎉 后端服务启动完成!"
echo ""
echo "💡 您可以通过以下方式测试:"
echo "  1. 浏览器访问: http://localhost:8000/docs"
echo "  2. 使用curl命令测试API"
echo "  3. 使用Postman等API测试工具" 