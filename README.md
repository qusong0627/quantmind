# QuantMind 量化投资平台

## 项目简介

QuantMind是一个专业的量化投资平台，集成智能仪表盘、AI策略生成、量化回测和数据管理等功能。平台提供实时市场数据监控、投资组合管理、社区交流和多LLM支持的策略生成服务。

## 技术架构

- **前端**: React 18 + TypeScript + Ant Design + Redux Toolkit
- **后端**: Python微服务架构 (FastAPI)
- **数据源**: 多源数据集成，实时行情数据
- **状态管理**: Redux Toolkit + Zustand
- **UI组件**: Ant Design + ECharts + Recharts
- **部署**: Docker容器化部署

## 核心功能模块

### 🎯 智能仪表盘
- **实时市场数据**: 8个主要A股指数实时监控（上证指数、深证成指、创业板指等）
- **投资组合管理**: 持仓概览、收益分析、风险评估
- **社区动态**: 策略分享、讨论交流、通知中心
- **数据可视化**: ECharts图表、响应式布局、移动端适配

### 🤖 AI策略生成
- **多LLM支持**: OpenAI、Anthropic、Google Gemini集成
- **策略生成服务**: 基于自然语言的策略创建
- **智能分析**: 市场数据分析和策略优化建议

### 📊 量化回测
- **历史数据回测**: 增强回测引擎服务
- **性能分析**: 收益率、夏普比率、最大回撤等指标
- **策略验证**: 多维度策略效果评估

### 💾 数据管理
- **股票数据查询**: 实时行情、历史数据获取
- **数据源管理**: 多源数据集成，10秒自动刷新
- **数据缓存**: Redis缓存优化，提升查询性能

### 👥 用户系统
- **身份认证**: JWT Token认证，受保护路由
- **权限管理**: 基于角色的访问控制
- **用户配置**: 个人设置、偏好管理

## 项目结构

```
quantmind/
├── frontend/web/              # React前端应用
│   ├── src/
│   │   ├── components/        # 可复用组件
│   │   ├── pages/            # 页面路由组件
│   │   ├── services/         # API服务层
│   │   ├── store/            # Redux状态管理
│   │   └── utils/            # 工具函数
│   └── package.json
├── backend/                   # Python微服务后端
│   ├── ai-strategy/          # AI策略生成服务
│   ├── api-gateway/          # API网关服务
│   ├── backtest/             # 量化回测引擎
│   ├── data-management/      # 数据管理服务
│   ├── market_data/          # 市场数据服务
│   ├── stock_query/          # 股票查询服务
│   ├── user/                 # 用户管理服务
│   └── shared/               # 共享模块
├── docker-compose.yml        # Docker编排配置
├── docker-compose.prod.yml   # 生产环境配置
├── scripts/deploy/           # 部署脚本目录
│   ├── cloud_setup.sh       # 云服务器环境准备
│   ├── one_click_deploy.sh   # 一键部署脚本
│   ├── monitor.sh           # 服务监控脚本
│   ├── backup.sh            # 数据库备份脚本
│   └── log_cleanup.sh       # 日志清理脚本
├── nginx/                    # Nginx配置目录
│   └── nginx.conf           # 反向代理配置
├── systemd/                  # 系统服务配置
│   └── quantmind.service    # Systemd服务文件
├── docs/deployment/          # 部署文档目录
│   └── CLOUD_DEPLOYMENT.md  # 云服务器部署指南
└── README.md                 # 项目文档
```

## 快速开始

### 环境要求
- **操作系统**: Ubuntu 18.04+ (推荐)
- Node.js 22+
- Python 3.9+
- Docker & Docker Compose

### 1. 克隆项目

```bash
git clone https://gitee.com/qusong0627/quantmind.git
cd quantmind
```

### 2. 前端开发

```bash
# 进入前端目录
cd frontend/web

# 安装依赖
npm install

# 启动开发服务器
npm start

# 访问应用：http://localhost:3000
```

### 3. 后端服务

```bash
# 使用Docker Compose启动所有后端服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# API网关：http://localhost:8000
# API文档：http://localhost:8000/docs
```

### 4. 开发模式

```bash
# 前端热重载开发
cd frontend/web
npm run dev

# 代码检查和格式化
npm run check
npm run lint
npm run format
```

### 5. 云服务器一键部署

#### 环境准备

```bash
# 运行环境准备脚本（自动检查系统环境、安装Docker等）
chmod +x scripts/deploy/cloud_setup.sh
./scripts/deploy/cloud_setup.sh
```

#### 一键部署（推荐使用改进版）

```bash
# 使用改进版一键部署脚本（修复了环境变量路径、MySQL重启等问题）
chmod +x scripts/deploy/one_click_deploy_v2.sh
./scripts/deploy/one_click_deploy_v2.sh
```

**改进版部署脚本特性：**
- ✅ 修复环境变量文件路径错误问题
- ✅ 解决MySQL容器重启循环问题
- ✅ 改进macOS兼容性（支持macOS和Linux）
- ✅ 增强错误处理和详细日志输出
- ✅ 添加容器状态监控和健康检查
- ✅ 优化JWT_SECRET生成方式
- ✅ 完善资源检查和故障排查建议

部署脚本将自动完成：
- 环境变量配置向导
- SSL证书配置（Let's Encrypt/自签名/现有证书）
- 域名和端口设置
- 数据库初始化和连接测试
- 服务启动和健康检查
- 部署后信息汇总

## 技术特色

### 🚀 实时数据
- **WebSocket集成**: 实时市场数据推送
- **自动刷新**: 10秒间隔数据更新
- **数据源降级**: 多级数据源保障服务稳定性

### 📱 响应式设计
- **移动端适配**: 完整的移动端用户体验
- **组件化架构**: 可复用的UI组件库
- **主题定制**: 支持深色/浅色主题切换

### ⚡ 性能优化
- **代码分割**: React.lazy懒加载优化
- **状态管理**: Redux Toolkit + Zustand双重状态管理
- **缓存策略**: Redis缓存 + 前端数据缓存

### 🔒 安全特性
- **JWT认证**: 安全的用户身份验证
- **受保护路由**: 基于权限的页面访问控制
- **API安全**: 请求验证和错误处理

### 🚀 一键部署
- **环境准备**: 自动化系统检查和Docker安装
- **生产配置**: 优化的Docker Compose生产环境配置
- **SSL支持**: 自动SSL证书配置和HTTPS启用
- **监控备份**: 服务监控、数据库备份和日志管理

## 生产环境部署

### Docker Compose生产配置

```bash
# 使用生产环境配置启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看服务日志
docker-compose -f docker-compose.prod.yml logs -f
```

### Nginx反向代理

生产环境使用Nginx作为反向代理，提供：
- **负载均衡**: 多实例服务负载分发
- **SSL终止**: HTTPS证书管理
- **静态资源缓存**: 提升访问性能
- **安全头设置**: 增强安全防护

```bash
# 启动Nginx服务
docker run -d --name quantmind-nginx \
  -p 80:80 -p 443:443 \
  -v ./nginx/nginx.conf:/etc/nginx/nginx.conf \
  -v ./ssl:/etc/nginx/ssl \
  nginx:1.24-alpine
```

### SSL证书配置

```bash
# 使用Let's Encrypt获取免费SSL证书
sudo certbot --nginx -d your-domain.com

# 或手动配置SSL证书
mkdir -p ssl
cp your-cert.pem ssl/
cp your-key.pem ssl/
```

## 监控和维护

### 服务监控

```bash
# 运行服务监控脚本
./scripts/deploy/monitor.sh

# 设置定时监控（每5分钟检查一次）
crontab -e
# 添加：*/5 * * * * /path/to/quantmind/scripts/deploy/monitor.sh
```

### 数据库备份

```bash
# 手动备份数据库
./scripts/deploy/backup.sh

# 设置自动备份（每天凌晨2点）
crontab -e
# 添加：0 2 * * * /path/to/quantmind/scripts/deploy/backup.sh
```

### 日志管理

```bash
# 清理旧日志文件
./scripts/deploy/log_cleanup.sh

# 设置定期日志清理（每周日凌晨3点）
crontab -e
# 添加：0 3 * * 0 /path/to/quantmind/scripts/deploy/log_cleanup.sh
```

### 系统服务管理

```bash
# 安装系统服务
sudo cp systemd/quantmind.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable quantmind

# 服务管理命令
sudo systemctl start quantmind    # 启动服务
sudo systemctl stop quantmind     # 停止服务
sudo systemctl restart quantmind  # 重启服务
sudo systemctl status quantmind   # 查看状态
```

## 开发指南

### API服务
- **多源数据API**: 实时股票数据获取
- **RESTful接口**: 标准化API设计
- **错误处理**: 完善的异常处理机制

### 数据模型
- **市场数据**: 8个主要A股指数支持
- **用户数据**: 完整的用户信息管理
- **策略数据**: AI生成策略存储和管理

### 部署配置
- **Docker化**: 所有服务支持容器化部署
- **微服务架构**: 独立服务，易于扩展
- **环境配置**: 开发/测试/生产环境分离
- **一键部署**: 自动化部署脚本，简化运维流程
- **生产优化**: 资源限制、重启策略、日志轮转
- **监控告警**: 服务状态监控和异常通知

## 故障排除

### 常见问题

1. **MySQL容器重启循环问题**
   ```bash
   # 检查MySQL容器状态
   docker-compose logs mysql
   
   # 确认环境变量文件路径正确
   ls -la .env.prod
   
   # 验证环境变量内容
   grep -E "MYSQL_|JWT_SECRET" .env.prod
   ```

2. **环境变量文件路径错误**
   ```bash
   # 确保.env.prod文件在项目根目录
   pwd  # 应该显示 /path/to/quantmind
   ls -la .env.prod  # 文件应该存在
   
   # 如果文件不存在，重新运行部署脚本
   ./scripts/deploy/one_click_deploy_v2.sh
   ```

3. **服务启动失败**
   ```bash
   # 检查Docker服务状态
   sudo systemctl status docker
   
   # 查看容器日志
   docker-compose logs [service-name]
   
   # 检查容器资源使用情况
   docker stats
   ```

4. **端口冲突**
   ```bash
   # 检查端口占用
   sudo netstat -tlnp | grep :8000
   
   # 修改docker-compose.yml中的端口映射
   ```

5. **SSL证书问题**
   ```bash
   # 检查证书有效期
   openssl x509 -in ssl/cert.pem -text -noout
   
   # 重新生成证书
   sudo certbot renew
   ```

6. **macOS兼容性问题**
   ```bash
   # 检查操作系统类型
   uname -s
   
   # macOS用户确保使用改进版部署脚本
   ./scripts/deploy/one_click_deploy_v2.sh
   ```

7. **Docker Compose兼容性问题**
   ```bash
   # 如果遇到 HTTPConnection.request() 错误
   # 检查docker-compose版本
   docker-compose --version
   
   # 使用修复版脚本（自动处理兼容性）
   ./scripts/deploy/one_click_deploy_v2.sh
   
   # 或手动升级docker-compose
   sudo apt-get remove docker-compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```
   
   详细解决方案请参考：[Docker Compose兼容性文档](DOCKER_COMPOSE_COMPATIBILITY.md)

### 性能优化

- **数据库优化**: 定期清理日志，优化查询索引
- **缓存策略**: 合理配置Redis缓存过期时间
- **资源监控**: 使用htop、docker stats监控资源使用
- **负载均衡**: 根据访问量调整服务实例数量

详细部署指南请参考：[云服务器部署文档](docs/deployment/CLOUD_DEPLOYMENT.md)

## 许可证

MIT License