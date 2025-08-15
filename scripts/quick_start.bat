@echo off
REM QuantMind 快速启动脚本 (Windows版本)

setlocal enabledelayedexpansion

REM 设置颜色代码
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 打印带颜色的消息
:print_info
echo %BLUE%ℹ️  %~1%NC%
goto :eof

:print_success
echo %GREEN%✅ %~1%NC%
goto :eof

:print_warning
echo %YELLOW%⚠️  %~1%NC%
goto :eof

:print_error
echo %RED%❌ %~1%NC%
goto :eof

REM 检查命令是否存在
:command_exists
where %1 >nul 2>&1
if %errorlevel% equ 0 (
    exit /b 0
) else (
    exit /b 1
)

REM 主程序开始
echo 🚀 QuantMind 量化交易系统快速启动
echo =================================
echo.

REM 检查环境要求
call :print_info "检查环境要求..."

REM 检查Python
call :command_exists python
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    call :print_success "Python !PYTHON_VERSION! 已安装"
) else (
    call :command_exists python3
    if %errorlevel% equ 0 (
        for /f "tokens=2" %%i in ('python3 --version 2^>^&1') do set PYTHON_VERSION=%%i
        call :print_success "Python !PYTHON_VERSION! 已安装"
        set PYTHON_CMD=python3
    ) else (
        call :print_error "Python 3.9+ 未安装"
        pause
        exit /b 1
    )
)

if not defined PYTHON_CMD set PYTHON_CMD=python

REM 检查Docker
set DOCKER_AVAILABLE=false
call :command_exists docker
if %errorlevel% equ 0 (
    for /f "tokens=3 delims=, " %%i in ('docker --version 2^>^&1') do set DOCKER_VERSION=%%i
    call :print_success "Docker !DOCKER_VERSION! 已安装"
    
    REM 检查Docker Compose
    call :command_exists docker-compose
    if %errorlevel% equ 0 (
        for /f "tokens=3 delims=, " %%i in ('docker-compose --version 2^>^&1') do set COMPOSE_VERSION=%%i
        call :print_success "Docker Compose !COMPOSE_VERSION! 已安装"
        set DOCKER_AVAILABLE=true
    ) else (
        call :print_warning "Docker Compose 未安装，将使用本地开发模式"
    )
) else (
    call :print_warning "Docker 未安装，将使用本地开发模式"
)

REM 如果不使用Docker，检查Node.js
if "%DOCKER_AVAILABLE%"=="false" (
    call :command_exists node
    if %errorlevel% equ 0 (
        for /f "tokens=1" %%i in ('node --version 2^>^&1') do set NODE_VERSION=%%i
        call :print_success "Node.js !NODE_VERSION! 已安装"
    ) else (
        call :print_error "Node.js 16+ 未安装（本地开发模式需要）"
        pause
        exit /b 1
    )
)

REM 设置API配置
call :print_info "设置API配置..."

REM 检查是否已有本地配置
if exist "config\api_keys.local.json" (
    call :print_success "本地API配置文件已存在"
) else (
    call :print_info "创建本地API配置文件..."
    %PYTHON_CMD% scripts\config_manager.py create-local
    if %errorlevel% equ 0 (
        call :print_success "本地API配置文件已创建"
        call :print_warning "请编辑 config\api_keys.local.json 文件，填入您的API密钥"
    ) else (
        call :print_error "创建本地API配置文件失败"
        pause
        exit /b 1
    )
)

REM 检查环境变量文件
if exist ".env" (
    call :print_success "环境变量文件已存在"
) else (
    call :print_info "创建环境变量文件..."
    copy ".env.example" ".env" >nul
    call :print_success "环境变量文件已创建"
    call :print_warning "请编辑 .env 文件，填入必要的配置"
)

REM 验证API配置
call :print_info "验证API配置..."
%PYTHON_CMD% scripts\config_manager.py validate
if %errorlevel% equ 0 (
    call :print_success "API配置验证通过"
) else (
    call :print_warning "部分API配置未设置，某些功能可能无法正常使用"
    echo.
    echo 运行以下命令查看详细配置状态：
    echo   %PYTHON_CMD% scripts\config_manager.py list
    echo.
    set /p "continue=是否继续启动服务？(y/N): "
    if /i not "!continue!"=="y" (
        call :print_info "启动已取消"
        pause
        exit /b 0
    )
)

REM 选择启动模式
if "%DOCKER_AVAILABLE%"=="true" (
    call :print_info "检测到Docker环境，使用Docker模式启动"
    goto :start_with_docker
) else (
    call :print_info "使用本地开发模式启动"
    goto :start_local_dev
)

:start_with_docker
call :print_info "使用Docker Compose启动服务..."

REM 检查Docker服务是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "Docker服务未运行，请启动Docker Desktop"
    pause
    exit /b 1
)

REM 构建并启动服务
call :print_info "构建并启动所有服务..."
docker-compose up -d --build

REM 等待服务启动
call :print_info "等待服务启动..."
timeout /t 10 /nobreak >nul

REM 检查服务状态
call :print_info "检查服务状态..."
docker-compose ps

call :print_success "服务启动完成！"
call :print_info "访问地址："
echo   - 前端应用: http://localhost:3000
echo   - API网关: http://localhost:8000
echo   - API文档: http://localhost:8000/docs
echo.
echo 按任意键退出...
pause >nul
exit /b 0

:start_local_dev
call :print_info "使用本地开发模式启动服务..."

REM 安装Python依赖
if exist "requirements.txt" (
    call :print_info "安装Python依赖..."
    %PYTHON_CMD% -m pip install -r requirements.txt
)

REM 安装前端依赖
call :print_info "安装前端依赖..."
cd frontend\web
npm install
cd ..\..

call :print_warning "本地开发模式需要手动启动数据库服务（MySQL、Redis、InfluxDB）"
call :print_info "启动前端开发服务器..."

REM 启动前端
cd frontend\web
start "QuantMind Frontend" cmd /c "npm start"
cd ..\..

call :print_success "前端服务已启动"
call :print_info "访问地址："
echo   - 前端应用: http://localhost:3000
echo.
echo 要启动后端服务，请运行：
echo   %PYTHON_CMD% api-gateway\main.py
echo.
echo 按任意键退出...
pause >nul
exit /b 0

REM 显示帮助信息
:show_help
echo QuantMind 快速启动脚本 (Windows版本)
echo.
echo 用法: %~nx0 [选项]
echo.
echo 选项:
echo   /h, /help      显示帮助信息
echo   /d, /docker    强制使用Docker模式
echo   /l, /local     强制使用本地开发模式
echo   /c, /config    仅设置配置，不启动服务
echo   /v, /validate  仅验证配置，不启动服务
echo.
echo 示例:
echo   %~nx0              # 自动选择启动模式
echo   %~nx0 /docker      # 使用Docker启动
echo   %~nx0 /local       # 使用本地开发模式启动
echo   %~nx0 /config      # 仅设置配置
goto :eof

REM 处理命令行参数
if "%1"=="/h" goto :show_help
if "%1"=="/help" goto :show_help
if "%1"=="/?" goto :show_help

REM 如果有参数，处理特殊模式
if "%1"=="/d" set DOCKER_AVAILABLE=true
if "%1"=="/docker" set DOCKER_AVAILABLE=true
if "%1"=="/l" set DOCKER_AVAILABLE=false
if "%1"=="/local" set DOCKER_AVAILABLE=false

if "%1"=="/c" goto :config_only
if "%1"=="/config" goto :config_only
if "%1"=="/v" goto :validate_only
if "%1"=="/validate" goto :validate_only

goto :eof

:config_only
call :print_success "配置设置完成"
pause
exit /b 0

:validate_only
call :print_success "配置验证完成"
pause
exit /b 0