import React, { useState } from 'react';
import AvatarView from '../../components/challenge/AvatarView';
import ChallengeCard from '../../components/challenge/ChallengeCard';
import CheckInPanel from '../../components/challenge/CheckInPanel';
import { Challenge } from '../../types/Challenge';
import { useNavigate } from 'react-router-dom';

// Mock Data
const MOCK_CHALLENGES: Challenge[] = [
  {
    id: '1',
    name: '30天论文定稿计划',
    startDate: '2023-10-01',
    endDate: '2023-10-31',
    totalDays: 30,
    goal: '完成毕业论文初稿',
    description: '每天撰写1000字，查阅3篇文献',
    status: 'active',
    beforeState: {
      description: '拖延症晚期，不知从何下手',
      media: [],
      negativeTags: ['拖延', '焦虑']
    },
    afterState: {
      expectedResult: '自信提交初稿',
      positiveTags: ['高效', '成就感']
    },
    progress: {
      currentDay: 5,
      checkInCount: 4
    }
  },
  {
    id: '2',
    name: '早起打卡挑战',
    startDate: '2023-10-05',
    endDate: '2023-11-05',
    totalDays: 30,
    goal: '养成早起习惯',
    description: '每天7点前起床',
    status: 'active',
    beforeState: {
      description: '赖床，上午没精神',
      media: [],
      negativeTags: ['赖床', '低效']
    },
    afterState: {
      expectedResult: '精神饱满迎接每一天',
      positiveTags: ['元气', '自律']
    },
    progress: {
      currentDay: 1,
      checkInCount: 0
    }
  }
];

const ChallengeHome: React.FC = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>(MOCK_CHALLENGES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  const activeChallenge = challenges[activeIndex];

  const handleCheckIn = (content: string, mood: string) => {
    console.log('Check-in:', content, mood);
    // Here you would update the challenge state
    const updatedChallenges = [...challenges];
    updatedChallenges[activeIndex].progress.checkInCount += 1;
    setChallenges(updatedChallenges);
    setIsCheckInOpen(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f6fa', position: 'relative', overflow: 'hidden' }}>
      {/* Top Navigation */}
      <div style={{
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>修炼场</h1>
        <div style={{ fontWeight: 'bold', color: '#666' }}>
          {activeChallenge?.goal || '暂无目标'}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>➕</button>
          <button onClick={() => navigate('/challenge/list')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>☰</button>
        </div>
      </div>

      {/* Avatar Area (60%) */}
      <div style={{ flex: '6', position: 'relative' }}>
        <AvatarView challenge={activeChallenge} />
      </div>

      {/* Interaction Area (40%) */}
      <div style={{
        flex: '4',
        background: '#fff',
        borderTopLeftRadius: '30px',
        borderTopRightRadius: '30px',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.05)',
        zIndex: 5
      }}>
        {/* Card Carousel */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          padding: '0 20px',
          gap: '20px',
          height: '200px',
          alignItems: 'center',
          scrollbarWidth: 'none' // Hide scrollbar for Firefox
        }}>
          {challenges.map((challenge, index) => (
            <div key={challenge.id} style={{ scrollSnapAlign: 'center' }}>
              <ChallengeCard
                challenge={challenge}
                isActive={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            </div>
          ))}
          {/* Add New Card Placeholder */}
          <div style={{
            minWidth: '280px',
            height: '160px',
            borderRadius: '16px',
            border: '2px dashed #ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaa',
            scrollSnapAlign: 'center',
            cursor: 'pointer'
          }}>
            + 新建挑战
          </div>
        </div>

        {/* Action Button */}
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setIsCheckInOpen(true)}
            style={{
              width: '80%',
              padding: '16px',
              background: 'linear-gradient(90deg, #3498db, #2ecc71)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 10px 20px rgba(52, 152, 219, 0.3)',
              cursor: 'pointer',
              transform: 'scale(1)',
              transition: 'transform 0.2s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            立即打卡
          </button>
        </div>
      </div>

      {/* Check-in Panel Modal */}
      {activeChallenge && (
        <CheckInPanel
          challenge={activeChallenge}
          isOpen={isCheckInOpen}
          onClose={() => setIsCheckInOpen(false)}
          onSubmit={handleCheckIn}
        />
      )}
    </div>
  );
};

export default ChallengeHome;
