#!/bin/bash

# QuantMind 日志清理脚本
# 定期清理应用日志、Docker日志、备份日志和临时文件

set -euo pipefail

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
CLEANUP_LOG="$LOG_DIR/cleanup.log"

# 清理配置
APP_LOG_RETENTION_DAYS=7      # 应用日志保留天数
DOCKER_LOG_RETENTION_DAYS=3   # Docker日志保留天数
BACKUP_LOG_RETENTION_DAYS=30  # 备份日志保留天数
TEMP_FILE_RETENTION_HOURS=24  # 临时文件保留小时数
MAX_LOG_SIZE="100M"           # 单个日志文件最大大小

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
    echo "[$timestamp] [$level] $message" | tee -a "$CLEANUP_LOG"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }

# 初始化清理环境
init_cleanup() {
    mkdir -p "$LOG_DIR"
    log_info "=== QuantMind 日志清理开始 ==="
    log_info "清理配置: 应用日志保留${APP_LOG_RETENTION_DAYS}天, Docker日志保留${DOCKER_LOG_RETENTION_DAYS}天"
}

# 获取文件大小（人类可读格式）
get_file_size() {
    local file="$1"
    if [[ -f "$file" ]]; then
        du -h "$file" | cut -f1
    else
        echo "0B"
    fi
}

# 清理应用日志
cleanup_app_logs() {
    log_info "清理应用日志..."
    
    local deleted_count=0
    local freed_space=0
    
    # 清理各服务的日志文件
    local log_patterns=(
        "$LOG_DIR/*.log"
        "$LOG_DIR/*/*.log"
        "$LOG_DIR/*/*/*.log"
    )
    
    for pattern in "${log_patterns[@]}"; do
        while IFS= read -r -d '' file; do
            if [[ -f "$file" ]]; then
                local file_age=$(stat -f "%m" "$file" 2>/dev/null || echo "0")
                local current_time=$(date +%s)
                local age_days=$(( (current_time - file_age) / 86400 ))
                
                if [[ $age_days -gt $APP_LOG_RETENTION_DAYS ]]; then
                    local file_size=$(stat -f "%z" "$file" 2>/dev/null || echo "0")
                    rm -f "$file"
                    deleted_count=$((deleted_count + 1))
                    freed_space=$((freed_space + file_size))
                    log_info "删除过期应用日志: $(basename "$file") (${age_days}天前)"
                fi
            fi
        done < <(find $(dirname "$pattern") -name "$(basename "$pattern")" -type f -print0 2>/dev/null || true)
    done
    
    # 清理大文件日志（超过最大大小限制）
    while IFS= read -r -d '' file; do
        if [[ -f "$file" ]]; then
            local file_size=$(stat -f "%z" "$file" 2>/dev/null || echo "0")
            local max_size_bytes=$(echo "$MAX_LOG_SIZE" | sed 's/M/*1024*1024/' | bc 2>/dev/null || echo "104857600")
            
            if [[ $file_size -gt $max_size_bytes ]]; then
                # 保留最后1000行
                local temp_file="${file}.tmp"
                tail -n 1000 "$file" > "$temp_file" && mv "$temp_file" "$file"
                log_info "截断大日志文件: $(basename "$file") (原大小: $(get_file_size "$file"))"
            fi
        fi
    done < <(find "$LOG_DIR" -name "*.log" -type f -print0 2>/dev/null || true)
    
    if [[ $deleted_count -gt 0 ]]; then
        local freed_mb=$((freed_space / 1024 / 1024))
        log_info "应用日志清理完成: 删除 $deleted_count 个文件，释放 ${freed_mb}MB 空间"
    else
        log_info "没有找到需要清理的应用日志文件"
    fi
}

# 清理Docker日志
cleanup_docker_logs() {
    log_info "清理Docker容器日志..."
    
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
    
    local cleaned_count=0
    
    for container in "${containers[@]}"; do
        if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
            # 获取容器日志文件路径
            local log_file=$(docker inspect "$container" --format='{{.LogPath}}' 2>/dev/null || echo "")
            
            if [[ -n "$log_file" && -f "$log_file" ]]; then
                local file_size_before=$(stat -f "%z" "$log_file" 2>/dev/null || echo "0")
                
                # 清理日志（保留最后1000行）
                if [[ $file_size_before -gt 1048576 ]]; then  # 大于1MB才清理
                    local temp_file="${log_file}.tmp"
                    tail -n 1000 "$log_file" > "$temp_file" 2>/dev/null && mv "$temp_file" "$log_file" 2>/dev/null
                    
                    local file_size_after=$(stat -f "%z" "$log_file" 2>/dev/null || echo "0")
                    local saved_bytes=$((file_size_before - file_size_after))
                    local saved_mb=$((saved_bytes / 1024 / 1024))
                    
                    if [[ $saved_bytes -gt 0 ]]; then
                        log_info "清理容器日志: $container (节省 ${saved_mb}MB)"
                        cleaned_count=$((cleaned_count + 1))
                    fi
                fi
            fi
        fi
    done
    
    if [[ $cleaned_count -gt 0 ]]; then
        log_info "Docker日志清理完成: 清理了 $cleaned_count 个容器的日志"
    else
        log_info "没有找到需要清理的Docker日志"
    fi
}

# 清理备份日志
cleanup_backup_logs() {
    log_info "清理备份相关日志..."
    
    local deleted_count=0
    local backup_log_dir="$LOG_DIR/backup"
    
    if [[ -d "$backup_log_dir" ]]; then
        while IFS= read -r -d '' file; do
            local file_age=$(stat -f "%m" "$file" 2>/dev/null || echo "0")
            local current_time=$(date +%s)
            local age_days=$(( (current_time - file_age) / 86400 ))
            
            if [[ $age_days -gt $BACKUP_LOG_RETENTION_DAYS ]]; then
                rm -f "$file"
                deleted_count=$((deleted_count + 1))
                log_info "删除过期备份日志: $(basename "$file") (${age_days}天前)"
            fi
        done < <(find "$backup_log_dir" -name "*.log" -o -name "*.txt" -type f -print0 2>/dev/null || true)
    fi
    
    if [[ $deleted_count -gt 0 ]]; then
        log_info "备份日志清理完成: 删除 $deleted_count 个文件"
    else
        log_info "没有找到需要清理的备份日志文件"
    fi
}

# 清理临时文件
cleanup_temp_files() {
    log_info "清理临时文件..."
    
    local deleted_count=0
    local temp_patterns=(
        "$PROJECT_ROOT/*.tmp"
        "$PROJECT_ROOT/*.temp"
        "$PROJECT_ROOT/.DS_Store"
        "$PROJECT_ROOT/*/.DS_Store"
        "$PROJECT_ROOT/*/*/.DS_Store"
        "/tmp/quantmind_*"
        "/tmp/docker_*"
    )
    
    for pattern in "${temp_patterns[@]}"; do
        while IFS= read -r -d '' file; do
            if [[ -f "$file" ]]; then
                local file_age=$(stat -f "%m" "$file" 2>/dev/null || echo "0")
                local current_time=$(date +%s)
                local age_hours=$(( (current_time - file_age) / 3600 ))
                
                if [[ $age_hours -gt $TEMP_FILE_RETENTION_HOURS ]]; then
                    rm -f "$file"
                    deleted_count=$((deleted_count + 1))
                    log_info "删除临时文件: $(basename "$file") (${age_hours}小时前)"
                fi
            fi
        done < <(find $(dirname "$pattern") -name "$(basename "$pattern")" -type f -print0 2>/dev/null || true)
    done
    
    if [[ $deleted_count -gt 0 ]]; then
        log_info "临时文件清理完成: 删除 $deleted_count 个文件"
    else
        log_info "没有找到需要清理的临时文件"
    fi
}

# 清理Docker系统
cleanup_docker_system() {
    log_info "清理Docker系统资源..."
    
    # 清理未使用的镜像、容器、网络和卷
    local cleanup_output
    cleanup_output=$(docker system prune -f --volumes 2>&1 || echo "Docker清理失败")
    
    if [[ "$cleanup_output" != "Docker清理失败" ]]; then
        log_info "Docker系统清理完成"
        echo "$cleanup_output" | while IFS= read -r line; do
            [[ -n "$line" ]] && log_info "Docker清理: $line"
        done
    else
        log_warn "Docker系统清理失败"
    fi
}

# 生成清理报告
generate_cleanup_report() {
    log_info "生成清理报告..."
    
    local report_file="$LOG_DIR/cleanup_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== QuantMind 日志清理报告 ==="
        echo "清理时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        
        echo "=== 当前日志目录大小 ==="
        if [[ -d "$LOG_DIR" ]]; then
            du -sh "$LOG_DIR"/* 2>/dev/null | sort -hr || echo "日志目录为空"
        else
            echo "日志目录不存在"
        fi
        echo ""
        
        echo "=== Docker磁盘使用情况 ==="
        docker system df 2>/dev/null || echo "无法获取Docker磁盘使用情况"
        echo ""
        
        echo "=== 系统磁盘使用情况 ==="
        df -h "$PROJECT_ROOT"
        echo ""
        
        echo "=== 最近的清理日志 ==="
        tail -n 20 "$CLEANUP_LOG" 2>/dev/null || echo "无清理日志"
        
    } > "$report_file"
    
    log_info "清理报告已生成: $report_file"
}

# 主函数
main() {
    local cleanup_type="${1:-all}"
    
    init_cleanup
    
    case "$cleanup_type" in
        "app")
            cleanup_app_logs
            ;;
        "docker")
            cleanup_docker_logs
            cleanup_docker_system
            ;;
        "backup")
            cleanup_backup_logs
            ;;
        "temp")
            cleanup_temp_files
            ;;
        "all")
            cleanup_app_logs
            cleanup_docker_logs
            cleanup_backup_logs
            cleanup_temp_files
            cleanup_docker_system
            ;;
        *)
            log_error "无效的清理类型: $cleanup_type"
            echo "用法: $0 [app|docker|backup|temp|all]"
            exit 1
            ;;
    esac
    
    # 生成报告
    generate_cleanup_report
    
    log_info "=== 日志清理完成 ==="
    printf "\n${GREEN}✓ 日志清理成功完成${NC}\n"
    printf "详细信息请查看清理报告和日志文件\n"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi