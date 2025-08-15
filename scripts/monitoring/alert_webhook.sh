#!/bin/bash

# QuantMind 告警通知脚本
# 支持Webhook、邮件、Slack等多种通知方式

set -euo pipefail

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs/alerts"
LOG_FILE="$LOG_DIR/alerts.log"

# 告警配置(从环境变量读取)
WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_SMTP_SERVER="${EMAIL_SMTP_SERVER:-}"
EMAIL_SMTP_PORT="${EMAIL_SMTP_PORT:-587}"
EMAIL_USERNAME="${EMAIL_USERNAME:-}"
EMAIL_PASSWORD="${EMAIL_PASSWORD:-}"
EMAIL_FROM="${EMAIL_FROM:-noreply@quantmind.com}"
EMAIL_TO="${EMAIL_TO:-}"
DINGTALK_WEBHOOK_URL="${DINGTALK_WEBHOOK_URL:-}"
WECOM_WEBHOOK_URL="${WECOM_WEBHOOK_URL:-}"

# 告警级别配置
declare -A ALERT_COLORS=(
    ["CRITICAL"]="#FF0000"
    ["HIGH"]="#FF6600"
    ["MEDIUM"]="#FFCC00"
    ["LOW"]="#00CC00"
    ["INFO"]="#0066CC"
)

declare -A ALERT_EMOJIS=(
    ["CRITICAL"]="🚨"
    ["HIGH"]="⚠️"
    ["MEDIUM"]="⚡"
    ["LOW"]="ℹ️"
    ["INFO"]="📊"
)

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

# 初始化告警环境
init_alerts() {
    mkdir -p "$LOG_DIR"
    log_info "=== QuantMind 告警通知初始化 ==="
}

# 格式化告警消息
format_alert_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local hostname=$(hostname)
    
    cat << EOF
${ALERT_EMOJIS[$level]} QuantMind 系统告警

级别: $level
时间: $timestamp
主机: $hostname
消息: $message

--- 
此消息由 QuantMind 监控系统自动发送
EOF
}

# 发送Webhook通知
send_webhook_alert() {
    local level="$1"
    local message="$2"
    
    if [[ -z "$WEBHOOK_URL" ]]; then
        log_warn "Webhook URL未配置，跳过Webhook通知"
        return 0
    fi
    
    local payload=$(cat << EOF
{
    "level": "$level",
    "message": "$message",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "hostname": "$(hostname)",
    "service": "QuantMind",
    "color": "${ALERT_COLORS[$level]}"
}
EOF
    )
    
    if curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$WEBHOOK_URL" >/dev/null 2>&1; then
        log_info "Webhook通知发送成功"
        return 0
    else
        log_error "Webhook通知发送失败"
        return 1
    fi
}

# 发送Slack通知
send_slack_alert() {
    local level="$1"
    local message="$2"
    
    if [[ -z "$SLACK_WEBHOOK_URL" ]]; then
        log_warn "Slack Webhook URL未配置，跳过Slack通知"
        return 0
    fi
    
    local color="${ALERT_COLORS[$level]}"
    local emoji="${ALERT_EMOJIS[$level]}"
    local formatted_message=$(format_alert_message "$level" "$message")
    
    local payload=$(cat << EOF
{
    "username": "QuantMind Monitor",
    "icon_emoji": ":robot_face:",
    "attachments": [
        {
            "color": "$color",
            "title": "$emoji QuantMind 系统告警",
            "text": "$formatted_message",
            "footer": "QuantMind Monitoring",
            "ts": $(date +%s)
        }
    ]
}
EOF
    )
    
    if curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$SLACK_WEBHOOK_URL" >/dev/null 2>&1; then
        log_info "Slack通知发送成功"
        return 0
    else
        log_error "Slack通知发送失败"
        return 1
    fi
}

# 发送钉钉通知
send_dingtalk_alert() {
    local level="$1"
    local message="$2"
    
    if [[ -z "$DINGTALK_WEBHOOK_URL" ]]; then
        log_warn "钉钉 Webhook URL未配置，跳过钉钉通知"
        return 0
    fi
    
    local emoji="${ALERT_EMOJIS[$level]}"
    local formatted_message=$(format_alert_message "$level" "$message")
    
    local payload=$(cat << EOF
{
    "msgtype": "text",
    "text": {
        "content": "$formatted_message"
    }
}
EOF
    )
    
    if curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$DINGTALK_WEBHOOK_URL" >/dev/null 2>&1; then
        log_info "钉钉通知发送成功"
        return 0
    else
        log_error "钉钉通知发送失败"
        return 1
    fi
}

# 发送企业微信通知
send_wecom_alert() {
    local level="$1"
    local message="$2"
    
    if [[ -z "$WECOM_WEBHOOK_URL" ]]; then
        log_warn "企业微信 Webhook URL未配置，跳过企业微信通知"
        return 0
    fi
    
    local emoji="${ALERT_EMOJIS[$level]}"
    local formatted_message=$(format_alert_message "$level" "$message")
    
    local payload=$(cat << EOF
{
    "msgtype": "text",
    "text": {
        "content": "$formatted_message"
    }
}
EOF
    )
    
    if curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$WECOM_WEBHOOK_URL" >/dev/null 2>&1; then
        log_info "企业微信通知发送成功"
        return 0
    else
        log_error "企业微信通知发送失败"
        return 1
    fi
}

# 发送邮件通知
send_email_alert() {
    local level="$1"
    local message="$2"
    
    if [[ -z "$EMAIL_TO" || -z "$EMAIL_SMTP_SERVER" ]]; then
        log_warn "邮件配置不完整，跳过邮件通知"
        return 0
    fi
    
    local subject="[QuantMind] ${ALERT_EMOJIS[$level]} $level 级别告警"
    local body=$(format_alert_message "$level" "$message")
    
    # 创建临时邮件文件
    local temp_mail_file="/tmp/quantmind_alert_$$.txt"
    
    cat << EOF > "$temp_mail_file"
To: $EMAIL_TO
From: $EMAIL_FROM
Subject: $subject
Content-Type: text/plain; charset=UTF-8

$body
EOF
    
    # 发送邮件(使用sendmail或msmtp)
    if command -v sendmail >/dev/null 2>&1; then
        if sendmail -t < "$temp_mail_file" 2>/dev/null; then
            log_info "邮件通知发送成功(sendmail)"
            rm -f "$temp_mail_file"
            return 0
        fi
    elif command -v msmtp >/dev/null 2>&1; then
        if msmtp -t < "$temp_mail_file" 2>/dev/null; then
            log_info "邮件通知发送成功(msmtp)"
            rm -f "$temp_mail_file"
            return 0
        fi
    fi
    
    log_error "邮件通知发送失败"
    rm -f "$temp_mail_file"
    return 1
}

# 发送系统通知(macOS)
send_system_notification() {
    local level="$1"
    local message="$2"
    
    if command -v osascript >/dev/null 2>&1; then
        local title="QuantMind ${ALERT_EMOJIS[$level]} $level"
        osascript -e "display notification \"$message\" with title \"$title\"" 2>/dev/null || true
        log_info "系统通知已发送"
    fi
}

# 记录告警历史
record_alert_history() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    local history_file="$LOG_DIR/alert_history.json"
    
    # 创建告警记录
    local alert_record=$(cat << EOF
{
    "timestamp": "$timestamp",
    "level": "$level",
    "message": "$message",
    "hostname": "$(hostname)",
    "id": "$(date +%s)_$$"
}
EOF
    )
    
    # 追加到历史文件
    if [[ -f "$history_file" ]]; then
        # 如果文件存在，添加逗号分隔
        echo ",$alert_record" >> "$history_file"
    else
        # 创建新文件
        echo "[$alert_record" > "$history_file"
    fi
    
    # 限制历史记录数量(保留最近1000条)
    local line_count=$(wc -l < "$history_file" 2>/dev/null || echo "0")
    if [[ $line_count -gt 1000 ]]; then
        tail -n 1000 "$history_file" > "${history_file}.tmp" && mv "${history_file}.tmp" "$history_file"
    fi
}

# 主函数
main() {
    local level="${1:-INFO}"
    local message="${2:-测试告警消息}"
    
    # 验证告警级别
    if [[ ! "${!ALERT_COLORS[@]}" =~ $level ]]; then
        log_error "无效的告警级别: $level"
        echo "支持的级别: ${!ALERT_COLORS[*]}"
        exit 1
    fi
    
    init_alerts
    
    log_info "发送 $level 级别告警: $message"
    
    # 记录告警历史
    record_alert_history "$level" "$message"
    
    local success_count=0
    local total_count=0
    
    # 发送各种通知
    if send_webhook_alert "$level" "$message"; then
        success_count=$((success_count + 1))
    fi
    total_count=$((total_count + 1))
    
    if send_slack_alert "$level" "$message"; then
        success_count=$((success_count + 1))
    fi
    total_count=$((total_count + 1))
    
    if send_dingtalk_alert "$level" "$message"; then
        success_count=$((success_count + 1))
    fi
    total_count=$((total_count + 1))
    
    if send_wecom_alert "$level" "$message"; then
        success_count=$((success_count + 1))
    fi
    total_count=$((total_count + 1))
    
    if send_email_alert "$level" "$message"; then
        success_count=$((success_count + 1))
    fi
    total_count=$((total_count + 1))
    
    # 发送系统通知(不计入统计)
    send_system_notification "$level" "$message"
    
    log_info "告警通知完成: $success_count/$total_count 个通道发送成功"
    
    if [[ $success_count -gt 0 ]]; then
        printf "\n${GREEN}✓ 告警通知发送完成 ($success_count/$total_count)${NC}\n"
        exit 0
    else
        printf "\n${RED}✗ 所有通知通道发送失败${NC}\n"
        exit 1
    fi
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi