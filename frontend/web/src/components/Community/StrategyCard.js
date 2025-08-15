import React from 'react';
import { Card, Avatar, Tag, Button, Tooltip } from 'antd';
import { 
  LikeOutlined, 
  StarOutlined, 
  EyeOutlined,
  LikeFilled,
  StarFilled,
  DownloadOutlined,
  CommentOutlined
} from '@ant-design/icons';
import './StrategyCard.css';

const StrategyCard = ({ 
  strategy, 
  onLike, 
  onStar, 
  onView, 
  onComment,
  onDownload,
  onViewDetails 
}) => {
  const handleLike = (e) => {
    e.stopPropagation();
    onLike && onLike(strategy.id);
  };

  const handleStar = (e) => {
    e.stopPropagation();
    onStar && onStar(strategy.id);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    onDownload && onDownload(strategy.id);
  };

  const handleComment = (e) => {
    e.stopPropagation();
    onComment && onComment(strategy.id);
  };

  const handleCardClick = () => {
    onView && onView(strategy.id);
    onViewDetails && onViewDetails(strategy.id);
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getReturnColor = (returnValue) => {
    if (returnValue > 0) return '#52c41a';
    if (returnValue < 0) return '#ff4d4f';
    return '#8c8c8c';
  };

  const getReturnPrefix = (returnValue) => {
    if (returnValue > 0) return '+';
    return '';
  };

  return (
    <Card 
      className="enhanced-strategy-card" 
      hoverable
      onClick={handleCardClick}
      cover={
        strategy.cover_image && (
          <div className="strategy-cover">
            <img src={strategy.cover_image} alt={strategy.title} />
          </div>
        )
      }
    >
      {/* 策略头部 */}
      <div className="strategy-header">
        <div className="author-info">
          <Avatar 
            src={strategy.author?.avatar} 
            size={36}
            className="author-avatar"
          >
            {strategy.author?.name?.charAt(0)}
          </Avatar>
          <div className="author-details">
            <div className="author-name">{strategy.author?.name}</div>
            <div className="author-meta">
              <Tag color="blue" size="small">{strategy.author?.level}</Tag>
              <span className="publish-time">{strategy.published_at}</span>
            </div>
          </div>
        </div>
        <div className="strategy-badges">
          {strategy.is_featured && (
            <Tag color="gold" className="featured-tag">精选</Tag>
          )}
          {strategy.is_hot && (
            <Tag color="red" className="hot-tag">热门</Tag>
          )}
        </div>
      </div>

      {/* 策略内容 */}
      <div className="strategy-content">
        <h3 className="strategy-title">
          <Tooltip title={strategy.title}>
            {strategy.title}
          </Tooltip>
        </h3>
        
        <p className="strategy-description">
          <Tooltip title={strategy.description}>
            {strategy.description}
          </Tooltip>
        </p>
        
        {/* 标签 */}
        <div className="strategy-tags">
          {strategy.tags?.slice(0, 3).map(tag => (
            <Tag key={tag} color="geekblue" className="strategy-tag">
              {tag}
            </Tag>
          ))}
          {strategy.tags?.length > 3 && (
            <Tag className="more-tags">+{strategy.tags.length - 3}</Tag>
          )}
        </div>

        {/* 回测数据 */}
        {strategy.backtest_return !== undefined && (
          <div className="backtest-stats">
            <div className="stat-item">
              <span className="stat-label">收益率:</span>
              <span 
                className="stat-value return-value"
                style={{ color: getReturnColor(strategy.backtest_return) }}
              >
                {getReturnPrefix(strategy.backtest_return)}{strategy.backtest_return}%
              </span>
            </div>
            {strategy.backtest_sharpe && (
              <div className="stat-item">
                <span className="stat-label">夏普:</span>
                <span className="stat-value">{strategy.backtest_sharpe}</span>
              </div>
            )}
            {strategy.backtest_max_drawdown && (
              <div className="stat-item">
                <span className="stat-label">最大回撤:</span>
                <span className="stat-value drawdown-value">
                  {strategy.backtest_max_drawdown}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* 互动统计 */}
        <div className="interaction-stats">
          <div className="stats-row">
            <Tooltip title="点赞">
              <div 
                className={`stat-item clickable ${strategy.user_liked ? 'liked' : ''}`}
                onClick={handleLike}
              >
                {strategy.user_liked ? <LikeFilled /> : <LikeOutlined />}
                <span>{formatNumber(strategy.likes_count || 0)}</span>
              </div>
            </Tooltip>
            
            <Tooltip title="收藏">
              <div 
                className={`stat-item clickable ${strategy.user_starred ? 'starred' : ''}`}
                onClick={handleStar}
              >
                {strategy.user_starred ? <StarFilled /> : <StarOutlined />}
                <span>{formatNumber(strategy.stars_count || 0)}</span>
              </div>
            </Tooltip>
            
            <Tooltip title="浏览">
              <div className="stat-item">
                <EyeOutlined />
                <span>{formatNumber(strategy.views_count || 0)}</span>
              </div>
            </Tooltip>
            
            <Tooltip title="评论">
              <div className="stat-item clickable" onClick={handleComment}>
                <CommentOutlined />
                <span>{formatNumber(strategy.comments_count || 0)}</span>
              </div>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="strategy-actions">
        <Button 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails && onViewDetails(strategy.id);
          }}
        >
          查看详情
        </Button>
        <Button 
          type="primary" 
          size="small"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
        >
          使用策略
        </Button>
      </div>
    </Card>
  );
};

export default StrategyCard;