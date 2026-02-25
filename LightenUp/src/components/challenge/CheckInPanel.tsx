import React, { useState } from 'react';
import { Challenge } from '../../types/Challenge';

interface CheckInPanelProps {
  challenge: Challenge;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, mood: string) => void;
}

const CheckInPanel: React.FC<CheckInPanelProps> = ({ challenge, isOpen, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<'energetic' | 'struggling' | 'breakthrough' | 'normal'>('normal');

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '66%',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 -10px 30px rgba(0,0,0,0.1)',
      borderTopLeftRadius: '24px',
      borderTopRightRadius: '24px',
      zIndex: 1000,
      padding: '24px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      transition: 'transform 0.3s ease-out',
      transform: isOpen ? 'translateY(0)' : 'translateY(100%)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>今日打卡: {challenge.name}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ 
          height: '120px', 
          background: '#f8f9fa', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '2px dashed #e9ecef',
          cursor: 'pointer'
        }}>
          📷 点击拍摄或上传照片/视频
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="记录今天的感受和成果..."
          style={{
            flex: 1,
            borderRadius: '12px',
            border: '1px solid #ced4da',
            padding: '16px',
            fontSize: '16px',
            resize: 'none',
            fontFamily: 'inherit'
          }}
        />

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>今日心情</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['energetic', 'normal', 'struggling', 'breakthrough'].map((m) => (
              <button
                key={m}
                onClick={() => setMood(m as any)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '20px',
                  border: mood === m ? '2px solid #3498db' : '1px solid #e9ecef',
                  background: mood === m ? '#e8f4fc' : '#fff',
                  cursor: 'pointer'
                }}
              >
                {m === 'energetic' && '🔥 元气'}
                {m === 'normal' && '😐 平常'}
                {m === 'struggling' && '💦 艰难'}
                {m === 'breakthrough' && '🚀 突破'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onSubmit(content, mood)}
        style={{
          width: '100%',
          padding: '16px',
          background: '#3498db',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        完成打卡
      </button>
    </div>
  );
};

export default CheckInPanel;
