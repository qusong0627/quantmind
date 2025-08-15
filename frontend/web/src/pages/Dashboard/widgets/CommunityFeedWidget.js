import React, { useState, useEffect } from 'react';
import { List, Avatar, Tag, Button, Badge } from 'antd';
import { TeamOutlined, HeartOutlined, CommentOutlined, ShareAltOutlined, UserOutlined, SendOutlined } from '@ant-design/icons';

function CommunityFeedWidget() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟获取社区动态数据
    const fetchPosts = () => {
      setTimeout(() => {
        setPosts([
          {
            id: 1,
            author: {
              name: '量化大师',
              avatar: null,
              level: 'VIP'
            },
            content: '今日市场分析：科技股表现强劲，建议关注AI相关概念股。我的量化策略在今天获得了3.2%的收益。',
            timestamp: '2小时前',
            likes: 24,
            comments: 8,
            shares: 3,
            tags: ['市场分析', '科技股', 'AI']
          },
          {
            id: 2,
            author: {
              name: '策略研究员',
              avatar: null,
              level: '专家'
            },
            content: '分享一个新的均值回归策略，回测年化收益率达到15.8%，最大回撤仅6.2%。有兴趣的朋友可以交流讨论。',
            timestamp: '4小时前',
            likes: 18,
            comments: 12,
            shares: 5,
            tags: ['策略分享', '均值回归', '回测']
          },
          {
            id: 3,
            author: {
              name: '投资小白',
              avatar: null,
              level: '新手'
            },
            content: '请教各位大神，如何设置止损点比较合理？我总是在震荡中被洗出来。',
            timestamp: '6小时前',
            likes: 12,
            comments: 15,
            shares: 2,
            tags: ['新手求助', '止损', '风控']
          },
          {
            id: 4,
            author: {
              name: '技术分析师',
              avatar: null,
              level: '专家'
            },
            content: '从技术面看，上证指数已经突破关键阻力位，预计后市还有上涨空间。建议逢低布局优质蓝筹股。',
            timestamp: '8小时前',
            likes: 31,
            comments: 6,
            shares: 8,
            tags: ['技术分析', '上证指数', '蓝筹股']
          }
        ]);
        setLoading(false);
      }, 1000);
    };

    fetchPosts();
  }, []);

  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1, liked: !post.liked }
        : post
    ));
  };

  const handleComment = (postId) => {
    console.log('评论帖子:', postId);
  };

  const handleShare = (postId) => {
    console.log('分享帖子:', postId);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'VIP': return '#f50';
      case '专家': return '#1890ff';
      case '新手': return '#52c41a';
      default: return '#666';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'VIP': return '👑';
      case '专家': return '🎯';
      case '新手': return '🌱';
      default: return '👤';
    }
  };

  return (
    <div className="widget-content community-feed-widget community-scroll-container">
      <div className="widget-header">
        <div className="widget-title">
          <TeamOutlined className="widget-icon" />
          <span>社区动态 <Badge count={posts.length} showZero className="widget-badge" /></span>
        </div>
        <Button type="link" size="small" icon={<SendOutlined />} className="widget-action">
          查看更多
        </Button>
      </div>
      <div className="widget-body community-scroll-body">
        <div className="community-list">
          <List
            itemLayout="vertical"
            dataSource={posts}
            loading={loading}
            className="community-feed-scroll"
            renderItem={(item) => (
              <List.Item
                key={item.id}
                className="community-item"
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      size={32} 
                      icon={<UserOutlined />}
                      className={`user-avatar level-${item.author.level.toLowerCase()}`}
                    />
                  }
                  title={
                    <div className="post-header">
                      <div className="user-info">
                        <span className="user-name">{item.author.name}</span>
                        <span 
                          className="user-level"
                          style={{ backgroundColor: getLevelColor(item.author.level) }}
                        >
                          {getLevelIcon(item.author.level)} {item.author.level}
                        </span>
                      </div>
                      <span className="post-time">{item.timestamp}</span>
                    </div>
                  }
                  description={
                    <>
                      <div className="post-content">{item.content}</div>
                      <div className="post-tags">
                        {item.tags.map(tag => (
                          <Tag key={tag} size="small">
                            #{tag}
                          </Tag>
                        ))}
                      </div>
                      <div className="post-actions">
                        <div 
                          className={`action-item ${item.liked ? 'liked' : ''}`}
                          onClick={() => handleLike(item.id)}
                        >
                          <HeartOutlined />
                          <span className="action-count">{item.likes}</span>
                        </div>
                        <div 
                          className="action-item"
                          onClick={() => handleComment(item.id)}
                        >
                          <CommentOutlined />
                          <span className="action-count">{item.comments}</span>
                        </div>
                        <div 
                          className="action-item"
                          onClick={() => handleShare(item.id)}
                        >
                          <ShareAltOutlined />
                          <span className="action-count">分享</span>
                        </div>
                      </div>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default CommunityFeedWidget;