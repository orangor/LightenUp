import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetsService } from '../../api/apiService';
import CameraModal from '../common/CameraModal';
import './MediaUploader.scss';

interface MediaUploaderProps {
  files: { type: 'image' | 'video'; url: string }[];
  onFilesChange: (files: { type: 'image' | 'video'; url: string }[]) => void;
  maxImages?: number;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  files,
  onFilesChange,
  maxImages = 9,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const isMobile = useMemo(
    () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    []
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setShowActionSheet(false);
    await uploadFiles(selectedFiles);
    e.target.value = '';
  };

  const uploadFiles = async (fileList: File[]) => {
    const remainingCount = maxImages - files.length;
    const nextFiles = fileList.slice(0, Math.max(remainingCount, 0));

    if (nextFiles.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = nextFiles.map(async (file) => {
        const isImage = file.type.startsWith('image');

        if (!isImage) {
          return {
            type: 'video' as 'image' | 'video',
            url: URL.createObjectURL(file),
          };
        }

        try {
          const res = await AssetsService.uploadImage(file);
          return {
            type: 'image' as 'image' | 'video',
            url: res.url,
          };
        } catch (err) {
          console.error(`File upload failed: ${file.name}`, err);
          throw err;
        }
      });

      const newFiles = await Promise.all(uploadPromises);
      onFilesChange([...files, ...newFiles]);
    } catch (error) {
      console.error('批量上传失败', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  const handleGalleryClick = () => {
    setShowActionSheet(false);
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    if (isMobile) {
      setShowActionSheet(false);
      cameraInputRef.current?.click();
    } else {
      setShowActionSheet(false);
      setShowCameraModal(true);
    }
  };

  const handleUploadButtonClick = () => {
    if (isMobile) {
      setShowActionSheet(true);
      return;
    }

    handleGalleryClick();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);

    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length === 0) return;

    await uploadFiles(droppedFiles);
  };

  return (
    <>
      <div
        className={`media-uploader ${isDragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="media-uploader-grid">
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div
                key={file.url}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="media-item"
              >
                {file.type === 'video' ? (
                  <video src={file.url} className="media-preview" />
                ) : (
                  <img src={file.url} alt={`upload-${index}`} className="media-preview" />
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="remove-btn"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {files.length < maxImages && (
            <button
              className={`upload-btn ${isDragActive ? 'is-drag-active' : ''}`}
              onClick={handleUploadButtonClick}
              disabled={isUploading}
            >
              <span className="upload-icon">+</span>
              <span className="upload-text">
                {isUploading ? '上传中...' : `${files.length}/${maxImages}`}
              </span>
              <span className="upload-hint">
                {isMobile ? '点击选择' : '拖拽或点击'}
              </span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="upload-input"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment" 
          className="upload-input"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {!isMobile && (
          <button className="desktop-camera-btn" onClick={handleCameraClick} type="button">
            也可以直接拍一张
          </button>
        )}
      </div>

      <AnimatePresence>
        {showActionSheet && (
          <>
            <motion.div
              className="action-sheet-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActionSheet(false)}
            />
            <motion.div
              className="action-sheet-panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex flex-col">
                <button className="action-item" onClick={handleCameraClick}>
                  拍摄
                </button>
                <button className="action-item" onClick={handleGalleryClick}>
                  {isMobile ? '从手机相册选择' : '从电脑选择'}
                </button>
              </div>

              <div className="mt-2">
                <button
                  className="action-item cancel-item"
                  onClick={() => setShowActionSheet(false)}
                >
                  取消
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CameraModal
        visible={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(file) => {
          uploadFiles([file]);
        }}
      />
    </>
  );
};

export default MediaUploader;
