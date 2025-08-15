#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
同花顺iFinD API Token管理器
用于管理Refresh Token和Access Token的获取、存储和更新
"""

import json
import os
import requests
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class IFindTokenManager:
    """同花顺iFinD API Token管理器"""
    
    def __init__(self, config_file: str = None):
        """初始化Token管理器
        
        Args:
            config_file: 配置文件路径，默认为当前目录下的ifind_tokens.json
        """
        if config_file is None:
            config_file = os.path.join(os.path.dirname(__file__), 'ifind_tokens.json')
        
        self.config_file = config_file
        self.config = self._load_config()
        
    def _load_config(self) -> Dict:
        """加载配置文件"""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error(f"配置文件不存在: {self.config_file}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"配置文件格式错误: {e}")
            raise
    
    def _save_config(self):
        """保存配置文件"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, ensure_ascii=False, indent=2)
            logger.info("配置文件已更新")
        except Exception as e:
            logger.error(f"保存配置文件失败: {e}")
            raise
    
    def set_refresh_token(self, refresh_token: str):
        """设置Refresh Token
        
        Args:
            refresh_token: 刷新令牌
        """
        self.config['ifind_api']['refresh_token'] = refresh_token
        self.config['ifind_api']['last_updated'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self._save_config()
        logger.info("Refresh Token已更新")
    
    def has_refresh_token(self) -> bool:
        """检查是否有Refresh Token"""
        refresh_token = self.config['ifind_api'].get('refresh_token', '')
        return bool(refresh_token and refresh_token.strip())
    
    def has_access_token(self) -> bool:
        """检查是否有Access Token"""
        access_token = self.config['ifind_api'].get('access_token', '')
        return bool(access_token and access_token.strip())
    
    def get_refresh_token(self) -> str:
        """获取Refresh Token"""
        return self.config['ifind_api']['refresh_token']
    
    def get_access_token(self) -> str:
        """获取Access Token"""
        return self.config['ifind_api']['access_token']
    
    def is_access_token_valid(self) -> bool:
        """检查Access Token是否有效
        
        Returns:
            bool: Token是否有效
        """
        expires_at_str = self.config['ifind_api']['token_expires_at']
        if not expires_at_str:
            return False
        
        try:
            expires_at = datetime.strptime(expires_at_str, '%Y-%m-%d %H:%M:%S')
            return datetime.now() < expires_at
        except ValueError:
            logger.error("Token过期时间格式错误")
            return False
    
    def refresh_access_token(self) -> Tuple[bool, str]:
        """使用Refresh Token获取新的Access Token
        
        Returns:
            Tuple[bool, str]: (是否成功, 错误信息或成功信息)
        """
        refresh_token = self.get_refresh_token()
        if not refresh_token:
            return False, "Refresh Token为空"
        
        try:
            # 构建请求
            url = self.config['ifind_api']['refresh_url']
            headers = {
                'Content-Type': 'application/json',
                'refresh_token': refresh_token
            }
            
            # 发送请求
            response = requests.post(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            # 检查响应
            if result.get('errorcode') == 0 and 'data' in result:
                access_token = result['data'].get('access_token')
                expired_time = result['data'].get('expired_time', '')
                
                if access_token:
                    # 更新配置
                    self.config['ifind_api']['access_token'] = access_token
                    self.config['ifind_api']['token_expires_at'] = expired_time
                    self.config['ifind_api']['last_updated'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    self._save_config()
                    
                    logger.info("Access Token刷新成功")
                    return True, "Access Token刷新成功"
                else:
                    logger.error("响应中缺少access_token")
                    return False, "响应中缺少access_token"
            else:
                error_msg = result.get('errmsg', '未知错误')
                logger.error(f"刷新Access Token失败: {error_msg}")
                return False, f"刷新失败: {error_msg}"
                
        except requests.RequestException as e:
            logger.error(f"网络请求失败: {e}")
            return False, f"网络请求失败: {e}"
        except Exception as e:
            logger.error(f"刷新Access Token时发生错误: {e}")
            return False, f"发生错误: {e}"
    
    def get_valid_access_token(self) -> Optional[str]:
        """获取有效的Access Token，如果过期则自动刷新
        
        Returns:
            Optional[str]: 有效的Access Token，失败返回None
        """
        # 检查当前token是否有效
        if self.is_access_token_valid():
            return self.get_access_token()
        
        # 尝试刷新token
        success, message = self.refresh_access_token()
        if success:
            return self.get_access_token()
        else:
            logger.error(f"无法获取有效的Access Token: {message}")
            return None
    
    def get_api_headers(self) -> Optional[Dict[str, str]]:
        """获取API请求所需的headers
        
        Returns:
            Optional[Dict[str, str]]: 包含Authorization的headers，失败返回None
        """
        access_token = self.get_valid_access_token()
        if not access_token:
            return None
        
        return {
            'Content-Type': 'application/json',
            'access_token': access_token
        }
    
    def get_token_status(self) -> Dict:
        """获取Token状态信息
        
        Returns:
            Dict: Token状态信息
        """
        return {
            'has_refresh_token': bool(self.get_refresh_token()),
            'has_access_token': bool(self.get_access_token()),
            'access_token_valid': self.is_access_token_valid(),
            'expires_at': self.config['ifind_api']['token_expires_at'],
            'last_updated': self.config['ifind_api']['last_updated']
        }


if __name__ == '__main__':
    # 示例用法
    import sys
    
    # 配置日志
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    try:
        # 创建Token管理器
        token_manager = IFindTokenManager()
        
        if len(sys.argv) > 1:
            command = sys.argv[1]
            
            if command == 'status':
                # 显示Token状态
                status = token_manager.get_token_status()
                print("Token状态:")
                for key, value in status.items():
                    print(f"  {key}: {value}")
                    
            elif command == 'refresh':
                # 刷新Access Token
                success, message = token_manager.refresh_access_token()
                print(f"刷新结果: {message}")
                
            elif command == 'set_refresh_token' and len(sys.argv) > 2:
                # 设置Refresh Token
                refresh_token = sys.argv[2]
                token_manager.set_refresh_token(refresh_token)
                print("Refresh Token已设置")
                
            else:
                print("用法:")
                print("  python ifind_token_manager.py status                    # 显示Token状态")
                print("  python ifind_token_manager.py refresh                   # 刷新Access Token")
                print("  python ifind_token_manager.py set_refresh_token <token> # 设置Refresh Token")
        else:
            # 默认显示状态
            status = token_manager.get_token_status()
            print("Token状态:")
            for key, value in status.items():
                print(f"  {key}: {value}")
                
    except Exception as e:
        logger.error(f"执行失败: {e}")
        sys.exit(1)