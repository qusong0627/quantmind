# QuantMind 一键部署命令

## 🚀 快速部署（推荐）

### Ubuntu 18.04+ 系统一键部署

```bash
# 方法一：直接下载脚本部署
wget https://gitee.com/qusong0627/quantmind/raw/master/scripts/deploy/cloud_setup.sh
wget https://gitee.com/qusong0627/quantmind/raw/master/scripts/deploy/one_click_deploy.sh
chmod +x *.sh
./cloud_setup.sh && ./one_click_deploy.sh
```

```bash
# 方法二：克隆仓库部署
git clone https://gitee.com/qusong0627/quantmind.git
cd quantmind
./scripts/deploy/cloud_setup.sh && ./scripts/deploy/one_click_deploy.sh
```

## 📋 系统要求

- **操作系统**：Ubuntu 18.04+ （推荐 Ubuntu 20.04/22.04 LTS）
- **最低配置**：4GB内存 + 20GB磁盘 + 2核CPU
- **推荐配置**：8GB内存 + 50GB磁盘 + 4核CPU
- **网络要求**：可访问外网（下载Docker镜像）

## 🔧 部署流程说明

### 第一步：环境准备 (`cloud_setup.sh`)
- ✅ 检查Ubuntu系统版本和资源
- ✅ 自动安装Docker和Docker Compose
- ✅ 配置防火墙和系统优化
- ✅ 支持root用户运行（会显示安全警告）

### 第二步：应用部署 (`one_click_deploy.sh`)
- ✅ 交互式配置环境变量
- ✅ 自动申请SSL证书（Let's Encrypt）
- ✅ 启动所有服务容器
- ✅ 配置Nginx反向代理

## 🌐 访问应用

部署完成后，您可以通过以下方式访问：

- **HTTPS访问**：`https://your-domain.com`
- **HTTP访问**：`http://your-server-ip:3000`
- **API文档**：`https://your-domain.com/api/docs`

**默认登录账户**：
- 用户名：`admin`
- 密码：`admin123`
- ⚠️ 首次登录后请立即修改密码

## 🛠️ 常用管理命令

```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d
```

## 🆘 快速故障排除

### Docker安装失败
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
```

### 端口被占用
```bash
# 检查端口占用
sudo netstat -tlnp | grep -E ':(80|443|3000)'
# 停止占用服务
sudo systemctl stop apache2 nginx
```

### SSL证书申请失败
```bash
# 检查域名解析
nslookup your-domain.com
# 开放防火墙端口
sudo ufw allow 80 && sudo ufw allow 443
```

## 📚 详细文档

- **完整部署指南**：[UBUNTU_DEPLOYMENT_GUIDE.md](./UBUNTU_DEPLOYMENT_GUIDE.md)
- **项目README**：[README.md](./README.md)
- **问题反馈**：https://gitee.com/qusong0627/quantmind/issues

---

**🎉 部署成功后，您将拥有一个完整的量化交易系统！**

包含功能：
- 📊 实时股市数据监控
- 🤖 AI量化策略
- 📈 回测引擎
- 💼 投资组合管理
- 📱 响应式Web界面
- 🔐 用户认证系统