# Docker Compose 兼容性问题解决方案

## 问题描述

在Linux服务器上运行QuantMind一键部署脚本时，可能会遇到以下错误：

```
TypeError: HTTPConnection.request() got an unexpected keyword argument 'chunked'
```

## 问题原因

这个错误是由于系统中安装的`docker-compose`版本过旧（特别是1.29.x版本）与新版本的Python `urllib3`库不兼容导致的。

## 解决方案

### 方案1：使用修复版部署脚本（推荐）

我们已经更新了`one_click_deploy_v2.sh`脚本，添加了自动兼容性检测和处理：

```bash
# 使用修复版脚本
chmod +x scripts/deploy/one_click_deploy_v2.sh
./scripts/deploy/one_click_deploy_v2.sh
```

修复版脚本会：
- 自动检测docker-compose版本
- 识别有问题的1.29.x版本
- 自动切换到`docker compose`命令（如果可用）
- 提供详细的升级指导

### 方案2：手动升级Docker Compose

如果您希望手动解决这个问题，可以按照以下步骤操作：

#### Ubuntu/Debian系统：

```bash
# 卸载旧版本
sudo apt-get remove docker-compose

# 下载并安装最新版本
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

#### CentOS/RHEL系统：

```bash
# 卸载旧版本
sudo yum remove docker-compose

# 下载并安装最新版本
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 方案3：使用Docker Compose V2

如果您的Docker版本较新，可以直接使用内置的`docker compose`命令：

```bash
# 检查是否支持docker compose v2
docker compose version

# 如果支持，可以直接使用
docker compose -f docker-compose.prod.yml up -d
```

## 验证修复

修复后，您可以通过以下命令验证：

```bash
# 检查docker-compose版本
docker-compose --version

# 或检查docker compose版本
docker compose version

# 测试基本功能
docker-compose ps
# 或
docker compose ps
```

## 技术细节

这个问题的根本原因是：
- docker-compose 1.29.x版本使用了旧版本的requests库
- 新版本的urllib3库移除了对`chunked`参数的支持
- 导致HTTP连接时出现参数不匹配错误

修复版脚本通过以下方式解决：
1. 检测docker-compose版本
2. 识别有问题的版本范围
3. 自动切换到兼容的命令
4. 提供统一的命令包装器

## 相关链接

- [Docker Compose官方文档](https://docs.docker.com/compose/)
- [Docker Compose发布页面](https://github.com/docker/compose/releases)
- [QuantMind项目文档](./README.md)