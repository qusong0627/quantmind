"""API集成测试"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
import json

# 导入主应用
from main import app
from models.requests import StrategyRequest, ModelType, MarketType, RiskLevel, TimeFrame
from models.responses import StrategyResponse, ValidationResult, ValidationStatus

class TestAPIIntegration:
    """API集成测试类"""
    
    @pytest.fixture
    def client(self):
        """测试客户端"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_llm_providers(self):
        """模拟LLM提供商"""
        mock_provider = MagicMock()
        mock_provider.generate_content = AsyncMock(return_value={
            "code": "# Test strategy\nclass TestStrategy:\n    pass",
            "description": "Test strategy description",
            "parameters": {"param1": 10}
        })
        mock_provider.verify_connection = AsyncMock(return_value=True)
        mock_provider.get_model_info = AsyncMock(return_value={"name": "test-model", "version": "1.0"})
        
        return {"qwen": mock_provider, "gemini": mock_provider}
    
    def test_health_check(self, client):
        """测试健康检查端点"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
        assert "version" in data
        assert "uptime" in data
    
    def test_generate_strategy_success(self, client):
        """测试成功生成策略"""
        request_data = {
            "description": "Generate a simple moving average strategy",
            "user_id": "test_user",
            "models": ["qwen"],
            "market_type": "stock",
            "time_frame": "daily",
            "risk_level": "medium",
            "custom_parameters": {"period": 20},
            "ptrade_syntax": True,
            "optimization_enabled": False
        }
        
        with patch('core.generator.StrategyGenerator') as mock_generator:
            mock_instance = MagicMock()
            mock_instance.generate_strategy = AsyncMock(return_value=StrategyResponse(
                success=True,
                request_id="test-123",
                strategies=[],
                best_strategy=None,
                model_responses=[],
                execution_time=1.5,
                timestamp="2024-01-01T00:00:00Z"
            ))
            mock_generator.return_value = mock_instance
            
            response = client.post("/api/v1/strategy/generate", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "request_id" in data
            assert "execution_time" in data
    
    def test_generate_strategy_invalid_request(self, client):
        """测试无效请求"""
        invalid_request = {
            "description": "",  # 空描述
            "user_id": "test_user",
            "models": [],  # 空模型列表
            "market_type": "invalid_market",  # 无效市场类型
            "time_frame": "daily",
            "risk_level": "medium"
        }
        
        response = client.post("/api/v1/strategy/generate", json=invalid_request)
        
        assert response.status_code == 422  # Validation error
    
    def test_validate_strategy_success(self, client):
        """测试成功验证策略"""
        request_data = {
            "code": """
class TestStrategy:
    def __init__(self):
        self.name = "test"
    
    def generate_signals(self, data):
        return [1, 0, 1, 0]
""",
            "validation_level": "standard",
            "ptrade_compliance": True
        }
        
        with patch('core.validator.StrategyValidator') as mock_validator:
            mock_instance = MagicMock()
            mock_instance.validate_strategy.return_value = ValidationResult(
                status=ValidationStatus.VALID,
                is_valid=True,
                errors=[],
                warnings=[],
                suggestions=[],
                quality_score=0.85,
                execution_time=0.5
            )
            mock_validator.return_value = mock_instance
            
            response = client.post("/api/v1/strategy/validate", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["is_valid"] is True
            assert data["status"] == "valid"
            assert data["quality_score"] == 0.85
    
    def test_validate_strategy_invalid_code(self, client):
        """测试验证无效策略代码"""
        request_data = {
            "code": "invalid python code with syntax errors",
            "validation_level": "basic",
            "ptrade_compliance": False
        }
        
        with patch('core.validator.StrategyValidator') as mock_validator:
            mock_instance = MagicMock()
            mock_instance.validate_strategy.return_value = ValidationResult(
                status=ValidationStatus.INVALID,
                is_valid=False,
                errors=["Syntax error: invalid syntax"],
                warnings=[],
                suggestions=["Fix syntax errors"],
                quality_score=0.0,
                execution_time=0.2
            )
            mock_validator.return_value = mock_instance
            
            response = client.post("/api/v1/strategy/validate", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["is_valid"] is False
            assert data["status"] == "invalid"
            assert len(data["errors"]) > 0
            assert data["quality_score"] == 0.0
    
    def test_optimize_strategy_success(self, client):
        """测试成功优化策略"""
        request_data = {
            "code": """
class OptimizableStrategy:
    def __init__(self, period=20, threshold=0.02):
        self.period = period
        self.threshold = threshold
    
    def generate_signals(self, data):
        return [1, 0, 1, 0]
""",
            "optimization_method": "grid_search",
            "optimization_target": "sharpe_ratio",
            "parameter_ranges": {
                "period": {"min": 10, "max": 50, "step": 5},
                "threshold": {"min": 0.01, "max": 0.05, "step": 0.01}
            },
            "max_iterations": 100
        }
        
        with patch('core.optimizer.StrategyOptimizer') as mock_optimizer:
            mock_instance = MagicMock()
            mock_instance.optimize_strategy = AsyncMock(return_value={
                "success": True,
                "best_parameters": {"period": 25, "threshold": 0.03},
                "best_score": 1.25,
                "optimization_history": [],
                "execution_time": 5.2
            })
            mock_optimizer.return_value = mock_instance
            
            response = client.post("/api/v1/strategy/optimize", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "best_parameters" in data
            assert "best_score" in data
    
    def test_list_templates_success(self, client):
        """测试成功获取模板列表"""
        with patch('templates.manager.get_template_manager') as mock_manager:
            mock_instance = MagicMock()
            mock_instance.list_templates.return_value = [
                {
                    "id": "ma_crossover",
                    "name": "Moving Average Crossover",
                    "description": "Simple MA crossover strategy",
                    "category": "trend_following",
                    "difficulty": "beginner",
                    "market_types": ["stock", "forex"],
                    "tags": ["moving_average", "crossover"]
                },
                {
                    "id": "rsi_mean_reversion",
                    "name": "RSI Mean Reversion",
                    "description": "RSI-based mean reversion strategy",
                    "category": "mean_reversion",
                    "difficulty": "intermediate",
                    "market_types": ["stock", "crypto"],
                    "tags": ["rsi", "mean_reversion"]
                }
            ]
            mock_manager.return_value = mock_instance
            
            response = client.get("/api/v1/templates")
            
            assert response.status_code == 200
            data = response.json()
            assert "templates" in data
            assert len(data["templates"]) == 2
            assert data["templates"][0]["id"] == "ma_crossover"
    
    def test_get_template_success(self, client):
        """测试成功获取单个模板"""
        template_id = "ma_crossover"
        
        with patch('templates.manager.get_template_manager') as mock_manager:
            mock_instance = MagicMock()
            mock_instance.get_template.return_value = {
                "id": template_id,
                "name": "Moving Average Crossover",
                "description": "Simple MA crossover strategy",
                "code": "# MA crossover code",
                "parameters": {"short_period": 10, "long_period": 20},
                "category": "trend_following",
                "difficulty": "beginner",
                "market_types": ["stock", "forex"],
                "tags": ["moving_average", "crossover"]
            }
            mock_manager.return_value = mock_instance
            
            response = client.get(f"/api/v1/templates/{template_id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == template_id
            assert "code" in data
            assert "parameters" in data
    
    def test_get_template_not_found(self, client):
        """测试获取不存在的模板"""
        template_id = "nonexistent_template"
        
        with patch('templates.manager.get_template_manager') as mock_manager:
            mock_instance = MagicMock()
            mock_instance.get_template.return_value = None
            mock_manager.return_value = mock_instance
            
            response = client.get(f"/api/v1/templates/{template_id}")
            
            assert response.status_code == 404
            data = response.json()
            assert "error" in data
    
    def test_search_templates_success(self, client):
        """测试成功搜索模板"""
        query_params = {
            "query": "moving average",
            "category": "trend_following",
            "difficulty": "beginner",
            "market_type": "stock"
        }
        
        with patch('templates.manager.get_template_manager') as mock_manager:
            mock_instance = MagicMock()
            mock_instance.search_templates.return_value = [
                {
                    "id": "ma_crossover",
                    "name": "Moving Average Crossover",
                    "description": "Simple MA crossover strategy",
                    "category": "trend_following",
                    "difficulty": "beginner",
                    "market_types": ["stock"],
                    "tags": ["moving_average", "crossover"],
                    "relevance_score": 0.95
                }
            ]
            mock_manager.return_value = mock_instance
            
            response = client.get("/api/v1/templates/search", params=query_params)
            
            assert response.status_code == 200
            data = response.json()
            assert "templates" in data
            assert len(data["templates"]) == 1
            assert "relevance_score" in data["templates"][0]
    
    def test_chat_success(self, client):
        """测试成功AI聊天"""
        request_data = {
            "message": "How do I implement a RSI strategy?",
            "user_id": "test_user",
            "context": {
                "strategy_type": "mean_reversion",
                "market": "stock"
            }
        }
        
        with patch('providers.factory.get_provider_factory') as mock_factory:
            mock_factory_instance = MagicMock()
            mock_provider = MagicMock()
            mock_provider.generate_content = AsyncMock(return_value={
                "response": "To implement an RSI strategy, you need to...",
                "suggestions": ["Use 14-period RSI", "Set overbought at 70"]
            })
            mock_factory_instance.get_provider.return_value = mock_provider
            mock_factory.return_value = mock_factory_instance
            
            response = client.post("/api/v1/chat", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            assert "suggestions" in data
            assert "timestamp" in data
    
    def test_ptrade_guide_success(self, client):
        """测试成功获取PTrade语法指南"""
        response = client.get("/api/v1/ptrade/guide")
        
        assert response.status_code == 200
        data = response.json()
        assert "syntax_guide" in data
        assert "examples" in data
        assert "best_practices" in data
    
    def test_error_handling(self, client):
        """测试错误处理"""
        # 测试内部服务器错误
        with patch('core.generator.StrategyGenerator') as mock_generator:
            mock_instance = MagicMock()
            mock_instance.generate_strategy = AsyncMock(side_effect=Exception("Internal error"))
            mock_generator.return_value = mock_instance
            
            request_data = {
                "description": "Test strategy",
                "user_id": "test_user",
                "models": ["qwen"],
                "market_type": "stock",
                "time_frame": "daily",
                "risk_level": "medium"
            }
            
            response = client.post("/api/v1/strategy/generate", json=request_data)
            
            assert response.status_code == 500
            data = response.json()
            assert "error" in data
    
    def test_cors_headers(self, client):
        """测试CORS头部"""
        response = client.options("/api/v1/strategy/generate")
        
        # 检查CORS头部是否存在
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
        assert "access-control-allow-headers" in response.headers
    
    def test_request_validation(self, client):
        """测试请求验证"""
        # 测试缺少必需字段
        incomplete_request = {
            "description": "Test strategy"
            # 缺少其他必需字段
        }
        
        response = client.post("/api/v1/strategy/generate", json=incomplete_request)
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    def test_concurrent_requests(self, client):
        """测试并发请求处理"""
        import threading
        import time
        
        results = []
        
        def make_request():
            response = client.get("/health")
            results.append(response.status_code)
        
        # 创建多个并发请求
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 检查所有请求都成功
        assert len(results) == 5
        assert all(status == 200 for status in results)
    
    def test_large_request_handling(self, client):
        """测试大请求处理"""
        # 创建一个大的策略代码
        large_code = "# Large strategy code\n" + "\n".join([f"# Line {i}" for i in range(1000)])
        
        request_data = {
            "code": large_code,
            "validation_level": "basic",
            "ptrade_compliance": False
        }
        
        with patch('core.validator.StrategyValidator') as mock_validator:
            mock_instance = MagicMock()
            mock_instance.validate_strategy.return_value = ValidationResult(
                status=ValidationStatus.VALID,
                is_valid=True,
                errors=[],
                warnings=[],
                suggestions=[],
                quality_score=0.7,
                execution_time=2.0
            )
            mock_validator.return_value = mock_instance
            
            response = client.post("/api/v1/strategy/validate", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["is_valid"] is True

class TestAPIPerformance:
    """API性能测试类"""
    
    @pytest.fixture
    def client(self):
        """测试客户端"""
        return TestClient(app)
    
    def test_response_time_health_check(self, client):
        """测试健康检查响应时间"""
        import time
        
        start_time = time.time()
        response = client.get("/health")
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 1.0  # 应该在1秒内响应
    
    def test_memory_usage(self, client):
        """测试内存使用情况"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # 执行多个请求
        for _ in range(10):
            response = client.get("/health")
            assert response.status_code == 200
        
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # 内存增长应该在合理范围内（例如小于50MB）
        assert memory_increase < 50 * 1024 * 1024

if __name__ == "__main__":
    pytest.main([__file__])