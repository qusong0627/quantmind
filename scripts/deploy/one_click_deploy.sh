#!/bin/bash

# QuantMind 一键部署脚本 v2.0
# 修复版本 - 解决环境变量路径、MySQL重启、macOS兼容性等问题
# 作者: QuantMind Team
# 版本: 2.0.0

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
ENV_FILE="$PROJECT_ROOT/.env.prod"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
SSL_DIR="$PROJECT_ROOT/ssl"
LOGS_DIR="$PROJECT_ROOT/logs"
DATA_DIR="$PROJECT_ROOT/data"

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

# 兼容性函数 - sed命令
sed_inplace() {
    if [[ "$OS" == "macos" ]]; then
        sed -i '' "$@"
    else
        sed -i "$@"
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
    
    # 检查openssl
    if ! command -v openssl &> /dev/null; then
        missing_deps+=("openssl")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "缺少以下依赖: ${missing_deps[*]}"
        if [[ "$OS" == "macos" ]]; then
            log_info "macOS用户请运行以下命令安装依赖:"
            echo "  brew install docker docker-compose openssl"
            echo "  或安装Docker Desktop: https://www.docker.com/products/docker-desktop"
        else
            log_info "请先运行 cloud_setup.sh 脚本安装依赖"
        fi
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 检查Docker服务状态
check_docker_service() {
    log_step "检查Docker服务状态..."
    
    # 检查Docker是否运行
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行，请启动Docker服务"
        if [[ "$OS" == "macos" ]]; then
            log_info "macOS用户请启动Docker Desktop应用程序"
        else
            log_info "Linux用户请运行: sudo systemctl start docker"
        fi
        exit 1
    fi
    
    # 检查Docker权限
    if ! docker ps &> /dev/null; then
        log_error "当前用户无法访问Docker"
        if [[ "$OS" == "linux" ]]; then
            log_info "请确保用户在docker组中: sudo usermod -aG docker $USER && newgrp docker"
        fi
        exit 1
    fi
    
    log_success "Docker服务正常"
}

# 创建必要目录
create_directories() {
    log_step "创建必要目录..."
    
    local dirs=(
        "$SSL_DIR"
        "$LOGS_DIR"
        "$DATA_DIR/mysql/data"
        "$DATA_DIR/mysql/logs"
        "$DATA_DIR/redis/data"
        "$DATA_DIR/redis/logs"
        "$DATA_DIR/influxdb/data"
        "$DATA_DIR/influxdb/logs"
        "$DATA_DIR/uploads"
    )
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_info "创建目录: $dir"
        fi
    done
    
    # 设置权限
    chmod 700 "$SSL_DIR"
    chmod 755 "$LOGS_DIR" "$DATA_DIR"
    
    log_success "目录创建完成"
}

# 环境变量配置向导
configure_environment() {
    log_step "配置环境变量..."
    
    # 如果环境文件已存在，询问是否重新配置
    if [[ -f "$ENV_FILE" ]]; then
        echo
        read -p "环境配置文件已存在，是否重新配置? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "使用现有环境配置"
            return 0
        fi
    fi
    
    echo
    echo "======================================"
    echo "         环境变量配置向导"
    echo "======================================"
    echo
    
    # 域名配置
    read -p "请输入域名 (例: quantmind.example.com): " DOMAIN
    while [[ -z "$DOMAIN" ]]; do
        read -p "域名不能为空，请重新输入: " DOMAIN
    done
    
    # SSL配置选择
    echo
    echo "SSL证书配置选项:"
    echo "1) 自动申请Let's Encrypt证书 (推荐)"
    echo "2) 使用自签名证书 (仅用于测试)"
    echo "3) 使用现有证书文件"
    echo "4) 跳过SSL配置 (仅使用HTTP)"
    read -p "请选择 (1-4): " SSL_OPTION
    
    case $SSL_OPTION in
        1)
            SSL_TYPE="letsencrypt"
            read -p "请输入邮箱地址 (用于Let's Encrypt): " SSL_EMAIL
            while [[ -z "$SSL_EMAIL" ]]; do
                read -p "邮箱不能为空，请重新输入: " SSL_EMAIL
            done
            ;;
        2)
            SSL_TYPE="selfsigned"
            SSL_EMAIL=""
            ;;
        3)
            SSL_TYPE="existing"
            SSL_EMAIL=""
            read -p "请输入证书文件路径 (cert.pem): " SSL_CERT_PATH
            read -p "请输入私钥文件路径 (key.pem): " SSL_KEY_PATH
            ;;
        4)
            SSL_TYPE="none"
            SSL_EMAIL=""
            log_warning "选择了跳过SSL配置，将使用HTTP协议"
            log_warning "生产环境强烈建议使用HTTPS"
            ;;
        *)
            log_error "无效选择，使用自签名证书"
            SSL_TYPE="selfsigned"
            SSL_EMAIL=""
            ;;
    esac
    
    # 数据库配置
    echo
    echo "数据库配置:"
    read -p "MySQL root密码 [随机生成]: " MYSQL_ROOT_PASSWORD
    if [[ -z "$MYSQL_ROOT_PASSWORD" ]]; then
        MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
        log_info "生成MySQL root密码: $MYSQL_ROOT_PASSWORD"
    fi
    
    read -p "MySQL数据库名 [quantmind]: " MYSQL_DATABASE
    MYSQL_DATABASE=${MYSQL_DATABASE:-quantmind}
    
    read -p "MySQL用户名 [quantmind]: " MYSQL_USER
    MYSQL_USER=${MYSQL_USER:-quantmind}
    
    read -p "MySQL用户密码 [随机生成]: " MYSQL_PASSWORD
    if [[ -z "$MYSQL_PASSWORD" ]]; then
        MYSQL_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
        log_info "生成MySQL用户密码: $MYSQL_PASSWORD"
    fi
    
    # Redis配置
    read -p "Redis密码 [随机生成]: " REDIS_PASSWORD
    if [[ -z "$REDIS_PASSWORD" ]]; then
        REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
        log_info "生成Redis密码: $REDIS_PASSWORD"
    fi
    
    # InfluxDB配置
    read -p "InfluxDB管理员用户名 [admin]: " INFLUXDB_ADMIN_USER
    INFLUXDB_ADMIN_USER=${INFLUXDB_ADMIN_USER:-admin}
    
    read -p "InfluxDB管理员密码 [随机生成]: " INFLUXDB_ADMIN_PASSWORD
    if [[ -z "$INFLUXDB_ADMIN_PASSWORD" ]]; then
        INFLUXDB_ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
        log_info "生成InfluxDB管理员密码: $INFLUXDB_ADMIN_PASSWORD"
    fi
    
    read -p "InfluxDB组织名 [quantmind]: " INFLUXDB_ORG
    INFLUXDB_ORG=${INFLUXDB_ORG:-quantmind}
    
    read -p "InfluxDB存储桶名 [market_data]: " INFLUXDB_BUCKET
    INFLUXDB_BUCKET=${INFLUXDB_BUCKET:-market_data}
    
    # JWT配置 - 修复生成方式
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    log_info "生成JWT密钥"
    
    # API密钥配置
    echo
    echo "第三方API配置 (可选，留空跳过):"
    read -p "聚合数据API密钥: " JUHE_API_KEY
    
    # 根据SSL配置设置协议和端口
    if [[ "$SSL_TYPE" == "none" ]]; then
        PROTOCOL="http"
        NGINX_PORT="80"
        NGINX_SSL_PORT=""
    else
        PROTOCOL="https"
        NGINX_PORT="80"
        NGINX_SSL_PORT="443"
    fi

    # 创建环境配置文件 - 确保路径正确
    log_info "创建环境配置文件: $ENV_FILE"
    
    cat > "$ENV_FILE" <<EOF
# QuantMind 生产环境配置
# 生成时间: $(date)
# 脚本版本: 2.0.0

# 域名配置
DOMAIN=$DOMAIN
PROTOCOL=$PROTOCOL

# SSL配置
SSL_TYPE=$SSL_TYPE
SSL_EMAIL=$SSL_EMAIL
SSL_CERT_PATH=$SSL_CERT_PATH
SSL_KEY_PATH=$SSL_KEY_PATH
NGINX_PORT=$NGINX_PORT
NGINX_SSL_PORT=$NGINX_SSL_PORT

# MySQL配置
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_DATABASE=$MYSQL_DATABASE
MYSQL_USER=$MYSQL_USER
MYSQL_PASSWORD=$MYSQL_PASSWORD
MYSQL_HOST=mysql
MYSQL_PORT=3306

# Redis配置
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_HOST=redis
REDIS_PORT=6379

# InfluxDB配置
INFLUXDB_ADMIN_USER=$INFLUXDB_ADMIN_USER
INFLUXDB_ADMIN_PASSWORD=$INFLUXDB_ADMIN_PASSWORD
INFLUXDB_ORG=$INFLUXDB_ORG
INFLUXDB_BUCKET=$INFLUXDB_BUCKET
INFLUXDB_HOST=influxdb
INFLUXDB_PORT=8086

# JWT配置
JWT_SECRET=$JWT_SECRET

# API密钥
JUHE_API_KEY=$JUHE_API_KEY

# 环境设置
ENVIRONMENT=production
DEBUG=false

# 日志配置
LOG_LEVEL=info
LOG_DIR=$LOGS_DIR

# 数据目录
DATA_DIR=$DATA_DIR
EOF
    
    chmod 600 "$ENV_FILE"
    log_success "环境配置文件已创建: $ENV_FILE"
    
    # 验证环境文件
    if [[ -f "$ENV_FILE" ]] && [[ -s "$ENV_FILE" ]]; then
        log_success "环境文件验证通过"
    else
        log_error "环境文件创建失败或为空"
        return 1
    fi
}

# 验证环境变量
validate_environment() {
    log_step "验证环境变量..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "环境配置文件不存在: $ENV_FILE"
        return 1
    fi
    
    # 加载环境变量
    set -a
    source "$ENV_FILE"
    set +a
    
    # 检查关键变量
    local required_vars=(
        "DOMAIN"
        "MYSQL_ROOT_PASSWORD"
        "MYSQL_DATABASE"
        "MYSQL_USER"
        "MYSQL_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "缺少必需的环境变量: ${missing_vars[*]}"
        return 1
    fi
    
    log_success "环境变量验证通过"
}

# 清理旧容器和数据
cleanup_old_deployment() {
    log_step "清理旧部署..."
    
    # 停止并删除容器
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q | grep -q .; then
        log_info "停止现有容器..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans
    fi
    
    # 清理未使用的镜像和网络
    log_info "清理Docker资源..."
    docker system prune -f --volumes || true
    
    log_success "清理完成"
}

# 检查容器状态 - 改进版
check_container_status() {
    local container_name=$1
    local max_attempts=${2:-60}
    local attempt=0
    
    log_info "检查容器 $container_name 状态..."
    
    while [ $attempt -lt $max_attempts ]; do
        # 使用docker-compose ps获取状态
        local status=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps --format "table {{.Name}}\t{{.State}}" | grep "$container_name" | awk '{print $2}' || echo "not_found")
        
        case $status in
            "Up")
                log_success "容器 $container_name 运行正常"
                return 0
                ;;
            "Restarting")
                log_warning "容器 $container_name 正在重启，等待中... (尝试 $((attempt+1))/$max_attempts)"
                ;;
            "Exit"*)
                log_error "容器 $container_name 已退出，检查日志:"
                docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=20 $container_name
                return 1
                ;;
            "not_found")
                log_error "容器 $container_name 未找到"
                return 1
                ;;
            *)
                log_warning "容器 $container_name 状态: $status (尝试 $((attempt+1))/$max_attempts)"
                ;;
        esac
        
        sleep 5
        attempt=$((attempt+1))
    done
    
    log_error "容器 $container_name 启动超时"
    return 1
}

# 初始化数据库 - 改进版
init_database() {
    log_step "初始化数据库..."
    
    # 确保环境变量已加载
    set -a
    source "$ENV_FILE"
    set +a
    
    # 启动数据库服务
    log_info "启动数据库服务..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d mysql redis influxdb
    
    # 等待容器启动
    sleep 10
    
    # 检查MySQL容器状态
    if ! check_container_status "mysql" 120; then
        log_error "MySQL容器启动失败"
        log_info "MySQL容器详细日志:"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=100 mysql
        
        # 检查系统资源
        log_info "检查系统资源:"
        echo "内存使用情况:"
        if [[ "$OS" == "macos" ]]; then
            vm_stat | head -5
        else
            free -h
        fi
        echo "磁盘使用情况:"
        df -h
        
        return 1
    fi
    
    # 等待MySQL服务就绪 - 改进版
    log_info "等待MySQL服务就绪..."
    local mysql_ready=false
    for i in {1..60}; do
        # 使用更可靠的连接测试
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" &>/dev/null; then
            mysql_ready=true
            break
        fi
        
        if [ $((i % 10)) -eq 0 ]; then
            log_info "MySQL连接测试 $i/60..."
        fi
        
        sleep 3
    done
    
    if [[ "$mysql_ready" != "true" ]]; then
        log_error "MySQL服务启动超时"
        log_info "MySQL错误日志:"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=100 mysql
        return 1
    fi
    
    # 创建数据库和用户
    log_info "创建数据库和用户..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON \`$MYSQL_DATABASE\`.* TO '$MYSQL_USER'@'%';
FLUSH PRIVILEGES;
EOF
    
    # 检查Redis和InfluxDB
    check_container_status "redis" 30 || log_warning "Redis启动可能有问题"
    check_container_status "influxdb" 30 || log_warning "InfluxDB启动可能有问题"
    
    log_success "数据库初始化完成"
}

# 构建和启动服务 - 改进版
deploy_services() {
    log_step "构建和启动服务..."
    
    # 确保环境变量已加载
    set -a
    source "$ENV_FILE"
    set +a
    
    # 构建镜像
    log_info "构建Docker镜像..."
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache; then
        log_error "Docker镜像构建失败"
        return 1
    fi
    
    # 启动所有服务
    log_info "启动所有服务..."
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" up -d; then
        log_error "服务启动失败"
        return 1
    fi
    
    # 等待服务启动
    sleep 15
    
    # 检查关键服务状态
    log_info "检查服务启动状态..."
    local services=("nginx" "frontend")
    
    for service in "${services[@]}"; do
        if ! check_container_status "$service" 60; then
            log_warning "$service 服务启动可能有问题，但继续部署"
        fi
    done
    
    # 显示所有容器状态
    log_info "当前容器状态:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    log_success "服务部署完成"
}

# 健康检查 - 改进版
health_check() {
    log_step "执行健康检查..."
    
    # 加载环境变量
    set -a
    source "$ENV_FILE"
    set +a
    
    # 检查端口是否可访问
    local ports=("80")
    if [[ "$SSL_TYPE" != "none" ]]; then
        ports+=("443")
    fi
    
    for port in "${ports[@]}"; do
        if command -v nc &> /dev/null; then
            if nc -z localhost "$port" 2>/dev/null; then
                log_success "端口 $port 可访问"
            else
                log_warning "端口 $port 不可访问"
            fi
        fi
    done
    
    # 执行自定义健康检查脚本
    if [[ -f "$SCRIPT_DIR/health_check.sh" ]]; then
        bash "$SCRIPT_DIR/health_check.sh"
    else
        log_warning "健康检查脚本不存在，跳过详细健康检查"
    fi
    
    log_success "健康检查完成"
}

# 显示部署信息
show_deployment_info() {
    set -a
    source "$ENV_FILE"
    set +a
    
    echo
    echo "======================================"
    echo "         部署完成信息"
    echo "======================================"
    echo
    if [[ "$SSL_TYPE" == "none" ]]; then
        echo "🌐 访问地址: http://$DOMAIN"
        echo "📱 前端地址: http://$DOMAIN"
        echo "🔌 API地址: http://$DOMAIN/api"
        echo
        echo "⚠️  警告: 当前使用HTTP协议，生产环境建议配置HTTPS"
    else
        echo "🌐 访问地址: https://$DOMAIN"
        echo "📱 前端地址: https://$DOMAIN"
        echo "🔌 API地址: https://$DOMAIN/api"
    fi
    echo
    echo "📊 数据库信息:"
    echo "  MySQL: $MYSQL_DATABASE (用户: $MYSQL_USER)"
    echo "  Redis: 已启用密码认证"
    echo "  InfluxDB: $INFLUXDB_ORG/$INFLUXDB_BUCKET"
    echo
    echo "🔒 SSL证书: $SSL_TYPE"
    echo "📁 日志目录: $LOGS_DIR"
    echo "⚙️  配置文件: $ENV_FILE"
    echo
    echo "🛠️  常用命令:"
    echo "  查看服务状态: docker-compose -f $DOCKER_COMPOSE_FILE ps"
    echo "  查看日志: docker-compose -f $DOCKER_COMPOSE_FILE logs -f [service]"
    echo "  重启服务: docker-compose -f $DOCKER_COMPOSE_FILE restart [service]"
    echo "  停止服务: docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo "  重新部署: bash $0"
    echo
}

# 错误处理函数
handle_error() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "部署过程中发生错误 (退出码: $exit_code)"
        log_info "正在收集错误信息..."
        
        # 显示容器状态
        echo "当前容器状态:"
        docker-compose -f "$DOCKER_COMPOSE_FILE" ps || true
        
        # 显示最近的日志
        echo "最近的错误日志:"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=20 || true
        
        echo
        echo "故障排除建议:"
        echo "1. 检查Docker服务是否正常运行"
        echo "2. 确认端口80和443未被占用"
        echo "3. 检查磁盘空间是否充足"
        echo "4. 查看详细日志: docker-compose -f $DOCKER_COMPOSE_FILE logs [service]"
        echo "5. 重新运行部署脚本"
        echo
    fi
}

# 主函数
main() {
    # 设置错误处理
    trap handle_error EXIT
    
    echo "======================================"
    echo "       QuantMind 一键部署 v2.0"
    echo "======================================"
    echo "操作系统: $OS_TYPE"
    echo "项目路径: $PROJECT_ROOT"
    echo "配置文件: $ENV_FILE"
    echo
    
    # 执行部署步骤
    check_dependencies
    check_docker_service
    create_directories
    configure_environment
    validate_environment
    cleanup_old_deployment
    init_database
    deploy_services
    health_check
    show_deployment_info
    
    # 取消错误处理陷阱
    trap - EXIT
    
    echo
    log_success "🎉 QuantMind部署完成！"
    echo
}

# 执行主函数
main "$@"