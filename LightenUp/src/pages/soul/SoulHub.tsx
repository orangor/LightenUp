import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SoulHub.scss';

const SoulHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="soul-hub-container">
      <div className="hub-header">
        <h1 className="luxury-heading">灵性探索</h1>
        <p className="luxury-subheading">Spiritual Exploration</p>
      </div>

      <div className="cards-grid">
        {/* 灵魂初始属性卡片 */}
        <div 
          className="test-card" 
          onClick={() => navigate('/soul/report')}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="card-content">
            <div className="card-tags">
              <span>先天设定</span>
              <span>能量卡点</span>
              <span>显化</span>
            </div>
            <h2 className="card-title">灵魂初始属性解析</h2>
            <p className="card-desc">
              融合八字、星盘、人类图与玛雅历，深入你的底层剧本，看清先天卡点与最适合你的显化节奏。
            </p>
            <div className="card-footer">
              <span className="card-action">开启测试</span>
              <span className="card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* 圣多纳情绪释放卡片 */}
        <div 
          className="test-card" 
          onClick={() => navigate('/soul/sedona')}
          style={{ animationDelay: '0.2s' }}
        >
          <div className="card-content">
            <div className="card-tags">
              <span>情绪觉察</span>
              <span>能量层级</span>
              <span>释放转化</span>
            </div>
            <h2 className="card-title">情绪日记 · 圣多纳释放</h2>
            <p className="card-desc">
              基于圣多纳情绪层级，从万念俱灰到平静，记录当下真实的感受，并跟随指引进行能量释放与转化。
            </p>
            <div className="card-footer">
              <span className="card-action">开始记录</span>
              <span className="card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* 占位卡片 1 */}
        <div 
          className="test-card coming-soon-card"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="card-content">
            <div className="card-tags" style={{ opacity: 0.5 }}>
              <span>近期上线</span>
            </div>
            <h2 className="card-title">流年能量指引</h2>
            <p className="card-desc">
              基于你的本命盘，推演当下的流年运势与能量走向，为你提供关键节点的决策参考。
            </p>
            <div className="card-footer" style={{ borderTopColor: 'transparent' }}>
              <span className="card-action" style={{ color: '#555' }}>敬请期待</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoulHub;
