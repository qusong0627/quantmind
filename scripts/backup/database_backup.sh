#!/bin/bash

# QuantMind 数据库备份脚本
# 支持MySQL、Redis、InfluxDB的自动备份和清理

set -euo pipefail

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_DIR="$PROJECT_ROOT/logs/backup"
LOG_FILE="$LOG_DIR/backup.log"

# 备份配置
RETENTION_DAYS=30         # 备份保留天数
COMPRESSION_LEVEL=6       # 压缩级别(1-9)
MAX_BACKUP_SIZE="10G"     # 单个备份文件最大大小

# 数据库配置(从环境变量读取)
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-}"
MYSQL_DATABASE="${MYSQL_DATABASE:-quantmind}"
MYSQL_CONTAINER="quantmind-mysql"
REDIS_CONTAINER="quantmind-redis"
INFLUXDB_CONTAINER="quantmind-influxdb"
INFLUXDB_TOKEN="${INFLUXDB_TOKEN:-}"
INFLUXDB_ORG="${INFLUXDB_ORG:-quantmind}"
INFLUXDB_BUCKET="${INFLUXDB_BUCKET:-trading_data}"

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

# 初始化备份环境
init_backup() {
    log_info "=== QuantMind 数据库备份开始 ==="
    
    # 创建备份目录
    mkdir -p "$BACKUP_DIR"/{mysql,redis,influxdb}
    mkdir -p "$LOG_DIR"
    
    # 检查磁盘空间
    local available_space=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
    local required_space=1048576  # 1GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        log_error "磁盘空间不足，可用空间: ${available_space}KB，需要至少: ${required_space}KB"
        exit 1
    fi
    
    log_info "备份目录: $BACKUP_DIR"
    log_info "可用磁盘空间: $(( available_space / 1024 ))MB"
}

# 检查容器状态
check_container() {
    local container="$1"
    
    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        log_error "容器 $container 未运行"
        return 1
    fi
    
    return 0
}

# MySQL备份
backup_mysql() {
    log_info "开始MySQL数据库备份..."
    
    if ! check_container "$MYSQL_CONTAINER"; then
        return 1
    fi
    
    local backup_file="$BACKUP_DIR/mysql/mysql_backup_$(date +%Y%m%d_%H%M%S).sql"
    local compressed_file="${backup_file}.gz"
    
    # 执行备份
    if docker exec "$MYSQL_CONTAINER" mysqldump \
        -u root \
        -p"$MYSQL_ROOT_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --all-databases > "$backup_file" 2>/dev/null; then
        
        # 压缩备份文件
        if gzip -"$COMPRESSION_LEVEL" "$backup_file"; then
            local file_size=$(du -h "$compressed_file" | cut -f1)
            log_info "MySQL备份完成: $compressed_file (大小: $file_size)"
            
            # 验证备份文件
            if ! gzip -t "$compressed_file"; then
                log_error "MySQL备份文件损坏: $compressed_file"
                rm -f "$compressed_file"
                return 1
            fi
        else
            log_error "MySQL备份压缩失败"
            rm -f "$backup_file"
            return 1
        fi
    else
        log_error "MySQL备份失败"
        rm -f "$backup_file"
        return 1
    fi
    
    return 0
}

# Redis备份
backup_redis() {
    log_info "开始Redis数据库备份..."
    
    if ! check_container "$REDIS_CONTAINER"; then
        return 1
    fi
    
    local backup_file="$BACKUP_DIR/redis/redis_backup_$(date +%Y%m%d_%H%M%S).rdb"
    local compressed_file="${backup_file}.gz"
    
    # 触发Redis保存
    if docker exec "$REDIS_CONTAINER" redis-cli BGSAVE >/dev/null 2>&1; then
        # 等待保存完成
        local max_wait=60
        local wait_time=0
        
        while [[ $wait_time -lt $max_wait ]]; do
            if docker exec "$REDIS_CONTAINER" redis-cli LASTSAVE >/dev/null 2>&1; then
                break
            fi
            sleep 2
            wait_time=$((wait_time + 2))
        done
        
        # 复制RDB文件
        if docker cp "$REDIS_CONTAINER:/data/dump.rdb" "$backup_file" 2>/dev/null; then
            # 压缩备份文件
            if gzip -"$COMPRESSION_LEVEL" "$backup_file"; then
                local file_size=$(du -h "$compressed_file" | cut -f1)
                log_info "Redis备份完成: $compressed_file (大小: $file_size)"
            else
                log_error "Redis备份压缩失败"
                rm -f "$backup_file"
                return 1
            fi
        else
            log_error "Redis备份文件复制失败"
            return 1
        fi
    else
        log_error "Redis备份触发失败"
        return 1
    fi
    
    return 0
}

# InfluxDB备份
backup_influxdb() {
    log_info "开始InfluxDB数据库备份..."
    
    if ! check_container "$INFLUXDB_CONTAINER"; then
        return 1
    fi
    
    if [[ -z "$INFLUXDB_TOKEN" ]]; then
        log_warn "InfluxDB Token未配置，跳过备份"
        return 0
    fi
    
    local backup_file="$BACKUP_DIR/influxdb/influxdb_backup_$(date +%Y%m%d_%H%M%S).tar"
    local compressed_file="${backup_file}.gz"
    
    # 创建临时备份目录
    local temp_backup_dir="/tmp/influxdb_backup_$$"
    
    # 执行备份
    if docker exec "$INFLUXDB_CONTAINER" influx backup \
        --token "$INFLUXDB_TOKEN" \
        --org "$INFLUXDB_ORG" \
        --bucket "$INFLUXDB_BUCKET" \
        "$temp_backup_dir" >/dev/null 2>&1; then
        
        # 打包备份文件
        if docker exec "$INFLUXDB_CONTAINER" tar -cf "/tmp/backup.tar" -C "$temp_backup_dir" . 2>/dev/null; then
            # 复制到宿主机
            if docker cp "$INFLUXDB_CONTAINER:/tmp/backup.tar" "$backup_file" 2>/dev/null; then
                # 压缩备份文件
                if gzip -"$COMPRESSION_LEVEL" "$backup_file"; then
                    local file_size=$(du -h "$compressed_file" | cut -f1)
                    log_info "InfluxDB备份完成: $compressed_file (大小: $file_size)"
                else
                    log_error "InfluxDB备份压缩失败"
                    rm -f "$backup_file"
                    return 1
                fi
            else
                log_error "InfluxDB备份文件复制失败"
                return 1
            fi
        else
            log_error "InfluxDB备份打包失败"
            return 1
        fi
        
        # 清理临时文件
        docker exec "$INFLUXDB_CONTAINER" rm -rf "$temp_backup_dir" "/tmp/backup.tar" 2>/dev/null || true
    else
        log_error "InfluxDB备份失败"
        return 1
    fi
    
    return 0
}

# 清理过期备份
cleanup_old_backups() {
    log_info "清理过期备份文件..."
    
    local deleted_count=0
    
    # 清理各数据库的过期备份
    for db_type in mysql redis influxdb; do
        local db_backup_dir="$BACKUP_DIR/$db_type"
        
        if [[ -d "$db_backup_dir" ]]; then
            # 查找并删除过期文件
            while IFS= read -r -d '' file; do
                rm -f "$file"
                deleted_count=$((deleted_count + 1))
                log_info "删除过期备份: $(basename "$file")"
            done < <(find "$db_backup_dir" -name "*.gz" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
        fi
    done
    
    if [[ $deleted_count -gt 0 ]]; then
        log_info "清理完成，删除了 $deleted_count 个过期备份文件"
    else
        log_info "没有找到过期的备份文件"
    fi
}

# 生成备份报告
generate_backup_report() {
    log_info "生成备份报告..."
    
    local report_file="$LOG_DIR/backup_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== QuantMind 数据库备份报告 ==="
        echo "备份时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "备份目录: $BACKUP_DIR"
        echo ""
        
        for db_type in mysql redis influxdb; do
            echo "=== ${db_type^^} 备份文件 ==="
            local db_backup_dir="$BACKUP_DIR/$db_type"
            
            if [[ -d "$db_backup_dir" ]]; then
                local file_count=$(find "$db_backup_dir" -name "*.gz" -type f | wc -l)
                echo "备份文件数量: $file_count"
                
                if [[ $file_count -gt 0 ]]; then
                    echo "最新备份文件:"
                    find "$db_backup_dir" -name "*.gz" -type f -exec ls -lh {} \; | sort -k6,7 | tail -5
                    
                    echo "总备份大小:"
                    du -sh "$db_backup_dir" 2>/dev/null || echo "无法计算大小"
                else
                    echo "没有找到备份文件"
                fi
            else
                echo "备份目录不存在"
            fi
            echo ""
        done
        
        echo "=== 磁盘使用情况 ==="
        df -h "$BACKUP_DIR"
        
    } > "$report_file"
    
    log_info "备份报告已生成: $report_file"
}

# 主函数
main() {
    local backup_type="${1:-all}"
    local exit_code=0
    
    init_backup
    
    case "$backup_type" in
        "mysql")
            backup_mysql || exit_code=1
            ;;
        "redis")
            backup_redis || exit_code=1
            ;;
        "influxdb")
            backup_influxdb || exit_code=1
            ;;
        "all")
            backup_mysql || exit_code=1
            backup_redis || exit_code=1
            backup_influxdb || exit_code=1
            ;;
        *)
            log_error "无效的备份类型: $backup_type"
            echo "用法: $0 [mysql|redis|influxdb|all]"
            exit 1
            ;;
    esac
    
    # 清理过期备份
    cleanup_old_backups
    
    # 生成报告
    generate_backup_report
    
    if [[ $exit_code -eq 0 ]]; then
        log_info "=== 数据库备份完成 ==="
        printf "\n${GREEN}✓ 数据库备份成功完成${NC}\n"
    else
        log_warn "=== 备份过程中发现问题 ==="
        printf "\n${YELLOW}⚠ 备份完成但有警告，详情请查看日志: $LOG_FILE${NC}\n"
    fi
    
    exit $exit_code
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi