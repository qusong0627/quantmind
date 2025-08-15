#!/bin/bash

# QuantMind 前端启动脚本

set -e

echo "🚀 启动 QuantMind 前端服务..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
echo -e "${GREEN}✅ npm: $(npm --version)${NC}"

# 进入前端目录
cd frontend/web

# 检查package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json 不存在${NC}"
    exit 1
fi

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装前端依赖...${NC}"
    npm install --legacy-peer-deps
fi

# 停止可能存在的旧进程
echo -e "${YELLOW}🧹 清理旧进程...${NC}"
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "webpack-dev-server" 2>/dev/null || true

# 检查端口占用
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  端口3000被占用，正在清理...${NC}"
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# 启动前端服务
echo -e "${BLUE}🔧 启动前端服务 (端口3000)...${NC}"
echo -e "${YELLOW}📝 注意: 首次启动可能需要几分钟时间${NC}"
echo -e "${YELLOW}📝 如果看到警告信息，这是正常的，不影响功能${NC}"

# 使用GENERATE_SOURCEMAP=false减少警告
export GENERATE_SOURCEMAP=false

# 启动服务
npm start > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# 保存进程ID
echo $FRONTEND_PID > ../../.frontend.pid

# 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo -e "${BLUE}🔍 检查服务状态...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端服务启动成功！${NC}"
        break
    else
        echo -e "${YELLOW}⏳ 等待中... ($i/30)${NC}"
        sleep 2
    fi
done

if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ 前端服务启动失败${NC}"
    echo -e "${YELLOW}📝 查看日志: tail -f logs/frontend.log${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 前端服务启动完成！${NC}"
echo ""
echo -e "${BLUE}🌐 访问地址:${NC}"
echo "  前端应用: http://localhost:3000"
echo "  后端API: http://localhost:8000"
echo "  API文档: http://localhost:8000/docs"
echo ""
echo -e "${BLUE}👤 测试账号:${NC}"
echo "  管理员: admin / admin123"
echo "  普通用户: user / user123"
echo ""
echo -e "${BLUE}📝 管理命令:${NC}"
echo "  查看日志: tail -f logs/frontend.log"
echo "  停止服务: ./scripts/stop_frontend.sh"
echo ""
echo -e "${YELLOW}💡 提示: 如果页面显示异常，请刷新浏览器${NC}" 