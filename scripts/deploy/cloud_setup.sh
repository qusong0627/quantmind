#!/bin/bash

# QuantMind 云服务器环境准备脚本
# 支持系统: Ubuntu 18.04+
# 功能: 系统环境检查、Docker安装、防火墙配置、系统优化
# 作者: QuantMind Team
# 版本: 2.1.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        IS_ROOT=true
        log_warning "检测到root用户，建议使用普通用户运行此脚本"
    else
        IS_ROOT=false
    fi
}

# 检查sudo权限
check_sudo() {
    if [[ $IS_ROOT == true ]]; then
        log_success "root用户权限检查通过"
        return 0
    fi
    
    # 检查用户是否在sudo组中
    if ! groups | grep -q sudo; then
        log_error "当前用户不在sudo组中，请联系管理员添加sudo权限"
        exit 1
    fi
    
    # 测试sudo权限
    if ! sudo -n true 2>/dev/null; then
        log_info "需要sudo权限，请输入密码"
        if ! sudo true; then
            log_error "sudo权限验证失败"
            exit 1
        fi
    fi
    
    log_success "sudo权限检查通过"
}

# 执行命令函数
exec_cmd() {
    local cmd="$1"
    
    if [[ $IS_ROOT == true ]]; then
        log_info "执行: $cmd"
        eval "$cmd"
    else
        log_info "执行: sudo $cmd"
        eval "sudo $cmd"
    fi
    
    if [[ $? -ne 0 ]]; then
        log_error "命令执行失败: $cmd"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    log_info "检测操作系统..."
    
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        OS=$NAME
        OS_VERSION=$VERSION_ID
        
        case $ID in
            "ubuntu")
                PACKAGE_MANAGER="apt"
                if [[ $(echo "$VERSION_ID >= 18.04" | bc) -eq 0 ]]; then
                    log_error "Ubuntu版本过低，需要18.04或更高版本"
                    exit 1
                fi
                ;;
            "centos"|"rhel")
                PACKAGE_MANAGER="yum"
                if [[ $(echo "$VERSION_ID >= 7" | bc) -eq 0 ]]; then
                    log_error "CentOS/RHEL版本过低，需要7或更高版本"
                    exit 1
                fi
                ;;
            "debian")
                PACKAGE_MANAGER="apt"
                if [[ $(echo "$VERSION_ID >= 10" | bc) -eq 0 ]]; then
                    log_error "Debian版本过低，需要10或更高版本"
                    exit 1
                fi
                ;;
            *)
                log_error "不支持的操作系统: $OS，此脚本支持Ubuntu 18.04+、CentOS/RHEL 7+、Debian 10+"
                exit 1
                ;;
        esac
    else
        log_error "无法检测操作系统版本"
        exit 1
    fi
    
    log_success "操作系统检测完成: $OS $OS_VERSION"
}

# 系统资源检查
check_system_resources() {
    log_info "检查系统资源..."
    
    # 检查内存
    if ! command -v free &> /dev/null; then
        log_error "free命令不可用，无法检查内存"
        exit 1
    fi
    
    MEMORY_GB=$(free -g | awk '/^Mem:/ {print $2}')
    if [[ $MEMORY_GB -lt 4 ]]; then
        log_warning "内存不足: ${MEMORY_GB}GB，建议至少4GB，但允许继续部署"
    elif [[ $MEMORY_GB -lt 8 ]]; then
        log_warning "内存较少: ${MEMORY_GB}GB，建议8GB或更多以获得更好性能"
    else
        log_success "内存检查通过: ${MEMORY_GB}GB"
    fi
    
    # 检查磁盘空间
    DISK_GB=$(df -BG . | awk 'NR==2 {gsub(/G/, "", $4); print $4}')
    if [[ $DISK_GB -lt 20 ]]; then
        log_error "磁盘空间不足: ${DISK_GB}GB，建议至少20GB"
        exit 1
    elif [[ $DISK_GB -lt 50 ]]; then
        log_warning "磁盘空间较少: ${DISK_GB}GB，建议50GB或更多"
    else
        log_success "磁盘空间检查通过: ${DISK_GB}GB"
    fi
    
    # 检查CPU核心数
    CPU_CORES=$(nproc)
    if [[ $CPU_CORES -lt 2 ]]; then
        log_warning "CPU核心数较少: ${CPU_CORES}核，建议2核或更多"
    else
        log_success "CPU检查通过: ${CPU_CORES}核"
    fi
}

# 检查并安装基础依赖
install_base_dependencies() {
    log_info "检查并安装基础依赖..."
    
    local dependencies=("curl" "wget" "git" "unzip" "bc")
    
    case $PACKAGE_MANAGER in
        "apt")
            exec_cmd "apt update -y"
            for dep in "${dependencies[@]}"; do
                if ! command -v "$dep" &> /dev/null; then
                    log_info "安装基础依赖: $dep"
                    exec_cmd "apt install -y $dep"
                else
                    log_success "基础依赖已安装: $dep"
                fi
            done
            ;;
        "yum")
            for dep in "${dependencies[@]}"; do
                if ! command -v "$dep" &> /dev/null; then
                    log_info "安装基础依赖: $dep"
                    exec_cmd "yum install -y $dep"
                else
                    log_success "基础依赖已安装: $dep"
                fi
            done
            ;;
    esac
    
    log_success "基础依赖检查和安装完成"
}

# 更新系统包
update_system() {
    log_info "更新系统包..."
    
    case $PACKAGE_MANAGER in
        "apt")
            exec_cmd "apt update -y"
            exec_cmd "apt upgrade -y"
            ;;
        "yum")
            exec_cmd "yum update -y"
            ;;
    esac
    
    log_success "系统包更新完成"
}

# 安装Docker
install_docker() {
    log_info "检查Docker安装状态..."
    
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker已安装: $DOCKER_VERSION"
        return 0
    fi
    
    log_info "安装Docker..."
    
    case $PACKAGE_MANAGER in
        "apt")
            # 卸载旧版本
            exec_cmd "apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true"
            
            # 安装依赖
            exec_cmd "apt install -y apt-transport-https ca-certificates curl gnupg lsb-release"
            
            # 添加Docker官方GPG密钥
            if [[ $IS_ROOT == true ]]; then
                curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            else
                curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            fi
            
            # 添加Docker仓库
            if [[ $IS_ROOT == true ]]; then
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
            else
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            fi
            
            # 安装Docker
            exec_cmd "apt update -y"
            exec_cmd "apt install -y docker-ce docker-ce-cli containerd.io"
            ;;
            
        "yum")
            # 卸载旧版本
            exec_cmd "yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true"
            
            # 安装依赖
            exec_cmd "yum install -y yum-utils device-mapper-persistent-data lvm2"
            
            # 添加Docker仓库
            exec_cmd "yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo"
            
            # 安装Docker
            exec_cmd "yum install -y docker-ce docker-ce-cli containerd.io"
            ;;
    esac
    
    # 启动Docker服务
    exec_cmd "systemctl start docker"
    exec_cmd "systemctl enable docker"
    
    # 将当前用户添加到docker组（root用户跳过）
    if [[ $IS_ROOT != true ]]; then
        exec_cmd "usermod -aG docker $USER"
    fi
    
    log_success "Docker安装完成"
    log_warning "请重新登录以使docker组权限生效"
}

# 安装Docker Compose
install_docker_compose() {
    log_info "检查Docker Compose安装状态..."
    
    # 检查新版本Docker Compose插件
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version | cut -d' ' -f4)
        log_success "Docker Compose插件已安装: $COMPOSE_VERSION"
        return 0
    fi
    
    # 检查旧版本docker-compose命令
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker Compose已安装: $COMPOSE_VERSION"
        return 0
    fi
    
    log_info "安装Docker Compose..."
    
    # 获取最新版本号
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
    
    # 下载并安装
    if [[ $IS_ROOT == true ]]; then
        curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # 创建软链接
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose 2>/dev/null || true
    else
        sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        # 创建软链接
        sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose 2>/dev/null || true
    fi
    
    log_success "Docker Compose安装完成: $COMPOSE_VERSION"
}

# 安装Node.js
install_nodejs() {
    log_info "检查Node.js安装状态..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js已安装: $NODE_VERSION"
        return 0
    fi
    
    log_info "安装Node.js..."
    
    case $PACKAGE_MANAGER in
        "apt")
            # 安装NodeSource仓库
            exec_cmd "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
            exec_cmd "apt-get install -y nodejs"
            ;;
        "yum")
            # 安装NodeSource仓库
            exec_cmd "curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo -E bash -"
            exec_cmd "yum install -y nodejs"
            ;;
    esac
    
    log_success "Node.js安装完成"
}

# 安装Python
install_python() {
    log_info "检查Python安装状态..."
    
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        log_success "Python已安装: $PYTHON_VERSION"
        return 0
    fi
    
    log_info "安装Python..."
    
    case $PACKAGE_MANAGER in
        "apt")
            exec_cmd "apt install -y python3 python3-pip python3-venv"
            ;;
        "yum")
            exec_cmd "yum install -y python3 python3-pip"
            ;;
    esac
    
    log_success "Python安装完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    # Ubuntu UFW配置
    if command -v ufw &> /dev/null; then
        exec_cmd "ufw --force enable"
        
        # 开放必要端口
        exec_cmd "ufw allow 22/tcp comment 'SSH'"
        exec_cmd "ufw allow 80/tcp comment 'HTTP'"
        exec_cmd "ufw allow 443/tcp comment 'HTTPS'"
        exec_cmd "ufw allow 3000/tcp comment 'Frontend Dev'"
        exec_cmd "ufw allow 8000/tcp comment 'API Gateway'"
        exec_cmd "ufw allow 3306/tcp comment 'MySQL'"
        exec_cmd "ufw allow 6379/tcp comment 'Redis'"
        exec_cmd "ufw allow 8086/tcp comment 'InfluxDB'"
        
        log_success "UFW防火墙配置完成"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL firewalld配置
        exec_cmd "systemctl start firewalld"
        exec_cmd "systemctl enable firewalld"
        
        # 开放必要端口
        exec_cmd "firewall-cmd --permanent --add-service=ssh"
        exec_cmd "firewall-cmd --permanent --add-service=http"
        exec_cmd "firewall-cmd --permanent --add-service=https"
        exec_cmd "firewall-cmd --permanent --add-port=3000/tcp"
        exec_cmd "firewall-cmd --permanent --add-port=8000/tcp"
        exec_cmd "firewall-cmd --permanent --add-port=3306/tcp"
        exec_cmd "firewall-cmd --permanent --add-port=6379/tcp"
        exec_cmd "firewall-cmd --permanent --add-port=8086/tcp"
        exec_cmd "firewall-cmd --reload"
        
        log_success "firewalld防火墙配置完成"
    else
        log_warning "未检测到防火墙，请手动配置iptables或其他防火墙"
    fi
}

# 系统优化
optimize_system() {
    log_info "应用系统优化配置..."
    
    # 创建系统优化配置文件
    if [[ $IS_ROOT == true ]]; then
        tee /etc/sysctl.d/99-quantmind.conf > /dev/null <<EOF
# QuantMind系统优化配置

# 网络优化
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 5000
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr

# 文件描述符限制
fs.file-max = 2097152

# 虚拟内存优化
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF
        
        # 应用配置
        sysctl -p /etc/sysctl.d/99-quantmind.conf
        
        # 设置用户限制
        tee -a /etc/security/limits.conf > /dev/null <<EOF

# QuantMind用户限制配置
* soft nofile 65536
* hard nofile 65536
* soft nproc 65535
* hard nproc 65535
EOF
    else
        sudo tee /etc/sysctl.d/99-quantmind.conf > /dev/null <<EOF
# QuantMind系统优化配置

# 网络优化
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 5000
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr

# 文件描述符限制
fs.file-max = 2097152

# 虚拟内存优化
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF
        
        # 应用配置
        sudo sysctl -p /etc/sysctl.d/99-quantmind.conf
        
        # 设置用户限制
        sudo tee -a /etc/security/limits.conf > /dev/null <<EOF

# QuantMind用户限制配置
* soft nofile 65536
* hard nofile 65536
* soft nproc 65535
* hard nproc 65535
EOF
    fi
    
    log_success "系统优化配置完成"
}

# 创建项目目录
setup_project_directories() {
    log_info "创建项目目录结构..."
    
    # 创建项目目录结构
    if [[ $IS_ROOT == true ]]; then
        mkdir -p /opt/quantmind/{logs,data,backups,ssl}
        chmod -R 755 /opt/quantmind
    else
        sudo mkdir -p /opt/quantmind/{logs,data,backups,ssl}
        sudo chown -R $USER:$USER /opt/quantmind
        sudo chmod -R 755 /opt/quantmind
    fi
    
    # 创建必要目录
    mkdir -p ~/quantmind/{logs,data,backups,ssl}
    mkdir -p ~/quantmind/data/{mysql,redis,influxdb}
    
    # 设置权限
    chmod 755 ~/quantmind
    chmod 700 ~/quantmind/ssl
    
    log_success "项目目录创建完成"
}

# 主函数
main() {
    echo "======================================"
    echo "    QuantMind 云服务器环境准备"
    echo "======================================"
    echo
    
    check_root
    check_sudo
    detect_os
    check_system_resources
    
    echo
    read -p "是否继续安装? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "安装已取消"
        exit 0
    fi
    
    install_base_dependencies
    update_system
    install_docker
    install_docker_compose
    install_nodejs
    install_python
    configure_firewall
    optimize_system
    setup_project_directories
    
    echo
    echo "======================================"
    log_success "环境准备完成！"
    echo "======================================"
    echo
    log_info "下一步:"
    echo "1. 重新登录以使docker组权限生效"
    echo "2. 运行 'docker --version' 验证Docker安装"
    echo "3. 运行 'docker compose version' 或 'docker-compose --version' 验证Docker Compose安装"
    echo "4. 运行 'node --version' 验证Node.js安装"
    echo "5. 运行 'python3 --version' 验证Python安装"
    echo "6. 执行一键部署脚本: ./one_click_deploy.sh"
    echo
}

# 执行主函数
main "$@"