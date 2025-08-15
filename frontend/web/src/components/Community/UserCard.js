import React from 'react';
import { Card, Avatar, Button, Tag, Tooltip, Space } from 'antd';
import { 
  UserAddOutlined, 
  UserDeleteOutlined,
  MessageOutlined,
  TrophyOutlined,
  StarOutlined,
  EyeOutlined
} from '@ant-design/icons';
import './UserCard.css';

const UserCard = ({ 
  user, 
  onFollow, 
  onUnfollow, 
  onMessage, 
  onViewProfile,
  currentUserId,
  showActions = true 
}) => {
  const isCurrentUser = currentUserId === user.user_id;
  const isFollowing = user.is_following;

  const handleFollow = (e) => {
    e.stopPropagation();
    if (isFollowing) {
      onUnfollow && onUnfollow(user.user_id);
    } else {
      onFollow && onFollow(user.user_id);
    }
  };

  const handleMessage = (e) => {
    e.stopPropagation();
    onMessage && onMessage(user.user_id);
  };

  const handleCardClick = () => {
    onViewProfile && onViewProfile(user.user_id);
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getLevelColor = (level) => {
    const levelColors = {
      '新手': 'default',
      '初级': 'green',
      '中级': 'blue',
      '高级': 'purple',
      '专家': 'gold'
    };
    return levelColors[level] || 'default';
  };

  const getLevelIcon = (level) => {
    if (level === '专家') {
      return <TrophyOutlined />;
    }
    return null;
  };

  return (
    <Card 
      className="user-card" 
      hoverable
      onClick={handleCardClick}
    >
      {/* 用户头像和基本信息 */}
      <div className="user-header">
        <div className="avatar-section">
          <Avatar 
            src={user.avatar_url} 
            size={64}
            className="user-avatar"
          >
            {user.nickname?.charAt(0) || user.username?.charAt(0)}
          </Avatar>
          {user.is_online && <div className="online-indicator" />}
        </div>
        
        <div className="user-info">
          <div className="user-name">
            <Tooltip title={user.nickname || user.username}>
              <span>{user.nickname || user.username}</span>
            </Tooltip>
            {getLevelIcon(user.level)}
          </div>
          
          <div className="user-meta">
            <Tag 
              color={getLevelColor(user.level)} 
              className="level-tag"
            >
              {user.level}
            </Tag>
            <span className="join-time">
              加入于 {new Date(user.created_at).getFullYear()}
            </span>
          </div>
          
          {user.bio && (
            <div className="user-bio">
              <Tooltip title={user.bio}>
                {user.bio}
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      {/* 用户统计 */}
      <div className="user-stats">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{formatNumber(user.strategies_count || 0)}</div>
            <div className="stat-label">策略</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatNumber(user.followers_count || 0)}</div>
            <div className="stat-label">粉丝</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatNumber(user.following_count || 0)}</div>
            <div className="stat-label">关注</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatNumber(user.points || 0)}</div>
            <div className="stat-label">积分</div>
          </div>
        </div>
      </div>

      {/* 最近活动 */}
      {user.recent_strategies && user.recent_strategies.length > 0 && (
        <div className="recent-activity">
          <div className="activity-title">最近策略</div>
          <div className="recent-strategies">
            {user.recent_strategies.slice(0, 2).map(strategy => (
              <div key={strategy.id} className="recent-strategy">
                <div className="strategy-name">
                  <Tooltip title={strategy.title}>
                    {strategy.title}
                  </Tooltip>
                </div>
                <div className="strategy-stats">
                  <span className="stat">
                    <StarOutlined /> {formatNumber(strategy.stars_count || 0)}
                  </span>
                  <span className="stat">
                    <EyeOutlined /> {formatNumber(strategy.views_count || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      {showActions && !isCurrentUser && (
        <div className="user-actions">
          <Space size="small" style={{ width: '100%' }}>
            <Button 
              type={isFollowing ? "default" : "primary"}
              size="small"
              icon={isFollowing ? <UserDeleteOutlined /> : <UserAddOutlined />}
              onClick={handleFollow}
              className={isFollowing ? "unfollow-btn" : "follow-btn"}
              style={{ flex: 1 }}
            >
              {isFollowing ? '取消关注' : '关注'}
            </Button>
            <Button 
              size="small"
              icon={<MessageOutlined />}
              onClick={handleMessage}
              style={{ flex: 1 }}
            >
              私信
            </Button>
          </Space>
        </div>
      )}

      {/* 当前用户标识 */}
      {isCurrentUser && (
        <div className="current-user-badge">
          <Tag color="blue">这是你</Tag>
        </div>
      )}
    </Card>
  );
};

export default UserCard;