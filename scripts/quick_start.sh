#!/bin/bash
# QuantMind 快速启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查环境要求
check_requirements() {
    print_info "检查环境要求..."
    
    # 检查Python
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_success "Python $PYTHON_VERSION 已安装"
    else
        print_error "Python 3.9+ 未安装"
        exit 1
    fi
    
    # 检查Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker $DOCKER_VERSION 已安装"
    else
        print_warning "Docker 未安装，将使用本地开发模式"
        DOCKER_AVAILABLE=false
    fi
    
    # 检查Docker Compose
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker Compose $COMPOSE_VERSION 已安装"
        DOCKER_AVAILABLE=true
    else
        print_warning "Docker Compose 未安装，将使用本地开发模式"
        DOCKER_AVAILABLE=false
    fi
    
    # 检查Node.js（本地开发模式需要）
    if ! $DOCKER_AVAILABLE; then
        if command_exists node; then
            NODE_VERSION=$(node --version)
            print_success "Node.js $NODE_VERSION 已安装"
        else
            print_error "Node.js 16+ 未安装（本地开发模式需要）"
            exit 1
        fi
    fi
}

# 创建API配置
setup_api_config() {
    print_info "设置API配置..."
    
    # 检查是否已有本地配置
    if [ -f "config/api_keys.local.json" ]; then
        print_success "本地API配置文件已存在"
    else
        print_info "创建本地API配置文件..."
        if python3 scripts/config_manager.py create-local; then
            print_success "本地API配置文件已创建"
            print_warning "请编辑 config/api_keys.local.json 文件，填入您的API密钥"
        else
            print_error "创建本地API配置文件失败"
            exit 1
        fi
    fi
    
    # 检查环境变量文件
    if [ -f ".env" ]; then
        print_success "环境变量文件已存在"
    else
        print_info "创建环境变量文件..."
        cp .env.example .env
        print_success "环境变量文件已创建"
        print_warning "请编辑 .env 文件，填入必要的配置"
    fi
}

# 验证API配置
validate_config() {
    print_info "验证API配置..."
    
    if python3 scripts/config_manager.py validate; then
        print_success "API配置验证通过"
    else
        print_warning "部分API配置未设置，某些功能可能无法正常使用"
        print_info "运行以下命令查看详细配置状态："
        echo "  python3 scripts/config_manager.py list"
        echo ""
        read -p "是否继续启动服务？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "启动已取消"
            exit 0
        fi
    fi
}

# Docker模式启动
start_with_docker() {
    print_info "使用Docker Compose启动服务..."
    
    # 检查Docker服务是否运行
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker服务未运行，请启动Docker"
        exit 1
    fi
    
    # 构建并启动服务
    print_info "构建并启动所有服务..."
    docker-compose up -d --build
    
    # 等待服务启动
    print_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    print_info "检查服务状态..."
    docker-compose ps
    
    print_success "服务启动完成！"
    print_info "访问地址："
    echo "  - 前端应用: http://localhost:3000"
    echo "  - API网关: http://localhost:8000"
    echo "  - API文档: http://localhost:8000/docs"
}

# 本地开发模式启动
start_local_dev() {
    print_info "使用本地开发模式启动服务..."
    
    # 安装Python依赖
    print_info "安装Python依赖..."
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
    fi
    
    # 安装前端依赖
    print_info "安装前端依赖..."
    cd frontend/web
    npm install
    cd ../..
    
    print_warning "本地开发模式需要手动启动数据库服务（MySQL、Redis、InfluxDB）"
    print_info "启动前端开发服务器..."
    
    # 启动前端（后台运行）
    cd frontend/web
    npm start &
    FRONTEND_PID=$!
    cd ../..
    
    print_success "前端服务已启动 (PID: $FRONTEND_PID)"
    print_info "访问地址："
    echo "  - 前端应用: http://localhost:3000"
    
    print_info "要启动后端服务，请运行："
    echo "  python3 api-gateway/main.py"
    
    # 等待用户输入
    echo ""
    print_info "按 Ctrl+C 停止前端服务"
    trap "kill $FRONTEND_PID 2>/dev/null; exit" INT
    wait $FRONTEND_PID
}

# 显示帮助信息
show_help() {
    echo "QuantMind 快速启动脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -d, --docker   强制使用Docker模式"
    echo "  -l, --local    强制使用本地开发模式"
    echo "  -c, --config   仅设置配置，不启动服务"
    echo "  -v, --validate 仅验证配置，不启动服务"
    echo ""
    echo "示例:"
    echo "  $0              # 自动选择启动模式"
    echo "  $0 --docker     # 使用Docker启动"
    echo "  $0 --local      # 使用本地开发模式启动"
    echo "  $0 --config     # 仅设置配置"
}

# 主函数
main() {
    echo "🚀 QuantMind 量化交易系统快速启动"
    echo "================================="
    echo ""
    
    # 解析命令行参数
    FORCE_DOCKER=false
    FORCE_LOCAL=false
    CONFIG_ONLY=false
    VALIDATE_ONLY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--docker)
                FORCE_DOCKER=true
                shift
                ;;
            -l|--local)
                FORCE_LOCAL=true
                shift
                ;;
            -c|--config)
                CONFIG_ONLY=true
                shift
                ;;
            -v|--validate)
                VALIDATE_ONLY=true
                shift
                ;;
            *)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查环境要求
    check_requirements
    
    # 设置API配置
    setup_api_config
    
    # 验证配置
    validate_config
    
    # 如果只是配置或验证，则退出
    if $CONFIG_ONLY; then
        print_success "配置设置完成"
        exit 0
    fi
    
    if $VALIDATE_ONLY; then
        print_success "配置验证完成"
        exit 0
    fi
    
    # 选择启动模式
    if $FORCE_DOCKER; then
        start_with_docker
    elif $FORCE_LOCAL; then
        start_local_dev
    elif $DOCKER_AVAILABLE; then
        print_info "检测到Docker环境，使用Docker模式启动"
        start_with_docker
    else
        print_info "使用本地开发模式启动"
        start_local_dev
    fi
}

# 运行主函数
main "$@"