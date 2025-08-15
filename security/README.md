# QuantMind 安全性增强方案

## 1. 身份认证和授权

### 1.1 多因素认证 (MFA)
```python
# 实现TOTP双因素认证
import pyotp
import qrcode

class MFAService:
    def __init__(self):
        self.secret_key = pyotp.random_base32()
    
    def generate_qr_code(self, user_email: str) -> str:
        totp = pyotp.TOTP(self.secret_key)
        provisioning_uri = totp.provisioning_uri(
            name=user_email,
            issuer_name="QuantMind"
        )
        return provisioning_uri
    
    def verify_code(self, code: str) -> bool:
        totp = pyotp.TOTP(self.secret_key)
        return totp.verify(code)
```

### 1.2 JWT Token增强
```python
# JWT Token安全增强
from datetime import datetime, timedelta
import jwt
from typing import Optional

class JWTService:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.algorithm = "HS256"
    
    def create_token(self, user_id: str, permissions: list) -> str:
        payload = {
            "user_id": user_id,
            "permissions": permissions,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=1),
            "jti": str(uuid.uuid4())  # JWT ID防止重放攻击
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
```

### 1.3 基于角色的访问控制 (RBAC)
```python
# RBAC权限控制
from enum import Enum
from typing import List, Set

class Permission(Enum):
    READ_STRATEGY = "read_strategy"
    WRITE_STRATEGY = "write_strategy"
    DELETE_STRATEGY = "delete_strategy"
    RUN_BACKTEST = "run_backtest"
    VIEW_COMMUNITY = "view_community"
    ADMIN_USERS = "admin_users"

class Role(Enum):
    USER = "user"
    PREMIUM = "premium"
    ADMIN = "admin"

class RBACService:
    def __init__(self):
        self.role_permissions = {
            Role.USER: {
                Permission.READ_STRATEGY,
                Permission.WRITE_STRATEGY,
                Permission.RUN_BACKTEST,
                Permission.VIEW_COMMUNITY
            },
            Role.PREMIUM: {
                Permission.READ_STRATEGY,
                Permission.WRITE_STRATEGY,
                Permission.DELETE_STRATEGY,
                Permission.RUN_BACKTEST,
                Permission.VIEW_COMMUNITY
            },
            Role.ADMIN: {
                Permission.READ_STRATEGY,
                Permission.WRITE_STRATEGY,
                Permission.DELETE_STRATEGY,
                Permission.RUN_BACKTEST,
                Permission.VIEW_COMMUNITY,
                Permission.ADMIN_USERS
            }
        }
    
    def has_permission(self, user_role: Role, permission: Permission) -> bool:
        return permission in self.role_permissions.get(user_role, set())
```

## 2. 数据安全

### 2.1 数据加密
```python
# 敏感数据加密
from cryptography.fernet import Fernet
import base64

class DataEncryption:
    def __init__(self, key: str):
        self.cipher = Fernet(key)
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """加密敏感数据"""
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """解密敏感数据"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()
    
    def hash_password(self, password: str) -> str:
        """密码哈希"""
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """验证密码"""
        return bcrypt.checkpw(password.encode(), hashed.encode())
```

### 2.2 API密钥管理
```python
# API密钥安全管理
import secrets
from datetime import datetime, timedelta

class APIKeyManager:
    def __init__(self):
        self.keys = {}
    
    def generate_api_key(self, user_id: str, permissions: list) -> str:
        """生成API密钥"""
        key = f"qm_{secrets.token_urlsafe(32)}"
        self.keys[key] = {
            "user_id": user_id,
            "permissions": permissions,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=365)
        }
        return key
    
    def validate_api_key(self, key: str) -> Optional[dict]:
        """验证API密钥"""
        if key not in self.keys:
            return None
        
        key_info = self.keys[key]
        if datetime.utcnow() > key_info["expires_at"]:
            del self.keys[key]
            return None
        
        return key_info
```

## 3. 网络安全

### 3.1 请求限流
```python
# API限流保护
import time
from collections import defaultdict
from typing import Dict, List

class RateLimiter:
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = defaultdict(list)
    
    def is_allowed(self, client_id: str) -> bool:
        """检查是否允许请求"""
        now = time.time()
        window_start = now - self.window_seconds
        
        # 清理过期的请求记录
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > window_start
        ]
        
        # 检查请求数量
        if len(self.requests[client_id]) >= self.max_requests:
            return False
        
        # 记录新请求
        self.requests[client_id].append(now)
        return True
```

### 3.2 SQL注入防护
```python
# SQL注入防护
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

class SecureDatabase:
    def __init__(self, engine):
        self.engine = engine
    
    def safe_query(self, query: str, params: dict = None):
        """安全查询方法"""
        try:
            with self.engine.connect() as conn:
                # 使用参数化查询防止SQL注入
                result = conn.execute(text(query), params or {})
                return result.fetchall()
        except SQLAlchemyError as e:
            logger.error(f"Database error: {e}")
            raise HTTPException(status_code=500, detail="Database error")
```

### 3.3 XSS防护
```python
# XSS防护
import html
import re

class XSSProtection:
    @staticmethod
    def sanitize_input(input_str: str) -> str:
        """清理用户输入"""
        # 移除危险标签
        dangerous_tags = ['script', 'iframe', 'object', 'embed']
        for tag in dangerous_tags:
            pattern = rf'<{tag}[^>]*>.*?</{tag}>'
            input_str = re.sub(pattern, '', input_str, flags=re.IGNORECASE)
        
        # HTML转义
        return html.escape(input_str)
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """验证邮箱格式"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
```

## 4. 审计日志

### 4.1 操作审计
```python
# 操作审计日志
from datetime import datetime
from typing import Dict, Any

class AuditLogger:
    def __init__(self, db_session):
        self.db_session = db_session
    
    def log_operation(self, user_id: str, operation: str, 
                     resource: str, details: Dict[str, Any] = None):
        """记录操作审计日志"""
        audit_log = {
            "user_id": user_id,
            "operation": operation,
            "resource": resource,
            "details": details or {},
            "timestamp": datetime.utcnow(),
            "ip_address": self.get_client_ip(),
            "user_agent": self.get_user_agent()
        }
        
        # 存储到数据库
        self.save_audit_log(audit_log)
    
    def get_suspicious_activities(self, user_id: str, 
                                time_window_hours: int = 24) -> List[dict]:
        """检测可疑活动"""
        # 实现可疑活动检测逻辑
        pass
```

## 5. 安全配置

### 5.1 安全中间件
```python
# 安全中间件
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 添加安全头
        response = await call_next(request)
        
        # 设置安全响应头
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        return response
```

### 5.2 环境变量安全
```python
# 环境变量安全配置
import os
from pydantic import BaseSettings

class SecuritySettings(BaseSettings):
    # 数据库配置
    DATABASE_URL: str
    DATABASE_PASSWORD: str
    
    # JWT配置
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30
    
    # API密钥配置
    API_KEYS_FILE: str = "config/api_keys.json"
    
    # 安全配置
    CORS_ORIGINS: list = ["http://localhost:3000"]
    RATE_LIMIT_PER_MINUTE: int = 100
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
```

## 6. 安全测试

### 6.1 自动化安全测试
```python
# 安全测试框架
import pytest
from fastapi.testclient import TestClient

class SecurityTests:
    def __init__(self, client: TestClient):
        self.client = client
    
    def test_sql_injection_protection(self):
        """测试SQL注入防护"""
        malicious_input = "'; DROP TABLE users; --"
        response = self.client.post("/api/v1/user/search", 
                                  json={"query": malicious_input})
        assert response.status_code != 500
    
    def test_xss_protection(self):
        """测试XSS防护"""
        malicious_input = "<script>alert('xss')</script>"
        response = self.client.post("/api/v1/strategy/create",
                                  json={"name": malicious_input})
        assert "<script>" not in response.text
    
    def test_rate_limiting(self):
        """测试限流功能"""
        for _ in range(101):
            response = self.client.get("/api/v1/data/stocks")
            if response.status_code == 429:
                break
        else:
            assert False, "Rate limiting not working"
```

## 7. 应急响应

### 7.1 安全事件响应
```python
# 安全事件响应
class SecurityIncidentResponse:
    def __init__(self):
        self.incident_types = {
            "data_breach": self.handle_data_breach,
            "unauthorized_access": self.handle_unauthorized_access,
            "api_abuse": self.handle_api_abuse
        }
    
    def handle_security_incident(self, incident_type: str, details: dict):
        """处理安全事件"""
        if incident_type in self.incident_types:
            self.incident_types[incident_type](details)
    
    def handle_data_breach(self, details: dict):
        """处理数据泄露事件"""
        # 1. 立即隔离受影响系统
        # 2. 通知相关用户
        # 3. 重置相关密码和密钥
        # 4. 启动调查流程
        pass
    
    def handle_unauthorized_access(self, details: dict):
        """处理未授权访问"""
        # 1. 锁定相关账户
        # 2. 记录访问日志
        # 3. 通知管理员
        pass
```

## 8. 合规性

### 8.1 数据保护合规
- **GDPR合规**: 用户数据权利保护
- **数据本地化**: 敏感数据本地存储
- **数据最小化**: 只收集必要数据
- **用户同意**: 明确的用户同意机制

### 8.2 金融合规
- **反洗钱 (AML)**: 交易监控和报告
- **了解你的客户 (KYC)**: 用户身份验证
- **风险控制**: 交易风险监控
- **审计追踪**: 完整的操作记录 