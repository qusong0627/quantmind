import React, { useState, useEffect } from 'react';
import { 
  List, 
  Avatar, 
  Button, 
  Input, 
  message, 
  Tooltip, 
  Dropdown, 
  Modal,
  Tag,
  Space
} from 'antd';
import { 
  LikeOutlined, 
  LikeFilled,
  MessageOutlined,
  MoreOutlined,
  DeleteOutlined,
  EditOutlined,
  FlagOutlined
} from '@ant-design/icons';
import './CommentList.css';

const { TextArea } = Input;

const CommentItem = ({ 
  comment, 
  onReply, 
  onLike, 
  onEdit, 
  onDelete, 
  onReport,
  currentUserId,
  level = 0 
}) => {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);

  const isOwner = currentUserId === comment.user_id;
  const isLiked = comment.user_liked;

  const handleLike = async () => {
    try {
      setLoading(true);
      await onLike(comment.comment_id);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      message.warning('请输入回复内容');
      return;
    }
    
    try {
      setLoading(true);
      await onReply(comment.comment_id, replyContent);
      setReplyContent('');
      setShowReply(false);
      message.success('回复成功');
    } catch (error) {
      message.error('回复失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) {
      message.warning('请输入评论内容');
      return;
    }
    
    try {
      setLoading(true);
      await onEdit(comment.comment_id, editContent);
      setIsEditing(false);
      message.success('编辑成功');
    } catch (error) {
      message.error('编辑失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条评论吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await onDelete(comment.comment_id);
          message.success('删除成功');
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleReport = () => {
    Modal.confirm({
      title: '举报评论',
      content: '确定要举报这条评论吗？我们会尽快处理。',
      okText: '举报',
      cancelText: '取消',
      onOk: async () => {
        try {
          await onReport(comment.comment_id);
          message.success('举报成功');
        } catch (error) {
          message.error('举报失败');
        }
      }
    });
  };

  const getMenuItems = () => {
    const items = [];
    
    if (isOwner) {
      items.push(
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: '编辑',
          onClick: () => setIsEditing(true)
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: '删除',
          danger: true,
          onClick: handleDelete
        }
      );
    } else {
      items.push({
        key: 'report',
        icon: <FlagOutlined />,
        label: '举报',
        onClick: handleReport
      });
    }
    
    return items;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return time.toLocaleDateString();
  };

  return (
    <div className={`comment-item level-${level}`}>
      <div className="comment-main">
        <Avatar 
          src={comment.author?.avatar_url} 
          size={level === 0 ? 36 : 32}
          className="comment-avatar"
        >
          {comment.author?.nickname?.charAt(0) || comment.author?.username?.charAt(0)}
        </Avatar>
        
        <div className="comment-content">
          <div className="comment-header">
            <div className="author-info">
              <span className="author-name">
                {comment.author?.nickname || comment.author?.username}
              </span>
              {comment.author?.level && (
                <Tag 
                  color={comment.author.level === '专家' ? 'gold' : 'blue'} 
                  size="small"
                >
                  {comment.author.level}
                </Tag>
              )}
              <span className="comment-time">
                {formatTime(comment.created_at)}
              </span>
              {comment.updated_at !== comment.created_at && (
                <span className="edited-mark">已编辑</span>
              )}
            </div>
            
            <Dropdown 
              menu={{ items: getMenuItems() }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button 
                type="text" 
                size="small" 
                icon={<MoreOutlined />}
                className="comment-menu"
              />
            </Dropdown>
          </div>
          
          {/* 回复目标 */}
          {comment.parent_author && (
            <div className="reply-target">
              回复 <span className="target-name">@{comment.parent_author.nickname}</span>:
            </div>
          )}
          
          {/* 评论内容 */}
          <div className="comment-body">
            {isEditing ? (
              <div className="edit-form">
                <TextArea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  maxLength={500}
                  showCount
                />
                <div className="edit-actions">
                  <Space>
                    <Button 
                      size="small" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(comment.content);
                      }}
                    >
                      取消
                    </Button>
                    <Button 
                      type="primary" 
                      size="small" 
                      loading={loading}
                      onClick={handleEdit}
                    >
                      保存
                    </Button>
                  </Space>
                </div>
              </div>
            ) : (
              <div className="comment-text">
                {comment.content}
              </div>
            )}
          </div>
          
          {/* 评论操作 */}
          <div className="comment-actions">
            <Tooltip title={isLiked ? '取消点赞' : '点赞'}>
              <Button 
                type="text" 
                size="small"
                icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
                className={`action-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                loading={loading}
              >
                {comment.likes_count || 0}
              </Button>
            </Tooltip>
            
            <Button 
              type="text" 
              size="small"
              icon={<MessageOutlined />}
              className="action-btn"
              onClick={() => setShowReply(!showReply)}
            >
              回复
            </Button>
          </div>
          
          {/* 回复框 */}
          {showReply && (
            <div className="reply-form">
              <TextArea 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`回复 @${comment.author?.nickname || comment.author?.username}...`}
                rows={3}
                maxLength={500}
                showCount
              />
              <div className="reply-actions">
                <Space>
                  <Button 
                    size="small" 
                    onClick={() => {
                      setShowReply(false);
                      setReplyContent('');
                    }}
                  >
                    取消
                  </Button>
                  <Button 
                    type="primary" 
                    size="small" 
                    loading={loading}
                    onClick={handleReply}
                  >
                    回复
                  </Button>
                </Space>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 子评论 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.comment_id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
              currentUserId={currentUserId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentList = ({ 
  targetType, 
  targetId, 
  comments = [], 
  loading = false,
  onLoadMore,
  hasMore = false,
  onCreateComment,
  onReplyComment,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onReportComment,
  currentUserId
}) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      message.warning('请输入评论内容');
      return;
    }
    
    try {
      setSubmitting(true);
      await onCreateComment({
        target_type: targetType,
        target_id: targetId,
        content: newComment
      });
      setNewComment('');
      message.success('评论成功');
    } catch (error) {
      message.error('评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-list">
      {/* 评论输入框 */}
      <div className="comment-editor">
        <div className="editor-header">
          <h4>发表评论</h4>
          <span className="comment-count">
            共 {comments.length} 条评论
          </span>
        </div>
        
        <div className="editor-body">
          <TextArea 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的评论..."
            rows={4}
            maxLength={500}
            showCount
          />
          <div className="editor-actions">
            <Button 
              type="primary" 
              loading={submitting}
              onClick={handleSubmit}
              disabled={!newComment.trim()}
            >
              发表评论
            </Button>
          </div>
        </div>
      </div>
      
      {/* 评论列表 */}
      <div className="comments-container">
        {comments.length === 0 ? (
          <div className="empty-comments">
            <div className="empty-icon">💬</div>
            <div className="empty-text">暂无评论，来发表第一条评论吧！</div>
          </div>
        ) : (
          <>
            {comments.map(comment => (
              <CommentItem
                key={comment.comment_id}
                comment={comment}
                onReply={onReplyComment}
                onLike={onLikeComment}
                onEdit={onEditComment}
                onDelete={onDeleteComment}
                onReport={onReportComment}
                currentUserId={currentUserId}
                level={0}
              />
            ))}
            
            {hasMore && (
              <div className="load-more">
                <Button 
                  type="link" 
                  loading={loading}
                  onClick={onLoadMore}
                >
                  加载更多评论
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentList;