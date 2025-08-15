ubuntu@VM-16-9-ubuntu:~/quantmind$ # 使用改进版一键部署脚本（修复了环境变量路径、MySQL重启等问题）
chmod +x scripts/deploy/one_click_deploy_v2.sh
./scripts/deploy/one_click_deploy_v2.sh
======================================
       QuantMind 一键部署 v2.0
======================================
操作系统: Linux
项目路径: /home/ubuntu/quantmind
配置文件: /home/ubuntu/quantmind/.env.prod

[STEP] 检查系统依赖...
[STEP] 检查Docker Compose版本兼容性...
[INFO] 使用Docker Compose V2 (docker compose)
[SUCCESS] 依赖检查通过
[STEP] 检查Docker服务状态...
[ERROR] Docker服务未运行，请启动Docker服务
[INFO] Linux用户请运行: sudo systemctl start docker
[ERROR] 部署过程中发生错误 (退出码: 1)
[INFO] 正在收集错误信息...
当前容器状态:
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ADMIN_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ORG" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_BUCKET" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ADMIN_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ORG" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_BUCKET" variable is not set. Defaulting to a blank string. 
WARN[0000] The "JUHE_API_KEY" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ADMIN_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ORG" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_BUCKET" variable is not set. Defaulting to a blank string. 
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_ROOT_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_ROOT_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "DOMAIN" variable is not set. Defaulting to a blank string. 
WARN[0000] The "JWT_SECRET" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "JWT_SECRET" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ADMIN_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ADMIN_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ORG" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_BUCKET" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ADMIN_PASSWORD" variable is not set. Defaulting to a blank string. 
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.51/containers/json?filters=%7B%22label%22%3A%7B%22com.docker.compose.config-hash%22%3Atrue%2C%22com.docker.compose.oneoff%3DFalse%22%3Atrue%2C%22com.docker.compose.project%3Dquantmind%22%3Atrue%7D%7D": dial unix /var/run/docker.sock: connect: permission denied
最近的错误日志:
WARN[0000] The "JUHE_API_KEY" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ADMIN_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ORG" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_BUCKET" variable is not set. Defaulting to a blank string. 
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_ROOT_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_ROOT_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "DOMAIN" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ADMIN_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ORG" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_BUCKET" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ADMIN_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ORG" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_BUCKET" variable is not set. Defaulting to a blank string. 
WARN[0000] The "JWT_SECRET" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ADMIN_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ADMIN_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ORG" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_BUCKET" variable is not set. Defaulting to a blank string. 
WARN[0000] The "INFLUXDB_ADMIN_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "JWT_SECRET" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "REDIS_PASSWORD" variable is not set. Defaulting to a blank string. 
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.51/containers/json?all=1&filters=%7B%22label%22%3A%7B%22com.docker.compose.config-hash%22%3Atrue%2C%22com.docker.compose.oneoff%3DFalse%22%3Atrue%2C%22com.docker.compose.project%3Dquantmind%22%3Atrue%7D%7D": dial unix /var/run/docker.sock: connect: permission denied

故障排除建议:
1. 检查Docker服务是否正常运行
2. 确认端口80和443未被占用
3. 检查磁盘空间是否充足
4. 查看详细日志: docker compose -f /home/ubuntu/quantmind/docker-compose.prod.yml logs [service]
5. 重新运行部署脚本
