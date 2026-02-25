import React from 'react';
import { Challenge } from '../../types/Challenge';

interface ChallengeCardProps {
  challenge: Challenge;
  isActive: boolean;
  onClick: () => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, isActive, onClick }) => {
  const progressPercentage = Math.round((challenge.progress.checkInCount / challenge.totalDays) * 100);

  return (
    <div 
      onClick={onClick}
      style={{
        width: '280px',
        height: '160px',
        background: isActive ? '#fff' : '#f0f0f0',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: isActive ? '0 10px 30px rgba(0,0,0,0.1)' : 'none',
        transform: isActive ? 'scale(1.05)' : 'scale(0.95)',
        opacity: isActive ? 1 : 0.7,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        border: isActive ? '2px solid #3498db' : '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{challenge.name}</h3>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
          {challenge.goal}
        </p>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontSize: '12px', color: '#999' }}>进度</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#3498db' }}>{progressPercentage}%</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '6px', 
          background: '#eee', 
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            background: '#3498db',
            borderRadius: '3px',
            transition: 'width 0.5s ease'
          }} />
        </div>
        <div style={{ fontSize: '10px', color: '#aaa', marginTop: '5px', textAlign: 'right' }}>
          已坚持 {challenge.progress.checkInCount} / {challenge.totalDays} 天
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;
