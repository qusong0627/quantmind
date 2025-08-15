# QuantMind Ubuntu云服务器部署指南

## 系统要求

**支持系统：** 仅支持 Ubuntu 18.04+ 系统
**推荐版本：** Ubuntu 20.04 LTS 或 Ubuntu 22.04 LTS
**最低配置：** 4GB内存 + 20GB磁盘空间 + 2核CPU
**推荐配置：** 8GB内存 + 50GB磁盘空间 + 4核CPU

## 快速部署（一键部署）

### 方法一：直接下载脚本部署

```bash
# 1. 下载部署脚本
wget https://gitee.com/qusong0627/quantmind/raw/master/scripts/deploy/cloud_setup.sh
wget https://gitee.com/qusong0627/quantmind/raw/master/scripts/deploy/one_click_deploy.sh

# 2. 添加执行权限
chmod +x cloud_setup.sh one_click_deploy.sh

# 3. 运行环境准备脚本（安装Docker等基础环境）
./cloud_setup.sh

# 4. 运行一键部署脚本
./one_click_deploy.sh
```

### 方法二：克隆仓库部署

```bash
# 1. 克隆项目仓库
git clone https://gitee.com/qusong0627/quantmind.git
cd quantmind

# 2. 运行环境准备脚本
./scripts/deploy/cloud_setup.sh

# 3. 运行一键部署脚本
./scripts/deploy/one_click_deploy.sh
```

## 详细部署步骤

### 第一步：环境准备

`cloud_setup.sh` 脚本会自动完成以下操作：

1. **系统检查**
   - 检查Ubuntu版本（支持18.04+）
   - 验证系统资源（内存、磁盘、CPU）
   - 检查网络连接

2. **Docker环境安装**
   - 自动安装Docker Engine
   - 安装Docker Compose
   - 配置Docker服务自启动

3. **系统优化**
   - 配置防火墙规则（开放80、443、3000端口）
   - 优化系统参数
   - 安装必要的系统工具

### 第二步：应用部署

`one_click_deploy.sh` 脚本会引导您完成：

1. **环境变量配置**
   - 数据库密码设置
   - JWT密钥生成
   - 域名配置（可选）

2. **SSL证书配置**
   - Let's Encrypt自动证书（推荐）
   - 自签名证书
   - 现有证书导入
   - HTTP模式（仅开发测试）

3. **服务启动**
   - 启动MySQL数据库
   - 启动后端API服务
   - 启动前端Web服务
   - 配置Nginx反向代理

## 部署后验证

### 检查服务状态

```bash
# 查看所有容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 检查端口监听
ss -tlnp | grep -E ':(80|443|3000)'
```

### 访问应用

- **HTTPS访问**：https://your-domain.com
- **HTTP访问**：http://your-server-ip:3000
- **API文档**：https://your-domain.com/api/docs

### 默认账户

- **用户名**：admin
- **密码**：admin123
- **首次登录后请立即修改密码**

## 常用管理命令

### 服务管理

```bash
# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart frontend

# 查看实时日志
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

### 数据库管理

```bash
# 进入MySQL容器
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p

# 备份数据库
docker-compose -f docker-compose.prod.yml exec mysql mysqldump -u root -p quantmind > backup.sql

# 恢复数据库
docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p quantmind < backup.sql
```

### 更新应用

```bash
# 拉取最新代码
git pull origin master

# 重新构建并启动
docker-compose -f docker-compose.prod.yml up -d --build
```

## 故障排除

### 常见问题

#### 1. Docker安装失败

```bash
# 手动安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker
```

#### 2. 端口被占用

```bash
# 查看端口占用
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# 停止占用端口的服务
sudo systemctl stop apache2  # 如果安装了Apache
sudo systemctl stop nginx    # 如果安装了Nginx
```

#### 3. SSL证书申请失败

```bash
# 检查域名DNS解析
nslookup your-domain.com

# 检查防火墙设置
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443

# 手动申请证书
sudo certbot certonly --standalone -d your-domain.com
```

#### 4. 数据库连接失败

```bash
# 检查MySQL容器状态
docker-compose -f docker-compose.prod.yml logs mysql

# 重启MySQL服务
docker-compose -f docker-compose.prod.yml restart mysql

# 检查数据库配置
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p -e "SHOW DATABASES;"
```

#### 6. MySQL容器重启循环问题

如果MySQL容器不断重启，并且日志中出现以下错误：

```
[ERROR] [Server] --initialize specified but the data directory has files in it. Aborting.
[ERROR] [Server] Could not open file '/var/log/mysql/error.log' for error logging: Permission denied
[ERROR] [Server] The designated data directory /var/lib/mysql/ is unusable.
```

这通常是由于数据目录权限问题或初始化冲突导致的。使用我们提供的修复脚本解决：

```bash
# 运行MySQL数据目录修复脚本
./scripts/maintenance/fix_mysql_data_dir.sh
```

或手动解决：

```bash
# 停止MySQL容器
docker-compose -f docker-compose.prod.yml stop mysql

# 备份并清理数据目录
sudo mv ~/quantmind/data/mysql ~/quantmind/data/mysql_backup_$(date +%Y%m%d)
sudo mkdir -p ~/quantmind/data/mysql

# 设置正确的权限（Linux系统）
sudo chown -R 999:999 ~/quantmind/data/mysql
sudo chmod -R 750 ~/quantmind/data/mysql

# 设置日志目录权限
sudo mkdir -p ~/quantmind/logs/mysql
sudo chown -R 999:999 ~/quantmind/logs/mysql
sudo chmod -R 750 ~/quantmind/logs/mysql

# 重新启动MySQL容器
docker-compose -f docker-compose.prod.yml up -d mysql
```

#### 5. 前端页面无法访问

```bash
# 检查Nginx配置
docker-compose -f docker-compose.prod.yml logs nginx

# 重启Nginx
docker-compose -f docker-compose.prod.yml restart nginx

# 检查前端构建
docker-compose -f docker-compose.prod.yml logs frontend
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs mysql
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs nginx

# 实时跟踪日志
docker-compose -f docker-compose.prod.yml logs -f --tail=50
```

### 性能优化

#### 1. 数据库优化

```bash
# 进入MySQL容器
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p

# 查看数据库状态
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Queries';
SHOW PROCESSLIST;
```

#### 2. 内存使用优化

```bash
# 查看容器资源使用
docker stats

# 调整容器内存限制（编辑docker-compose.prod.yml）
# 在services下添加：
# deploy:
#   resources:
#     limits:
#       memory: 512M
```

#### 3. 磁盘空间清理

```bash
# 清理Docker镜像和容器
docker system prune -a

# 清理日志文件
sudo find /var/lib/docker/containers/ -name "*.log" -exec truncate -s 0 {} \;

# 清理系统日志
sudo journalctl --vacuum-time=7d
```

## 安全建议

### 1. 防火墙配置

```bash
# 启用UFW防火墙
sudo ufw enable

# 只开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS

# 限制SSH访问（可选）
sudo ufw limit 22
```

### 2. 定期更新

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 更新Docker
sudo apt update && sudo apt install docker-ce docker-ce-cli containerd.io

# 更新应用
git pull origin master
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. 备份策略

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/quantmind_$DATE"
mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD quantmind > $BACKUP_DIR/database.sql

# 备份配置文件
cp .env $BACKUP_DIR/
cp docker-compose.prod.yml $BACKUP_DIR/

# 压缩备份
tar -czf /backup/quantmind_$DATE.tar.gz -C /backup quantmind_$DATE
rm -rf $BACKUP_DIR

echo "备份完成: /backup/quantmind_$DATE.tar.gz"
EOF

chmod +x backup.sh

# 设置定时备份（每天凌晨2点）
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## 技术支持

- **项目地址**：https://gitee.com/qusong0627/quantmind
- **问题反馈**：请在Gitee仓库提交Issue
- **部署文档**：查看项目根目录下的README.md

## 更新日志

- **v1.0.0**：初始版本，支持Ubuntu 18.04+
- **v1.1.0**：简化部署流程，移除CentOS支持，专注Ubuntu优化
- **v1.1.1**：修复root用户检查问题，优化SSL证书配置