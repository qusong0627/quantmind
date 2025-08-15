# QuantMind 部署指南

## 🚀 快速部署

### 环境要求

- **操作系统**: Linux (Ubuntu 20.04+, CentOS 7+), macOS 10.15+, Windows 10+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **内存**: 4GB+ (推荐8GB+)
- **磁盘**: 20GB+ 可用空间
- **网络**: 稳定的网络连接

### 一键部署

```bash
# 克隆项目
git clone <repository_url>
cd quantmind

# 配置环境变量
cp env.example .env
# 编辑 .env 文件配置您的环境变量

# 一键部署
chmod +x scripts/deploy/deploy.sh
./scripts/deploy/deploy.sh
```

## 🔧 手动部署

### 1. 环境准备

```bash
# 安装Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. 项目配置

```bash
# 创建必要的目录
mkdir -p data/{mysql/init,uploads} logs

# 配置环境变量
cp env.example .env
nano .env  # 编辑配置文件
```

### 3. 构建和启动

```bash
# 构建基础镜像
docker-compose build python-base

# 构建所有服务
docker-compose build

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

## 🌐 生产环境部署

### 1. 服务器配置

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git nginx ufw

# 配置防火墙
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # 前端
sudo ufw allow 8000/tcp  # API网关
sudo ufw enable
```

### 2. 域名和SSL配置

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d yourdomain.com

# 配置Nginx
sudo nano /etc/nginx/sites-available/quantmind
```

### 3. Nginx配置示例

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # 前端应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API网关
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. 系统服务配置

```bash
# 创建systemd服务文件
sudo nano /etc/systemd/system/quantmind.service
```

```ini
[Unit]
Description=QuantMind Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/root/quantmind
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# 启用服务
sudo systemctl enable quantmind
sudo systemctl start quantmind
```

## 🔍 部署验证

### 1. 服务状态检查

```bash
# 查看所有服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f

# 执行健康检查
./scripts/deploy/health_check.sh
```

### 2. 功能测试

```bash
# 测试API网关
curl http://localhost:8000/health

# 测试前端应用
curl http://localhost:3000

# 测试数据库连接
docker-compose exec api-gateway python -c "
import requests
print(requests.get('http://localhost:8000/health').json())
"
```

### 3. 性能测试

```bash
# 安装ab工具
sudo apt install -y apache2-utils

# 压力测试API
ab -n 1000 -c 10 http://localhost:8000/health

# 监控系统资源
htop
docker stats
```

## 🛠️ 维护操作

### 1. 日常维护

```bash
# 查看服务状态
docker-compose ps

# 查看资源使用
docker stats

# 查看磁盘使用
docker system df

# 清理日志
docker-compose logs --tail=1000 > logs_backup.log
docker-compose logs --tail=0
```

### 2. 更新服务

```bash
# 拉取最新代码
git pull origin main

# 重新构建服务
docker-compose build --no-cache

# 重启服务
docker-compose up -d

# 验证更新
./scripts/deploy/health_check.sh
```

### 3. 备份和恢复

```bash
# 备份数据库
docker-compose exec mysql mysqldump -u root -p quantmind > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份配置文件
tar -czf config_backup_$(date +%Y%m%d_%H%M%S).tar.gz .env docker-compose.yml

# 恢复数据库
docker-compose exec -T mysql mysql -u root -p quantmind < backup_file.sql
```

## 🐛 故障排查

### 1. 常见问题

#### 服务启动失败
```bash
# 查看详细错误
docker-compose logs <service_name>

# 检查端口占用
netstat -tulpn | grep :8000

# 检查资源使用
docker stats
```

#### 数据库连接失败
```bash
# 检查数据库状态
docker-compose ps mysql

# 测试网络连接
docker-compose exec api-gateway ping mysql

# 查看数据库日志
docker-compose logs mysql
```

#### 内存不足
```bash
# 查看内存使用
free -h

# 限制容器内存
# 在docker-compose.yml中添加:
# deploy:
#   resources:
#     limits:
#       memory: 1G
```

### 2. 日志分析

```bash
# 查看错误日志
docker-compose logs | grep ERROR

# 查看特定时间段的日志
docker-compose logs --since="2024-01-01T00:00:00" --until="2024-01-01T23:59:59"

# 导出日志
docker-compose logs > all_logs.log
```

### 3. 性能调优

```bash
# 调整Docker守护进程配置
sudo nano /etc/docker/daemon.json
```

```json
{
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## 📊 监控和告警

### 1. 基础监控

```bash
# 安装监控工具
sudo apt install -y htop iotop nethogs

# 创建监控脚本
nano monitor.sh
```

```bash
#!/bin/bash
# 系统资源监控
echo "=== 系统资源 ==="
echo "CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "内存使用率: $(free | grep Mem | awk '{printf("%.2f%%", $3/$2 * 100.0)}')"
echo "磁盘使用率: $(df / | tail -1 | awk '{print $5}')"

echo "=== Docker状态 ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo "=== 服务状态 ==="
docker-compose ps
```

### 2. 告警配置

```bash
# 创建告警脚本
nano alert.sh
```

```bash
#!/bin/bash
# 检查服务状态并发送告警
if ! docker-compose ps | grep -q "Up"; then
    echo "警告: 有服务未正常运行" | mail -s "QuantMind服务告警" admin@example.com
fi
```

## 🔒 安全配置

### 1. 网络安全

```bash
# 配置防火墙规则
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.1.0/24 to any port 22
sudo ufw allow from 192.168.1.0/24 to any port 80
sudo ufw allow from 192.168.1.0/24 to any port 443
```

### 2. 容器安全

```bash
# 使用非root用户运行容器
# 在Dockerfile中添加:
# USER app

# 限制容器权限
# 在docker-compose.yml中添加:
# security_opt:
#   - no-new-privileges:true
```

### 3. 数据加密

```bash
# 配置数据库加密
# 在MySQL配置中添加:
# [mysqld]
# default_authentication_plugin=mysql_native_password
# ssl-ca=/etc/ssl/certs/ca-certificates.crt
```

## 📚 参考资源

- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [FastAPI部署指南](https://fastapi.tiangolo.com/deployment/)
- [Nginx配置指南](https://nginx.org/en/docs/)
- [Let's Encrypt文档](https://letsencrypt.org/docs/)
