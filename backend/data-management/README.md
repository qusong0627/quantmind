# QuantMind 数据管理模块

## 概述

数据管理模块是QuantMind平台的核心组件之一，负责管理量化回测数据源，包括CSV文件上传、数据解析存储、数据验证和状态监控等功能。

## 主要功能

### 1. 数据源管理
- 创建、查询、更新、删除数据源
- 支持股票代码、数据源描述、更新频率等配置
- 数据源状态监控和统计

### 2. 文件上传处理
- CSV格式文件上传
- 自动数据解析和验证
- 文件完整性校验（MD5）
- 批量数据处理

### 3. 数据存储
- MySQL存储元数据信息
- InfluxDB存储时序股票数据
- Redis缓存热点数据

### 4. 数据验证
- 数据格式验证
- 数据完整性检查
- 数据缺口检测
- 异常数据处理

## API接口

### 数据源管理

```http
# 获取所有数据源
GET /api/data-sources

# 创建数据源
POST /api/data-sources
{
  "name": "平安银行历史数据",
  "symbol": "000001",
  "description": "平安银行日K线数据",
  "source_type": "csv",
  "update_frequency": "daily",
  "auto_update": false
}

# 获取指定数据源
GET /api/data-sources/{source_id}

# 更新数据源
PUT /api/data-sources/{source_id}

# 删除数据源
DELETE /api/data-sources/{source_id}
```

### 文件管理

```http
# 上传CSV文件
POST /api/data-sources/{source_id}/upload
Content-Type: multipart/form-data

# 获取数据源文件列表
GET /api/data-sources/{source_id}/files

# 验证数据源
POST /api/data-sources/{source_id}/validate

# 获取数据源状态
GET /api/data-sources/{source_id}/status
```

## CSV文件格式要求

上传的CSV文件必须包含以下列：

| 列名 | 类型 | 说明 | 示例 |
|------|------|------|------|
| date | 日期 | 交易日期 | 2024-01-01 |
| open | 浮点数 | 开盘价 | 10.50 |
| high | 浮点数 | 最高价 | 10.80 |
| low | 浮点数 | 最低价 | 10.30 |
| close | 浮点数 | 收盘价 | 10.60 |
| volume | 整数 | 成交量 | 1000000 |
| amount | 浮点数 | 成交额(可选) | 10600000.00 |

### 示例CSV文件

```csv
date,open,high,low,close,volume,amount
2024-01-01,10.50,10.80,10.30,10.60,1000000,10600000.00
2024-01-02,10.60,10.90,10.40,10.70,1200000,12840000.00
2024-01-03,10.70,10.85,10.55,10.65,900000,9585000.00
```

## 部署说明

### 本地开发

1. 安装依赖
```bash
cd backend/data-management
pip install -r requirements.txt
```

2. 配置环境变量
```bash
export DATABASE_URL="mysql://user:password@localhost:3306/quantmind"
export INFLUXDB_URL="http://localhost:8086"
export INFLUXDB_TOKEN="admin-token"
export INFLUXDB_ORG="quantmind"
export INFLUXDB_BUCKET="stock_data"
```

3. 创建数据表
```bash
python models.py
```

4. 启动服务
```bash
python main.py
```

### Docker部署

1. 构建镜像
```bash
docker build -t quantmind-data-management .
```

2. 运行容器
```bash
docker run -d \
  --name data-management \
  -p 8008:8008 \
  -e DATABASE_URL="mysql://user:password@mysql:3306/quantmind" \
  -e INFLUXDB_URL="http://influxdb:8086" \
  -v ./data:/app/data \
  quantmind-data-management
```

### Docker Compose集成

在主项目的`docker-compose.yml`中添加：

```yaml
services:
  data-management:
    build: ./backend/data-management
    ports:
      - "8008:8008"
    environment:
      - DATABASE_URL=mysql://quantmind:password@mysql:3306/quantmind
      - INFLUXDB_URL=http://influxdb:8086
      - INFLUXDB_TOKEN=admin-token
      - INFLUXDB_ORG=quantmind
      - INFLUXDB_BUCKET=stock_data
    volumes:
      - ./data/uploads:/app/data/uploads
      - ./logs:/app/logs
    depends_on:
      - mysql
      - influxdb
      - redis
    networks:
      - quantmind-network
```

## 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| DATA_MANAGEMENT_PORT | 8008 | 服务端口 |
| DATABASE_URL | - | MySQL连接URL |
| INFLUXDB_URL | - | InfluxDB连接URL |
| INFLUXDB_TOKEN | admin-token | InfluxDB访问令牌 |
| INFLUXDB_ORG | quantmind | InfluxDB组织 |
| INFLUXDB_BUCKET | stock_data | InfluxDB存储桶 |
| UPLOAD_DIR | ./data/uploads | 文件上传目录 |
| MAX_FILE_SIZE | 104857600 | 最大文件大小(100MB) |
| LOG_LEVEL | INFO | 日志级别 |

## 监控和日志

### 健康检查
```bash
curl http://localhost:8008/health
```

### 日志文件
- 应用日志：`logs/data_management.log`
- 错误日志：`logs/error.log`

### 监控指标
- 文件上传成功率
- 数据处理延迟
- 存储使用情况
- API响应时间

## 故障排除

### 常见问题

1. **文件上传失败**
   - 检查文件格式是否为CSV
   - 确认文件大小不超过限制
   - 验证CSV列名是否正确

2. **数据库连接失败**
   - 检查DATABASE_URL配置
   - 确认MySQL服务运行状态
   - 验证数据库权限

3. **InfluxDB写入失败**
   - 检查InfluxDB服务状态
   - 验证Token和组织配置
   - 确认存储桶存在

### 调试模式

设置环境变量启用调试：
```bash
export LOG_LEVEL=DEBUG
export DEV_MODE=true
```

## 开发指南

### 项目结构
```
data-management/
├── main.py              # 应用入口
├── models.py            # 数据模型
├── controllers.py       # 控制器
├── services.py          # 业务逻辑
├── config.py            # 配置管理
├── requirements.txt     # 依赖包
├── Dockerfile          # 容器配置
└── README.md           # 文档
```

### 代码规范
- 使用Black进行代码格式化
- 使用Flake8进行代码检查
- 编写单元测试
- 添加类型注解

### 测试
```bash
pytest tests/
```

## 版本历史

- v1.0.0 - 初始版本，基础功能实现
  - 数据源管理
  - CSV文件上传
  - 数据存储和验证

## 许可证

本项目采用MIT许可证。