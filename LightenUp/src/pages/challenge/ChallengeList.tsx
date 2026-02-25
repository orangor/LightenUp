import React from 'react';
import { Challenge } from '../../types/Challenge';

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
    beforeState: { description: '', media: [], negativeTags: [] },
    afterState: { expectedResult: '', positiveTags: [] },
    progress: { currentDay: 5, checkInCount: 4 }
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
    beforeState: { description: '', media: [], negativeTags: [] },
    afterState: { expectedResult: '', positiveTags: [] },
    progress: { currentDay: 1, checkInCount: 0 }
  }
];

const ChallengeList: React.FC = () => {
  return (
    <div style={{ padding: '20px', background: '#f5f6fa', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '20px' }}>挑战列表</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {MOCK_CHALLENGES.map(challenge => (
          <div key={challenge.id} style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ margin: 0, marginBottom: '5px' }}>{challenge.name}</h3>
              <div style={{ fontSize: '14px', color: '#666' }}>{challenge.goal}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                {challenge.startDate} ~ {challenge.endDate}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                {Math.round((challenge.progress.checkInCount / challenge.totalDays) * 100)}%
              </div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>进度</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChallengeList;
