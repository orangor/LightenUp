import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnergyType, Sticker } from '../../api/energyTypes';
import { EnergyService } from '../../api/energyService';
import MediaUploader from '../../components/energy/MediaUploader';
import EnergySelector from '../../components/energy/EnergySelector';
import './EnergyPublish.scss';

const EnergyPublish: React.FC = () => {
  const navigate = useNavigate();

  const [content, setContent] = useState('');
  const [files, setFiles] = useState<{ type: 'image' | 'video'; url: string }[]>([]);
  const [selectedType, setSelectedType] = useState<EnergyType | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 弹窗状态
  const [showSelector, setShowSelector] = useState(false);
  const [types, setTypes] = useState<EnergyType[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);

  // 加载配置
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { types, stickers } = await EnergyService.getConfig();
        setTypes(types);
        setStickers(stickers);
      } catch (error) {
        console.error('加载能量配置失败', error);
      }
    };
    fetchConfig();
  }, []);

  const handleSubmit = async () => {
    if (!selectedType || !selectedSticker) {
      // 这里的 alert 可能不会触发，因为按钮会被 disable，但保留作为兜底
      alert('请选择此刻的能量心情');
      return;
    }

    setIsSubmitting(true);
    try {
      // 真实文件上传逻辑需补充
      const media = files.map((f, i) => ({
        mediaType: f.type === 'image' ? 1 : 2,
        fileUrl: f.url,
        sortOrder: i + 1,
      }));

      await EnergyService.createMoment({
        energyTypeId: selectedType.id,
        stickerId: selectedSticker.id,
        content,
        media,
        visibility: 1, // 默认公开
      });
      navigate('/energy');
    } catch (error) {
      console.error('发布失败', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="publish-container">
      {/* 头部导航 */}
      <div className="publish-header">
        <button onClick={() => navigate(-1)} className="cancel-btn">
          取消
        </button>
        <h1 className="title">发布</h1>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedType || !selectedSticker}
          className="submit-btn"
        >
          {isSubmitting ? '发布中...' : '发布'}
        </button>
      </div>

      <div className="publish-content">
        {/* 核心心情选择区 */}
        <div 
          className="mood-section"
          onClick={() => setShowSelector(true)}
        >
          {selectedType && selectedSticker ? (
            <>
              <div 
                className="mood-circle filled"
                style={{ backgroundColor: selectedType.color_hex }}
              >
                {selectedSticker.sticker_url}
              </div>
              <span className="mood-label">
                {selectedType.name.split('/')[0]}
              </span>
            </>
          ) : (
            <>
              <div className="mood-circle empty">
                +
              </div>
              <span className="mood-label placeholder">选择此刻心情</span>
            </>
          )}
        </div>

        {/* 内容输入区 */}
          <div className="input-section">
            <textarea
              placeholder="写点什么... (可选)"
              className="content-textarea"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                // 简单的自适应高度：输入内容时自动撑开
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
            />
          
          {/* 多媒体上传 - 居中展示 */}
          <div className="flex justify-center w-full">
            <div className="w-full max-w-xs">
              <MediaUploader
                files={files}
                onFilesChange={setFiles}
                maxImages={9}
              />
            </div>
          </div>
        </div>

      </div>

      {/* 能量表情选择器 */}
      <EnergySelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        types={types}
        stickers={stickers}
        onSelect={(type, sticker) => {
          setSelectedType(type);
          setSelectedSticker(sticker);
        }}
      />
    </div>
  );
};

export default EnergyPublish;
