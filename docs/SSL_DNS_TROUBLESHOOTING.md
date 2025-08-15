# SSL证书和DNS故障排除指南

## 概述

本指南帮助解决QuantMind项目部署过程中遇到的SSL证书申请失败和DNS解析问题。

## 常见问题诊断

### 1. DNS解析问题

#### 问题症状
- `DNS problem: SERVFAIL looking up A for domain`
- `ConnectionResetError: [Errno 104] Connection reset by peer`
- Certbot无法下载验证文件

#### 诊断步骤
```bash
# 检查域名A记录
nslookup your-domain.com

# 使用dig命令详细检查
dig your-domain.com A

# 检查域名是否指向当前服务器IP
dig your-domain.com A +short
curl -I ifconfig.me  # 获取当前服务器公网IP
```

#### 解决方案
1. **配置域名A记录**
   - 登录域名注册商管理面板
   - 添加A记录指向服务器公网IP
   - 等待DNS传播（通常5-30分钟）

2. **验证DNS传播**
   ```bash
   # 检查全球DNS传播状态
   nslookup your-domain.com 8.8.8.8
   nslookup your-domain.com 1.1.1.1
   ```

### 2. 端口占用问题

#### 问题症状
- `bind: address already in use`
- `Port 80 is already in use`

#### 解决方案
```bash
# 查找占用80端口的进程
sudo netstat -tlnp | grep :80
sudo lsof -i :80

# 停止Apache2服务（常见原因）
sudo systemctl stop apache2
sudo systemctl disable apache2

# 停止Nginx服务
sudo systemctl stop nginx

# 或直接杀死进程
sudo kill -9 <PID>
```

### 3. 防火墙配置

#### 检查防火墙状态
```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## SSL证书替代方案

### 方案1：跳过SSL配置（仅HTTP）

**适用场景**：测试环境、内网部署

```bash
# 在部署脚本中选择选项4
# 或手动设置环境变量
export SSL_TYPE="none"
export PROTOCOL="http"
```

**注意事项**：
- 仅适用于测试环境
- 生产环境强烈建议使用HTTPS
- 数据传输不加密，存在安全风险

### 方案2：自签名证书

**适用场景**：内网环境、开发测试

```bash
# 在部署脚本中选择选项2
# 或手动生成
sudo mkdir -p /home/quantmind/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /home/quantmind/ssl/privkey.pem \
  -out /home/quantmind/ssl/fullchain.pem \
  -subj "/C=CN/ST=State/L=City/O=Organization/CN=your-domain.com"
```

**注意事项**：
- 浏览器会显示安全警告
- 需要手动信任证书
- 不适用于生产环境

### 方案3：使用其他CA证书

**免费证书提供商**：
- ZeroSSL
- Buypass
- SSL.com

**商业证书提供商**：
- DigiCert
- Comodo
- GeoTrust

## 部署脚本修复

### 更新部署脚本

```bash
# 拉取最新修复
git pull origin master

# 重新执行部署
sudo ./scripts/deploy/one_click_deploy.sh
```

### 手动修复环境变量

如果遇到环境变量语法错误：

```bash
# 检查.env.prod文件
cat .env.prod

# 修复引号问题
sed -i 's/^\([^=]*=\)\(.*[^"]*\)$/\1"\2"/' .env.prod
```

## 验证部署状态

### 检查服务状态
```bash
# 检查Docker容器
docker-compose -f docker-compose.prod.yml ps

# 检查服务健康状态
docker-compose -f docker-compose.prod.yml logs nginx

# 测试HTTP访问
curl -I http://your-domain.com

# 测试HTTPS访问（如果配置了SSL）
curl -I https://your-domain.com
```

### 常用调试命令
```bash
# 查看nginx配置
docker exec quantmind-nginx nginx -t

# 重新加载nginx配置
docker exec quantmind-nginx nginx -s reload

# 查看证书信息
openssl x509 -in /home/quantmind/ssl/fullchain.pem -text -noout
```

## 预防措施

1. **部署前检查**
   - 确认域名A记录已配置
   - 检查服务器防火墙设置
   - 确保80和443端口未被占用

2. **监控和维护**
   - 定期检查SSL证书有效期
   - 监控DNS解析状态
   - 备份重要配置文件

3. **安全建议**
   - 生产环境必须使用HTTPS
   - 定期更新SSL证书
   - 配置安全头和HSTS

## 联系支持

如果问题仍然存在，请提供以下信息：
- 错误日志完整内容
- 域名和服务器配置信息
- DNS解析测试结果
- 防火墙和端口检查结果

---

**更新日期**：2024年12月
**版本**：1.0