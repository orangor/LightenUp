import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResonanceFeed from '../../components/energy/ResonanceFeed';
import './EnergyHome.scss';

const EnergyHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="energy-home-container">
      {/* 头部导航 */}
      <div className="energy-header">
        <h1 className="header-title">
          EnergyFlow
        </h1>
      </div>

      {/* 能量流列表 */}
      <div className="energy-content">
        <ResonanceFeed />
      </div>

      {/* 悬浮发布按钮 */}
      <button
        onClick={() => navigate('/energy/publish')}
        className="publish-btn"
        aria-label="发布能量"
      >
        <span className="btn-icon">+</span>
      </button>
    </div>
  );
};

export default EnergyHome;
