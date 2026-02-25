import React, { useState, useRef } from 'react';
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
  
  // 隐藏的 input 引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // 关闭选择面板
    setShowActionSheet(false);
    
    await uploadFiles(selectedFiles);
    
    // 清空 input，允许重复选择同一文件
    e.target.value = '';
  };

  const uploadFiles = async (fileList: File[]) => {
    setIsUploading(true);
    try {
      const uploadPromises = fileList.map(async (file) => {
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

  // 触发相册选择
  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  // 触发拍照
  const handleCameraClick = () => {
    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // 移动端直接触发 capture input
      cameraInputRef.current?.click();
    } else {
      // PC 端打开摄像头模态框
      setShowActionSheet(false); // 关闭底部菜单
      setShowCameraModal(true);
    }
  };

  return (
    <>
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

        {/* 上传按钮 - 触发 ActionSheet */}
        {files.length < maxImages && (
          <button 
            className="upload-btn"
            onClick={() => setShowActionSheet(true)}
            disabled={isUploading}
          >
            <span className="upload-icon">+</span>
            <span className="upload-text">
              {files.length}/{maxImages}
            </span>
          </button>
        )}

        {/* 隐藏的文件输入框 - 相册 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="upload-input"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {/* 隐藏的文件输入框 - 拍照 (移动端) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment" 
          className="upload-input"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* ActionSheet 底部弹窗 */}
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
                  从手机相册选择
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

      {/* PC 端拍照模态框 */}
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
