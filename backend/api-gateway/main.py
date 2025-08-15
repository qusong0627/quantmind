from fastapi import FastAPI, HTTPException, Depends, Request, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import httpx
import os
import time
from typing import Dict, Any, Optional
import logging
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from backend.shared.security import SecurityService, RateLimiter, SecurityMiddleware, AuditLogger

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 初始化安全服务
security_service = SecurityService(os.getenv("SECRET_KEY", "your-secret-key-here"))
rate_limiter = RateLimiter(max_requests=100, window_seconds=60)
audit_logger = AuditLogger()

# 监控指标
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

app = FastAPI(
    title="QuantMind API Gateway",
    description="QuantMind量化平台API网关",
    version="2.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加安全中间件
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    """安全中间件"""
    # 获取客户端ID
    client_id = rate_limiter.get_client_id(request)
    
    # 检查限流
    if not rate_limiter.is_allowed(client_id):
        raise HTTPException(status_code=429, detail="Too many requests")
    
    # 记录请求开始时间
    start_time = time.time()
    
    # 处理请求
    response = await call_next(request)
    
    # 记录请求时长
    duration = time.time() - start_time
    REQUEST_DURATION.observe(duration)
    
    # 记录请求统计
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    # 添加安全响应头
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    
    return response

# 安全认证
security = HTTPBearer()

# 请求模型定义
class UserLogin(BaseModel):
    """用户登录请求模型"""
    username: str
    password: str

class UserRegister(BaseModel):
    """用户注册请求模型"""
    username: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

# 微服务地址配置
SERVICES = {
    "user": os.getenv("USER_SERVICE_URL", "http://localhost:8001"),
    "ai-strategy": os.getenv("AI_STRATEGY_SERVICE_URL", "http://localhost:8006"),
    "multi-llm-strategy": os.getenv("MULTI_LLM_STRATEGY_SERVICE_URL", "http://localhost:8004"),
    "backtest": os.getenv("BACKTEST_SERVICE_URL", "http://localhost:8002"),
    "data-service": os.getenv("DATA_SERVICE_URL", "http://localhost:8005"),
    "market-data": os.getenv("MARKET_DATA_SERVICE_URL", "http://localhost:5002"),
    "trading": os.getenv("TRADING_SERVICE_URL", "http://localhost:8006"),
    "community": os.getenv("COMMUNITY_SERVICE_URL", "http://localhost:8007"),
}

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """验证JWT token"""
    token = credentials.credentials
    try:
        # 使用安全服务验证token
        payload = security_service.verify_jwt_token(token)
        
        # 兼容用户服务的token格式：sub字段映射到user_id
        if "sub" in payload and "user_id" not in payload:
            payload["user_id"] = payload["sub"]
        
        # 记录审计日志
        audit_logger.log_operation(
            user_id=payload.get("user_id") or payload.get("sub"),
            operation="API_ACCESS",
            resource="api_gateway",
            details={"token": token[:10] + "..."}
        )
        
        return payload
    except Exception as e:
        logger.error(f"Token验证失败: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/")
async def root():
    """健康检查接口"""
    return {"message": "QuantMind API Gateway is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """健康检查 - 检查网关和所有微服务状态"""
    from datetime import datetime
    
    service_status = {}
    overall_healthy = True
    
    async with httpx.AsyncClient() as client:
        for service_name, service_url in SERVICES.items():
            try:
                response = await client.get(f"{service_url}/health", timeout=5.0)
                is_healthy = response.status_code == 200
                service_status[service_name] = {
                    "status": "healthy" if is_healthy else "unhealthy",
                    "url": service_url,
                    "response_time": response.elapsed.total_seconds() if hasattr(response, 'elapsed') else None
                }
                if not is_healthy:
                    overall_healthy = False
            except Exception as e:
                service_status[service_name] = {
                    "status": "unhealthy",
                    "error": str(e),
                    "url": service_url
                }
                overall_healthy = False
    
    return {
        "status": "healthy" if overall_healthy else "degraded",
        "service": "api-gateway",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "services": service_status,
        "healthy_services": len([s for s in service_status.values() if s["status"] == "healthy"]),
        "total_services": len(service_status)
    }

@app.get("/dev/status")
async def dev_status():
    """开发模式状态检查"""
    dev_mode = os.getenv("DEV_MODE") == "true"
    return {
        "dev_mode": dev_mode,
        "auth_disabled": dev_mode,
        "test_accounts": {
            "admin": "admin123",
            "user": "user123"
        } if dev_mode else None,
        "message": "Development mode active - authentication bypassed" if dev_mode else "Production mode"
    }

@app.get("/metrics")
async def metrics():
    """Prometheus监控指标"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

async def proxy_request(service_name: str, path: str, method: str, **kwargs):
    """代理请求到对应的微服务"""
    if service_name not in SERVICES:
        raise HTTPException(status_code=404, detail=f"Service {service_name} not found")
    
    service_url = SERVICES[service_name]
    # 正确处理路径拼接，避免双斜杠
    if path.startswith('/'):
        url = f"{service_url}{path}"
    else:
        url = f"{service_url}/{path}"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            logger.info(f"Proxying {method} request to {url}")
            response = await client.request(method, url, **kwargs)
            logger.info(f"Response from {service_name}: {response.status_code}")
            # 如果后端服务返回错误状态码，抛出相应的HTTPException
            if response.status_code >= 400:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get('detail', error_detail)
                except:
                    pass
                raise HTTPException(status_code=response.status_code, detail=error_detail)
            
            return response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
        except httpx.RequestError as e:
            logger.error(f"Request to {service_name} at {url} failed: {e}")
            raise HTTPException(status_code=503, detail=f"Service {service_name} unavailable")
        except HTTPException:
            # 重新抛出HTTPException
            raise

# 用户相关路由
@app.post("/api/v1/auth/login")
async def login(login_data: UserLogin):
    logger.info(f"Login request received: {login_data.username}")
    
    # 开发模式：直接返回成功的token
    if os.getenv("DEV_MODE") == "true":
        logger.info("Dev mode: bypassing user service authentication")
        # 生成一个简单的开发token
        dev_token = security_service.create_jwt_token(
            user_id=login_data.username, permissions=["admin"]
        )
        return {
            "access_token": dev_token,
            "token_type": "bearer",
            "user_id": 1,
            "username": login_data.username,
            "role": "admin"
        }
    
    return await proxy_request("user", "/auth/login", "POST", json=login_data.dict())

@app.post("/v1/auth/login")
async def login_v1_compat(login_data: UserLogin):
    """兼容性路由：将 /v1/auth/login 重定向到 /api/v1/auth/login"""
    logger.info(f"V1 compat login request received: {login_data.username}")
    
    # 开发模式：直接返回成功的token
    if os.getenv("DEV_MODE") == "true":
        logger.info("Dev mode: bypassing user service authentication")
        # 生成一个简单的开发token
        dev_token = security_service.create_jwt_token(
            user_id=login_data.username, permissions=["admin"]
        )
        return {
            "access_token": dev_token,
            "token_type": "bearer",
            "user_id": 1,
            "username": login_data.username,
            "role": "admin"
        }
    
    return await proxy_request("user", "/auth/login", "POST", json=login_data.dict())

@app.post("/api/v1/auth/register")
async def register(register_data: UserRegister):
    logger.info(f"Register request received: {register_data.username}")
    return await proxy_request("user", "/auth/register", "POST", json=register_data.dict())

@app.post("/v1/auth/register")
async def register_v1_compat(register_data: UserRegister):
    """兼容性路由：将 /v1/auth/register 重定向到 /api/v1/auth/register"""
    logger.info(f"V1 compat register request received: {register_data.username}")
    return await proxy_request("user", "/auth/register", "POST", json=register_data.dict())

@app.get("/api/v1/user/profile")
async def get_profile(user_info: dict = Depends(verify_token), credentials: HTTPAuthorizationCredentials = Depends(security)):
    """获取用户信息"""
    user_id = user_info.get('sub') or user_info.get('user_id')
    headers = {"Authorization": f"Bearer {credentials.credentials}"}
    return await proxy_request("user", f"/profile/{user_id}", "GET", headers=headers)

# AI策略生成相关路由
@app.post("/api/v1/ai/generate-strategy")
async def generate_strategy(request_data: Dict[Any, Any], user_info: dict = Depends(verify_token)):
    """AI策略生成"""
    request_data["user_id"] = user_info["user_id"]
    return await proxy_request("ai-strategy", "/generate", "POST", json=request_data)

@app.post("/api/v1/ai/generate")
async def generate_ai_strategy(request_data: Dict[Any, Any], user_info: dict = Depends(verify_token)):
    """AI策略生成（兼容路径）"""
    request_data["user_id"] = user_info["user_id"]
    return await proxy_request("ai-strategy", "/generate", "POST", json=request_data)

@app.post("/generate")
async def generate_strategy_direct(request_data: Dict[Any, Any], user_info: dict = Depends(verify_token)):
    """直接策略生成路径（兼容性）"""
    request_data["user_id"] = user_info["user_id"]
    return await proxy_request("multi-llm-strategy", "/api/v1/generate", "POST", json=request_data)

@app.post("/test-generate")
async def test_generate_strategy(request_data: Dict[Any, Any]):
    """测试策略生成路径（无认证）- 仅用于测试"""
    request_data["user_id"] = "test_user"
    return await proxy_request("multi-llm-strategy", "/api/v1/generate", "POST", json=request_data)

@app.get("/api/v1/ai/templates")
async def get_strategy_templates():
    """获取策略模板"""
    return await proxy_request("ai-strategy", "/templates", "GET")

# 回测相关路由
@app.post("/api/v1/backtest/run")
async def run_backtest(request_data: Dict[Any, Any], user_info: dict = Depends(verify_token)):
    """运行回测"""
    request_data["user_id"] = user_info["user_id"]
    return await proxy_request("backtest", "/run", "POST", json=request_data)

@app.get("/api/v1/backtest/results/{backtest_id}")
async def get_backtest_results(backtest_id: str, user_info: dict = Depends(verify_token)):
    """获取回测结果"""
    return await proxy_request("backtest", f"/results/{backtest_id}", "GET")

@app.get("/api/v1/backtest/history")
async def get_backtest_history(user_info: dict = Depends(verify_token)):
    """获取回测历史"""
    return await proxy_request("backtest", f"/history/{user_info['user_id']}", "GET")

@app.post("/api/v1/backtest/optimize")
async def optimize_backtest(request_data: Dict[Any, Any], user_info: dict = Depends(verify_token)):
    """参数优化"""
    request_data["user_id"] = user_info["user_id"]
    return await proxy_request("backtest", "/optimize", "POST", json=request_data)

@app.get("/api/v1/backtest/report/{backtest_id}")
async def get_backtest_report(backtest_id: str, user_info: dict = Depends(verify_token)):
    """生成回测报告"""
    return await proxy_request("backtest", f"/report/{backtest_id}", "GET")

@app.get("/api/v1/backtest/compare/{backtest_id1}/{backtest_id2}")
async def compare_backtests(backtest_id1: str, backtest_id2: str, user_info: dict = Depends(verify_token)):
    """比较回测结果"""
    return await proxy_request("backtest", f"/compare/{backtest_id1}/{backtest_id2}", "GET")

# 社区相关路由
@app.get("/api/v1/community/strategies")
async def get_community_strategies():
    """获取社区策略"""
    return await proxy_request("community", "/strategies", "GET")

@app.post("/api/v1/community/strategies")
async def share_strategy(request_data: Dict[Any, Any], user_info: dict = Depends(verify_token)):
    """分享策略到社区"""
    request_data["user_id"] = user_info["user_id"]
    return await proxy_request("community", "/strategies", "POST", json=request_data)

# 数据服务路由
@app.post("/api/v1/data/ifind/setup")
async def setup_ifind_client(request_data: Dict[Any, Any], user_info: dict = Depends(verify_token)):
    """设置iFinD客户端"""
    return await proxy_request("data-service", "/api/v1/ifind/setup", "POST", json=request_data)

@app.get("/api/v1/data/ifind/token/status")
async def get_ifind_token_status(user_info: dict = Depends(verify_token)):
    """获取iFinD token状态"""
    return await proxy_request("data-service", "/api/v1/ifind/token/status", "GET")

@app.post("/api/v1/data/basic")
async def get_basic_data(request_data: Dict[Any, Any], user_info: dict = Depends(verify_token)):
    """获取基础数据"""
    return await proxy_request("data-service", "/api/v1/data/basic", "POST", json=request_data)

@app.post("/api/v1/data/market")
async def get_market_data(request_data: Dict[Any, Any], user_info: dict = Depends(verify_token)):
    """获取市场数据"""
    return await proxy_request("data-service", "/api/v1/data/market", "POST", json=request_data)

@app.get("/api/v1/data/stocks/search")
async def search_stocks(keyword: str, limit: int = 20, user_info: dict = Depends(verify_token)):
    """搜索股票"""
    return await proxy_request("data-service", f"/api/v1/data/stocks/search?keyword={keyword}&limit={limit}", "GET")

@app.get("/api/v1/data/indicators")
async def get_available_indicators(user_info: dict = Depends(verify_token)):
    """获取可用指标列表"""
    return await proxy_request("data-service", "/api/v1/data/indicators", "GET")

# 多模型AI策略生成服务路由
@app.post("/api/v1/multi-llm/generate")
async def generate_multi_llm_strategy(request_data: Dict[Any, Any], user_info: dict = Depends(verify_token)):
    """多模型AI策略生成"""
    request_data["user_id"] = user_info["user_id"]
    return await proxy_request("multi-llm-strategy", "/api/v1/generate", "POST", json=request_data)

@app.get("/api/v1/multi-llm/ptrade-guide")
async def get_ptrade_guide():
    """获取PTrade语法指南"""
    return await proxy_request("multi-llm-strategy", "/api/v1/ptrade-guide", "GET")

@app.post("/api/v1/multi-llm/validate")
async def validate_multi_llm_strategy(request_data: Dict[Any, Any], user_info: dict = Depends(verify_token)):
    """验证多LLM策略"""
    return await proxy_request("multi-llm-strategy", "validate", "POST", json=request_data)

# 添加市场数据API路由
@app.options("/api/v1/market/indices")
async def options_market_indices():
    """处理市场指数数据的CORS预检请求"""
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*"
    })

@app.get("/api/v1/market/indices")
async def get_market_indices(symbols: str = Query(None)):
    """获取市场指数数据"""
    # 构建请求参数
    params = {}
    if symbols:
        params['symbols'] = symbols
    
    # 代理到market_data服务的指数接口
    return await proxy_request("market-data", "api/v1/market/indices", "GET", params=params)

# 调度器API路由
@app.get("/api/v1/scheduler/status")
async def get_scheduler_status():
    """获取调度器状态"""
    try:
        response = await proxy_request("market-data", "/api/v1/scheduler/status", "GET")
        return response
    except Exception as e:
        logger.error(f"获取调度器状态失败: {e}")
        raise HTTPException(status_code=500, detail="获取调度器状态失败")

@app.get("/api/v1/scheduler/latest")
async def get_scheduler_latest():
    """获取最新采集数据"""
    try:
        response = await proxy_request("market-data", "/api/v1/scheduler/latest", "GET")
        return response
    except Exception as e:
        logger.error(f"获取最新采集数据失败: {e}")
        raise HTTPException(status_code=500, detail="获取最新采集数据失败")

@app.post("/api/v1/scheduler/start")
async def start_scheduler():
    """启动调度器"""
    try:
        response = await proxy_request("market-data", "/api/v1/scheduler/start", "POST")
        return response
    except Exception as e:
        logger.error(f"启动调度器失败: {e}")
        raise HTTPException(status_code=500, detail="启动调度器失败")

@app.post("/api/v1/scheduler/stop")
async def stop_scheduler():
    """停止调度器"""
    try:
        response = await proxy_request("market-data", "/api/v1/scheduler/stop", "POST")
        return response
    except Exception as e:
        logger.error(f"停止调度器失败: {e}")
        raise HTTPException(status_code=500, detail="停止调度器失败")

# 添加404处理器来捕获未匹配的路由（必须在最后定义）
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def catch_all(path: str, request: Request):
    logger.warning(f"404 - Unmatched route: {request.method} /{path}")
    logger.warning(f"Request headers: {dict(request.headers)}")
    raise HTTPException(status_code=404, detail=f"Route not found: {request.method} /{path}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)