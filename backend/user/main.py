from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import hashlib
import jwt
import os
from datetime import datetime, timedelta
import logging
import json
import sys

# 添加数据服务路径
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data-service'))
from database_user import UserDatabaseManager, User

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="QuantMind User Service",
    description="用户管理服务",
    version="1.0.0"
)

# 配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

class UserRegister(BaseModel):
    """用户注册请求"""
    username: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    """用户登录请求"""
    username: str
    password: str

class UserProfile(BaseModel):
    """用户信息"""
    user_id: str
    username: str
    email: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool = True
    subscription_type: str = "free"  # free, premium, pro

class TokenResponse(BaseModel):
    """登录响应"""
    access_token: str
    token_type: str
    expires_in: int
    user_info: UserProfile

# 初始化用户数据库管理器
user_db_manager = UserDatabaseManager('aliyun_mysql')
token_blacklist = set()

# 确保数据库表已创建
try:
    user_db_manager.init_tables()
    user_db_manager.create_admin_user()
    logger.info("用户数据库初始化完成")
except Exception as e:
    logger.error(f"用户数据库初始化失败: {e}")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """创建JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """验证JWT token"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        username: str = payload.get("username")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 检查token是否在黑名单中
        if token in token_blacklist:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 获取用户完整信息
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {"user_id": user_id, "username": username, "token": token, "subscription_type": user.get("subscription_type", "free")}
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_user_by_username(username: str) -> Optional[dict]:
    """根据用户名获取用户"""
    user = user_db_manager.get_user_by_username(username)
    if user:
        user_dict = user.to_dict()
        user_dict["password"] = user.password  # 添加密码字段用于验证
        return user_dict
    return None

def get_user_by_email(email: str) -> Optional[dict]:
    """根据邮箱获取用户"""
    user = user_db_manager.get_user_by_email(email)
    if user:
        user_dict = user.to_dict()
        user_dict["password"] = user.password  # 添加密码字段用于验证
        return user_dict
    return None

def get_user_by_id(user_id: str) -> Optional[dict]:
    """根据用户ID获取用户"""
    user = user_db_manager.get_user_by_id(user_id)
    if user:
        user_dict = user.to_dict()
        user_dict["password"] = user.password  # 添加密码字段用于验证
        return user_dict
    return None

@app.get("/")
async def root():
    return {"message": "User Service is running"}

@app.get("/health")
async def health_check():
    """健康检查端点"""
    try:
        # 尝试获取用户数量来检查数据库连接
        users_count = user_db_manager.get_users_count() if hasattr(user_db_manager, 'get_users_count') else 0
        database_status = "connected"
    except Exception as e:
        users_count = 0
        database_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "service": "user-service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "database": database_status,
        "users_count": users_count
    }

@app.post("/auth/register", response_model=UserProfile)
async def register(user_data: UserRegister):
    """用户注册"""
    try:
        # 创建新用户
        new_user = user_db_manager.create_user(
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
            phone=user_data.phone
        )
        
        if not new_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="用户创建失败"
            )
        
        # 返回用户信息（不包含密码）
        return UserProfile(
            user_id=new_user.user_id,
            username=new_user.username,
            email=new_user.email,
            phone=new_user.phone,
            avatar=new_user.avatar,
            created_at=new_user.created_at,
            last_login=new_user.last_login,
            is_active=new_user.is_active,
            subscription_type=new_user.subscription_type
        )
        
    except ValueError as e:
        # 处理业务逻辑错误（如用户名已存在）
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"用户注册失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="注册失败，请稍后重试"
        )

@app.post("/auth/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    """用户登录"""
    try:
        # 验证用户
        user = get_user_by_username(login_data.username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 验证密码
        if not user_db_manager.verify_password(login_data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="账户已被禁用"
            )
        
        # 更新最后登录时间
        user_db_manager.update_last_login(user["user_id"])
        
        # 创建访问令牌
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["user_id"], "username": user["username"]},
            expires_delta=access_token_expires
        )
        
        logger.info(f"用户登录成功: {login_data.username}")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_info=UserProfile(**user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"用户登录失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="登录失败，请稍后重试"
        )

@app.post("/auth/logout")
async def logout(current_user: dict = Depends(verify_token)):
    """用户登出"""
    try:
        # 将token加入黑名单
        token = current_user["token"]
        token_blacklist.add(token)
        
        logger.info(f"用户登出: {current_user['username']}")
        return {"message": "登出成功"}
        
    except Exception as e:
        logger.error(f"用户登出失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="登出失败"
        )

@app.get("/profile/{user_id}", response_model=UserProfile)
async def get_profile(user_id: str, current_user: dict = Depends(verify_token)):
    """获取用户资料"""
    try:
        # 查找用户
        user = get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 检查权限（只能查看自己的资料或管理员可以查看所有）
        logger.info(f"权限检查: current_user_id={current_user['user_id']}, requested_user_id={user_id}, subscription_type={current_user['subscription_type']}")
        if current_user["user_id"] != user_id and current_user["subscription_type"] != "pro":
            logger.warning(f"权限不足: 用户 {current_user['user_id']} 尝试访问用户 {user_id} 的资料")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权限访问该用户资料"
            )
        
        return UserProfile(**user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取用户资料失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取用户资料失败"
        )

@app.put("/profile/{user_id}", response_model=UserProfile)
async def update_profile(
    user_id: str,
    profile_data: dict,
    current_user: dict = Depends(verify_token)
):
    """更新用户资料"""
    try:
        # 检查权限
        if current_user["user_id"] != user_id and current_user.get("subscription_type") != "pro":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权限修改该用户资料"
            )
        
        # 更新用户资料
        updated_user = user_db_manager.update_user_profile(user_id, profile_data)
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        return UserProfile(
            user_id=updated_user.user_id,
            username=updated_user.username,
            email=updated_user.email,
            phone=updated_user.phone,
            avatar=updated_user.avatar,
            created_at=updated_user.created_at,
            last_login=updated_user.last_login,
            is_active=updated_user.is_active,
            subscription_type=updated_user.subscription_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新用户资料失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新用户资料失败"
        )

@app.post("/auth/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: dict = Depends(verify_token)
):
    """修改密码"""
    try:
        username = current_user["username"]
        user = get_user_by_username(username)
        
        if not user or not user_db_manager.verify_password(old_password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="原密码错误"
            )
        
        # 更新密码
        success = user_db_manager.update_password(user["user_id"], new_password)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="密码更新失败"
            )
        
        logger.info(f"密码修改成功: {username}")
        return {"message": "密码修改成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"修改密码失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="修改密码失败"
        )

@app.get("/users")
async def list_users(
    page: int = 1,
    size: int = 10,
    current_user: dict = Depends(verify_token)
):
    """获取用户列表（管理员功能）"""
    try:
        # 简化实现，实际需要权限检查
        users_list = []
        for user in users_db.values():
            users_list.append({
                "user_id": user["user_id"],
                "username": user["username"],
                "email": user["email"],
                "created_at": user["created_at"],
                "is_active": user["is_active"],
                "subscription_type": user["subscription_type"]
            })
        
        # 分页
        start = (page - 1) * size
        end = start + size
        paginated_users = users_list[start:end]
        
        return {
            "users": paginated_users,
            "total": len(users_list),
            "page": page,
            "size": size
        }
        
    except Exception as e:
        logger.error(f"获取用户列表失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取用户列表失败"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)