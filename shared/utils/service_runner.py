"""服务启动器"""
import uvicorn
import logging
from typing import Optional
import os

def setup_logging(level: str = "INFO"):
    """设置日志配置"""
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

def run_service(
    app_name: str,
    host: str = "0.0.0.0",
    port: int = 8000,
    reload: bool = False,
    log_level: str = "INFO"
):
    """运行服务"""
    setup_logging(log_level)
    
    print(f"启动服务: {app_name}")
    print(f"地址: http://{host}:{port}")
    print(f"日志级别: {log_level}")
    
    uvicorn.run(
        f"{app_name}:app",
        host=host,
        port=port,
        reload=reload,
        log_level=log_level.lower()
    )

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("用法: python service_runner.py <app_name> [port] [host]")
        sys.exit(1)
    
    app_name = sys.argv[1]
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8000
    host = sys.argv[3] if len(sys.argv) > 3 else "0.0.0.0"
    
    run_service(app_name, host, port)
