"""策略验证器模块"""

import ast
import re
import sys
import traceback
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from models.requests import StrategyValidationRequest
from models.responses import ValidationResult, ValidationStatus
from utils.logger import LoggerMixin
from utils.config import get_config

class ValidationLevel(str, Enum):
    """验证级别"""
    BASIC = "basic"          # 基础语法检查
    STANDARD = "standard"    # 标准检查（语法+结构）
    STRICT = "strict"        # 严格检查（语法+结构+安全）
    COMPREHENSIVE = "comprehensive"  # 全面检查（所有检查项）

@dataclass
class ValidationRule:
    """验证规则"""
    name: str
    description: str
    level: ValidationLevel
    enabled: bool = True
    severity: str = "error"  # error, warning, info

class StrategyValidator(LoggerMixin):
    """策略验证器
    
    负责验证生成的策略代码的正确性、安全性和完整性
    """
    
    def __init__(self):
        """初始化验证器"""
        self.config = get_config()
        self._init_validation_rules()
        self.logger.info("策略验证器初始化完成")
    
    def _init_validation_rules(self):
        """初始化验证规则"""
        self.rules = {
            # 基础语法规则
            "syntax_check": ValidationRule(
                name="语法检查",
                description="检查Python语法是否正确",
                level=ValidationLevel.BASIC,
                severity="error"
            ),
            "import_check": ValidationRule(
                name="导入检查",
                description="检查导入语句是否合法",
                level=ValidationLevel.BASIC,
                severity="warning"
            ),
            
            # 结构检查规则
            "class_structure": ValidationRule(
                name="类结构检查",
                description="检查策略类结构是否完整",
                level=ValidationLevel.STANDARD,
                severity="error"
            ),
            "method_signature": ValidationRule(
                name="方法签名检查",
                description="检查必需方法是否存在且签名正确",
                level=ValidationLevel.STANDARD,
                severity="error"
            ),
            "return_type": ValidationRule(
                name="返回类型检查",
                description="检查方法返回类型是否正确",
                level=ValidationLevel.STANDARD,
                severity="warning"
            ),
            
            # 安全检查规则
            "dangerous_imports": ValidationRule(
                name="危险导入检查",
                description="检查是否使用了危险的模块",
                level=ValidationLevel.STRICT,
                severity="error"
            ),
            "file_operations": ValidationRule(
                name="文件操作检查",
                description="检查是否包含文件操作",
                level=ValidationLevel.STRICT,
                severity="warning"
            ),
            "network_operations": ValidationRule(
                name="网络操作检查",
                description="检查是否包含网络操作",
                level=ValidationLevel.STRICT,
                severity="warning"
            ),
            
            # 全面检查规则
            "code_quality": ValidationRule(
                name="代码质量检查",
                description="检查代码质量和最佳实践",
                level=ValidationLevel.COMPREHENSIVE,
                severity="info"
            ),
            "performance_check": ValidationRule(
                name="性能检查",
                description="检查潜在的性能问题",
                level=ValidationLevel.COMPREHENSIVE,
                severity="warning"
            ),
            "ptrade_compliance": ValidationRule(
                name="PTrade合规检查",
                description="检查是否符合PTrade框架规范",
                level=ValidationLevel.COMPREHENSIVE,
                severity="warning"
            )
        }
    
    async def validate_strategy(self, request: StrategyValidationRequest) -> ValidationResult:
        """验证策略代码
        
        Args:
            request: 验证请求
        
        Returns:
            验证结果
        """
        try:
            self.logger.info(f"开始验证策略代码，验证级别: {request.validation_level}")
            
            # 执行验证
            issues = await self._perform_validation(request.code, request.validation_level)
            
            # 确定验证状态
            status = self._determine_status(issues)
            
            # 生成建议
            suggestions = self._generate_suggestions(issues)
            
            # 计算质量评分
            quality_score = self._calculate_quality_score(request.code, issues)
            
            result = ValidationResult(
                status=status,
                issues=issues,
                suggestions=suggestions,
                quality_score=quality_score,
                validation_level=request.validation_level,
                metadata={
                    "code_length": len(request.code),
                    "line_count": len(request.code.split('\n')),
                    "validation_time": 0.0  # 实际实现中应该计算
                }
            )
            
            self.logger.info(f"策略验证完成，状态: {status}, 质量评分: {quality_score:.2f}")
            return result
            
        except Exception as e:
            self.logger.error(f"策略验证失败: {e}")
            return ValidationResult(
                status=ValidationStatus.ERROR,
                issues=[{
                    "type": "system_error",
                    "severity": "error",
                    "message": f"验证过程出错: {str(e)}",
                    "line": 0,
                    "column": 0
                }],
                suggestions=["请检查代码格式或联系技术支持"],
                quality_score=0.0,
                validation_level=request.validation_level,
                metadata={}
            )
    
    async def _perform_validation(self, code: str, level: ValidationLevel) -> List[Dict[str, Any]]:
        """执行验证
        
        Args:
            code: 策略代码
            level: 验证级别
        
        Returns:
            问题列表
        """
        issues = []
        
        # 根据验证级别执行相应的检查
        for rule_name, rule in self.rules.items():
            if not rule.enabled:
                continue
            
            # 检查规则是否适用于当前验证级别
            if self._should_apply_rule(rule.level, level):
                rule_issues = await self._apply_rule(rule_name, code)
                issues.extend(rule_issues)
        
        return issues
    
    def _should_apply_rule(self, rule_level: ValidationLevel, validation_level: ValidationLevel) -> bool:
        """判断是否应该应用规则
        
        Args:
            rule_level: 规则级别
            validation_level: 验证级别
        
        Returns:
            是否应用规则
        """
        level_order = {
            ValidationLevel.BASIC: 1,
            ValidationLevel.STANDARD: 2,
            ValidationLevel.STRICT: 3,
            ValidationLevel.COMPREHENSIVE: 4
        }
        
        return level_order[rule_level] <= level_order[validation_level]
    
    async def _apply_rule(self, rule_name: str, code: str) -> List[Dict[str, Any]]:
        """应用验证规则
        
        Args:
            rule_name: 规则名称
            code: 代码
        
        Returns:
            问题列表
        """
        method_name = f"_check_{rule_name}"
        if hasattr(self, method_name):
            check_method = getattr(self, method_name)
            return await check_method(code)
        else:
            self.logger.warning(f"未找到验证方法: {method_name}")
            return []
    
    async def _check_syntax_check(self, code: str) -> List[Dict[str, Any]]:
        """检查语法"""
        issues = []
        
        try:
            ast.parse(code)
        except SyntaxError as e:
            issues.append({
                "type": "syntax_error",
                "severity": "error",
                "message": f"语法错误: {e.msg}",
                "line": e.lineno or 0,
                "column": e.offset or 0,
                "rule": "syntax_check"
            })
        except Exception as e:
            issues.append({
                "type": "parse_error",
                "severity": "error",
                "message": f"代码解析错误: {str(e)}",
                "line": 0,
                "column": 0,
                "rule": "syntax_check"
            })
        
        return issues
    
    async def _check_syntax(self, code: str) -> List[Dict[str, Any]]:
        """检查语法（别名方法）"""
        return await self._check_syntax_check(code)
    
    async def _check_import_check(self, code: str) -> List[Dict[str, Any]]:
        """检查导入语句"""
        issues = []
        lines = code.split('\n')
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if line.startswith('import ') or line.startswith('from '):
                # 检查导入格式
                if not self._is_valid_import(line):
                    issues.append({
                        "type": "invalid_import",
                        "severity": "warning",
                        "message": f"可能的无效导入: {line}",
                        "line": i,
                        "column": 0,
                        "rule": "import_check"
                    })
        
        return issues
    
    async def _check_imports(self, code: str) -> List[Dict[str, Any]]:
        """检查导入语句（别名方法）"""
        return await self._check_import_check(code)
    
    async def _check_class_structure(self, code: str) -> List[Dict[str, Any]]:
        """检查类结构"""
        issues = []
        
        # 检查是否包含类定义
        if 'class ' not in code:
            issues.append({
                "type": "missing_class",
                "severity": "error",
                "message": "策略代码必须包含类定义",
                "line": 0,
                "column": 0,
                "rule": "class_structure"
            })
            return issues
        
        try:
            tree = ast.parse(code)
            
            # 查找类定义
            classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
            
            if not classes:
                issues.append({
                    "type": "no_class_found",
                    "severity": "error",
                    "message": "未找到有效的类定义",
                    "line": 0,
                    "column": 0,
                    "rule": "class_structure"
                })
            
            # 检查每个类
            for cls in classes:
                class_issues = self._validate_class_structure(cls)
                issues.extend(class_issues)
        
        except Exception as e:
            issues.append({
                "type": "structure_analysis_error",
                "severity": "warning",
                "message": f"类结构分析失败: {str(e)}",
                "line": 0,
                "column": 0,
                "rule": "class_structure"
            })
        
        return issues
    
    async def _check_method_signature(self, code: str) -> List[Dict[str, Any]]:
        """检查方法签名"""
        issues = []
        required_methods = ['__init__', 'generate_signals']
        
        try:
            tree = ast.parse(code)
            classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
            
            for cls in classes:
                methods = [node.name for node in cls.body if isinstance(node, ast.FunctionDef)]
                
                for required_method in required_methods:
                    if required_method not in methods:
                        issues.append({
                            "type": "missing_method",
                            "severity": "error",
                            "message": f"缺少必需方法: {required_method}",
                            "line": cls.lineno,
                            "column": cls.col_offset,
                            "rule": "method_signature"
                        })
        
        except Exception as e:
            issues.append({
                "type": "method_analysis_error",
                "severity": "warning",
                "message": f"方法签名分析失败: {str(e)}",
                "line": 0,
                "column": 0,
                "rule": "method_signature"
            })
        
        return issues
    
    async def _check_dangerous_imports(self, code: str) -> List[Dict[str, Any]]:
        """检查危险导入"""
        issues = []
        dangerous_modules = [
            'os', 'sys', 'subprocess', 'eval', 'exec', 'compile',
            'open', '__import__', 'globals', 'locals', 'vars',
            'socket', 'urllib', 'requests', 'http'
        ]
        
        lines = code.split('\n')
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if line.startswith('import ') or line.startswith('from '):
                for dangerous in dangerous_modules:
                    if dangerous in line:
                        issues.append({
                            "type": "dangerous_import",
                            "severity": "error",
                            "message": f"检测到危险导入: {dangerous}",
                            "line": i,
                            "column": 0,
                            "rule": "dangerous_imports"
                        })
        
        return issues
    
    async def _check_file_operations(self, code: str) -> List[Dict[str, Any]]:
        """检查文件操作"""
        issues = []
        file_operations = ['open(', 'file(', 'with open', 'read(', 'write(', 'close(']
        
        lines = code.split('\n')
        for i, line in enumerate(lines, 1):
            for op in file_operations:
                if op in line:
                    issues.append({
                        "type": "file_operation",
                        "severity": "warning",
                        "message": f"检测到文件操作: {op.strip('(')}",
                        "line": i,
                        "column": line.find(op),
                        "rule": "file_operations"
                    })
        
        return issues
    
    async def _check_network_operations(self, code: str) -> List[Dict[str, Any]]:
        """检查网络操作"""
        issues = []
        network_patterns = [
            r'requests\.',
            r'urllib\.',
            r'http\.',
            r'socket\.',
            r'connect\(',
            r'send\(',
            r'recv\('
        ]
        
        lines = code.split('\n')
        for i, line in enumerate(lines, 1):
            for pattern in network_patterns:
                if re.search(pattern, line):
                    issues.append({
                        "type": "network_operation",
                        "severity": "warning",
                        "message": f"检测到网络操作: {pattern}",
                        "line": i,
                        "column": 0,
                        "rule": "network_operations"
                    })
        
        return issues
    
    async def _check_code_quality(self, code: str) -> List[Dict[str, Any]]:
        """检查代码质量"""
        issues = []
        lines = code.split('\n')
        
        # 检查注释比例
        comment_lines = [line for line in lines if line.strip().startswith('#')]
        if len(comment_lines) / len(lines) < 0.1:
            issues.append({
                "type": "insufficient_comments",
                "severity": "info",
                "message": "建议增加代码注释，提高可读性",
                "line": 0,
                "column": 0,
                "rule": "code_quality"
            })
        
        # 检查行长度
        for i, line in enumerate(lines, 1):
            if len(line) > 120:
                issues.append({
                    "type": "long_line",
                    "severity": "info",
                    "message": f"行长度过长 ({len(line)} 字符)，建议不超过120字符",
                    "line": i,
                    "column": 120,
                    "rule": "code_quality"
                })
        
        return issues
    
    async def _check_ptrade_compliance(self, code: str) -> List[Dict[str, Any]]:
        """检查PTrade合规性"""
        issues = []
        
        # 检查是否使用了PTrade相关的导入或语法
        ptrade_indicators = ['pandas', 'numpy', 'ta', 'talib']
        has_ptrade_imports = any(indicator in code for indicator in ptrade_indicators)
        
        if not has_ptrade_imports:
            issues.append({
                "type": "ptrade_compliance",
                "severity": "warning",
                "message": "建议使用PTrade框架相关的库（如pandas、numpy、ta等）",
                "line": 0,
                "column": 0,
                "rule": "ptrade_compliance"
            })
        
        return issues
    
    def _validate_class_structure(self, cls: ast.ClassDef) -> List[Dict[str, Any]]:
        """验证类结构"""
        issues = []
        
        # 检查类名
        if not cls.name[0].isupper():
            issues.append({
                "type": "class_naming",
                "severity": "info",
                "message": f"类名 '{cls.name}' 建议使用大驼峰命名法",
                "line": cls.lineno,
                "column": cls.col_offset,
                "rule": "class_structure"
            })
        
        return issues
    
    def _is_valid_import(self, import_line: str) -> bool:
        """检查导入语句是否有效"""
        try:
            ast.parse(import_line)
            return True
        except:
            return False
    
    def _determine_status(self, issues: List[Dict[str, Any]]) -> ValidationStatus:
        """确定验证状态"""
        if not issues:
            return ValidationStatus.PASSED
        
        error_count = len([issue for issue in issues if issue['severity'] == 'error'])
        warning_count = len([issue for issue in issues if issue['severity'] == 'warning'])
        
        if error_count > 0:
            return ValidationStatus.FAILED
        elif warning_count > 0:
            return ValidationStatus.WARNING
        else:
            return ValidationStatus.PASSED
    
    def _generate_suggestions(self, issues: List[Dict[str, Any]]) -> List[str]:
        """生成修复建议"""
        suggestions = []
        
        # 根据问题类型生成建议
        issue_types = set(issue['type'] for issue in issues)
        
        suggestion_map = {
            'syntax_error': '请检查并修复语法错误',
            'missing_class': '请添加策略类定义',
            'missing_method': '请实现必需的方法（__init__和generate_signals）',
            'dangerous_import': '请移除危险的导入语句，使用安全的替代方案',
            'insufficient_comments': '建议添加更多注释以提高代码可读性',
            'long_line': '建议将长行拆分为多行以提高可读性'
        }
        
        for issue_type in issue_types:
            if issue_type in suggestion_map:
                suggestions.append(suggestion_map[issue_type])
        
        # 添加通用建议
        if not suggestions:
            suggestions.append('代码质量良好，建议进行充分测试')
        
        return list(set(suggestions))  # 去重
    
    def _calculate_quality_score(self, code: str, issues: List[Dict[str, Any]]) -> float:
        """计算质量评分"""
        base_score = 100.0
        
        # 根据问题严重程度扣分
        for issue in issues:
            if issue['severity'] == 'error':
                base_score -= 20
            elif issue['severity'] == 'warning':
                base_score -= 10
            elif issue['severity'] == 'info':
                base_score -= 2
        
        # 根据代码特征加分
        lines = code.split('\n')
        
        # 注释比例加分
        comment_lines = [line for line in lines if line.strip().startswith('#')]
        comment_ratio = len(comment_lines) / len(lines) if lines else 0
        base_score += min(comment_ratio * 20, 10)
        
        # 代码长度合理性加分
        if 50 <= len(lines) <= 200:
            base_score += 5
        
        # 确保分数在0-100范围内
        return max(0.0, min(100.0, base_score))