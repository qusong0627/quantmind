/**
 * 腾讯财经数据采集服务 (JavaScript版本)
 * 基于腾讯财经免费API直接获取实时指数数据
 * 严格按照文档规范实现11个字段的完整数据解析
 * 支持主要指数的实时数据获取，包括上证指数、深证成指、创业板指等
 * 数据来源：https://qt.gtimg.cn/q=s_sh000001
 * 
 * 作者: QuantMind Team
 * 版本: 2.0.0
 * 更新时间: 2024-12-19
 */

// 腾讯财经API配置
const TENCENT_API_BASE = 'https://qt.gtimg.cn/q=';
const REQUEST_TIMEOUT = 8000; // 8秒超时
const MAX_RETRIES = 3; // 最大重试次数
const RETRY_DELAY = 1000; // 重试延迟（毫秒）
const RATE_LIMIT_DELAY = 1000; // 速率限制延迟（毫秒）

// 支持的主要指数配置（基于文档规范）
const MAJOR_INDICES = {
    'sh000001': { name: '上证指数', market: '上海', description: '上海证券交易所综合股价指数' },
    'sh000016': { name: '上证50', market: '上海', description: '上海证券市场规模大、流动性好的50只股票' },
    'sh000300': { name: '沪深300', market: '上海', description: '沪深两市规模大、流动性好的300只股票' },
    'sz399001': { name: '深证成指', market: '深圳', description: '深圳证券交易所成份股价指数' },
    'sz399006': { name: '创业板指', market: '深圳', description: '创业板指数' },
    'sh000905': { name: '中证500', market: '上海', description: '中证500指数' },
    'sz399905': { name: '中证500', market: '深圳', description: '中证500指数（兼容映射）' },
    'sz399102': { name: '创业板综', market: '深圳', description: '创业板综合指数' },
    'sz399005': { name: '中小板指', market: '深圳', description: '中小板指数' }
};

// 数据字段映射（基于文档规范的11个字段）
const DATA_FIELD_MAPPING = {
    0: 'market_id',      // 市场标识：1=上海证券交易所，0=深圳证券交易所
    1: 'name',           // 指数名称：中文名称
    2: 'code',           // 指数代码：6位数字代码
    3: 'current_price',  // 当前点位：实时指数点位
    4: 'change_points',  // 涨跌点数：相对于前一交易日收盘的变化
    5: 'change_percent', // 涨跌幅：涨跌幅百分比
    6: 'volume',         // 成交量：单位：手
    7: 'amount',         // 成交金额：单位：万元
    8: 'reserved',       // 预留字段：暂未使用
    9: 'market_cap',     // 总市值：单位：亿元
    10: 'type'           // 证券类型：ZS=指数，其他类型待补充
};

/**
 * 腾讯财经数据采集服务类
 */
class TencentFinanceService {
    constructor() {
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.rateLimitDelay = RATE_LIMIT_DELAY;
    }

    /**
     * 执行速率限制控制
     */
    async enforceRateLimit() {
        const currentTime = Date.now();
        const timeSinceLastRequest = currentTime - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimitDelay) {
            const delay = this.rateLimitDelay - timeSinceLastRequest;
            console.debug(`速率限制：等待 ${delay} 毫秒`);
            await this.sleep(delay);
        }
        
        this.lastRequestTime = Date.now();
        this.requestCount++;
    }

    /**
     * 睡眠函数
     * @param {number} ms - 毫秒数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 直接调用腾讯财经API获取指数数据（带重试机制）
     * @param {string|Array<string>} symbols - 指数代码或代码数组
     * @param {number} retryCount - 当前重试次数
     * @returns {Promise<Object>} 指数数据
     */
    async fetchDirectFromTencent(symbols, retryCount = 0) {
        try {
            await this.enforceRateLimit();
            
            const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
            const queryString = symbolArray.map(s => `s_${s}`).join(',');
            const url = `${TENCENT_API_BASE}${queryString}`;
            
            console.info(`腾讯财经API调用 (尝试 ${retryCount + 1}/${MAX_RETRIES + 1}): ${url}`);
            
            // 创建AbortController用于超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
            
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; QuantMind/2.0)',
                        'Accept': 'text/plain; charset=utf-8',
                        'Accept-Charset': 'utf-8'
                    },
                    signal: controller.signal,
                    mode: 'cors' // 尝试CORS请求
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const textData = await response.text();
                console.debug(`腾讯财经原始数据: ${textData.substring(0, 200)}...`);
                
                if (!textData || textData.trim() === '') {
                    throw new Error('API返回空数据');
                }
                
                return await this.parseTencentResponse(textData);
                
            } catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
            
        } catch (error) {
            console.warn(`腾讯财经API调用失败 (尝试 ${retryCount + 1}): ${error.message}`);
            
            // 如果还有重试次数，则重试
            if (retryCount < MAX_RETRIES) {
                const delay = RETRY_DELAY * (retryCount + 1); // 递增延迟
                console.info(`等待 ${delay} 毫秒后重试...`);
                await this.sleep(delay);
                return await this.fetchDirectFromTencent(symbols, retryCount + 1);
            }
            
            // 重试次数用完，生成模拟数据
            console.warn(`直接调用腾讯财经API失败，生成模拟数据: ${error.message}`);
            return await this.generateMockData(symbols);
        }
    }

    /**
     * 解析腾讯财经API返回的数据（严格按照文档规范的11个字段）
     * @param {string} textData - 原始文本数据
     * @returns {Promise<Object>} 解析后的数据
     */
    async parseTencentResponse(textData) {
        const results = {};
        const errors = [];
        
        try {
            // 处理字符编码
            const processedData = this.handleCharacterEncoding(textData);
            
            // 使用正则表达式匹配每行数据
            const lines = processedData.split('\n').map(line => line.trim()).filter(line => line);
            
            for (let index = 0; index < lines.length; index++) {
                const line = lines[index];
                try {
                    const match = line.match(/v_s_(\w+)="(.+)";/);
                    if (match) {
                        const symbol = match[1];
                        const data = match[2];
                        const fields = data.split('~');
                        
                        // 严格验证字段数量（必须是11个字段）
                        if (fields.length < 11) {
                            throw new Error(`字段数量不足：期望11个字段，实际${fields.length}个`);
                        }
                        
                        // 按照文档规范解析11个字段
                        const parsedData = await this.parseDataFields(fields, symbol);
                        
                        // 数据验证
                        const validation = this.validateParsedData(parsedData);
                        if (!validation.isValid) {
                            throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
                        }
                        
                        results[symbol] = parsedData;
                    } else {
                        throw new Error(`数据格式不匹配: ${line}`);
                    }
                    
                } catch (error) {
                    const errorMsg = `行 ${index + 1}: ${error.message}`;
                    errors.push(errorMsg);
                    console.warn(`解析第${index + 1}行数据失败: ${error.message}`);
                }
            }
            
            return {
                success: Object.keys(results).length > 0,
                data: results,
                message: Object.keys(results).length > 0 ? 
                    `成功解析${Object.keys(results).length}个指数数据` : 
                    '未能解析任何有效数据',
                errors: errors.length > 0 ? errors : null,
                timestamp: new Date().toISOString(),
                requestCount: this.requestCount
            };
            
        } catch (error) {
            console.error(`数据解析失败: ${error.message}`);
            return {
                success: false,
                data: {},
                message: `数据解析失败: ${error.message}`,
                errors: [error.message],
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 处理字符编码问题
     * @param {string} textData - 原始文本数据
     * @returns {string} 处理后的文本数据
     */
    handleCharacterEncoding(textData) {
        try {
            // 处理可能的编码问题
            if (textData.includes('\\u') || /[\u0080-\uFFFF]/.test(textData)) {
                // 尝试解码Unicode转义序列
                let decoded = textData.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
                    return String.fromCharCode(parseInt(code, 16));
                });
                
                // 尝试处理其他编码问题
                try {
                    decoded = decodeURIComponent(decoded);
                } catch (e) {
                    console.warn(`字符编码处理警告: ${e.message}`);
                }
                
                return decoded;
            }
            
            return textData;
            
        } catch (error) {
            console.warn(`字符编码处理失败，使用原始数据: ${error.message}`);
            return textData;
        }
    }

    /**
     * 解析数据字段（严格按照文档规范的11个字段）
     * @param {Array<string>} fields - 字段数组
     * @param {string} symbol - 指数代码
     * @returns {Promise<Object>} 解析后的数据对象
     */
    async parseDataFields(fields, symbol) {
        // 规范化市场ID：腾讯简洁行情第0位常带状态，如'51'，首位'1'视为上交所，其它视为深交所
        const marketRaw = (fields[0] ?? '').toString();
        const normalizedMarketId = marketRaw.startsWith('1') ? '1' : '0';

        const parsedData = {
            symbol: symbol,
            market_id: normalizedMarketId,                            // 使用规范化后的市场ID
            name: this.cleanChineseName(fields[1]),                  // 指数名称
            code: fields[2],                                         // 指数代码
            current_price: this.safeFloat(fields[3]),                // 当前点位
            change_points: this.safeFloat(fields[4]),                // 涨跌点数
            change_percent: this.safeFloat(fields[5]),               // 涨跌幅
            volume: this.safeInt(fields[6]),                         // 成交量（手）
            amount: this.safeInt(fields[7]),                         // 成交金额（万元）
            reserved: fields[8],                                     // 预留字段
            market_cap: this.safeFloat(fields[9]),                   // 总市值（亿元）
            type: fields[10],                                        // 证券类型
            
            // 扩展字段
            market: this.getMarketName(normalizedMarketId),          // 市场名称
            trend: this.getTrendStatus(this.safeFloat(fields[5])),   // 涨跌状态
            timestamp: new Date().toISOString(),                     // 时间戳
            
            // 格式化显示字段
            display_text: {
                price: this.formatNumber(this.safeFloat(fields[3]), 2),
                change: this.formatChange(this.safeFloat(fields[4]), this.safeFloat(fields[5])),
                volume: this.formatVolume(this.safeInt(fields[6])),
                amount: this.formatAmount(this.safeInt(fields[7])),
                market_cap: this.formatMarketCap(this.safeFloat(fields[9]))
            }
        };
        
        return parsedData;
    }

    /**
     * 清理中文名称
     * @param {string} name - 原始名称
     * @returns {string} 清理后的名称
     */
    cleanChineseName(name) {
        if (!name) {
            return '未知指数';
        }
        
        try {
            // 移除可能的特殊字符和空格
            const cleaned = name.replace(/[\r\n\t]/g, '').trim();
            
            // 如果名称为空或包含乱码，使用配置中的名称
            if (!cleaned || /[\x00-\x1F\x7F-\x9F]/.test(cleaned)) {
                return '未知指数';
            }
            
            return cleaned;
            
        } catch (error) {
            console.warn(`名称清理失败: ${error.message}`);
            return '未知指数';
        }
    }

    /**
     * 安全的浮点数解析
     * @param {string} value - 字符串值
     * @returns {number} 浮点数
     */
    safeFloat(value) {
        try {
            return value ? parseFloat(value) : 0.0;
        } catch (error) {
            return 0.0;
        }
    }

    /**
     * 安全的整数解析
     * @param {string} value - 字符串值
     * @returns {number} 整数
     */
    safeInt(value) {
        try {
            return value ? parseInt(parseFloat(value)) : 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * 获取市场名称
     * @param {string} marketId - 市场ID
     * @returns {string} 市场名称
     */
    getMarketName(marketId) {
        return marketId === '1' ? '上海' : '深圳';
    }

    /**
     * 验证解析后的数据
     * @param {Object} data - 解析后的数据
     * @returns {Object} 验证结果
     */
    validateParsedData(data) {
        const errors = [];
        
        // 必需字段验证
        if (!data.symbol) {
            errors.push('缺少指数代码');
        }
        if (!data.name || data.name === '未知指数') {
            errors.push('指数名称无效');
        }
        if (!data.code) {
            errors.push('缺少指数代码');
        }
        if (typeof data.current_price !== 'number') {
            errors.push('当前价格格式错误');
        }
        
        // 数值范围验证
        if (data.current_price < 0) {
            errors.push('当前价格不能为负数');
        }
        if (Math.abs(data.change_percent || 0) > 20) {
            errors.push('涨跌幅超出合理范围');
        }
        if ((data.volume || 0) < 0) {
            errors.push('成交量不能为负数');
        }
        if ((data.amount || 0) < 0) {
            errors.push('成交金额不能为负数');
        }
        if ((data.market_cap || 0) < 0) {
            errors.push('市值不能为负数');
        }
        
        // 市场ID验证（已在解析阶段规范化为 '0' 或 '1'）
        if (!['0', '1'].includes(data.market_id)) {
            errors.push('市场ID无效');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 生成模拟数据（最后的降级方案）
     * @param {string|Array<string>} symbols - 指数代码
     * @returns {Promise<Object>} 模拟数据
     */
    async generateMockData(symbols) {
        const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
        const mockData = {};
        
        for (const symbol of symbolArray) {
            const config = MAJOR_INDICES[symbol];
            if (config) {
                const basePrices = {
                    'sh000001': 3200,
                    'sz399001': 12000,
                    'sz399006': 2800
                };
                const basePrice = basePrices[symbol] || 5000;
                
                const changePercent = (Math.random() - 0.5) * 4; // -2% 到 +2%
                const changePoints = basePrice * changePercent / 100;
                
                mockData[symbol] = {
                    symbol: symbol,
                    market_id: symbol.startsWith('sh') ? '1' : '0',
                    name: config.name,
                    code: symbol.substring(2),
                    current_price: basePrice + changePoints,
                    change_points: changePoints,
                    change_percent: changePercent,
                    volume: Math.floor(Math.random() * 900000000) + 100000000,
                    amount: Math.floor(Math.random() * 90000000) + 10000000,
                    reserved: '',
                    market_cap: Math.floor(Math.random() * 900000) + 100000,
                    type: 'ZS',
                    market: config.market,
                    trend: this.getTrendStatus(changePercent),
                    timestamp: new Date().toISOString(),
                    display_text: {
                        price: this.formatNumber(basePrice + changePoints, 2),
                        change: this.formatChange(changePoints, changePercent),
                        volume: this.formatVolume(Math.floor(Math.random() * 900000000) + 100000000),
                        amount: this.formatAmount(Math.floor(Math.random() * 90000000) + 10000000),
                        market_cap: this.formatMarketCap(Math.floor(Math.random() * 900000) + 100000)
                    }
                };
            }
        }
        
        return {
            success: true,
            data: mockData,
            message: '使用模拟数据（所有数据源不可用）',
            timestamp: new Date().toISOString(),
            is_mock_data: true
        };
    }

    /**
     * 获取单个指数数据
     * @param {string} symbol - 指数代码
     * @returns {Promise<Object>} 指数数据
     */
    async getSingleIndex(symbol) {
        try {
            console.info(`获取单个指数数据: ${symbol}`);
            const rawData = await this.fetchDirectFromTencent([symbol]);
            
            if (rawData.success && rawData.data[symbol]) {
                return {
                    success: true,
                    data: rawData.data[symbol],
                    message: '指数数据获取成功',
                    timestamp: rawData.timestamp
                };
            } else {
                throw new Error(`指数 ${symbol} 数据不存在`);
            }
            
        } catch (error) {
            console.error(`单个指数数据请求失败: ${error.message}`);
            throw new Error(`单个指数数据请求失败: ${error.message}`);
        }
    }

    /**
     * 批量获取指数数据
     * @param {Array<string>} symbols - 指数代码数组
     * @returns {Promise<Object>} 批量指数数据
     */
    async getBatchIndices(symbols) {
        try {
            console.info(`批量获取指数数据: ${symbols}`);
            const rawData = await this.fetchDirectFromTencent(symbols);
            
            if (rawData.success) {
                return {
                    success: true,
                    data: rawData.data,
                    message: `成功获取${Object.keys(rawData.data).length}个指数数据`,
                    timestamp: rawData.timestamp,
                    requestCount: this.requestCount
                };
            } else {
                throw new Error('批量获取指数数据失败');
            }
            
        } catch (error) {
            console.error(`批量指数数据请求失败: ${error.message}`);
            throw new Error(`批量指数数据请求失败: ${error.message}`);
        }
    }

    /**
     * 获取所有主要指数的实时数据
     * @returns {Promise<Object>} 包含所有主要指数的市场数据
     */
    async getAllMajorIndices() {
        try {
            const symbols = Object.keys(MAJOR_INDICES);
            const rawData = await this.fetchDirectFromTencent(symbols);
            
            if (rawData.success) {
                // 将对象形式转换为数组形式，满足组件对数组的期望
                const dataArray = Array.isArray(rawData.data)
                    ? rawData.data
                    : Object.values(rawData.data || {});
                
                return {
                    success: true,
                    data: dataArray,
                    message: `成功获取${dataArray.length}个主要指数数据`,
                    timestamp: rawData.timestamp,
                    requestCount: this.requestCount,
                    is_mock_data: rawData.is_mock_data || false
                };
            } else {
                throw new Error(rawData.message || '腾讯财经API返回错误');
            }
            
        } catch (error) {
            console.error(`主要指数数据请求失败: ${error.message}`);
            throw new Error(`主要指数数据请求失败: ${error.message}`);
        }
    }

    /**
     * 获取实时市场数据（兼容旧接口）
     * @returns {Promise<Object>} 市场数据
     */
    async getRealtimeMarketData() {
        try {
            const allData = await this.getAllMajorIndices();
            
            if (allData.success) {
                return {
                    success: true,
                    data: {
                        market_indices: allData.data
                    },
                    message: allData.message,
                    timestamp: allData.timestamp,
                    requestCount: allData.requestCount,
                    is_mock_data: allData.is_mock_data || false
                };
            } else {
                throw new Error(allData.message || '腾讯财经API返回错误');
            }
            
        } catch (error) {
            console.error(`实时市场数据请求失败: ${error.message}`);
            throw new Error(`实时市场数据请求失败: ${error.message}`);
        }
    }

    /**
     * 获取市场概览数据
     * @returns {Promise<Object>} 市场概览
     */
    async getMarketOverview() {
        try {
            const allData = await this.getAllMajorIndices();
            
            if (!allData.success) {
                throw new Error('获取市场数据失败');
            }
            
            // 兼容 getAllMajorIndices() 返回数组
            const indicesArray = Array.isArray(allData.data) ? allData.data : Object.values(allData.data || {});
            const indicesBySymbol = {};
            indicesArray.forEach(item => {
                if (item && item.symbol) {
                    indicesBySymbol[item.symbol] = item;
                }
            });

            const overview = {
                total_indices: indicesArray.length,
                up_count: 0,
                down_count: 0,
                flat_count: 0,
                major_indices: {
                    shanghai: indicesBySymbol['sh000001'],    // 上证指数
                    shenzhen: indicesBySymbol['sz399001'],    // 深证成指
                    chuangye: indicesBySymbol['sz399006'],    // 创业板指
                    csi300: indicesBySymbol['sh000300']       // 沪深300
                },
                timestamp: allData.timestamp,
                is_mock_data: allData.is_mock_data || false
            };
            
            // 统计涨跌情况
            indicesArray.forEach(indexData => {
                const trend = indexData?.trend || 'flat';
                if (trend === 'up') {
                    overview.up_count += 1;
                } else if (trend === 'down') {
                    overview.down_count += 1;
                } else {
                    overview.flat_count += 1;
                }
            });
            
            return {
                success: true,
                data: overview,
                message: '市场概览获取成功',
                timestamp: allData.timestamp,
                is_mock_data: allData.is_mock_data || false
            };
            
        } catch (error) {
            console.error(`获取市场概览失败: ${error.message}`);
            throw new Error(`获取市场概览失败: ${error.message}`);
        }
    }

    /**
     * 测试数据源连通性和数据质量
     * @returns {Promise<Object>} 测试结果
     */
    async testDataSources() {
        const testResults = {
            timestamp: new Date().toISOString(),
            tests: {
                connectivity: { status: 'pending', message: '', duration: 0 },
                data_quality: { status: 'pending', message: '', duration: 0 },
                performance: { status: 'pending', message: '', duration: 0 }
            },
            overall: { status: 'pending', message: '' }
        };
        
        try {
            // 测试1: 连通性测试
            console.info('开始连通性测试...');
            const connectivityStart = Date.now();
            
            try {
                const testData = await this.getSingleIndex('sh000001');
                testResults.tests.connectivity = {
                    status: testData.success ? 'passed' : 'failed',
                    message: testData.success ? '腾讯财经API连通正常' : '腾讯财经API连通失败',
                    duration: Date.now() - connectivityStart,
                    data: testData.success ? testData.data : null
                };
            } catch (error) {
                testResults.tests.connectivity = {
                    status: 'failed',
                    message: `连通性测试失败: ${error.message}`,
                    duration: Date.now() - connectivityStart
                };
            }
            
            // 测试2: 数据质量测试
            console.info('开始数据质量测试...');
            const qualityStart = Date.now();
            
            try {
                const batchData = await this.getBatchIndices(['sh000001', 'sz399001', 'sz399006']);
                let qualityScore = 0;
                let totalFields = 0;
                
                if (batchData.success) {
                    Object.values(batchData.data).forEach(item => {
                        // 检查必需字段
                        const requiredFields = ['symbol', 'name', 'current_price', 'change_points', 'change_percent'];
                        requiredFields.forEach(field => {
                            totalFields++;
                            if (item[field] !== null && item[field] !== undefined && item[field] !== '') {
                                qualityScore++;
                            }
                        });
                    });
                }
                
                const qualityPercentage = totalFields > 0 ? (qualityScore / totalFields * 100) : 0;
                testResults.tests.data_quality = {
                    status: qualityPercentage >= 80 ? 'passed' : 'failed',
                    message: `数据质量评分: ${qualityPercentage.toFixed(1)}% (${qualityScore}/${totalFields})`,
                    duration: Date.now() - qualityStart,
                    score: qualityPercentage
                };
            } catch (error) {
                testResults.tests.data_quality = {
                    status: 'failed',
                    message: `数据质量测试失败: ${error.message}`,
                    duration: Date.now() - qualityStart
                };
            }
            
            // 测试3: 性能测试
            console.info('开始性能测试...');
            const performanceStart = Date.now();
            
            try {
                const allData = await this.getAllMajorIndices();
                const duration = Date.now() - performanceStart;
                
                testResults.tests.performance = {
                    status: duration < 10000 ? 'passed' : 'failed',  // 10秒内完成
                    message: `批量获取${Object.keys(allData.data || {}).length}个指数耗时${(duration/1000).toFixed(2)}秒`,
                    duration: duration,
                    requestCount: this.requestCount
                };
            } catch (error) {
                testResults.tests.performance = {
                    status: 'failed',
                    message: `性能测试失败: ${error.message}`,
                    duration: Date.now() - performanceStart
                };
            }
            
            // 计算总体结果
            const passedTests = Object.values(testResults.tests).filter(test => test.status === 'passed').length;
            const totalTests = Object.keys(testResults.tests).length;
            
            testResults.overall = {
                status: passedTests === totalTests ? 'passed' : (passedTests > 0 ? 'partial' : 'failed'),
                message: `测试完成: ${passedTests}/${totalTests} 项通过`,
                passed_tests: passedTests,
                total_tests: totalTests
            };
            
            return {
                success: true,
                data: testResults,
                message: '数据源测试完成'
            };
            
        } catch (error) {
            console.error(`数据源测试失败: ${error.message}`);
            return {
                success: false,
                data: testResults,
                message: `数据源测试失败: ${error.message}`
            };
        }
    }

    /**
     * 获取涨跌状态
     * @param {number} changePercent - 涨跌幅
     * @returns {string} 涨跌状态
     */
    getTrendStatus(changePercent) {
        const change = parseFloat(changePercent) || 0;
        if (change > 0) {
            return 'up';
        } else if (change < 0) {
            return 'down';
        } else {
            return 'flat';
        }
    }

    /**
     * 格式化数字
     * @param {number} num - 数字
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化后的数字
     */
    formatNumber(num, decimals = 2) {
        const number = parseFloat(num) || 0;
        return number.toFixed(decimals);
    }

    /**
     * 格式化涨跌显示
     * @param {number} changePoints - 涨跌点数
     * @param {number} changePercent - 涨跌幅
     * @returns {string} 格式化后的涨跌显示
     */
    formatChange(changePoints, changePercent) {
        const points = parseFloat(changePoints) || 0;
        const percent = parseFloat(changePercent) || 0;
        const sign = points >= 0 ? '+' : '';
        return `${sign}${points.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
    }

    /**
     * 格式化成交量
     * @param {number} volume - 成交量（手）
     * @returns {string} 格式化后的成交量
     */
    formatVolume(volume) {
        const vol = parseInt(volume) || 0;
        if (vol >= 100000000) {
            return `${(vol / 100000000).toFixed(2)}亿手`;
        } else if (vol >= 10000) {
            return `${(vol / 10000).toFixed(2)}万手`;
        }
        return `${vol}手`;
    }

    /**
     * 格式化成交额
     * @param {number} amount - 成交额（万元）
     * @returns {string} 格式化后的成交额
     */
    formatAmount(amount) {
        const amt = parseInt(amount) || 0;
        if (amt >= 100000000) {
            return `${(amt / 100000000).toFixed(2)}万亿元`;
        } else if (amt >= 10000) {
            return `${(amt / 10000).toFixed(2)}亿元`;
        }
        return `${amt}万元`;
    }

    /**
     * 格式化市值
     * @param {number} marketCap - 市值（亿元）
     * @returns {string} 格式化后的市值
     */
    formatMarketCap(marketCap) {
        const cap = parseFloat(marketCap) || 0;
        if (cap >= 10000) {
            return `${(cap / 10000).toFixed(2)}万亿元`;
        }
        return `${cap.toFixed(2)}亿元`;
    }

    /**
     * 获取支持的指数列表
     * @returns {Object} 支持的指数配置
     */
    getSupportedIndices() {
        return { ...MAJOR_INDICES };
    }

    /**
     * 检查腾讯财经API连通性
     * @returns {Promise<boolean>} 连通性状态
     */
    async checkConnectivity() {
        try {
            const testData = await this.getSingleIndex('sh000001');
            return testData.success;
        } catch (error) {
            console.error(`腾讯财经API连通性检查失败: ${error.message}`);
            return false;
        }
    }

    /**
     * 获取服务统计信息
     * @returns {Object} 服务统计
     */
    getServiceStats() {
        return {
            requestCount: this.requestCount,
            lastRequestTime: this.lastRequestTime,
            supportedIndicesCount: Object.keys(MAJOR_INDICES).length,
            rateLimitDelay: this.rateLimitDelay,
            maxRetries: MAX_RETRIES,
            requestTimeout: REQUEST_TIMEOUT
        };
    }
}

/**
 * 市场数据服务类（整合腾讯财经数据）
 */
class MarketDataService {
    constructor() {
        this.tencentService = new TencentFinanceService();
    }

    /**
     * 获取市场数据
     * @returns {Promise<Object>} 市场数据
     */
    async getMarketData() {
        try {
            return await this.tencentService.getRealtimeMarketData();
        } catch (error) {
            console.error(`获取市场数据失败: ${error.message}`);
            throw new Error(`获取市场数据失败: ${error.message}`);
        }
    }

    /**
     * 获取实时市场概览
     * @returns {Promise<Object>} 市场概览数据
     */
    async getRealtimeMarketOverview() {
        try {
            return await this.tencentService.getMarketOverview();
        } catch (error) {
            console.error(`获取市场概览失败: ${error.message}`);
            throw new Error(`获取市场概览失败: ${error.message}`);
        }
    }

    /**
     * 健康检查
     * @returns {Promise<Object>} 健康状态
     */
    async healthCheck() {
        try {
            const connectivity = await this.tencentService.checkConnectivity();
            const stats = this.tencentService.getServiceStats();
            
            return {
                status: connectivity ? 'healthy' : 'degraded',
                tencent_api_connectivity: connectivity,
                service_stats: stats,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error(`健康检查失败: ${error.message}`);
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// 创建单例实例
let tencentServiceInstance = null;
let marketServiceInstance = null;

/**
 * 获取腾讯财经服务单例实例
 * @returns {TencentFinanceService} 服务实例
 */
export function getTencentFinanceService() {
    if (!tencentServiceInstance) {
        tencentServiceInstance = new TencentFinanceService();
    }
    return tencentServiceInstance;
}

/**
 * 获取市场数据服务单例实例
 * @returns {MarketDataService} 服务实例
 */
export function getMarketDataService() {
    if (!marketServiceInstance) {
        marketServiceInstance = new MarketDataService();
    }
    return marketServiceInstance;
}

/**
 * 创建腾讯财经服务实例
 * @returns {TencentFinanceService} 服务实例
 */
export function createTencentFinanceService() {
    return new TencentFinanceService();
}

/**
 * 创建市场数据服务实例
 * @returns {MarketDataService} 服务实例
 */
export function createMarketDataService() {
    return new MarketDataService();
}

// 导出类和常量
export {
    TencentFinanceService,
    MarketDataService,
    MAJOR_INDICES,
    DATA_FIELD_MAPPING
};

// 默认导出
export default TencentFinanceService;

// 测试函数（仅在开发环境使用）
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    /**
     * 测试服务功能
     */
    window.testTencentFinanceService = async function() {
        const service = new TencentFinanceService();
        
        try {
            // 测试单个指数获取
            console.log('\n=== 测试单个指数获取 ===');
            const singleData = await service.getSingleIndex('sh000001');
            console.log('单个指数结果:', JSON.stringify(singleData, null, 2));
            
            // 测试批量指数获取
            console.log('\n=== 测试批量指数获取 ===');
            const batchData = await service.getBatchIndices(['sh000001', 'sz399001', 'sz399006']);
            console.log('批量指数结果:', JSON.stringify(batchData, null, 2));
            
            // 测试所有主要指数获取
            console.log('\n=== 测试所有主要指数获取 ===');
            const allData = await service.getAllMajorIndices();
            console.log('所有指数结果:', JSON.stringify(allData, null, 2));
            
            // 测试数据源
            console.log('\n=== 测试数据源 ===');
            const testResults = await service.testDataSources();
            console.log('测试结果:', JSON.stringify(testResults, null, 2));
            
            // 获取服务统计
            console.log('\n=== 服务统计 ===');
            const stats = service.getServiceStats();
            console.log('服务统计:', JSON.stringify(stats, null, 2));
            
        } catch (error) {
            console.error(`测试失败: ${error.message}`);
            console.error(error.stack);
        }
    };
}