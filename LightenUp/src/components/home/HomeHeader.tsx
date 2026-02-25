
import React from 'react';
import { Carousel, Progress, Tag } from 'antd';
import { Goal } from './mockData';
import './Home.scss';

interface HomeHeaderProps {
  goals: Goal[];
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ goals }) => {
  return (
    <div className="home-header">
      <Carousel 
        autoplay 
        effect="fade"
        dotPosition="bottom"
      >
        {goals.map((goal) => (
          <div key={goal.id} className="goal-card-wrapper">
            <div className="goal-card">
              <div className="goal-header">
                <span className="goal-icon">◎</span>
                <span className="goal-title">{goal.title}</span>
              </div>
              
              <div className="goal-progress-container">
                {goal.tags.includes('超期') && (
                  <Tag color="#ff4d4f" className="goal-status-tag">超期</Tag>
                )}
                <Progress 
                  percent={goal.progress} 
                  showInfo={false} 
                  strokeColor="#ff4d4f" 
                  trailColor="#f0f0f0"
                  size="small"
                  className="goal-progress-bar"
                />
              </div>

              <div className="goal-footer">
                <span className="goal-date">📅 {goal.startDate}</span>
                <span className="goal-date">{goal.endDate} 📅</span>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default HomeHeader;
