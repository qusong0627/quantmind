#!/bin/bash

# QuantMind 项目简化环境配置脚本
# 自动检查和安装基础软件和依赖

set -e

echo "🚀 QuantMind 项目环境配置开始..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 已安装${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 未安装${NC}"
        return 1
    fi
}

# 1. 检查系统环境
echo -e "${BLUE}=== 系统环境检查 ===${NC}"
uname -a

# 2. 检查Python环境
echo -e "${BLUE}=== Python环境检查 ===${NC}"
if check_command python3; then
    python3 --version
else
    echo -e "${RED}请先安装Python3${NC}"
    exit 1
fi

# 3. 检查Node.js环境
echo -e "${BLUE}=== Node.js环境检查 ===${NC}"
if check_command node; then
    node --version
else
    echo -e "${RED}Node.js未安装，请从 https://nodejs.org/ 下载安装${NC}"
    exit 1
fi

if check_command npm; then
    npm --version
else
    echo -e "${RED}npm未安装，请检查Node.js安装${NC}"
    exit 1
fi

# 4. 安装基础Python依赖
echo -e "${BLUE}=== 安装基础Python依赖 ===${NC}"
BASIC_DEPS=("fastapi" "uvicorn" "pydantic" "PyJWT")
for dep in "${BASIC_DEPS[@]}"; do
    echo -e "${YELLOW}📦 安装 $dep...${NC}"
    pip3 install $dep
done

# 5. 检查前端依赖
echo -e "${BLUE}=== 前端依赖检查 ===${NC}"
cd frontend/web

if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json 存在${NC}"
    
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✅ node_modules 存在${NC}"
    else
        echo -e "${YELLOW}📦 安装前端依赖...${NC}"
        npm install --legacy-peer-deps
    fi
else
    echo -e "${RED}❌ package.json 不存在${NC}"
    exit 1
fi

cd ../..

# 6. 创建必要的目录
echo -e "${BLUE}=== 创建必要目录 ===${NC}"
mkdir -p logs
mkdir -p data
mkdir -p backups

# 7. 设置权限
echo -e "${BLUE}=== 设置脚本权限 ===${NC}"
chmod +x scripts/*.sh 2>/dev/null || true

# 8. 环境测试
echo -e "${BLUE}=== 环境测试 ===${NC}"

# 测试Python环境
if python3 -c "import fastapi, uvicorn, pydantic, jwt; print('Python环境正常')" 2>/dev/null; then
    echo -e "${GREEN}✅ Python环境测试通过${NC}"
else
    echo -e "${RED}❌ Python环境测试失败${NC}"
fi

# 测试Node.js环境
if node --version > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Node.js环境测试通过${NC}"
else
    echo -e "${RED}❌ Node.js环境测试失败${NC}"
fi

# 测试npm环境
if npm --version > /dev/null 2>&1; then
    echo -e "${GREEN}✅ npm环境测试通过${NC}"
else
    echo -e "${RED}❌ npm环境测试失败${NC}"
fi

echo ""
echo -e "${GREEN}🎉 环境配置完成！${NC}"
echo ""
echo -e "${BLUE}📋 环境信息:${NC}"
echo "  Python: $(python3 --version)"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo ""
echo -e "${BLUE}🚀 启动命令:${NC}"
echo "  启动后端: ./scripts/start_backend_only.sh"
echo "  启动前端: cd frontend/web && npm start"
echo ""
echo -e "${BLUE}📝 访问地址:${NC}"
echo "  前端: http://localhost:3000"
echo "  后端API: http://localhost:8000"
echo "  API文档: http://localhost:8000/docs"
echo ""
echo -e "${BLUE}👤 测试账号:${NC}"
echo "  管理员: admin / admin123"
echo "  普通用户: user / user123"
echo ""
echo -e "${YELLOW}⚠️  注意: 某些高级功能可能需要额外的数据库依赖${NC}" 