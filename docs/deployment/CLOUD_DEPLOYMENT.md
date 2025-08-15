# QuantMind 云服务器部署指南

本文档提供了 QuantMind 量化交易平台在云服务器上的完整部署指南，包括环境准备、配置、部署、监控和维护等各个环节。

## 目录

- [系统要求](#系统要求)
- [环境准备](#环境准备)
- [快速部署](#快速部署)
- [详细配置](#详细配置)
- [服务管理](#服务管理)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)
- [性能优化](#性能优化)
- [安全配置](#安全配置)
- [备份和恢复](#备份和恢复)

## 系统要求

### 硬件要求

| 组件 | 最低配置 | 推荐配置 | 生产环境 |
|------|----------|----------|----------|
| CPU | 2核 | 4核 | 8核+ |
| 内存 | 4GB | 8GB | 16GB+ |
| 存储 | 50GB SSD | 100GB SSD | 500GB+ SSD |
| 网络 | 10Mbps | 100Mbps | 1Gbps+ |

### 软件要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Nginx**: 1.20+ (可选，用于反向代理)
- **SSL证书**: Let's Encrypt 或商业证书

### 网络要求

- **入站端口**: 80 (HTTP), 443 (HTTPS), 22 (SSH)
- **出站端口**: 80, 443 (用于数据获取和更新)
- **内部端口**: 3000 (前端), 8000 (API网关), 3306 (MySQL), 6379 (Redis)

## 环境准备

### 1. 服务器初始化

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git vim htop unzip

# 创建应用用户
sudo useradd -m -s /bin/bash quantmind
sudo usermod -aG sudo quantmind
sudo usermod -aG docker quantmind
```

### 2. 使用自动化脚本

我们提供了自动化的环境准备脚本：

```bash
# 下载并执行环境准备脚本
wget https://raw.githubusercontent.com/your-repo/quantmind/main/scripts/deploy/cloud_setup.sh
chmod +x cloud_setup.sh
sudo ./cloud_setup.sh
```

该脚本将自动完成：
- 系统环境检查和优化
- Docker 和 Docker Compose 安装
- 防火墙配置
- 用户和权限设置
- 系统服务配置

## 快速部署

### 一键部署脚本

```bash
# 克隆项目
git clone https://github.com/your-repo/quantmind.git
cd quantmind

# 执行一键部署
./scripts/deploy/one_click_deploy.sh
```

一键部署脚本将引导您完成：
1. 环境变量配置
2. SSL证书设置
3. 域名配置
4. 数据库初始化
5. 服务启动

### 手动部署步骤

如果您希望手动控制部署过程：

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/quantmind.git
cd quantmind

# 2. 配置环境变量
cp .env.example .env
vim .env  # 编辑配置文件

# 3. 构建和启动服务
docker-compose -f docker-compose.prod.yml up -d

# 4. 初始化数据库
docker-compose -f docker-compose.prod.yml exec api-gateway python manage.py migrate

# 5. 创建管理员用户
docker-compose -f docker-compose.prod.yml exec api-gateway python manage.py createsuperuser
```

## 详细配置

### 环境变量配置

创建 `.env` 文件并配置以下变量：

```bash
# 基础配置
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your-secret-key-here

# 域名配置
DOMAIN=your-domain.com
SSL_EMAIL=admin@your-domain.com

# 数据库配置
MYSQL_ROOT_PASSWORD=your-mysql-root-password
MYSQL_DATABASE=quantmind
MYSQL_USER=quantmind
MYSQL_PASSWORD=your-mysql-password

# Redis配置
REDIS_PASSWORD=your-redis-password

# JWT配置
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# 邮件配置
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-email-password

# 告警配置
ALERT_WEBHOOK_URL=https://hooks.slack.com/your-webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/your-slack-webhook
EMAIL_TO=admin@your-domain.com

# 数据源配置
TENCENT_API_ENABLED=true
TSANGHI_API_ENABLED=true
```

### SSL证书配置

#### 使用 Let's Encrypt (推荐)

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 使用自有证书

将证书文件放置在以下位置：
- 证书文件: `/opt/quantmind/ssl/cert.pem`
- 私钥文件: `/opt/quantmind/ssl/key.pem`
- 证书链文件: `/opt/quantmind/ssl/chain.pem`

### Nginx 配置

我们提供了优化的 Nginx 配置文件：

```bash
# 复制配置文件
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo cp nginx/conf.d/default.conf /etc/nginx/conf.d/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 服务管理

### 系统服务配置

将 QuantMind 注册为系统服务：

```bash
# 复制服务文件
sudo cp systemd/quantmind.service /etc/systemd/system/

# 重新加载 systemd
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable quantmind

# 启动服务
sudo systemctl start quantmind

# 检查状态
sudo systemctl status quantmind
```

### 定时任务配置

```bash
# 安装定时任务
sudo crontab -u quantmind systemd/quantmind.crontab

# 检查定时任务
sudo crontab -u quantmind -l
```

### 常用服务命令

```bash
# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart api-gateway

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看服务日志
docker-compose -f docker-compose.prod.yml logs -f api-gateway

# 进入容器
docker-compose -f docker-compose.prod.yml exec api-gateway bash
```

## 监控和维护

### 服务监控

我们提供了完整的监控脚本：

```bash
# 执行服务状态检查
./scripts/monitoring/service_monitor.sh

# 生成详细报告
./scripts/monitoring/service_monitor.sh --detailed-report

# 快速健康检查
./scripts/monitoring/service_monitor.sh --health-check
```

### 数据备份

```bash
# 执行数据库备份
./scripts/backup/database_backup.sh

# 压缩备份
./scripts/backup/database_backup.sh --compress

# 完整备份
./scripts/backup/database_backup.sh --full-backup
```

### 日志管理

```bash
# 清理应用日志
./scripts/maintenance/log_cleanup.sh app

# 清理 Docker 日志
./scripts/maintenance/log_cleanup.sh docker

# 完整日志清理
./scripts/maintenance/log_cleanup.sh all
```

### 告警通知

```bash
# 发送测试告警
./scripts/monitoring/alert_webhook.sh INFO "系统运行正常"

# 发送高级别告警
./scripts/monitoring/alert_webhook.sh CRITICAL "系统异常"
```

## 故障排除

### 常见问题

#### 1. 容器启动失败

```bash
# 检查容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看容器日志
docker-compose -f docker-compose.prod.yml logs container-name

# 检查资源使用
docker stats

# 重新构建容器
docker-compose -f docker-compose.prod.yml build --no-cache
```

#### 2. 数据库连接问题

```bash
# 检查 MySQL 容器状态
docker-compose -f docker-compose.prod.yml logs mysql

# 测试数据库连接
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p

# 检查网络连接
docker network ls
docker network inspect quantmind_default
```

#### 3. 前端访问问题

```bash
# 检查 Nginx 状态
sudo systemctl status nginx

# 测试 Nginx 配置
sudo nginx -t

# 检查端口占用
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

#### 4. SSL 证书问题

```bash
# 检查证书有效期
openssl x509 -in /path/to/cert.pem -text -noout

# 测试 SSL 连接
openssl s_client -connect your-domain.com:443

# 续期 Let's Encrypt 证书
sudo certbot renew --dry-run
```

### 日志分析

#### 应用日志位置

- 应用日志: `/opt/quantmind/logs/`
- Nginx 日志: `/var/log/nginx/`
- Docker 日志: `docker logs container-name`
- 系统日志: `/var/log/syslog`

#### 常用日志命令

```bash
# 实时查看应用日志
tail -f /opt/quantmind/logs/app.log

# 搜索错误日志
grep -i error /opt/quantmind/logs/*.log

# 分析访问日志
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr
```

## 性能优化

### 系统优化

```bash
# 调整系统参数
echo 'vm.swappiness=10' >> /etc/sysctl.conf
echo 'net.core.somaxconn=65535' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog=65535' >> /etc/sysctl.conf
sysctl -p

# 优化文件描述符限制
echo '* soft nofile 65535' >> /etc/security/limits.conf
echo '* hard nofile 65535' >> /etc/security/limits.conf
```

### Docker 优化

```bash
# 配置 Docker 守护进程
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true
}
EOF

sudo systemctl restart docker
```

### 数据库优化

```bash
# MySQL 配置优化
cat > mysql/conf.d/optimization.cnf << EOF
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
query_cache_size = 128M
max_connections = 200
EOF
```

### 应用优化

- **前端优化**: 启用 Gzip 压缩、静态资源缓存
- **API优化**: 数据库连接池、Redis 缓存
- **网络优化**: CDN 加速、负载均衡

## 安全配置

### 防火墙设置

```bash
# 配置 UFW 防火墙
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### SSH 安全

```bash
# 配置 SSH
sudo vim /etc/ssh/sshd_config

# 修改以下配置：
# Port 2222  # 更改默认端口
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes

sudo systemctl restart ssh
```

### 应用安全

- 定期更新系统和依赖
- 使用强密码和 JWT 密钥
- 启用 HTTPS 和安全头
- 配置 API 限流
- 定期备份数据

## 备份和恢复

### 数据备份策略

- **每日备份**: 数据库增量备份
- **每周备份**: 完整数据备份
- **每月备份**: 系统配置备份
- **实时备份**: 关键交易数据

### 备份脚本使用

```bash
# 创建备份
./scripts/backup/database_backup.sh --full-backup

# 恢复数据
./scripts/backup/restore_backup.sh /path/to/backup.sql

# 清理旧备份
./scripts/backup/database_backup.sh --cleanup-old
```

### 灾难恢复

1. **准备新服务器**
2. **恢复系统配置**
3. **恢复数据库数据**
4. **验证服务功能**
5. **切换 DNS 解析**

## 升级和维护

### 应用升级

```bash
# 备份当前版本
./scripts/backup/database_backup.sh --full-backup

# 拉取最新代码
git pull origin main

# 重新构建和部署
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 执行数据库迁移
docker-compose -f docker-compose.prod.yml exec api-gateway python manage.py migrate
```

### 定期维护任务

- 检查系统资源使用情况
- 清理日志和临时文件
- 更新系统和依赖包
- 检查备份完整性
- 测试灾难恢复流程

## 联系支持

如果您在部署过程中遇到问题，请通过以下方式联系我们：

- **GitHub Issues**: https://github.com/your-repo/quantmind/issues
- **邮件支持**: support@quantmind.com
- **技术文档**: https://docs.quantmind.com

---

**注意**: 本文档会持续更新，请定期检查最新版本。在生产环境部署前，建议先在测试环境中验证所有配置和流程。