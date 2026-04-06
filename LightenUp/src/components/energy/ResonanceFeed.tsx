import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnergyService } from '../../api/energyService';
import { EnergyMoment } from '../../api/energyTypes';
import { Tooltip, Image, Modal, message, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { clearEnergyPublishDraft, EnergyPublishDraft, readEnergyPublishDraft } from '../../pages/energy/draftStorage';
import './ResonanceFeed.scss';

const ResonanceFeed: React.FC = () => {
  const navigate = useNavigate();
  const [moments, setMoments] = useState<EnergyMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<EnergyPublishDraft | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFeed = async () => {
      setDraft(readEnergyPublishDraft());
      try {
        const { items } = await EnergyService.getFeed({ page: 1, limit: 10 });
        setMoments(items);
      } catch (error) {
        console.error('Failed to load feed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const handleDiscardDraft = () => {
    Modal.confirm({
      title: '清空草稿',
      content: '清空后将无法恢复，确定删除这份草稿吗？',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        clearEnergyPublishDraft();
        setDraft(null);
        message.success('草稿已清空');
      },
    });
  };

  const handleDelete = (momentId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条动态吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await EnergyService.deleteMoment(momentId);
          message.success('删除成功');
          setMoments((prev) => prev.filter((m) => m.id !== momentId));
        } catch (error) {
          console.error('Failed to delete moment:', error);
          message.error('删除失败，请重试');
        }
      },
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getDraftSummary = () => {
    if (!draft) return '';
    const text = draft.content.trim();
    if (text) return text.length > 48 ? `${text.slice(0, 48)}...` : text;
    if (draft.files.length > 0) return `已保存 ${draft.files.length} 个媒体文件`;
    if (draft.mood) return `已保存心情：${draft.mood.name}`;
    if (draft.selectedTypeId !== null || draft.selectedStickerId !== null) return '已保存当前心情选择';
    return '继续完善这条未发布的记录';
  };

  const getMediaLayout = (count: number) => {
    const gap = 4;
    if (count <= 1) return { cols: 1, cell: 168, gap };
    if (count === 4) return { cols: 2, cell: 112, gap };
    if (count === 2) return { cols: 2, cell: 112, gap };
    if (count === 3) return { cols: 3, cell: 104, gap };
    return { cols: 3, cell: 104, gap };
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="feed-container">
      {draft && (
        <div className="draft-card">
          <div className="draft-meta">
            <span className="draft-badge">草稿箱</span>
            <span className="draft-time">{formatDate(draft.savedAt)}</span>
          </div>
          {draft.mood && (
            <div className="draft-mood">
              <div
                className="draft-mood-icon"
                style={{ backgroundColor: `${draft.mood.colorHex}20`, color: draft.mood.colorHex }}
              >
                {draft.mood.stickerUrl || draft.mood.iconCode}
              </div>
              <span className="draft-mood-name">{draft.mood.name}</span>
            </div>
          )}
          <div className="draft-title">你有一条未发布的记录</div>
          <div className="draft-content">{getDraftSummary()}</div>
          <div className="draft-footer">
            <span className="draft-count">
              {draft.files.length > 0 ? `${draft.files.length} 个附件` : '暂无附件'}
            </span>
            <div className="draft-actions">
              <button className="draft-link" onClick={handleDiscardDraft}>
                清空
              </button>
              <button className="draft-primary" onClick={() => navigate('/energy/publish')}>
                继续编辑
              </button>
            </div>
          </div>
        </div>
      )}

      {moments.map((moment) => (
        <div key={moment.id} className="feed-item">
          {/* 左侧头像区 */}
          <div className="item-left">
            <div 
              className="avatar-wrapper"
              style={{ backgroundColor: `${moment.energy_type?.color_hex}20` }}
            >
              <Tooltip 
                title={moment.energy_type?.name} 
                color={moment.energy_type?.color_hex}
                placement="right"
              >
                <span>
                  {moment.sticker?.sticker_url || moment.energy_type?.icon_code}
                </span>
              </Tooltip>
            </div>
          </div>

          {/* 右侧内容区 */}
          <div className="item-right">
            <div className="item-header">
              <span className="user-name">
                {moment.energy_type?.name.split('/')[0]}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="time">{formatDate(moment.created_at)}</span>
                {user?.id === moment.user_id && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(moment.id);
                    }}
                  />
                )}
              </div>
            </div>

            <div className="item-content">
              {moment.content_text}
            </div>
            
            {/* 媒体展示 - 九宫格适配 */}
            {moment.media && moment.media.length > 0 && (
              (() => {
                const layout = getMediaLayout(moment.media.length)
                return (
                  <div
                    className="media-grid"
                    style={{
                      gridTemplateColumns: `repeat(${layout.cols}, ${layout.cell}px)`,
                      gap: `${layout.gap}px`,
                    }}
                  >
                    <Image.PreviewGroup>
                      {moment.media.map((media) => (
                        <Image
                          key={media.id}
                          src={media.file_url}
                          alt="动态图片"
                          width={layout.cell}
                          height={layout.cell}
                          style={{ objectFit: 'cover', display: 'block' }}
                        />
                      ))}
                    </Image.PreviewGroup>
                  </div>
                )
              })()
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResonanceFeed;
