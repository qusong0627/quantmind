/**
 * 腾讯财经数据源测试工具
 * 用于测试腾讯财经API的连通性、数据获取和解析功能
 * 可在浏览器控制台或Node.js环境中运行
 */

// 腾讯财经API配置
const TENCENT_API_BASE = 'https://qt.gtimg.cn/q=';

// 测试用的主要指数配置
const TEST_INDICES = {
  'sh000001': { name: '上证指数', market: '上海' },
  'sz399001': { name: '深证成指', market: '深圳' },
  'sz399006': { name: '创业板指', market: '深圳' },
  'sh000300': { name: '沪深300', market: '上海' }
};

class TencentFinanceTestSuite {
  constructor() {
    this.testResults = [];
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * 记录测试结果
   * @param {string} testName 测试名称
   * @param {boolean} success 是否成功
   * @param {string} message 测试消息
   * @param {number} duration 耗时（毫秒）
   * @param {Object} data 测试数据
   */
  logTestResult(testName, success, message, duration = 0, data = null) {
    const result = {
      testName,
      success,
      message,
      duration,
      data,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} [${testName}] ${message} (${duration}ms)`);
    if (data && Object.keys(data).length > 0) {
      console.log('  数据:', data);
    }
  }

  /**
   * 测试直接调用腾讯财经API
   * @param {string} symbol 指数代码
   * @returns {Promise<Object>} 测试结果
   */
  async testDirectAPI(symbol = 'sh000001') {
    const startTime = Date.now();
    try {
      const url = `${TENCENT_API_BASE}s_${symbol}`;
      console.log(`测试直接API调用: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/plain; charset=utf-8',
          'Accept-Charset': 'utf-8',
          'Content-Type': 'text/plain; charset=utf-8'
        },
        timeout: 5000
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const textData = await response.text();
      const parsedData = this.parseTencentResponse(textData);
      
      if (parsedData.success && Object.keys(parsedData.data).length > 0) {
        this.logTestResult(
          '直接API调用',
          true,
          `成功获取${symbol}数据`,
          duration,
          parsedData.data[symbol]
        );
        return { success: true, data: parsedData.data[symbol], duration };
      } else {
        throw new Error('数据解析失败或无有效数据');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logTestResult(
        '直接API调用',
        false,
        `失败: ${error.message}`,
        duration
      );
      return { success: false, error: error.message, duration };
    }
  }

  /**
   * 测试批量获取指数数据
   * @param {Array} symbols 指数代码数组
   * @returns {Promise<Object>} 测试结果
   */
  async testBatchAPI(symbols = ['sh000001', 'sz399001']) {
    const startTime = Date.now();
    try {
      const queryString = symbols.map(s => `s_${s}`).join(',');
      const url = `${TENCENT_API_BASE}${queryString}`;
      console.log(`测试批量API调用: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/plain; charset=utf-8',
          'Accept-Charset': 'utf-8',
          'Content-Type': 'text/plain; charset=utf-8'
        },
        timeout: 10000
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const textData = await response.text();
      const parsedData = this.parseTencentResponse(textData);
      
      if (parsedData.success) {
        const dataCount = Object.keys(parsedData.data).length;
        this.logTestResult(
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
      this.logTestResult(
        '批量API调用',
        false,
        `失败: ${error.message}`,
        duration
      );
      return { success: false, error: error.message, duration };
    }
  }

  /**
   * 测试后端代理接口
   * @param {Array} symbols 指数代码数组
   * @returns {Promise<Object>} 测试结果
   */
  async testBackendProxy(symbols = ['sh000001']) {
    const startTime = Date.now();
    try {
      const symbolsParam = symbols.join(',');
      const url = `/api/v1/market/indices?symbols=${symbolsParam}`;
      console.log(`测试后端代理接口: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const dataCount = Object.keys(data.data || {}).length;
        this.logTestResult(
          '后端代理接口',
          true,
          `成功获取${dataCount}个指数数据`,
          duration,
          data.data
        );
        return { success: true, data: data.data, duration, count: dataCount };
      } else {
        throw new Error(data.message || '后端返回错误');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logTestResult(
        '后端代理接口',
        false,
        `失败: ${error.message}`,
        duration
      );
      return { success: false, error: error.message, duration };
    }
  }

  /**
   * 解析腾讯财经API返回的数据
   * @param {string} textData 原始文本数据
   * @returns {Object} 解析后的数据
   */
  parseTencentResponse(textData) {
    const results = {};
    
    try {
      // 处理可能的编码问题
      let processedData = textData;
      if (textData.includes('\\u') || /[\x80-\xFF]/.test(textData)) {
        processedData = unescape(encodeURIComponent(textData));
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
                indexName = decodeURIComponent(escape(indexName));
              }
            } catch (e) {
              console.warn('指数名称编码处理失败:', e.message);
            }
            
            const parsedData = {
              market_id: fields[0],
              name: indexName,
              code: fields[2],
              current_price: parseFloat(fields[3]) || 0,
              change_points: parseFloat(fields[4]) || 0,
              change_percent: parseFloat(fields[5]) || 0,
              volume: parseInt(fields[6]) || 0,
              amount: parseInt(fields[7]) || 0,
              market_cap: parseFloat(fields[9]) || 0,
              trend: this.getTrendStatus(fields[5]),
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

  /**
   * 获取涨跌状态
   * @param {string|number} changePercent 涨跌幅
   * @returns {string} 涨跌状态
   */
  getTrendStatus(changePercent) {
    const change = parseFloat(changePercent) || 0;
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'flat';
  }

  /**
   * 测试数据完整性
   * @param {Object} data 指数数据
   * @returns {Object} 完整性测试结果
   */
  testDataIntegrity(data) {
    const requiredFields = [
      'name', 'code', 'current_price', 'change_points', 
      'change_percent', 'volume', 'amount'
    ];
    
    const missingFields = [];
    const invalidFields = [];
    
    requiredFields.forEach(field => {
      if (!(field in data)) {
        missingFields.push(field);
      } else if (data[field] === null || data[field] === undefined) {
        invalidFields.push(field);
      }
    });
    
    const isComplete = missingFields.length === 0 && invalidFields.length === 0;
    
    return {
      complete: isComplete,
      missingFields,
      invalidFields,
      score: ((requiredFields.length - missingFields.length - invalidFields.length) / requiredFields.length * 100).toFixed(1)
    };
  }

  /**
   * 运行完整测试套件
   * @returns {Promise<Object>} 完整测试报告
   */
  async runFullTestSuite() {
    console.log('🚀 开始腾讯财经数据源测试...');
    this.startTime = Date.now();
    this.testResults = [];
    
    const testSymbols = Object.keys(TEST_INDICES);
    
    // 1. 测试单个指数直接API调用
    console.log('\n📊 测试1: 单个指数直接API调用');
    const singleTest = await this.testDirectAPI('sh000001');
    
    // 2. 测试批量指数直接API调用
    console.log('\n📊 测试2: 批量指数直接API调用');
    const batchTest = await this.testBatchAPI(testSymbols);
    
    // 3. 测试后端代理接口
    console.log('\n📊 测试3: 后端代理接口');
    const proxyTest = await this.testBackendProxy(testSymbols);
    
    // 4. 测试数据完整性
    console.log('\n📊 测试4: 数据完整性检查');
    if (batchTest.success && batchTest.data) {
      let totalScore = 0;
      let testCount = 0;
      
      Object.entries(batchTest.data).forEach(([symbol, data]) => {
        const integrity = this.testDataIntegrity(data);
        totalScore += parseFloat(integrity.score);
        testCount++;
        
        this.logTestResult(
          `数据完整性-${symbol}`,
          integrity.complete,
          `完整性评分: ${integrity.score}%`,
          0,
          { missingFields: integrity.missingFields, invalidFields: integrity.invalidFields }
        );
      });
      
      const avgScore = testCount > 0 ? (totalScore / testCount).toFixed(1) : 0;
      this.logTestResult(
        '数据完整性总评',
        avgScore >= 80,
        `平均完整性评分: ${avgScore}%`,
        0
      );
    }
    
    // 5. 性能测试
    console.log('\n📊 测试5: 性能基准测试');
    const performanceTests = [];
    for (let i = 0; i < 3; i++) {
      const perfTest = await this.testDirectAPI('sh000001');
      if (perfTest.success) {
        performanceTests.push(perfTest.duration);
      }
    }
    
    if (performanceTests.length > 0) {
      const avgDuration = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
      const minDuration = Math.min(...performanceTests);
      const maxDuration = Math.max(...performanceTests);
      
      this.logTestResult(
        '性能基准测试',
        avgDuration < 3000,
        `平均响应时间: ${avgDuration.toFixed(0)}ms`,
        0,
        { avg: avgDuration, min: minDuration, max: maxDuration }
      );
    }
    
    this.endTime = Date.now();
    return this.generateTestReport();
  }

  /**
   * 生成测试报告
   * @returns {Object} 测试报告
   */
  generateTestReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
    const totalDuration = this.endTime - this.startTime;
    
    const report = {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: `${successRate}%`,
        totalDuration: `${totalDuration}ms`,
        timestamp: new Date().toISOString()
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };
    
    console.log('\n📋 测试报告生成完成');
    console.log('=' .repeat(50));
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过测试: ${passedTests}`);
    console.log(`失败测试: ${failedTests}`);
    console.log(`成功率: ${successRate}%`);
    console.log(`总耗时: ${totalDuration}ms`);
    console.log('=' .repeat(50));
    
    return report;
  }

  /**
   * 生成建议
   * @returns {Array} 建议列表
   */
  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.testResults.filter(r => !r.success);
    
    if (failedTests.some(t => t.testName === '直接API调用')) {
      recommendations.push('直接API调用失败，可能是网络问题或CORS限制，建议使用后端代理');
    }
    
    if (failedTests.some(t => t.testName === '后端代理接口')) {
      recommendations.push('后端代理接口不可用，请检查后端服务状态和路由配置');
    }
    
    const avgDuration = this.testResults
      .filter(r => r.duration > 0)
      .reduce((sum, r, _, arr) => sum + r.duration / arr.length, 0);
    
    if (avgDuration > 3000) {
      recommendations.push('API响应时间较慢，建议添加缓存机制或优化网络配置');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('所有测试通过，腾讯财经数据源工作正常');
    }
    
    return recommendations;
  }

  /**
   * 快速连通性测试
   * @returns {Promise<boolean>} 连通性状态
   */
  async quickConnectivityTest() {
    console.log('🔍 快速连通性测试...');
    const result = await this.testDirectAPI('sh000001');
    const isConnected = result.success;
    
    console.log(isConnected ? '✅ 腾讯财经API连通正常' : '❌ 腾讯财经API连通失败');
    return isConnected;
  }
}

// 创建测试实例
const tencentFinanceTest = new TencentFinanceTestSuite();

// 导出测试工具（支持ES6模块和CommonJS）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = tencentFinanceTest;
} else if (typeof window !== 'undefined') {
  window.tencentFinanceTest = tencentFinanceTest;
}

// 如果在浏览器环境中，添加到全局对象
if (typeof window !== 'undefined') {
  console.log('🔧 腾讯财经测试工具已加载到全局对象 window.tencentFinanceTest');
  console.log('使用方法:');
  console.log('  - 快速测试: tencentFinanceTest.quickConnectivityTest()');
  console.log('  - 完整测试: tencentFinanceTest.runFullTestSuite()');
  console.log('  - 单项测试: tencentFinanceTest.testDirectAPI("sh000001")');
}

export default tencentFinanceTest;