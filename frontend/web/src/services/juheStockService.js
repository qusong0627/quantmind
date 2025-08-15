/**
 * 聚合数据股票API服务
 * 提供沪深、港股、美股的实时数据
 */

const API_BASE_URL = '/api/v1/juhe';

class JuheStockService {
  /**
   * 获取市场指数数据
   * @param {string} marketType - 市场类型: sh(沪市), sz(深市), hk(港股), us(美股)
   * @returns {Promise<Object>}
   */
  async getMarketIndices(marketType) {
    try {
      const response = await fetch(`${API_BASE_URL}/market/${marketType}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || `获取${marketType}市场数据失败`);
      }
      
      return data;
    } catch (error) {
      console.error(`获取${marketType}市场指数失败:`, error);
      throw error;
    }
  }

  /**
   * 获取股票列表
   * @param {string} marketType - 市场类型
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>}
   */
  async getStockList(marketType, page = 1, limit = 20) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/stocks/${marketType}?page=${page}&limit=${limit}`
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || `获取${marketType}股票列表失败`);
      }
      
      return data;
    } catch (error) {
      console.error(`获取${marketType}股票列表失败:`, error);
      throw error;
    }
  }

  /**
   * 获取热门股票
   * @param {string} marketType - 市场类型
   * @param {number} limit - 数量限制
   * @returns {Promise<Object>}
   */
  async getHotStocks(marketType, limit = 10) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/hot/${marketType}?limit=${limit}`
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || `获取${marketType}热门股票失败`);
      }
      
      return data;
    } catch (error) {
      console.error(`获取${marketType}热门股票失败:`, error);
      throw error;
    }
  }

  /**
   * 搜索股票
   * @param {string} keywords - 搜索关键词
   * @param {number} limit - 结果数量限制
   * @returns {Promise<Object>}
   */
  async searchStocks(keywords, limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords,
          limit
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || '搜索股票失败');
      }
      
      return data;
    } catch (error) {
      console.error('搜索股票失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有市场的综合数据
   * @returns {Promise<Object>}
   */
  async getAllMarketsData() {
    try {
      const markets = ['sh', 'sz', 'hk', 'us'];
      const promises = markets.map(market => 
        this.getMarketIndices(market).catch(error => ({
          market,
          error: error.message,
          success: false
        }))
      );
      
      const results = await Promise.all(promises);
      
      return {
        success: true,
        data: results.reduce((acc, result, index) => {
          const market = markets[index];
          acc[market] = result.success !== false ? result : { error: result.error };
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取所有市场数据失败:', error);
      throw error;
    }
  }

  // 工具函数
  
  /**
   * 格式化价格
   * @param {number|string} price - 价格
   * @param {number} decimals - 小数位数
   * @returns {string}
   */
  formatPrice(price, decimals = 2) {
    if (price === null || price === undefined || price === '') {
      return '--';
    }
    return parseFloat(price).toFixed(decimals);
  }

  /**
   * 格式化涨跌幅
   * @param {number|string} change - 涨跌幅
   * @returns {string}
   */
  formatChangePercent(change) {
    if (change === null || change === undefined || change === '') {
      return '--';
    }
    const num = parseFloat(change);
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  }

  /**
   * 获取涨跌颜色类名
   * @param {number|string} change - 涨跌值
   * @returns {string}
   */
  getChangeColorClass(change) {
    if (change === null || change === undefined || change === '') {
      return '';
    }
    const num = parseFloat(change);
    if (num > 0) return 'stock-up';
    if (num < 0) return 'stock-down';
    return 'stock-neutral';
  }

  /**
   * 格式化成交量
   * @param {number|string} volume - 成交量
   * @returns {string}
   */
  formatVolume(volume) {
    if (volume === null || volume === undefined || volume === '') {
      return '--';
    }
    const num = parseFloat(volume);
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(2)}亿`;
    } else if (num >= 10000) {
      return `${(num / 10000).toFixed(2)}万`;
    }
    return num.toString();
  }

  /**
   * 获取市场名称
   * @param {string} marketType - 市场类型
   * @returns {string}
   */
  getMarketName(marketType) {
    const marketNames = {
      'sh': '沪市',
      'sz': '深市', 
      'hk': '港股',
      'us': '美股'
    };
    return marketNames[marketType] || marketType;
  }
}

// 创建单例实例
const juheStockService = new JuheStockService();

export default juheStockService;