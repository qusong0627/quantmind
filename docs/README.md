# QuantMind 量化投资平台

## 🚀 项目概述

QuantMind是一个基于微服务架构的量化投资平台，集成了AI策略生成、回测引擎、数据管理等核心功能。

## 🏗️ 项目结构

```
quantmind/
├── backend/                 # 后端服务
│   ├── api-gateway/        # API网关 (端口: 8000)
│   ├── ai-strategy/        # AI策略服务 (端口: 8003)
│   ├── backtest/           # 回测服务 (端口: 8002)
│   ├── data-management/    # 数据管理服务 (端口: 8008)
│   ├── user/               # 用户服务 (端口: 8001)
│   └── data-service/       # 数据服务 (端口: 8005)
├── frontend/                # 前端应用
│   └── web/                # Web前端 (端口: 3000)
├── docker/                  # Docker配置
│   ├── base/               # 基础镜像
│   └── services/           # 服务镜像
├── shared/                  # 共享代码
│   ├── requirements/        # 依赖管理
│   ├── config/             # 配置模板
│   └── utils/              # 工具函数
├── scripts/                 # 脚本文件
│   ├── deploy/             # 部署脚本
│   └── maintenance/        # 维护脚本
├── config/                  # 配置文件
├── docs/                    # 项目文档
└── docker-compose.yml      # 服务编排
```

## 🛠️ 技术栈

### 后端
- **Python 3.9+**: 主要开发语言
- **FastAPI**: 现代、快速的Web框架
- **SQLAlchemy**: ORM框架
- **Redis**: 缓存和会话存储
- **MySQL 8.0**: 关系型数据库
- **InfluxDB 2.0**: 时序数据库

### 前端
- **React 18**: 用户界面框架
- **Ant Design**: UI组件库
- **ECharts**: 数据可视化

### 部署
- **Docker**: 容器化部署
- **Docker Compose**: 服务编排
- **Nginx**: 反向代理

## 🚀 快速开始

### 环境要求
- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 20GB+ 磁盘空间

### 部署步骤

1. **克隆项目**
```bash
git clone <repository_url>
cd quantmind
```

2. **配置环境变量**
```bash
cp env.example .env
# 编辑 .env 文件配置您的环境变量
```

3. **部署服务**
```bash
chmod +x scripts/deploy/deploy.sh
./scripts/deploy/deploy.sh
```

4. **访问应用**
- 前端应用: http://localhost:3000
- API文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

## 🔧 服务说明

### 核心服务

#### API网关 (端口: 8000)
- 统一API入口
- 路由转发
- 认证授权
- 限流控制

#### AI策略服务 (端口: 8003)
- 智能策略生成
- 多模型支持 (Qwen, Gemini)
- 策略优化
- 风险评估

#### 回测引擎 (端口: 8002)
- 策略回测
- 性能分析
- 风险指标
- 报告生成

#### 数据管理服务 (端口: 8008)
- 金融数据采集
- 数据清洗
- 数据存储
- 数据API

#### 用户服务 (端口: 8001)
- 用户认证
- 权限管理
- 用户配置
- 会话管理

#### 数据服务 (端口: 8005)
- 实时数据
- 历史数据
- 数据订阅
- 数据导出

### 数据存储
- **MySQL**: 用户数据、策略配置、回测结果
- **Redis**: 缓存、会话、实时数据
- **InfluxDB**: 时序数据、市场数据

## 🛠️ 维护操作

### 日常维护

```bash
# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f

# 重启服务
docker-compose restart <service_name>

# 更新服务
docker-compose pull
docker-compose up -d
```

### 清理资源

```bash
# 清理Docker资源
./scripts/maintenance/cleanup.sh

# 清理日志
docker-compose logs --tail=1000 > logs_backup.log
docker-compose logs --tail=0
```

## 🐛 故障排查

### 常见问题

1. **服务启动失败**
   - 检查端口占用: `netstat -tulpn | grep :8000`
   - 检查依赖服务状态: `docker-compose ps`
   - 查看服务日志: `docker-compose logs <service_name>`

2. **数据库连接失败**
   - 检查数据库服务状态: `docker-compose ps mysql`
   - 检查网络连接: `docker-compose exec api-gateway ping mysql`
   - 查看数据库日志: `docker-compose logs mysql`

3. **内存不足**
   - 增加系统内存
   - 减少并发连接数
   - 优化服务配置

### 日志分析

```bash
# 查看错误日志
docker-compose logs | grep ERROR

# 查看特定服务的日志
docker-compose logs -f <service_name>

# 查看最近的日志
docker-compose logs --tail=100
```

## 🔒 安全配置

### 环境变量
- 数据库密码
- API密钥
- JWT密钥
- 服务端口

### 网络安全
- 服务间通信使用内部网络
- 外部访问通过API网关
- 数据库不直接暴露到外网

## 📈 性能优化

### 数据库优化
- 使用连接池
- 索引优化
- 查询优化

### 缓存策略
- Redis缓存热点数据
- 本地缓存
- 分布式缓存

### 服务优化
- 异步处理
- 负载均衡
- 资源限制

## 🤝 开发指南

### 添加新服务

1. 在 `backend/` 目录下创建服务目录
2. 创建 `Dockerfile` 和 `requirements.txt`
3. 在 `docker-compose.yml` 中添加服务配置
4. 在 `shared/` 目录下添加共享代码

### 修改配置

1. 更新 `.env` 文件中的环境变量
2. 修改 `shared/config/` 下的配置模板
3. 重启相关服务

### 代码规范

- 使用Python类型提示
- 遵循PEP 8代码规范
- 编写单元测试
- 添加API文档

## 📚 相关文档

- [API文档](http://localhost:8000/docs)
- [部署指南](./deployment/README.md)
- [开发指南](./development/README.md)
- [故障排查](./troubleshooting/README.md)

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如有问题，请查看：
1. 项目文档
2. Issue列表
3. 讨论区
