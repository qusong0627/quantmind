#!/bin/bash

# QuantMind 服务监控脚本
# 监控Docker容器状态、资源使用情况和服务健康状态

set -euo pipefail

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs/monitoring"
LOG_FILE="$LOG_DIR/service_monitor.log"
ALERT_WEBHOOK_SCRIPT="$SCRIPT_DIR/alert_webhook.sh"

# 监控配置
CPU_THRESHOLD=80          # CPU使用率阈值(%)
MEMORY_THRESHOLD=80       # 内存使用率阈值(%)
DISK_THRESHOLD=85         # 磁盘使用率阈值(%)
RESPONSE_TIMEOUT=10       # HTTP响应超时时间(秒)

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }

# 初始化
init_monitoring() {
    mkdir -p "$LOG_DIR"
    log_info "=== QuantMind 服务监控开始 ==="
    log_info "监控配置: CPU阈值=${CPU_THRESHOLD}%, 内存阈值=${MEMORY_THRESHOLD}%, 磁盘阈值=${DISK_THRESHOLD}%"
}

# 检查Docker服务状态
check_docker_status() {
    log_info "检查Docker服务状态..."
    
    if ! systemctl is-active --quiet docker; then
        log_error "Docker服务未运行"
        send_alert "CRITICAL" "Docker服务未运行"
        return 1
    fi
    
    log_info "Docker服务运行正常"
    return 0
}

# 检查容器状态
check_containers() {
    log_info "检查容器状态..."
    
    local failed_containers=()
    local containers=(
        "quantmind-nginx"
        "quantmind-frontend"
        "quantmind-api-gateway"
        "quantmind-ai-strategy"
        "quantmind-backtest-engine"
        "quantmind-data-manager"
        "quantmind-user-service"
        "quantmind-notification"
        "quantmind-mysql"
        "quantmind-redis"
        "quantmind-influxdb"
    )
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
            local status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not_found")
            if [[ "$status" == "running" ]]; then
                printf "${GREEN}✓${NC} %-25s: 运行中\n" "$container"
                log_info "容器 $container 运行正常"
            else
                printf "${RED}✗${NC} %-25s: %s\n" "$container" "$status"
                log_error "容器 $container 状态异常: $status"
                failed_containers+=("$container")
            fi
        else
            printf "${RED}✗${NC} %-25s: 未找到\n" "$container"
            log_error "容器 $container 未找到"
            failed_containers+=("$container")
        fi
    done
    
    if [[ ${#failed_containers[@]} -gt 0 ]]; then
        send_alert "HIGH" "容器状态异常: ${failed_containers[*]}"
        return 1
    fi
    
    return 0
}

# 检查服务健康状态
check_service_health() {
    log_info "检查服务健康状态..."
    
    local failed_services=()
    
    # 检查前端服务
    if ! curl -sf --max-time $RESPONSE_TIMEOUT http://localhost:3000/health >/dev/null 2>&1; then
        log_warn "前端服务健康检查失败"
        failed_services+=("frontend")
    else
        log_info "前端服务健康检查通过"
    fi
    
    # 检查API网关
    if ! curl -sf --max-time $RESPONSE_TIMEOUT http://localhost:8000/health >/dev/null 2>&1; then
        log_warn "API网关健康检查失败"
        failed_services+=("api-gateway")
    else
        log_info "API网关健康检查通过"
    fi
    
    # 检查数据库连接
    if ! docker exec quantmind-mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        log_warn "MySQL数据库连接失败"
        failed_services+=("mysql")
    else
        log_info "MySQL数据库连接正常"
    fi
    
    # 检查Redis连接
    if ! docker exec quantmind-redis redis-cli ping >/dev/null 2>&1; then
        log_warn "Redis连接失败"
        failed_services+=("redis")
    else
        log_info "Redis连接正常"
    fi
    
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        send_alert "MEDIUM" "服务健康检查失败: ${failed_services[*]}"
        return 1
    fi
    
    return 0
}

# 检查系统资源使用情况
check_system_resources() {
    log_info "检查系统资源使用情况..."
    
    local alerts=()
    
    # CPU使用率
    local cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "0")
    cpu_usage=${cpu_usage%.*}  # 去掉小数部分
    
    if [[ $cpu_usage -gt $CPU_THRESHOLD ]]; then
        log_warn "CPU使用率过高: ${cpu_usage}%"
        alerts+=("CPU使用率: ${cpu_usage}%")
    else
        log_info "CPU使用率正常: ${cpu_usage}%"
    fi
    
    # 内存使用率
    local memory_info=$(vm_stat | grep -E "Pages (free|active|inactive|speculative|wired down)")
    local page_size=4096
    local free_pages=$(echo "$memory_info" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    local active_pages=$(echo "$memory_info" | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
    local inactive_pages=$(echo "$memory_info" | grep "Pages inactive" | awk '{print $3}' | sed 's/\.//')
    local wired_pages=$(echo "$memory_info" | grep "Pages wired down" | awk '{print $4}' | sed 's/\.//')
    
    local total_pages=$((free_pages + active_pages + inactive_pages + wired_pages))
    local used_pages=$((active_pages + inactive_pages + wired_pages))
    local memory_usage=$((used_pages * 100 / total_pages))
    
    if [[ $memory_usage -gt $MEMORY_THRESHOLD ]]; then
        log_warn "内存使用率过高: ${memory_usage}%"
        alerts+=("内存使用率: ${memory_usage}%")
    else
        log_info "内存使用率正常: ${memory_usage}%"
    fi
    
    # 磁盘使用率
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [[ $disk_usage -gt $DISK_THRESHOLD ]]; then
        log_warn "磁盘使用率过高: ${disk_usage}%"
        alerts+=("磁盘使用率: ${disk_usage}%")
    else
        log_info "磁盘使用率正常: ${disk_usage}%"
    fi
    
    if [[ ${#alerts[@]} -gt 0 ]]; then
        send_alert "MEDIUM" "系统资源告警: ${alerts[*]}"
        return 1
    fi
    
    return 0
}

# 发送告警
send_alert() {
    local level="$1"
    local message="$2"
    
    log_warn "发送告警: [$level] $message"
    
    if [[ -x "$ALERT_WEBHOOK_SCRIPT" ]]; then
        "$ALERT_WEBHOOK_SCRIPT" "$level" "$message" || log_error "告警发送失败"
    else
        log_warn "告警脚本不存在或不可执行: $ALERT_WEBHOOK_SCRIPT"
    fi
}

# 生成监控报告
generate_report() {
    log_info "生成监控报告..."
    
    local report_file="$LOG_DIR/monitor_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== QuantMind 服务监控报告 ==="
        echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        
        echo "=== 容器状态 ==="
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep quantmind || echo "未找到运行中的容器"
        echo ""
        
        echo "=== 系统资源 ==="
        echo "CPU使用率: $(top -l 1 | grep "CPU usage" | awk '{print $3}' || echo "N/A")"
        echo "内存使用情况:"
        vm_stat | grep -E "Pages (free|active|inactive|wired down)"
        echo "磁盘使用情况:"
        df -h /
        echo ""
        
        echo "=== Docker统计 ==="
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep quantmind || echo "无容器统计信息"
        
    } > "$report_file"
    
    log_info "监控报告已生成: $report_file"
}

# 主函数
main() {
    local exit_code=0
    
    init_monitoring
    
    # 执行各项检查
    check_docker_status || exit_code=1
    check_containers || exit_code=1
    check_service_health || exit_code=1
    check_system_resources || exit_code=1
    
    # 生成报告
    generate_report
    
    if [[ $exit_code -eq 0 ]]; then
        log_info "=== 所有监控检查通过 ==="
        printf "\n${GREEN}✓ 所有服务运行正常${NC}\n"
    else
        log_warn "=== 发现问题，请检查日志 ==="
        printf "\n${YELLOW}⚠ 发现问题，详情请查看日志: $LOG_FILE${NC}\n"
    fi
    
    exit $exit_code
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi