import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnergyType, Sticker } from '../../api/energyTypes';
import { EnergyService } from '../../api/energyService';
import MediaUploader from '../../components/energy/MediaUploader';
import EnergySelector from '../../components/energy/EnergySelector';
import { clearEnergyPublishDraft, EnergyPublishDraft, readEnergyPublishDraft, saveEnergyPublishDraft } from './draftStorage';
import './EnergyPublish.scss';

const EnergyPublish: React.FC = () => {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState('');
  const [files, setFiles] = useState<{ type: 'image' | 'video'; url: string }[]>([]);
  const [selectedType, setSelectedType] = useState<EnergyType | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [types, setTypes] = useState<EnergyType[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [draftSelection, setDraftSelection] = useState<{ typeId: number | null; stickerId: number | null } | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);
  const [draftMood, setDraftMood] = useState<EnergyPublishDraft['mood']>(null);

  const syncTextareaHeight = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };

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

  useEffect(() => {
    const draft = readEnergyPublishDraft();
    if (!draft) {
      setHasHydratedDraft(true);
      return;
    }

    try {
      setContent(draft.content);
      setFiles(draft.files);
      setDraftMood(draft.mood);
      setDraftSelection({
        typeId: draft.selectedTypeId,
        stickerId: draft.selectedStickerId,
      });
      setDraftSavedAt(draft.savedAt || null);
    } finally {
      setHasHydratedDraft(true);
    }
  }, []);

  useEffect(() => {
    syncTextareaHeight();
  }, [content]);

  useEffect(() => {
    if (!draftSelection || types.length === 0) return;

    const matchedType =
      draftSelection.typeId !== null
        ? types.find((type) => type.id === draftSelection.typeId) || null
        : null;

    if (draftSelection.typeId !== null) {
      setSelectedType(matchedType);
    }

    const matchedSticker =
      draftSelection.stickerId !== null
        ? stickers.find((sticker) => sticker.id === draftSelection.stickerId) || null
        : null;
    const fallbackSticker = matchedType
      ? {
          id: draftSelection.stickerId ?? 0,
          energy_type_id: matchedType.id,
          sticker_url: matchedType.icon_code,
          sticker_name: matchedType.name,
          is_active: true,
        }
      : null;
    const effectiveSticker = matchedSticker || fallbackSticker;

    setSelectedSticker(effectiveSticker);
    if (matchedType && effectiveSticker) {
      setDraftMood({
        name: matchedType.name.split('/')[0],
        colorHex: matchedType.color_hex,
        iconCode: matchedType.icon_code,
        stickerUrl: effectiveSticker.sticker_url,
      });
    }

    setDraftSelection(null);
  }, [draftSelection, types, stickers]);

  useEffect(() => {
    if (!hasHydratedDraft) return;

    const draftFiles = files.filter((file) => !file.url.startsWith('blob:'));
    const selectedTypeId = selectedType?.id ?? draftSelection?.typeId ?? null;
    const selectedStickerId = selectedSticker?.id ?? draftSelection?.stickerId ?? null;
    const mood =
      selectedType && selectedSticker
        ? {
            name: selectedType.name.split('/')[0],
            colorHex: selectedType.color_hex,
            iconCode: selectedType.icon_code,
            stickerUrl: selectedSticker.sticker_url,
          }
        : draftMood;
    const hasDraft =
      content.trim().length > 0 ||
      draftFiles.length > 0 ||
      selectedTypeId !== null ||
      selectedStickerId !== null ||
      mood !== null;

    if (!hasDraft) {
      clearEnergyPublishDraft();
      setDraftSavedAt(null);
      return;
    }

    const nextSavedAt = new Date().toISOString();
    saveEnergyPublishDraft({
      content,
      files: draftFiles,
      selectedTypeId,
      selectedStickerId,
      mood,
      savedAt: nextSavedAt,
    });
    setDraftSavedAt(nextSavedAt);
  }, [content, draftMood, draftSelection, files, hasHydratedDraft, selectedSticker, selectedType]);

  const clearDraft = () => {
    clearEnergyPublishDraft();
    setContent('');
    setFiles([]);
    setSelectedType(null);
    setSelectedSticker(null);
    setDraftSelection(null);
    setDraftSavedAt(null);
    setDraftMood(null);
  };

  const effectiveSelectedType =
    selectedType ||
    (draftSelection?.typeId !== null && draftSelection?.typeId !== undefined
      ? types.find((type) => type.id === draftSelection.typeId) || (
          draftMood
            ? {
                id: draftSelection.typeId,
                name: draftMood.name,
                level_value: 0,
                color_hex: draftMood.colorHex,
                icon_code: draftMood.iconCode,
                description: '',
              }
            : null
        )
      : null);

  const effectiveSelectedSticker =
    selectedSticker ||
    (effectiveSelectedType &&
    draftSelection?.stickerId !== null &&
    draftSelection?.stickerId !== undefined
      ? stickers.find((sticker) => sticker.id === draftSelection.stickerId) || {
          id: draftSelection.stickerId,
          energy_type_id: effectiveSelectedType.id,
          sticker_url: draftMood?.stickerUrl || effectiveSelectedType.icon_code,
          sticker_name: draftMood?.name || effectiveSelectedType.name,
          is_active: true,
        }
      : null);

  const moodPreview =
    effectiveSelectedType && effectiveSelectedSticker
      ? {
          colorHex: effectiveSelectedType.color_hex,
          label: effectiveSelectedType.name.split('/')[0],
          sticker: effectiveSelectedSticker.sticker_url,
        }
      : draftMood
        ? {
            colorHex: draftMood.colorHex,
            label: draftMood.name,
            sticker: draftMood.stickerUrl || draftMood.iconCode,
          }
        : null;

  const handleSubmit = async () => {
    if (!effectiveSelectedType || !effectiveSelectedSticker) {
      alert('请选择此刻的能量心情');
      return;
    }

    setIsSubmitting(true);
    try {
      const media = files.map((f, i) => ({
        mediaType: f.type === 'image' ? 1 : 2,
        fileUrl: f.url,
        sortOrder: i + 1,
      }));

      await EnergyService.createMoment({
        energyTypeId: effectiveSelectedType.id,
        stickerId: effectiveSelectedSticker.id,
        content,
        media,
        visibility: 1,
      });
      clearDraft();
      navigate('/energy');
    } catch (error) {
      console.error('发布失败', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="publish-container">
      <div className="publish-header">
        <button onClick={() => navigate(-1)} className="cancel-btn">
          取消
        </button>
        <h1 className="title">发布</h1>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !effectiveSelectedType || !effectiveSelectedSticker}
          className="submit-btn"
        >
          {isSubmitting ? '发布中...' : '发布'}
        </button>
      </div>

      <div className="publish-content">
        <div 
          className="mood-section"
          onClick={() => setShowSelector(true)}
        >
          {moodPreview ? (
            <>
              <div 
                className="mood-circle filled"
                style={{ backgroundColor: moodPreview.colorHex }}
              >
                {moodPreview.sticker}
              </div>
              <span className="mood-label">
                {moodPreview.label}
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

        <div className="input-section">
          <textarea
            ref={textareaRef}
            placeholder="写点什么... (可选)"
            className="content-textarea"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              syncTextareaHeight();
            }}
            rows={1}
          />
          <div className="draft-status">
            <span>{draftSavedAt ? '草稿已自动保存' : '输入内容后会自动保存草稿'}</span>
            <span>电脑端支持拖拽图片到上传框</span>
          </div>

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

      <EnergySelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        types={types}
        stickers={stickers}
        onSelect={(type, sticker) => {
          setSelectedType(type);
          setSelectedSticker(sticker);
          setDraftMood({
            name: type.name.split('/')[0],
            colorHex: type.color_hex,
            iconCode: type.icon_code,
            stickerUrl: sticker.sticker_url,
          });
        }}
      />
    </div>
  );
};

export default EnergyPublish;
