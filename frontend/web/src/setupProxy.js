const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🚀 SETUPPROXY.JS 已加载！');
  console.log('当前时间:', new Date().toISOString());
  

  
  // 代理股票管理API请求到股票管理服务
  console.log('🔧 设置股票管理API代理: /api/v2/management -> http://localhost:8005');
  app.use(
    '/api/v2/management',
    createProxyMiddleware({
      target: 'http://localhost:8005',
      changeOrigin: true,
      logLevel: 'silent',
      onError: (err, req, res) => {
        console.error('❌ 股票管理代理错误:', err.message);
      }
    })
  );

  // 代理大盘数据服务API请求到API网关
  console.log('🔧 设置大盘数据API代理: /api/v1/market -> http://localhost:8000');
  app.use(
    '/api/v1/market',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      logLevel: 'debug',
      pathRewrite: {
        '^/(.*)': '/api/v1/market/$1' // 将剥离后的路径重新添加前缀
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('📤 大盘数据代理请求:', req.method, req.url, '->', proxyReq.path);
        console.log('📤 目标地址:', proxyReq.protocol + '//' + proxyReq.getHeader('host') + proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('📥 大盘数据代理响应:', req.url, '状态:', proxyRes.statusCode);
        console.log('📥 响应头:', proxyRes.headers);
      },
      onError: (err, req, res) => {
        console.error('❌ 大盘数据代理错误:', err.message);
        console.error('❌ 请求URL:', req.url);
      }
    })
  );
  
  // 代理调度器API请求直接到市场数据服务
  console.log('🔧 设置调度器API代理: /api/v1/scheduler -> http://localhost:5002');
  app.use(
    '/api/v1/scheduler',
    createProxyMiddleware({
      target: 'http://localhost:5002',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('📤 调度器代理请求:', req.method, req.url, '->', proxyReq.path);
        console.log('📤 目标地址:', proxyReq.protocol + '//' + proxyReq.getHeader('host') + proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('📥 调度器代理响应:', req.url, '状态:', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('❌ 调度器代理错误:', err.message);
        console.error('❌ 请求URL:', req.url);
      }
    })
  );
  
  // 代理股票查询API请求到股票查询服务
  console.log('🔧 设置股票查询API代理: /api/stock -> http://localhost:5001');
  app.use(
    '/api/stock',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      logLevel: 'silent',
      onError: (err, req, res) => {
        console.error('❌ 股票查询代理错误:', err.message);
      }
    })
  );

  // 移除错误的 /v1 代理规则，因为API网关的认证路由是 /api/v1/auth/*
  // console.log('🔧 设置认证API代理: /v1 -> http://localhost:8000');
  // app.use(
  //   '/v1',
  //   createProxyMiddleware({
  //     target: 'http://localhost:8000',
  //     changeOrigin: true,
  //     logLevel: 'silent',
  //     onError: (err, req, res) => {
  //       console.error('❌ 认证API代理错误:', err.message);
  //     }
  //   })
  // );

  // 代理AI策略服务API请求到AI策略服务
  console.log('🔧 设置AI策略API代理: /api/v1/ai -> http://localhost:8006');
  app.use(
    '/api/v1/ai',
    createProxyMiddleware({
      target: 'http://localhost:8006',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('📤 AI策略代理请求:', req.method, req.url, '->', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('📥 AI策略代理响应:', req.url, '状态:', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('❌ AI策略代理错误:', err.message);
      }
    })
  );

  // 代理多模型AI策略服务API请求到API网关
  console.log('🔧 设置多模型AI策略API代理: /api/v1/multi-llm -> http://localhost:8000');
  app.use(
    '/api/v1/multi-llm',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('📤 多模型AI策略代理请求:', req.method, req.url, '->', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('📥 多模型AI策略代理响应:', req.url, '状态:', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('❌ 多模型AI策略代理错误:', err.message);
      }
    })
  );

  // 代理其他API请求到后端网关
  console.log('🔧 设置通用API代理: /api -> http://localhost:8000 (排除已定义的特定路径)');
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      logLevel: 'debug',
      filter: (pathname, req) => {
        // 只代理以/api开头但不匹配前面特定规则的请求
        const shouldProxy = pathname.startsWith('/api') && 
          !pathname.startsWith('/api/v2/management') && 
          !pathname.startsWith('/api/stock') && 
          !pathname.startsWith('/api/tencent') &&
          !pathname.startsWith('/api/v1/market') &&
          !pathname.startsWith('/api/v1/scheduler') &&
          !pathname.startsWith('/api/v1/ai') &&
          !pathname.startsWith('/api/v1/multi-llm');
        console.log('🔍 通用API代理过滤:', pathname, '-> 代理:', shouldProxy);
        return shouldProxy;
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('📤 通用API代理请求:', req.method, req.url, '->', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('📥 通用API代理响应:', req.url, '状态:', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('❌ 通用API代理错误:', err.message);
      }
    })
  );
};