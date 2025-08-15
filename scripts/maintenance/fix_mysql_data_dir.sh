#!/bin/bash

# QuantMind MySQL数据目录修复脚本
# 解决MySQL容器重启循环问题：数据目录初始化冲突和权限问题
# 作者: QuantMind Team

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
ENV_FILE="$PROJECT_ROOT/.env.prod"

# 检测操作系统
OS_TYPE="$(uname -s)"
case "$OS_TYPE" in
    Darwin*) OS="macos" ;;
    Linux*)  OS="linux" ;;
    *)       OS="unknown" ;;
esac

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Docker Compose 命令包装器
docker_compose_cmd() {
    # 检查是否使用Docker Compose V2
    if docker compose version &>/dev/null; then
        docker compose "$@"
    else
        docker-compose "$@"
    fi
}

# 检查依赖
check_dependencies() {
    log_step "检查系统依赖..."
    
    local missing_deps=()
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "缺少以下依赖: ${missing_deps[*]}"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 停止MySQL容器
stop_mysql_container() {
    log_step "停止MySQL容器..."
    
    # 检查MySQL容器是否在运行
    if docker ps --format '{{.Names}}' | grep -q "quantmind-mysql"; then
        log_info "停止MySQL容器..."
        docker_compose_cmd -f "$DOCKER_COMPOSE_FILE" stop mysql
        
        # 等待容器完全停止
        local max_attempts=30
        local attempt=0
        while [ $attempt -lt $max_attempts ]; do
            if ! docker ps --format '{{.Names}}' | grep -q "quantmind-mysql"; then
                log_success "MySQL容器已停止"
                return 0
            fi
            log_info "等待MySQL容器停止... (尝试 $((attempt+1))/$max_attempts)"
            sleep 2
            attempt=$((attempt+1))
        done
        
        log_error "MySQL容器停止超时，尝试强制停止..."
        docker_compose_cmd -f "$DOCKER_COMPOSE_FILE" rm -f mysql
    else
        log_info "MySQL容器未运行"
    fi
}

# 修复MySQL数据目录
fix_mysql_data_dir() {
    log_step "修复MySQL数据目录..."
    
    # 加载环境变量
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
    else
        log_error "环境配置文件不存在: $ENV_FILE"
        exit 1
    fi
    
    # 确定MySQL数据目录路径
    local mysql_data_dir="${HOME}/quantmind/data/mysql"
    
    # 检查数据目录是否存在
    if [ ! -d "$mysql_data_dir" ]; then
        log_warning "MySQL数据目录不存在: $mysql_data_dir"
        log_info "创建MySQL数据目录..."
        mkdir -p "$mysql_data_dir"
    fi
    
    # 备份现有数据（如果需要）
    if [ -d "$mysql_data_dir" ] && [ "$(ls -A "$mysql_data_dir" 2>/dev/null)" ]; then
        log_info "备份现有MySQL数据..."
        local backup_dir="${mysql_data_dir}_backup_$(date +%Y%m%d_%H%M%S)"
        mv "$mysql_data_dir" "$backup_dir"
        mkdir -p "$mysql_data_dir"
        log_success "现有数据已备份到: $backup_dir"
    fi
    
    # 设置正确的权限
    log_info "设置MySQL数据目录权限..."
    if [ "$OS" == "linux" ]; then
        # Linux系统设置MySQL用户权限
        chown -R 999:999 "$mysql_data_dir" || {
            log_warning "无法设置权限，尝试使用sudo..."
            sudo chown -R 999:999 "$mysql_data_dir" || {
                log_error "无法设置MySQL数据目录权限"
                log_info "请手动执行: sudo chown -R 999:999 $mysql_data_dir"
                exit 1
            }
        }
        chmod -R 750 "$mysql_data_dir" || {
            log_warning "无法设置权限，尝试使用sudo..."
            sudo chmod -R 750 "$mysql_data_dir" || {
                log_error "无法设置MySQL数据目录权限"
                log_info "请手动执行: sudo chmod -R 750 $mysql_data_dir"
                exit 1
            }
        }
    else
        # macOS系统设置权限
        chmod -R 777 "$mysql_data_dir" || {
            log_warning "无法设置权限，尝试使用sudo..."
            sudo chmod -R 777 "$mysql_data_dir" || {
                log_error "无法设置MySQL数据目录权限"
                log_info "请手动执行: sudo chmod -R 777 $mysql_data_dir"
                exit 1
            }
        }
    fi
    
    log_success "MySQL数据目录权限设置完成"
}

# 创建日志目录
create_log_dir() {
    log_step "创建MySQL日志目录..."
    
    local mysql_log_dir="${HOME}/quantmind/logs/mysql"
    
    # 创建日志目录
    if [ ! -d "$mysql_log_dir" ]; then
        log_info "创建MySQL日志目录: $mysql_log_dir"
        mkdir -p "$mysql_log_dir"
    fi
    
    # 设置日志目录权限
    log_info "设置MySQL日志目录权限..."
    if [ "$OS" == "linux" ]; then
        # Linux系统设置MySQL用户权限
        chown -R 999:999 "$mysql_log_dir" || {
            log_warning "无法设置权限，尝试使用sudo..."
            sudo chown -R 999:999 "$mysql_log_dir" || {
                log_error "无法设置MySQL日志目录权限"
                log_info "请手动执行: sudo chown -R 999:999 $mysql_log_dir"
                exit 1
            }
        }
        chmod -R 750 "$mysql_log_dir" || {
            log_warning "无法设置权限，尝试使用sudo..."
            sudo chmod -R 750 "$mysql_log_dir" || {
                log_error "无法设置MySQL日志目录权限"
                log_info "请手动执行: sudo chmod -R 750 $mysql_log_dir"
                exit 1
            }
        }
    else
        # macOS系统设置权限
        chmod -R 777 "$mysql_log_dir" || {
            log_warning "无法设置权限，尝试使用sudo..."
            sudo chmod -R 777 "$mysql_log_dir" || {
                log_error "无法设置MySQL日志目录权限"
                log_info "请手动执行: sudo chmod -R 777 $mysql_log_dir"
                exit 1
            }
        }
    fi
    
    log_success "MySQL日志目录权限设置完成"
}

# 启动MySQL容器
start_mysql_container() {
    log_step "启动MySQL容器..."
    
    log_info "启动MySQL容器..."
    docker_compose_cmd -f "$DOCKER_COMPOSE_FILE" up -d mysql
    
    # 等待容器启动
    local max_attempts=60
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        local status=$(docker ps --format "{{.Status}}" --filter "name=quantmind-mysql" 2>/dev/null || echo "not_found")
        
        if [[ "$status" == *"Up"* ]]; then
            log_success "MySQL容器已成功启动"
            return 0
        elif [[ "$status" == *"Restarting"* ]]; then
            log_warning "MySQL容器正在重启 (尝试 $((attempt+1))/$max_attempts)"
        elif [[ "$status" == "not_found" ]]; then
            log_error "MySQL容器未找到"
            return 1
        else
            log_info "等待MySQL容器启动... (尝试 $((attempt+1))/$max_attempts)"
        fi
        
        sleep 5
        attempt=$((attempt+1))
    done
    
    log_error "MySQL容器启动超时"
    log_info "查看MySQL容器日志:"
    docker_compose_cmd -f "$DOCKER_COMPOSE_FILE" logs --tail=50 mysql
    return 1
}

# 验证MySQL连接
verify_mysql_connection() {
    log_step "验证MySQL连接..."
    
    # 加载环境变量
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
    fi
    
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker_compose_cmd -f "$DOCKER_COMPOSE_FILE" exec -T mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" &>/dev/null; then
            log_success "MySQL连接测试成功"
            return 0
        fi
        
        log_info "等待MySQL服务就绪... (尝试 $((attempt+1))/$max_attempts)"
        sleep 5
        attempt=$((attempt+1))
    done
    
    log_error "MySQL连接测试失败"
    return 1
}

# 主函数
main() {
    echo "=================================================="
    echo "  QuantMind MySQL数据目录修复工具"
    echo "  解决MySQL容器重启循环问题"
    echo "=================================================="
    echo
    
    # 检查是否以root用户运行（Linux系统）
    if [ "$OS" == "linux" ] && [ "$(id -u)" != "0" ]; then
        log_warning "此脚本需要root权限来修改MySQL数据目录权限"
        log_info "请使用sudo运行此脚本"
        exit 1
    fi
    
    # 检查依赖
    check_dependencies
    
    # 停止MySQL容器
    stop_mysql_container
    
    # 修复MySQL数据目录
    fix_mysql_data_dir
    
    # 创建日志目录
    create_log_dir
    
    # 启动MySQL容器
    start_mysql_container
    
    # 验证MySQL连接
    if verify_mysql_connection; then
        echo
        echo "=================================================="
        echo "  ✅ MySQL数据目录修复成功!"
        echo "=================================================="
        echo
        log_info "MySQL容器现在应该正常运行"
        log_info "您可以继续部署其他服务:"
        log_info "  docker-compose -f $DOCKER_COMPOSE_FILE up -d"
    else
        echo
        echo "=================================================="
        echo "  ❌ MySQL数据目录修复失败"
        echo "=================================================="
        echo
        log_error "MySQL容器仍然无法正常启动"
        log_info "请检查MySQL容器日志以获取更多信息:"
        log_info "  docker-compose -f $DOCKER_COMPOSE_FILE logs mysql"
        exit 1
    fi
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi