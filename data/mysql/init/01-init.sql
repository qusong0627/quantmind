-- QuantMind数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS quantmind CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE quantmind;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建策略表
CREATE TABLE IF NOT EXISTS strategies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    status ENUM('draft', 'active', 'inactive') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建回测结果表
CREATE TABLE IF NOT EXISTS backtest_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    strategy_id INT NOT NULL,
    user_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital DECIMAL(15,2) NOT NULL,
    final_capital DECIMAL(15,2) NOT NULL,
    total_return DECIMAL(10,4) NOT NULL,
    sharpe_ratio DECIMAL(10,4),
    max_drawdown DECIMAL(10,4),
    results_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建数据源配置表
CREATE TABLE IF NOT EXISTS data_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('stock', 'index', 'forex', 'crypto') NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    source VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    config_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入示例数据
INSERT INTO users (username, email, password_hash, full_name) VALUES
('admin', 'admin@quantmind.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQxqHh2O', 'Administrator'),
('demo', 'demo@quantmind.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQxqHh2O', 'Demo User');

INSERT INTO data_sources (name, type, symbol, source) VALUES
('上证指数', 'index', '000001.SH', 'tushare'),
('深证成指', 'index', '399001.SZ', 'tushare'),
('创业板指', 'index', '399006.SZ', 'tushare'),
('沪深300', 'index', '000300.SH', 'tushare'),
('中证500', 'index', '000905.SH', 'tushare');

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_status ON strategies(status);
CREATE INDEX idx_backtest_results_strategy_id ON backtest_results(strategy_id);
CREATE INDEX idx_backtest_results_user_id ON backtest_results(user_id);
CREATE INDEX idx_data_sources_symbol ON data_sources(symbol);
CREATE INDEX idx_data_sources_type ON data_sources(type);
