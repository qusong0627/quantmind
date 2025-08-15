"""日志模块单元测试"""

import pytest
import tempfile
import os
import logging
from unittest.mock import patch, MagicMock
from pathlib import Path

from ai_strategy.utils.logger import setup_logger, _parse_file_size, get_logger, LoggerMixin, log_execution_time

class TestParseFileSize:
    """文件大小解析测试类"""
    
    def test_parse_bytes(self):
        """测试字节解析"""
        assert _parse_file_size("1024") == 1024
        assert _parse_file_size("512") == 512
    
    def test_parse_kb(self):
        """测试KB解析"""
        assert _parse_file_size("1KB") == 1024
        assert _parse_file_size("2kb") == 2048
        assert _parse_file_size("10K") == 10240
    
    def test_parse_mb(self):
        """测试MB解析"""
        assert _parse_file_size("1MB") == 1024 * 1024
        assert _parse_file_size("2mb") == 2 * 1024 * 1024
        assert _parse_file_size("5M") == 5 * 1024 * 1024
    
    def test_parse_gb(self):
        """测试GB解析"""
        assert _parse_file_size("1GB") == 1024 * 1024 * 1024
        assert _parse_file_size("2gb") == 2 * 1024 * 1024 * 1024
        assert _parse_file_size("1G") == 1024 * 1024 * 1024
    
    def test_parse_invalid_format(self):
        """测试无效格式"""
        with pytest.raises(ValueError):
            _parse_file_size("invalid")
        
        with pytest.raises(ValueError):
            _parse_file_size("1XB")
        
        with pytest.raises(ValueError):
            _parse_file_size("")

class TestSetupLogger:
    """日志设置测试类"""
    
    def test_setup_logger_console_only(self):
        """测试仅控制台日志"""
        logger = setup_logger(
            name="test_logger",
            level="INFO",
            console_output=True,
            file_output=False
        )
        
        assert logger.name == "test_logger"
        assert logger.level == logging.INFO
        
        # 检查处理器
        handlers = logger.handlers
        console_handlers = [h for h in handlers if isinstance(h, logging.StreamHandler) and not hasattr(h, 'baseFilename')]
        assert len(console_handlers) > 0
    
    def test_setup_logger_file_only(self):
        """测试仅文件日志"""
        with tempfile.TemporaryDirectory() as temp_dir:
            log_file = os.path.join(temp_dir, "test.log")
            
            logger = setup_logger(
                name="test_file_logger",
                level="DEBUG",
                console_output=False,
                file_output=True,
                log_file=log_file
            )
            
            assert logger.name == "test_file_logger"
            assert logger.level == logging.DEBUG
            
            # 检查文件处理器
            file_handlers = [h for h in logger.handlers if hasattr(h, 'baseFilename')]
            assert len(file_handlers) > 0
            assert file_handlers[0].baseFilename == log_file
    
    def test_setup_logger_both_outputs(self):
        """测试控制台和文件日志"""
        with tempfile.TemporaryDirectory() as temp_dir:
            log_file = os.path.join(temp_dir, "test_both.log")
            
            logger = setup_logger(
                name="test_both_logger",
                level="WARNING",
                console_output=True,
                file_output=True,
                log_file=log_file,
                max_file_size="1MB",
                backup_count=3
            )
            
            assert logger.name == "test_both_logger"
            assert logger.level == logging.WARNING
            
            # 检查处理器数量
            assert len(logger.handlers) >= 2
            
            # 检查控制台处理器
            console_handlers = [h for h in logger.handlers if isinstance(h, logging.StreamHandler) and not hasattr(h, 'baseFilename')]
            assert len(console_handlers) > 0
            
            # 检查文件处理器
            file_handlers = [h for h in logger.handlers if hasattr(h, 'baseFilename')]
            assert len(file_handlers) > 0
    
    def test_setup_logger_custom_format(self):
        """测试自定义日志格式"""
        custom_format = "%(name)s - %(levelname)s - %(message)s"
        
        logger = setup_logger(
            name="test_custom_format",
            level="INFO",
            console_output=True,
            file_output=False,
            log_format=custom_format
        )
        
        # 检查格式器
        for handler in logger.handlers:
            if handler.formatter:
                assert handler.formatter._fmt == custom_format
    
    def test_setup_logger_invalid_level(self):
        """测试无效日志级别"""
        # 应该使用默认级别INFO
        logger = setup_logger(
            name="test_invalid_level",
            level="INVALID_LEVEL",
            console_output=True,
            file_output=False
        )
        
        assert logger.level == logging.INFO
    
    def test_setup_logger_file_creation(self):
        """测试日志文件创建"""
        with tempfile.TemporaryDirectory() as temp_dir:
            log_file = os.path.join(temp_dir, "subdir", "test.log")
            
            logger = setup_logger(
                name="test_file_creation",
                level="INFO",
                console_output=False,
                file_output=True,
                log_file=log_file
            )
            
            # 记录一条日志
            logger.info("Test message")
            
            # 检查文件是否创建
            assert os.path.exists(log_file)
            
            # 检查目录是否创建
            assert os.path.exists(os.path.dirname(log_file))

class TestGetLogger:
    """获取日志器测试类"""
    
    def test_get_logger_default(self):
        """测试获取默认日志器"""
        logger = get_logger()
        
        assert logger is not None
        assert logger.name == "ai-strategy"
    
    def test_get_logger_custom_name(self):
        """测试获取自定义名称日志器"""
        logger = get_logger("custom_logger")
        
        assert logger is not None
        assert logger.name == "custom_logger"
    
    def test_get_logger_singleton(self):
        """测试日志器单例"""
        logger1 = get_logger("singleton_test")
        logger2 = get_logger("singleton_test")
        
        assert logger1 is logger2

class TestLoggerMixin:
    """日志器混入类测试"""
    
    def test_logger_mixin_property(self):
        """测试日志器属性"""
        class TestClass(LoggerMixin):
            pass
        
        test_obj = TestClass()
        logger = test_obj.logger
        
        assert logger is not None
        assert logger.name == "TestClass"
    
    def test_logger_mixin_usage(self):
        """测试日志器使用"""
        class TestService(LoggerMixin):
            def do_something(self):
                self.logger.info("Doing something")
                return "done"
        
        service = TestService()
        result = service.do_something()
        
        assert result == "done"
        assert service.logger.name == "TestService"

class TestLogExecutionTime:
    """执行时间日志装饰器测试类"""
    
    def test_log_execution_time_sync(self):
        """测试同步函数执行时间记录"""
        @log_execution_time
        def test_function(x, y):
            return x + y
        
        result = test_function(1, 2)
        assert result == 3
    
    def test_log_execution_time_with_exception(self):
        """测试异常情况下的执行时间记录"""
        @log_execution_time
        def failing_function():
            raise ValueError("Test error")
        
        with pytest.raises(ValueError, match="Test error"):
            failing_function()
    
    def test_log_execution_time_custom_logger(self):
        """测试自定义日志器"""
        custom_logger = get_logger("custom_execution_logger")
        
        @log_execution_time(logger=custom_logger)
        def test_function_custom():
            return "custom result"
        
        result = test_function_custom()
        assert result == "custom result"
    
    def test_log_execution_time_custom_level(self):
        """测试自定义日志级别"""
        @log_execution_time(level="DEBUG")
        def test_function_debug():
            return "debug result"
        
        result = test_function_debug()
        assert result == "debug result"
    
    @pytest.mark.asyncio
    async def test_log_execution_time_async(self):
        """测试异步函数执行时间记录"""
        @log_execution_time
        async def async_test_function(x):
            return x * 2
        
        result = await async_test_function(5)
        assert result == 10
    
    @pytest.mark.asyncio
    async def test_log_execution_time_async_exception(self):
        """测试异步函数异常情况"""
        @log_execution_time
        async def async_failing_function():
            raise RuntimeError("Async test error")
        
        with pytest.raises(RuntimeError, match="Async test error"):
            await async_failing_function()

class TestLoggerIntegration:
    """日志器集成测试类"""
    
    def test_logger_hierarchy(self):
        """测试日志器层次结构"""
        parent_logger = get_logger("parent")
        child_logger = get_logger("parent.child")
        
        assert child_logger.parent == parent_logger
    
    def test_logger_level_inheritance(self):
        """测试日志级别继承"""
        parent_logger = setup_logger(
            name="level_parent",
            level="WARNING",
            console_output=True,
            file_output=False
        )
        
        child_logger = get_logger("level_parent.child")
        
        # 子日志器应该继承父日志器的级别
        assert child_logger.getEffectiveLevel() == logging.WARNING
    
    def test_multiple_loggers_isolation(self):
        """测试多个日志器的隔离性"""
        logger1 = setup_logger(
            name="isolated1",
            level="DEBUG",
            console_output=True,
            file_output=False
        )
        
        logger2 = setup_logger(
            name="isolated2",
            level="ERROR",
            console_output=True,
            file_output=False
        )
        
        assert logger1.level == logging.DEBUG
        assert logger2.level == logging.ERROR
        assert logger1 is not logger2

if __name__ == "__main__":
    pytest.main([__file__])