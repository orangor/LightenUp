import React, { useRef, useState, useCallback } from 'react';
import { Modal, Button, message } from 'antd';
import { CameraOutlined, SwapOutlined } from '@ant-design/icons';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ visible, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [loading, setLoading] = useState(false);

  const startCamera = useCallback(async () => {
    setLoading(true);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('无法访问摄像头:', err);
      message.error('无法访问摄像头，请检查权限设置');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [isFrontCamera, onClose]);

  // 当 Modal 显示时启动摄像头
  React.useEffect(() => {
    if (visible) {
      startCamera();
    } else {
      // 关闭时停止所有流
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [visible]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // 设置画布尺寸与视频一致
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // 镜像翻转（如果是前置摄像头）
        if (isFrontCamera) {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 转换为 File 对象
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            onClose();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const switchCamera = () => {
    setIsFrontCamera(!isFrontCamera);
    // startCamera 会因为 dependency 变化自动重新调用
  };

  return (
    <Modal
      title="拍摄照片"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      destroyOnClose
    >
      <div className="flex flex-col items-center">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${isFrontCamera ? 'scale-x-[-1]' : ''}`}
            playsInline
            muted
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              启动摄像头中...
            </div>
          )}
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="flex gap-4">
          <Button 
            icon={<SwapOutlined />} 
            onClick={switchCamera}
            disabled={loading}
          >
            切换镜头
          </Button>
          <Button 
            type="primary" 
            icon={<CameraOutlined />} 
            onClick={handleCapture}
            size="large"
            disabled={loading}
          >
            拍照
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CameraModal;
