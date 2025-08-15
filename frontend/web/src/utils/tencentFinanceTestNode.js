#!/usr/bin/env node

/**
 * 腾讯财经数据源测试工具 - Node.js版本
 * 用于在终端环境中测试腾讯财经API的可用性
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// 腾讯财经API配置
const TENCENT_API_BASE = 'https://qt.gtimg.cn/q=';

// 测试用的主要指数配置
const TEST_INDICES = {
    'sh000001': { name: '上证指数', market: '上海' },
    'sz399001': { name: '深证成指', market: '深圳' },
    'sz399006': { name: '创业板指', market: '深圳' },
    'sh000300': { name: '沪深300', market: '上海' }
};

// 颜色输出工具
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP请求工具
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/plain; charset=utf-8',
                'Accept-Charset': 'utf-8',
                ...options.headers
            },
            timeout: options.timeout || 10000
        };
        
        const req = client.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

// 解析腾讯财经API返回的数据
function parseTencentResponse(textData) {
    const results = {};
    
    try {
        // 处理可能的编码问题
        let processedData = textData;
        if (textData.includes('\\u') || /[\x80-\xFF]/.test(textData)) {
            try {
                processedData = Buffer.from(textData, 'latin1').toString('utf8');
            } catch (e) {
                console.warn('编码转换失败，使用原始数据:', e.message);
            }
        }
        
        // 使用正则表达式匹配每行数据
        const lines = processedData.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
            const match = line.match(/v_s_(\w+)="(.+)";/);
            if (match) {
                const symbol = match[1];
                const data = match[2];
                const fields = data.split('~');
                
                if (fields.length >= 11) {
                    // 处理中文名称编码
                    let indexName = fields[1];
                    try {
                        if (indexName && /[\x80-\xFF]/.test(indexName)) {
                            indexName = Buffer.from(indexName, 'latin1').toString('utf8');
                        }
                    } catch (e) {
                        console.warn('指数名称编码处理失败:', e.message);
                    }
                    
                    const changePercent = parseFloat(fields[5]) || 0;
                    let trend = 'flat';
                    if (changePercent > 0) trend = 'up';
                    else if (changePercent < 0) trend = 'down';
                    
                    const parsedData = {
                        market_id: fields[0],
                        name: indexName,
                        code: fields[2],
                        current_price: parseFloat(fields[3]) || 0,
                        change_points: parseFloat(fields[4]) || 0,
                        change_percent: changePercent,
                        volume: parseInt(fields[6]) || 0,
                        amount: parseInt(fields[7]) || 0,
                        market_cap: parseFloat(fields[9]) || 0,
                        trend: trend,
                        timestamp: new Date().toISOString()
                    };
                    
                    results[symbol] = parsedData;
                }
            }
        });
        
        return {
            success: true,
            data: results,
            message: '数据解析成功',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            success: false,
            data: {},
            message: `数据解析失败: ${error.message}`,
            timestamp: new Date().toISOString()
        };
    }
}

// 测试结果记录
class TestResults {
    constructor() {
        this.results = [];
        this.startTime = Date.now();
    }
    
    addResult(testName, success, message, duration = 0, data = null) {
        const result = {
            testName,
            success,
            message,
            duration,
            data,
            timestamp: new Date().toISOString()
        };
        this.results.push(result);
        
        const status = success ? '✅ PASS' : '❌ FAIL';
        const color = success ? 'green' : 'red';
        colorLog(`${status} [${testName}] ${message} (${duration}ms)`, color);
        
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            this.displayData(testName, data);
        }
    }
    
    displayData(testName, data) {
        colorLog(`\n📊 ${testName} - 数据详情:`, 'cyan');
        
        if (typeof data === 'object' && !Array.isArray(data)) {
            Object.entries(data).forEach(([symbol, indexData]) => {
                if (typeof indexData === 'object') {
                    const trendIcon = indexData.trend === 'up' ? '📈' : 
                                    indexData.trend === 'down' ? '📉' : '➡️';
                    const trendColor = indexData.trend === 'up' ? 'red' : 
                                     indexData.trend === 'down' ? 'green' : 'yellow';
                    
                    console.log(`  ${symbol}: ${indexData.name || 'N/A'}`);
                    console.log(`    当前价格: ${indexData.current_price ? indexData.current_price.toFixed(2) : 'N/A'}`);
                    console.log(`    涨跌点数: ${indexData.change_points ? indexData.change_points.toFixed(2) : 'N/A'}`);
                    colorLog(`    涨跌幅: ${indexData.change_percent ? indexData.change_percent.toFixed(2) : 'N/A'}% ${trendIcon}`, trendColor);
                    console.log(`    成交量: ${indexData.volume || 'N/A'}`);
                    console.log('');
                }
            });
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    }
    
    generateSummary() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
        const avgDuration = this.results.length > 0 ? 
            (this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length).toFixed(0) : 0;
        const totalDuration = Date.now() - this.startTime;
        
        colorLog('\n' + '='.repeat(60), 'bright');
        colorLog('📋 测试摘要报告', 'bright');
        colorLog('='.repeat(60), 'bright');
        
        console.log(`总测试数: ${totalTests}`);
        colorLog(`通过测试: ${passedTests}`, 'green');
        colorLog(`失败测试: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
        colorLog(`成功率: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
        console.log(`平均响应时间: ${avgDuration}ms`);
        console.log(`总执行时间: ${totalDuration}ms`);
        
        if (failedTests > 0) {
            colorLog('\n❌ 失败的测试:', 'red');
            this.results.filter(r => !r.success).forEach(result => {
                console.log(`  - ${result.testName}: ${result.message}`);
            });
        }
        
        colorLog('\n💡 建议:', 'yellow');
        if (successRate >= 80) {
            colorLog('  ✅ 腾讯财经数据源工作正常，可以正常使用', 'green');
        } else if (successRate >= 50) {
            colorLog('  ⚠️  腾讯财经数据源部分功能异常，建议检查网络连接', 'yellow');
        } else {
            colorLog('  ❌ 腾讯财经数据源存在严重问题，建议使用备用数据源', 'red');
        }
        
        if (avgDuration > 3000) {
            colorLog('  ⚠️  响应时间较慢，可能影响用户体验', 'yellow');
        }
        
        colorLog('='.repeat(60), 'bright');
    }
}

// 测试类
class TencentFinanceTestSuite {
    constructor() {
        this.testResults = new TestResults();
    }
    
    async testDirectAPI(symbol = 'sh000001') {
        const startTime = Date.now();
        try {
            const url = `${TENCENT_API_BASE}s_${symbol}`;
            colorLog(`\n🔍 测试直接API调用: ${url}`, 'blue');
            
            const response = await makeRequest(url, {
                headers: {
                    'Accept': 'text/plain; charset=utf-8',
                    'Accept-Charset': 'utf-8'
                }
            });
            
            const duration = Date.now() - startTime;
            
            if (response.statusCode !== 200) {
                throw new Error(`HTTP error! status: ${response.statusCode}`);
            }
            
            const parsedData = parseTencentResponse(response.data);
            
            if (parsedData.success && Object.keys(parsedData.data).length > 0) {
                this.testResults.addResult(
                    '直接API调用',
                    true,
                    `成功获取${symbol}数据`,
                    duration,
                    parsedData.data
                );
                return { success: true, data: parsedData.data[symbol], duration };
            } else {
                throw new Error('数据解析失败或无有效数据');
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            this.testResults.addResult(
                '直接API调用',
                false,
                `失败: ${error.message}`,
                duration
            );
            return { success: false, error: error.message, duration };
        }
    }
    
    async testBatchAPI(symbols = ['sh000001', 'sz399001']) {
        const startTime = Date.now();
        try {
            const queryString = symbols.map(s => `s_${s}`).join(',');
            const url = `${TENCENT_API_BASE}${queryString}`;
            colorLog(`\n🔍 测试批量API调用: ${url}`, 'blue');
            
            const response = await makeRequest(url, {
                headers: {
                    'Accept': 'text/plain; charset=utf-8',
                    'Accept-Charset': 'utf-8'
                }
            });
            
            const duration = Date.now() - startTime;
            
            if (response.statusCode !== 200) {
                throw new Error(`HTTP error! status: ${response.statusCode}`);
            }
            
            const parsedData = parseTencentResponse(response.data);
            
            if (parsedData.success) {
                const dataCount = Object.keys(parsedData.data).length;
                this.testResults.addResult(
                    '批量API调用',
                    true,
                    `成功获取${dataCount}个指数数据`,
                    duration,
                    parsedData.data
                );
                return { success: true, data: parsedData.data, duration, count: dataCount };
            } else {
                throw new Error('批量数据解析失败');
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            this.testResults.addResult(
                '批量API调用',
                false,
                `失败: ${error.message}`,
                duration
            );
            return { success: false, error: error.message, duration };
        }
    }
    
    async testDataParsing() {
        const startTime = Date.now();
        
        colorLog('\n🔍 测试数据解析功能', 'blue');
        
        // 模拟腾讯财经API返回的数据格式
        const mockData = 'v_s_sh000001="1~上证指数~000001~3200.50~15.20~0.48~1234567~9876543210~0~123456789~SH";\nv_s_sz399001="1~深证成指~399001~12500.30~-25.80~-0.21~2345678~8765432109~0~234567890~SZ";';
        
        try {
            const parsedData = parseTencentResponse(mockData);
            const duration = Date.now() - startTime;
            
            if (parsedData.success && Object.keys(parsedData.data).length > 0) {
                this.testResults.addResult(
                    '数据解析功能',
                    true,
                    `成功解析${Object.keys(parsedData.data).length}个指数数据`,
                    duration,
                    parsedData.data
                );
                return { success: true, data: parsedData.data, duration };
            } else {
                throw new Error('数据解析失败');
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            this.testResults.addResult(
                '数据解析功能',
                false,
                `失败: ${error.message}`,
                duration
            );
            return { success: false, error: error.message, duration };
        }
    }
    
    async quickConnectivityTest() {
        colorLog('🚀 开始快速连通性测试...', 'bright');
        
        const result = await this.testDirectAPI('sh000001');
        
        if (result.success) {
            colorLog('\n✅ 腾讯财经API连通正常', 'green');
        } else {
            colorLog('\n❌ 腾讯财经API连通失败', 'red');
        }
        
        this.testResults.generateSummary();
        return result;
    }
    
    async runFullTestSuite() {
        colorLog('🚀 开始完整测试套件...', 'bright');
        
        const testSymbols = Object.keys(TEST_INDICES);
        
        // 1. 测试单个指数直接API调用
        await this.testDirectAPI('sh000001');
        
        // 2. 测试批量指数直接API调用
        await this.testBatchAPI(testSymbols);
        
        // 3. 测试数据解析功能
        await this.testDataParsing();
        
        // 4. 性能测试
        colorLog('\n🔍 执行性能基准测试...', 'blue');
        const performanceTests = [];
        for (let i = 0; i < 3; i++) {
            const perfTest = await this.testDirectAPI('sh000001');
            if (perfTest.success) {
                performanceTests.push(perfTest.duration);
            }
            // 避免请求过于频繁
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (performanceTests.length > 0) {
            const avgDuration = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
            const minDuration = Math.min(...performanceTests);
            const maxDuration = Math.max(...performanceTests);
            
            this.testResults.addResult(
                '性能基准测试',
                avgDuration < 3000,
                `平均响应时间: ${avgDuration.toFixed(0)}ms (最快: ${minDuration}ms, 最慢: ${maxDuration}ms)`,
                0
            );
        }
        
        colorLog('\n📋 测试套件执行完成', 'bright');
        this.testResults.generateSummary();
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    const testSuite = new TencentFinanceTestSuite();
    
    colorLog('🔧 腾讯财经数据源测试工具 - Node.js版本', 'bright');
    colorLog('=' .repeat(50), 'bright');
    
    if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
        colorLog('\n使用方法:', 'yellow');
        console.log('  node tencentFinanceTestNode.js [command]');
        console.log('');
        console.log('可用命令:');
        console.log('  quick     - 快速连通性测试');
        console.log('  full      - 完整测试套件');
        console.log('  direct    - 测试直接API调用');
        console.log('  batch     - 测试批量API调用');
        console.log('  parse     - 测试数据解析功能');
        console.log('  help      - 显示帮助信息');
        console.log('');
        console.log('示例:');
        console.log('  node tencentFinanceTestNode.js quick');
        console.log('  node tencentFinanceTestNode.js full');
        return;
    }
    
    const command = args[0].toLowerCase();
    
    try {
        switch (command) {
            case 'quick':
                await testSuite.quickConnectivityTest();
                break;
            case 'full':
                await testSuite.runFullTestSuite();
                break;
            case 'direct':
                await testSuite.testDirectAPI('sh000001');
                testSuite.testResults.generateSummary();
                break;
            case 'batch':
                await testSuite.testBatchAPI(Object.keys(TEST_INDICES));
                testSuite.testResults.generateSummary();
                break;
            case 'parse':
                await testSuite.testDataParsing();
                testSuite.testResults.generateSummary();
                break;
            default:
                colorLog(`❌ 未知命令: ${command}`, 'red');
                colorLog('使用 "node tencentFinanceTestNode.js help" 查看可用命令', 'yellow');
                process.exit(1);
        }
    } catch (error) {
        colorLog(`\n❌ 测试执行失败: ${error.message}`, 'red');
        console.error(error.stack);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        colorLog(`\n💥 程序异常退出: ${error.message}`, 'red');
        console.error(error.stack);
        process.exit(1);
    });
}

module.exports = {
    TencentFinanceTestSuite,
    parseTencentResponse,
    TEST_INDICES
};