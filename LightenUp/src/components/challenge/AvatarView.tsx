import React from 'react';
import { Challenge } from '../../types/Challenge';

interface AvatarViewProps {
  challenge?: Challenge;
}

const AvatarView: React.FC<AvatarViewProps> = ({ challenge }) => {
  const isNegative = challenge?.status === 'abandoned' || (challenge?.progress.checkInCount || 0) < (challenge?.progress.currentDay || 0) * 0.5;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: isNegative ? 'linear-gradient(180deg, #2c3e50 0%, #000000 100%)' : 'linear-gradient(180deg, #a1c4fd 0%, #c2e9fb 100%)',
      transition: 'all 0.5s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Avatar Placeholder */}
      <div style={{
        fontSize: '100px',
        filter: isNegative ? 'grayscale(100%) blur(2px)' : 'none',
        transform: isNegative ? 'scale(0.9)' : 'scale(1.1)',
        transition: 'all 0.5s ease'
      }}>
        🧘
      </div>
      
      {/* Status Text */}
      <div style={{
        marginTop: '20px',
        color: isNegative ? '#bdc3c7' : '#2980b9',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        {challenge ? (isNegative ? '需要充能...' : '状态极佳!') : '选择一个挑战开始修炼'}
      </div>

      {/* Particle Effects (Simplified) */}
      {isNegative && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.3)',
          pointerEvents: 'none'
        }} />
      )}
    </div>
  );
};

export default AvatarView;
