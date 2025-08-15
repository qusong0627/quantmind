/**
 * 股票数据服务API客户端
 * 集成AkShare和Baostock数据源
 */

const API_BASE_URL = '';

class StockDataService {
  /**
   * 获取实时市场指数数据
   */
  async getRealtimeMarketData() {
    try {
      // 使用多种数据源
      const response = await fetch(`/api/v1/market/realtime`);
      const data = await response.json();
      
      if (data.success) {
        // 转换为前端期望的格式
        return {
          marketIndices: data.data
        };
      } else {
        throw new Error(data.message || '获取实时市场数据失败');
      }
    } catch (error) {
      console.error('获取实时市场数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取单只股票实时数据
   * @param {string} symbol - 股票代码
   * @param {string} exchange - 交易所代码，默认为XSHG
   */
  async getStockRealtimeData(symbol, exchange = 'XSHG') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stocks/${symbol}/realtime?exchange=${exchange}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || `获取股票${symbol}实时数据失败`);
      }
    } catch (error) {
      console.error(`获取股票${symbol}实时数据失败:`, error);
      throw error;
    }
  }

  /**
   * 获取股票历史数据
   * @param {string} symbol - 股票代码
   * @param {string} startDate - 开始日期 (YYYY-MM-DD)
   * @param {string} endDate - 结束日期 (YYYY-MM-DD)
   * @param {string} frequency - 频率 (d/w/m)
   */
  async getStockHistoryData(symbol, startDate, endDate, frequency = 'd') {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        frequency: frequency
      });
      
      const response = await fetch(`${API_BASE_URL}/api/v1/stock/history/${symbol}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || `获取股票${symbol}历史数据失败`);
      }
    } catch (error) {
      console.error(`获取股票${symbol}历史数据失败:`, error);
      throw error;
    }
  }

  /**
   * 搜索股票
   * @param {string} keywords - 搜索关键词
   * @param {number} limit - 返回结果数量限制
   */
  async searchStocks(keywords, limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stocks/search?keyword=${encodeURIComponent(keywords)}&limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || '搜索股票失败');
      }
    } catch (error) {
      console.error('搜索股票失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门股票
   * @param {number} limit - 返回数量限制
   */
  async getHotStocks(limit = 10) {
    try {
      // 暂时使用上海证券交易所的前几只股票作为热门股票
      const response = await fetch(`${API_BASE_URL}/api/stocks/list?exchange_code=XSHG&limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data.stocks;
      } else {
        throw new Error(data.message || '获取热门股票失败');
      }
    } catch (error) {
      console.error('获取热门股票失败:', error);
      throw error;
    }
  }

  /**
   * 获取股票列表
   * @param {string} exchangeCode - 交易所代码
   * @param {string} keyword - 搜索关键词
   * @param {number} limit - 返回结果数量限制
   * @param {number} offset - 偏移量
   */
  async getStockList(exchangeCode = null, keyword = null, limit = 50, offset = 0) {
    try {
      let url = `${API_BASE_URL}/api/stocks/list?limit=${limit}&offset=${offset}`;
      if (exchangeCode) {
        url += `&exchange_code=${exchangeCode}`;
      }
      if (keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || '获取股票列表失败');
      }
    } catch (error) {
      console.error('获取股票列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取市场概览
   */
  async getMarketOverview() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/market/overview`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || '获取市场概览失败');
      }
    } catch (error) {
      console.error('获取市场概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取交易所股票列表
   * @param {string} exchangeCode - 交易所代码
   * @param {number} limit - 返回结果数量限制
   */
  async getExchangeStocks(exchangeCode, limit = 100) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/exchanges/${exchangeCode}/stocks?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || `获取${exchangeCode}交易所股票列表失败`);
      }
    } catch (error) {
      console.error(`获取${exchangeCode}交易所股票列表失败:`, error);
      throw error;
    }
  }

  /**
   * 格式化股票代码（添加市场后缀）
   * @param {string} code - 原始股票代码
   */
  formatStockCode(code) {
    if (code.includes('.')) {
      return code; // 已经包含市场后缀
    }
    
    // 根据代码前缀判断市场
    if (code.startsWith('6')) {
      return `${code}.SH`; // 上海市场
    } else if (code.startsWith('0') || code.startsWith('3')) {
      return `${code}.SZ`; // 深圳市场
    } else {
      return code; // 其他情况保持原样
    }
  }

  /**
   * 格式化价格显示
   * @param {number} price - 价格
   * @param {number} decimals - 小数位数
   */
  formatPrice(price, decimals = 2) {
    if (typeof price !== 'number' || isNaN(price)) {
      return '--';
    }
    return price.toFixed(decimals);
  }

  /**
   * 格式化涨跌幅显示
   * @param {number} changePercent - 涨跌幅
   */
  formatChangePercent(changePercent) {
    if (typeof changePercent !== 'number' || isNaN(changePercent)) {
      return '--';
    }
    
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  }

  /**
   * 格式化成交量显示
   * @param {number} volume - 成交量
   */
  formatVolume(volume) {
    if (typeof volume !== 'number' || isNaN(volume)) {
      return '--';
    }
    
    if (volume >= 100000000) {
      return `${(volume / 100000000).toFixed(2)}亿`;
    } else if (volume >= 10000) {
      return `${(volume / 10000).toFixed(2)}万`;
    } else {
      return volume.toString();
    }
  }

  /**
   * 获取涨跌颜色类名
   * @param {number} change - 涨跌额或涨跌幅
   */
  getChangeColorClass(change) {
    if (typeof change !== 'number' || isNaN(change)) {
      return '';
    }
    
    if (change > 0) {
      return 'stock-rise';
    } else if (change < 0) {
      return 'stock-fall';
    } else {
      return 'stock-flat';
    }
  }
}

// 创建单例实例
const stockDataService = new StockDataService();

// 导出具名函数
export const getRealtimeMarketData = () => stockDataService.getRealtimeMarketData();
export const getStockRealtimeData = (symbol, exchange) => stockDataService.getStockRealtimeData(symbol, exchange);
export const searchStocks = (keywords, limit) => stockDataService.searchStocks(keywords, limit);
export const getStockList = (exchangeCode, keyword, limit, offset) => stockDataService.getStockList(exchangeCode, keyword, limit, offset);
export const getMarketOverview = () => stockDataService.getMarketOverview();
export const getExchangeStocks = (exchangeCode, limit) => stockDataService.getExchangeStocks(exchangeCode, limit);

export default stockDataService;