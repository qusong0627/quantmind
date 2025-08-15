"""策略模板管理器单元测试"""

import pytest
import tempfile
import os
import json
from unittest.mock import patch, mock_open

from ai_strategy.templates.manager import TemplateManager, StrategyTemplate


class TestStrategyTemplate:
    """StrategyTemplate 测试类"""
    
    def test_strategy_template_creation(self):
        """测试策略模板创建"""
        template = StrategyTemplate(
            id="test_template",
            name="测试模板",
            description="这是一个测试模板",
            category="trend",
            difficulty_level="beginner",
            market_types=["stock"],
            code_template="class TestStrategy: pass",
            parameters={"period": 20},
            tags=["test", "demo"]
        )
        
        assert template.id == "test_template"
        assert template.name == "测试模板"
        assert template.category == "trend"
        assert template.difficulty_level == "beginner"
        assert "test" in template.tags
    
    def test_strategy_template_to_dict(self):
        """测试策略模板转换为字典"""
        template = StrategyTemplate(
            id="test_template",
            name="测试模板",
            description="这是一个测试模板",
            category="trend",
            difficulty="beginner",
            market_types=["stock"],
            code_template="class TestStrategy: pass",
            parameters={"period": 20},
            tags=["test", "demo"]
        )
        
        template_dict = template.to_dict()
        
        assert template_dict["id"] == "test_template"
        assert template_dict["name"] == "测试模板"
        assert template_dict["parameters"]["period"] == 20
        assert "test" in template_dict["tags"]
    
    def test_strategy_template_from_dict(self):
        """测试从字典创建策略模板"""
        template_data = {
            "id": "test_template",
            "name": "测试模板",
            "description": "这是一个测试模板",
            "category": "trend",
            "difficulty": "beginner",
            "market_type": "stock",
            "code": "class TestStrategy: pass",
            "parameters": {"period": 20},
            "tags": ["test", "demo"]
        }
        
        template = StrategyTemplate.from_dict(template_data)
        
        assert template.id == "test_template"
        assert template.name == "测试模板"
        assert template.parameters["period"] == 20
        assert "test" in template.tags
        assert template.difficulty_level == "beginner"
        assert "stock" in template.market_types


class TestTemplateManager:
    """TemplateManager 测试类"""
    
    def setup_method(self):
        """测试前设置"""
        self.manager = TemplateManager()
        
        # 创建测试模板
        self.test_template = StrategyTemplate(
            id="test_template",
            name="测试模板",
            description="这是一个测试模板",
            category="trend",
            difficulty="beginner",
            market_types=["stock"],
            code_template="class TestStrategy: pass",
            parameters={"period": 20},
            tags=["test", "demo"],
            author="user"
        )
    
    def test_template_manager_initialization(self):
        """测试模板管理器初始化"""
        manager = TemplateManager()
        assert len(manager.templates) >= 2  # 至少有两个内置模板
        
        # 检查内置模板
        template_ids = [t.id for t in manager.templates.values()]
        assert "dual_ma_crossover" in template_ids
        assert "rsi_mean_reversion" in template_ids
    
    def test_get_template_existing(self):
        """测试获取存在的模板"""
        # 添加测试模板
        self.manager.templates[self.test_template.id] = self.test_template
        
        template = self.manager.get_template("test_template")
        assert template is not None
        assert template.id == "test_template"
        assert template.name == "测试模板"
    
    def test_get_template_nonexistent(self):
        """测试获取不存在的模板"""
        template = self.manager.get_template("nonexistent_template")
        assert template is None
    
    def test_list_templates_all(self):
        """测试列出所有模板"""
        # 添加测试模板
        self.manager.templates[self.test_template.id] = self.test_template
        
        templates = self.manager.list_templates()
        assert len(templates) >= 3  # 至少包含2个内置模板 + 1个测试模板
        
        template_ids = [t.id for t in templates]
        assert "test_template" in template_ids
    
    def test_list_templates_by_category(self):
        """测试按分类列出模板"""
        # 修改测试模板的分类为 trend_following 以匹配内置模板
        self.test_template.category = "trend_following"
        self.manager.templates[self.test_template.id] = self.test_template
        
        trend_templates = self.manager.list_templates(category="trend_following")
        assert len(trend_templates) >= 2  # 至少包含内置的双均线模板和测试模板
        
        for template in trend_templates:
            assert template.category == "trend_following"
    
    def test_list_templates_by_difficulty(self):
        """测试按难度列出模板"""
        beginner_templates = self.manager.list_templates(difficulty="beginner")
        assert len(beginner_templates) >= 1
        
        for template in beginner_templates:
            assert template.difficulty == "beginner"
    
    def test_list_templates_by_market_type(self):
        """测试按市场类型列出模板"""
        stock_templates = self.manager.list_templates(market_type="stock")
        assert len(stock_templates) >= 2  # 内置模板都是股票类型
        
        for template in stock_templates:
            assert template.market_type == "stock"
    
    def test_list_templates_by_tags(self):
        """测试按标签列出模板"""
        # 添加测试模板
        self.manager.templates[self.test_template.id] = self.test_template
        
        test_templates = self.manager.list_templates(tags=["test"])
        assert len(test_templates) >= 1
        
        for template in test_templates:
            assert "test" in template.tags
    
    def test_search_templates_by_name(self):
        """测试按名称搜索模板"""
        results = self.manager.search_templates("双均线")
        assert len(results) >= 1
        
        for template in results:
            assert "双均线" in template.name or "双均线" in template.description
    
    def test_search_templates_by_description(self):
        """测试按描述搜索模板"""
        results = self.manager.search_templates("交叉")
        assert len(results) >= 1
        
        for template in results:
            assert "交叉" in template.name or "交叉" in template.description
    
    def test_search_templates_case_insensitive(self):
        """测试搜索不区分大小写"""
        results1 = self.manager.search_templates("RSI")
        results2 = self.manager.search_templates("rsi")
        
        assert len(results1) == len(results2)
        assert len(results1) >= 1
    
    def test_create_template(self):
        """测试创建模板"""
        template_data = {
            "name": "新测试模板",
            "description": "这是一个新的测试模板",
            "category": "momentum",
            "difficulty": "intermediate",
            "market_type": "crypto",
            "code": "class NewTestStrategy: pass",
            "parameters": {"threshold": 0.5},
            "tags": ["new", "test"]
        }
        
        template = self.manager.create_template(template_data)
        
        assert template is not None
        assert template.name == "新测试模板"
        assert template.category == "momentum"
        assert template.id in self.manager.templates
    
    def test_create_template_missing_required_fields(self):
        """测试创建缺少必需字段的模板"""
        incomplete_data = {
            "name": "不完整模板"
            # 缺少其他必需字段
        }
        
        with pytest.raises(ValueError, match="Missing required fields"):
            self.manager.create_template(incomplete_data)
    
    def test_update_template_existing(self):
        """测试更新存在的模板"""
        # 添加测试模板
        self.manager.templates[self.test_template.id] = self.test_template
        
        update_data = {
            "name": "更新后的测试模板",
            "description": "这是更新后的描述"
        }
        
        updated_template = self.manager.update_template("test_template", update_data)
        
        assert updated_template is not None
        assert updated_template.name == "更新后的测试模板"
        assert updated_template.description == "这是更新后的描述"
        assert updated_template.category == "trend"  # 其他字段保持不变
    
    def test_update_template_nonexistent(self):
        """测试更新不存在的模板"""
        update_data = {"name": "新名称"}
        
        updated_template = self.manager.update_template("nonexistent_template", update_data)
        assert updated_template is None
    
    def test_delete_template_existing(self):
        """测试删除存在的模板"""
        # 添加测试模板
        self.manager.templates[self.test_template.id] = self.test_template
        
        result = self.manager.delete_template("test_template")
        assert result is True
        assert "test_template" not in self.manager.templates
    
    def test_delete_template_nonexistent(self):
        """测试删除不存在的模板"""
        result = self.manager.delete_template("nonexistent_template")
        assert result is False
    
    def test_delete_builtin_template(self):
        """测试删除内置模板（应该失败）"""
        result = self.manager.delete_template("dual_ma_crossover")
        assert result is False
        assert "dual_ma_crossover" in self.manager.templates
    
    def test_get_popular_templates(self):
        """测试获取热门模板"""
        popular_templates = self.manager.get_popular_templates(limit=5)
        assert len(popular_templates) <= 5
        assert len(popular_templates) >= 2  # 至少有两个内置模板
    
    def test_get_categories(self):
        """测试获取所有分类"""
        categories = self.manager.get_categories()
        assert "trend" in categories
        assert "mean_reversion" in categories
        assert len(categories) >= 2
    
    def test_get_category_stats(self):
        """测试获取分类统计"""
        stats = self.manager.get_category_stats()
        assert "trend" in stats
        assert "mean_reversion" in stats
        assert stats["trend"] >= 1  # 至少有一个趋势模板
        assert stats["mean_reversion"] >= 1  # 至少有一个均值回归模板
    
    @patch("builtins.open", new_callable=mock_open)
    @patch("json.load")
    def test_load_custom_templates_success(self, mock_json_load, mock_file):
        """测试成功加载自定义模板"""
        custom_templates_data = [
            {
                "id": "custom_template_1",
                "name": "自定义模板1",
                "description": "这是自定义模板1",
                "category": "custom",
                "difficulty": "advanced",
                "market_types": ["forex"],
                "code_template": "class CustomStrategy1: pass",
                "parameters": {},
                "tags": ["custom"]
            }
        ]
        
        mock_json_load.return_value = custom_templates_data
        
        manager = TemplateManager()
        manager._load_custom_templates("custom_templates.json")
        
        assert "custom_template_1" in manager.templates
        custom_template = manager.templates["custom_template_1"]
        assert custom_template.name == "自定义模板1"
        assert custom_template.category == "custom"
    
    @patch("builtins.open", side_effect=FileNotFoundError)
    def test_load_custom_templates_file_not_found(self, mock_file):
        """测试自定义模板文件不存在"""
        manager = TemplateManager()
        # 应该不抛出异常，只是没有加载自定义模板
        manager._load_custom_templates("nonexistent.json")
        
        # 只有内置模板
        builtin_count = len([t for t in manager.templates.values() if t.id.startswith(("dual_ma", "rsi_"))])
        assert len(manager.templates) == builtin_count
    
    @patch("builtins.open", new_callable=mock_open)
    @patch("json.load", side_effect=json.JSONDecodeError("Invalid JSON", "", 0))
    def test_load_custom_templates_invalid_json(self, mock_json_load, mock_file):
        """测试无效的JSON文件"""
        manager = TemplateManager()
        # 应该不抛出异常，只是没有加载自定义模板
        manager._load_custom_templates("invalid.json")
        
        # 只有内置模板
        builtin_count = len([t for t in manager.templates.values() if t.id.startswith(("dual_ma", "rsi_"))])
        assert len(manager.templates) == builtin_count
    
    def test_builtin_templates_content(self):
        """测试内置模板内容"""
        manager = TemplateManager()
        
        # 测试双均线交叉策略模板
        dual_ma_template = manager.get_template("dual_ma_crossover")
        assert dual_ma_template is not None
        assert "双均线交叉策略" in dual_ma_template.name
        assert "class DualMovingAverageCrossoverStrategy" in dual_ma_template.code
        assert "short_period" in dual_ma_template.parameters
        assert "long_period" in dual_ma_template.parameters
        
        # 测试RSI均值回归策略模板
        rsi_template = manager.get_template("rsi_mean_reversion")
        assert rsi_template is not None
        assert "RSI均值回归策略" in rsi_template.name
        assert "class RSIMeanReversionStrategy" in rsi_template.code
        assert "rsi_period" in rsi_template.parameters
        assert "oversold_threshold" in rsi_template.parameters
        assert "overbought_threshold" in rsi_template.parameters
    
    def test_template_filtering_combinations(self):
        """测试模板过滤条件组合"""
        # 添加测试模板
        self.manager.templates[self.test_template.id] = self.test_template
        
        # 组合过滤：分类 + 难度
        templates = self.manager.list_templates(category="trend", difficulty="beginner")
        for template in templates:
            assert template.category == "trend"
            assert template.difficulty == "beginner"
        
        # 组合过滤：市场类型 + 标签
        templates = self.manager.list_templates(market_type="stock", tags=["test"])
        for template in templates:
            assert template.market_type == "stock"
            assert "test" in template.tags


if __name__ == "__main__":
    pytest.main([__file__])