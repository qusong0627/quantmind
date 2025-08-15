"""负载和性能测试"""

import pytest
import asyncio
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
import psutil
import os

from main import app
from models.responses import StrategyResponse, ValidationResult, ValidationStatus

class TestLoadPerformance:
    """负载性能测试类"""
    
    @pytest.fixture
    def client(self):
        """测试客户端"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_fast_provider(self):
        """快速响应的模拟提供商"""
        mock_provider = MagicMock()
        mock_provider.generate_content = AsyncMock(return_value={
            "code": "# Fast strategy\nclass FastStrategy:\n    pass",
            "description": "Fast generated strategy",
            "parameters": {"param1": 10}
        })
        mock_provider.verify_connection = AsyncMock(return_value=True)
        return mock_provider
    
    @pytest.fixture
    def mock_slow_provider(self):
        """慢响应的模拟提供商"""
        async def slow_generate_content(*args, **kwargs):
            await asyncio.sleep(2)  # 模拟2秒延迟
            return {
                "code": "# Slow strategy\nclass SlowStrategy:\n    pass",
                "description": "Slow generated strategy",
                "parameters": {"param1": 20}
            }
        
        mock_provider = MagicMock()
        mock_provider.generate_content = slow_generate_content
        mock_provider.verify_connection = AsyncMock(return_value=True)
        return mock_provider
    
    def test_health_check_load(self, client):
        """测试健康检查端点的负载能力"""
        num_requests = 100
        max_workers = 10
        response_times = []
        
        def make_request():
            start_time = time.time()
            response = client.get("/health")
            end_time = time.time()
            return response.status_code, end_time - start_time
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]
            
            for future in as_completed(futures):
                status_code, response_time = future.result()
                assert status_code == 200
                response_times.append(response_time)
        
        # 分析响应时间
        avg_response_time = statistics.mean(response_times)
        max_response_time = max(response_times)
        p95_response_time = statistics.quantiles(response_times, n=20)[18]  # 95th percentile
        
        print(f"\n健康检查负载测试结果:")
        print(f"请求数量: {num_requests}")
        print(f"平均响应时间: {avg_response_time:.3f}s")
        print(f"最大响应时间: {max_response_time:.3f}s")
        print(f"95%响应时间: {p95_response_time:.3f}s")
        
        # 性能断言
        assert avg_response_time < 0.1  # 平均响应时间应小于100ms
        assert max_response_time < 1.0  # 最大响应时间应小于1s
        assert p95_response_time < 0.2  # 95%响应时间应小于200ms
    
    def test_strategy_generation_concurrent(self, client):
        """测试策略生成的并发处理能力"""
        num_requests = 20
        max_workers = 5
        
        request_data = {
            "description": "Generate a test strategy",
            "user_id": "load_test_user",
            "models": ["qwen"],
            "market_type": "stock",
            "time_frame": "daily",
            "risk_level": "medium"
        }
        
        response_times = []
        success_count = 0
        
        def make_strategy_request():
            with patch('core.generator.StrategyGenerator') as mock_generator:
                mock_instance = MagicMock()
                mock_instance.generate_strategy = AsyncMock(return_value=StrategyResponse(
                    success=True,
                    request_id=f"load-test-{time.time()}",
                    strategies=[],
                    best_strategy=None,
                    model_responses=[],
                    execution_time=0.5,
                    timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ")
                ))
                mock_generator.return_value = mock_instance
                
                start_time = time.time()
                response = client.post("/api/v1/strategy/generate", json=request_data)
                end_time = time.time()
                
                return response.status_code, end_time - start_time
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(make_strategy_request) for _ in range(num_requests)]
            
            for future in as_completed(futures):
                status_code, response_time = future.result()
                response_times.append(response_time)
                if status_code == 200:
                    success_count += 1
        
        # 分析结果
        success_rate = success_count / num_requests
        avg_response_time = statistics.mean(response_times)
        
        print(f"\n策略生成并发测试结果:")
        print(f"请求数量: {num_requests}")
        print(f"成功率: {success_rate:.2%}")
        print(f"平均响应时间: {avg_response_time:.3f}s")
        
        # 性能断言
        assert success_rate >= 0.95  # 成功率应大于95%
        assert avg_response_time < 5.0  # 平均响应时间应小于5s
    
    def test_validation_load(self, client):
        """测试策略验证的负载能力"""
        num_requests = 50
        max_workers = 8
        
        test_code = """
class LoadTestStrategy:
    def __init__(self, period=20):
        self.period = period
    
    def generate_signals(self, data):
        signals = []
        for i in range(len(data)):
            if i % 2 == 0:
                signals.append(1)
            else:
                signals.append(0)
        return signals
"""
        
        request_data = {
            "code": test_code,
            "validation_level": "standard",
            "ptrade_compliance": False
        }
        
        response_times = []
        success_count = 0
        
        def make_validation_request():
            with patch('core.validator.StrategyValidator') as mock_validator:
                mock_instance = MagicMock()
                mock_instance.validate_strategy.return_value = ValidationResult(
                    status=ValidationStatus.VALID,
                    is_valid=True,
                    errors=[],
                    warnings=[],
                    suggestions=[],
                    quality_score=0.8,
                    execution_time=0.1
                )
                mock_validator.return_value = mock_instance
                
                start_time = time.time()
                response = client.post("/api/v1/strategy/validate", json=request_data)
                end_time = time.time()
                
                return response.status_code, end_time - start_time
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(make_validation_request) for _ in range(num_requests)]
            
            for future in as_completed(futures):
                status_code, response_time = future.result()
                response_times.append(response_time)
                if status_code == 200:
                    success_count += 1
        
        # 分析结果
        success_rate = success_count / num_requests
        avg_response_time = statistics.mean(response_times)
        throughput = num_requests / sum(response_times)  # 请求/秒
        
        print(f"\n策略验证负载测试结果:")
        print(f"请求数量: {num_requests}")
        print(f"成功率: {success_rate:.2%}")
        print(f"平均响应时间: {avg_response_time:.3f}s")
        print(f"吞吐量: {throughput:.2f} 请求/秒")
        
        # 性能断言
        assert success_rate >= 0.98  # 成功率应大于98%
        assert avg_response_time < 2.0  # 平均响应时间应小于2s
        assert throughput > 10  # 吞吐量应大于10请求/秒
    
    def test_memory_usage_under_load(self, client):
        """测试负载下的内存使用情况"""
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        num_requests = 30
        memory_samples = []
        
        def make_request_and_sample_memory():
            # 执行请求
            response = client.get("/health")
            
            # 采样内存使用
            current_memory = process.memory_info().rss / 1024 / 1024  # MB
            memory_samples.append(current_memory)
            
            return response.status_code
        
        # 执行负载测试
        for i in range(num_requests):
            status_code = make_request_and_sample_memory()
            assert status_code == 200
            
            if i % 10 == 0:
                time.sleep(0.1)  # 短暂休息
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        max_memory = max(memory_samples)
        memory_increase = final_memory - initial_memory
        
        print(f"\n内存使用测试结果:")
        print(f"初始内存: {initial_memory:.2f} MB")
        print(f"最终内存: {final_memory:.2f} MB")
        print(f"最大内存: {max_memory:.2f} MB")
        print(f"内存增长: {memory_increase:.2f} MB")
        
        # 内存断言
        assert memory_increase < 100  # 内存增长应小于100MB
        assert max_memory < initial_memory + 150  # 最大内存不应超过初始+150MB
    
    def test_cpu_usage_under_load(self, client):
        """测试负载下的CPU使用情况"""
        process = psutil.Process(os.getpid())
        cpu_samples = []
        
        def monitor_cpu():
            for _ in range(10):
                cpu_percent = process.cpu_percent(interval=0.1)
                cpu_samples.append(cpu_percent)
        
        def generate_load():
            for _ in range(20):
                response = client.get("/health")
                assert response.status_code == 200
        
        # 并行执行CPU监控和负载生成
        with ThreadPoolExecutor(max_workers=2) as executor:
            cpu_future = executor.submit(monitor_cpu)
            load_future = executor.submit(generate_load)
            
            # 等待完成
            cpu_future.result()
            load_future.result()
        
        avg_cpu = statistics.mean(cpu_samples) if cpu_samples else 0
        max_cpu = max(cpu_samples) if cpu_samples else 0
        
        print(f"\nCPU使用测试结果:")
        print(f"平均CPU使用率: {avg_cpu:.2f}%")
        print(f"最大CPU使用率: {max_cpu:.2f}%")
        
        # CPU断言（这些值可能需要根据实际环境调整）
        assert avg_cpu < 80  # 平均CPU使用率应小于80%
        assert max_cpu < 95  # 最大CPU使用率应小于95%
    
    def test_response_time_distribution(self, client):
        """测试响应时间分布"""
        num_requests = 100
        response_times = []
        
        for _ in range(num_requests):
            start_time = time.time()
            response = client.get("/health")
            end_time = time.time()
            
            assert response.status_code == 200
            response_times.append((end_time - start_time) * 1000)  # 转换为毫秒
        
        # 计算统计数据
        avg_time = statistics.mean(response_times)
        median_time = statistics.median(response_times)
        std_dev = statistics.stdev(response_times)
        min_time = min(response_times)
        max_time = max(response_times)
        
        # 计算百分位数
        sorted_times = sorted(response_times)
        p50 = sorted_times[int(0.50 * len(sorted_times))]
        p90 = sorted_times[int(0.90 * len(sorted_times))]
        p95 = sorted_times[int(0.95 * len(sorted_times))]
        p99 = sorted_times[int(0.99 * len(sorted_times))]
        
        print(f"\n响应时间分布测试结果:")
        print(f"请求数量: {num_requests}")
        print(f"平均时间: {avg_time:.2f} ms")
        print(f"中位数时间: {median_time:.2f} ms")
        print(f"标准差: {std_dev:.2f} ms")
        print(f"最小时间: {min_time:.2f} ms")
        print(f"最大时间: {max_time:.2f} ms")
        print(f"P50: {p50:.2f} ms")
        print(f"P90: {p90:.2f} ms")
        print(f"P95: {p95:.2f} ms")
        print(f"P99: {p99:.2f} ms")
        
        # 性能断言
        assert avg_time < 100  # 平均响应时间应小于100ms
        assert p95 < 200  # 95%的请求应在200ms内完成
        assert p99 < 500  # 99%的请求应在500ms内完成
        assert std_dev < 50  # 标准差应小于50ms（响应时间稳定）
    
    def test_error_rate_under_load(self, client):
        """测试负载下的错误率"""
        num_requests = 100
        max_workers = 10
        
        success_count = 0
        error_count = 0
        timeout_count = 0
        
        def make_request():
            try:
                response = client.get("/health", timeout=5.0)
                return response.status_code
            except Exception as e:
                return "timeout" if "timeout" in str(e).lower() else "error"
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]
            
            for future in as_completed(futures):
                result = future.result()
                if result == 200:
                    success_count += 1
                elif result == "timeout":
                    timeout_count += 1
                else:
                    error_count += 1
        
        success_rate = success_count / num_requests
        error_rate = error_count / num_requests
        timeout_rate = timeout_count / num_requests
        
        print(f"\n错误率测试结果:")
        print(f"总请求数: {num_requests}")
        print(f"成功数: {success_count}")
        print(f"错误数: {error_count}")
        print(f"超时数: {timeout_count}")
        print(f"成功率: {success_rate:.2%}")
        print(f"错误率: {error_rate:.2%}")
        print(f"超时率: {timeout_rate:.2%}")
        
        # 错误率断言
        assert success_rate >= 0.99  # 成功率应大于99%
        assert error_rate <= 0.01  # 错误率应小于1%
        assert timeout_rate <= 0.005  # 超时率应小于0.5%
    
    def test_sustained_load(self, client):
        """测试持续负载能力"""
        duration_seconds = 30  # 持续30秒
        requests_per_second = 5
        
        start_time = time.time()
        end_time = start_time + duration_seconds
        
        total_requests = 0
        successful_requests = 0
        response_times = []
        
        while time.time() < end_time:
            batch_start = time.time()
            
            # 在1秒内发送指定数量的请求
            for _ in range(requests_per_second):
                request_start = time.time()
                response = client.get("/health")
                request_end = time.time()
                
                total_requests += 1
                response_times.append(request_end - request_start)
                
                if response.status_code == 200:
                    successful_requests += 1
            
            # 确保每秒的间隔
            batch_duration = time.time() - batch_start
            if batch_duration < 1.0:
                time.sleep(1.0 - batch_duration)
        
        actual_duration = time.time() - start_time
        actual_rps = total_requests / actual_duration
        success_rate = successful_requests / total_requests if total_requests > 0 else 0
        avg_response_time = statistics.mean(response_times) if response_times else 0
        
        print(f"\n持续负载测试结果:")
        print(f"测试持续时间: {actual_duration:.2f}s")
        print(f"总请求数: {total_requests}")
        print(f"成功请求数: {successful_requests}")
        print(f"实际RPS: {actual_rps:.2f}")
        print(f"成功率: {success_rate:.2%}")
        print(f"平均响应时间: {avg_response_time:.3f}s")
        
        # 持续负载断言
        assert success_rate >= 0.98  # 成功率应大于98%
        assert avg_response_time < 0.5  # 平均响应时间应小于500ms
        assert actual_rps >= requests_per_second * 0.9  # 实际RPS应接近目标值

class TestStressTest:
    """压力测试类"""
    
    @pytest.fixture
    def client(self):
        """测试客户端"""
        return TestClient(app)
    
    @pytest.mark.slow
    def test_extreme_concurrent_requests(self, client):
        """测试极端并发请求"""
        num_requests = 200
        max_workers = 20
        
        response_times = []
        status_codes = []
        
        def make_request():
            start_time = time.time()
            try:
                response = client.get("/health", timeout=10.0)
                end_time = time.time()
                return response.status_code, end_time - start_time
            except Exception as e:
                end_time = time.time()
                return 500, end_time - start_time  # 将异常视为500错误
        
        print(f"\n开始极端并发测试: {num_requests} 请求, {max_workers} 并发")
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]
            
            for future in as_completed(futures):
                status_code, response_time = future.result()
                status_codes.append(status_code)
                response_times.append(response_time)
        
        # 分析结果
        success_count = sum(1 for code in status_codes if code == 200)
        success_rate = success_count / num_requests
        avg_response_time = statistics.mean(response_times)
        max_response_time = max(response_times)
        
        print(f"极端并发测试结果:")
        print(f"成功率: {success_rate:.2%}")
        print(f"平均响应时间: {avg_response_time:.3f}s")
        print(f"最大响应时间: {max_response_time:.3f}s")
        
        # 在极端负载下，我们允许更宽松的标准
        assert success_rate >= 0.90  # 成功率应大于90%
        assert avg_response_time < 2.0  # 平均响应时间应小于2s
        assert max_response_time < 10.0  # 最大响应时间应小于10s

if __name__ == "__main__":
    # 运行性能测试时添加标记
    pytest.main([__file__, "-v", "-s", "--tb=short"])