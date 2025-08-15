"""AI策略生成服务主应用"""

import asyncio
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from api.v1.routes import router as api_router, http_exception_handler, general_exception_handler
from fastapi import HTTPException
from utils.config import get_config
from utils.logger import setup_logger, get_logger
from providers.factory import get_provider_factory
from templates.manager import get_template_manager

# 应用生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger = get_logger(__name__)
    
    # 启动时初始化
    logger.info("AI策略生成服务启动中...")
    
    try:
        # 初始化配置
        config = get_config()
        logger.info("配置加载完成")
        
        # 初始化提供商工厂
        factory = get_provider_factory()
        logger.info("LLM提供商工厂初始化完成")
        
        # 初始化模板管理器
        template_manager = get_template_manager()
        logger.info(f"模板管理器初始化完成，加载了 {len(template_manager)} 个模板")
        
        # 验证关键组件
        await _verify_components(factory, logger)
        
        logger.info("AI策略生成服务启动完成")
        
    except Exception as e:
        logger.error(f"服务启动失败: {e}")
        raise
    
    yield
    
    # 关闭时清理
    logger.info("AI策略生成服务关闭中...")
    
    try:
        # 清理资源
        if 'factory' in locals():
            factory.clear_cache()
        
        logger.info("AI策略生成服务关闭完成")
        
    except Exception as e:
        logger.error(f"服务关闭时出错: {e}")

async def _verify_components(factory, logger):
    """验证关键组件"""
    config = get_config()
    
    # 验证LLM提供商
    enabled_providers = list(config.get('llm_providers', {}).keys())
    working_providers = []
    
    for provider_name in enabled_providers:
        try:
            provider = factory.create_provider(provider_name)
            is_connected = await provider.verify_connection()
            if is_connected:
                working_providers.append(provider_name)
                logger.info(f"LLM提供商 {provider_name} 连接正常")
            else:
                logger.warning(f"LLM提供商 {provider_name} 连接失败")
        except Exception as e:
            logger.error(f"LLM提供商 {provider_name} 初始化失败: {e}")
    
    if not working_providers:
        logger.warning("没有可用的LLM提供商，服务功能将受限")
    else:
        logger.info(f"可用的LLM提供商: {', '.join(working_providers)}")

# 创建FastAPI应用
def create_app() -> FastAPI:
    """创建FastAPI应用实例"""
    
    # 初始化日志
    setup_logger(__name__)
    logger = get_logger(__name__)
    
    # 获取配置
    config = get_config()
    app_config = config.get('app', {})
    
    # 创建应用
    app = FastAPI(
        title="AI策略生成服务",
        description="基于多模型LLM的量化交易策略生成服务",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan
    )
    
    # 配置CORS中间件
    cors_config = config.get('security', {}).get('cors', {})
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_config.get('allowed_origins', ["*"]),
        allow_credentials=cors_config.get('allow_credentials', True),
        allow_methods=cors_config.get('allowed_methods', ["*"]),
        allow_headers=cors_config.get('allowed_headers', ["*"]),
    )
    
    # 配置受信任主机中间件
    trusted_hosts = config.get('security', {}).get('trusted_hosts', [])
    if trusted_hosts:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=trusted_hosts
        )
    
    # 添加请求日志中间件
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.time()
        
        # 记录请求信息
        logger.info(f"收到请求: {request.method} {request.url.path}")
        
        # 处理请求
        response = await call_next(request)
        
        # 记录响应信息
        process_time = time.time() - start_time
        logger.info(
            f"请求完成: {request.method} {request.url.path} "
            f"状态码: {response.status_code} 耗时: {process_time:.3f}s"
        )
        
        # 添加响应头
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
    
    # 添加异常处理器
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    
    # 注册路由
    app.include_router(api_router)
    
    # 添加根路径处理
    @app.get("/")
    async def root():
        """根路径"""
        return {
            "service": "AI策略生成服务",
            "version": "1.0.0",
            "status": "running",
            "docs": "/docs",
            "health": "/api/v1/health",
            "timestamp": int(time.time())
        }
    
    logger.info("FastAPI应用创建完成")
    return app

# 创建应用实例
app = create_app()

def main():
    """主函数"""
    config = get_config()
    server_config = config.get('app', {})
    
    # 服务器配置
    host = server_config.get('host', '0.0.0.0')
    port = server_config.get('port', 8001)
    workers = server_config.get('workers', 1)
    reload = server_config.get('reload', False)
    log_level = server_config.get('log_level', 'info')
    
    # 启动服务器
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers,
        reload=reload,
        log_level=log_level,
        access_log=True
    )

if __name__ == "__main__":
    main()