import React from 'react'
import { createPortal } from 'react-dom'
import moment from 'moment'
import { motion } from 'framer-motion'
import { TrendPoint } from '../../../api/energyTypes'
import { getEnergyColor } from '../utils'
import './EnergyDetailDrawer.scss'

type MatrixPoint = TrendPoint & { note?: string };

interface EnergyDetailDrawerProps {
  point: MatrixPoint
  onClose: () => void
}

const EnergyDetailDrawer: React.FC<EnergyDetailDrawerProps> = ({ point, onClose }) => {
  // 阻止冒泡，防止点击抽屉内容时触发关闭
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const isMobile = window.innerWidth <= 768;

  return createPortal(
    <>
      {/* 背景遮罩 */}
      <motion.div 
        className="drawer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      
      {/* 抽屉面板 */}
      <motion.div
        className="matrix-drawer-custom"
        initial={isMobile ? { y: '100%' } : { x: '100%' }}
        animate={isMobile ? { y: 0 } : { x: 0 }}
        exit={isMobile ? { y: '100%' } : { x: '100%' }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        onClick={handleContentClick}
      >
        <div className="drawer-handle-bar" onClick={onClose}>
          <div className="handle-indicator" />
        </div>

        <div className="detail-content">
          <div className="detail-header">
            <div className="detail-time-badge">
               {moment(point.created_at).format('HH:mm')} · {moment(point.created_at).format('dddd')}
            </div>
            <div className="close-btn" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </div>
          
          <div className="energy-hero">
            <div 
              className="hero-value"
              style={{ color: getEnergyColor(Number(point.level_value)) }}
            >
              {point.level_value}
            </div>
            <div className="hero-meta">
              <div 
                className="energy-tag"
                style={{ 
                  backgroundColor: `${getEnergyColor(Number(point.level_value))}10`,
                  color: getEnergyColor(Number(point.level_value)),
                  borderColor: `${getEnergyColor(Number(point.level_value))}20`
                }}
              >
                {point.energy_name || '未知能量'}
              </div>
              <div className="date-label">
                {moment(point.created_at).format('YYYY年MM月DD日')}
              </div>
            </div>
          </div>

          <div className="detail-card">
            <div className="card-label">记录</div>
            <div className="card-text">
              {point.note || '此刻没有留下文字记录，但能量的波动已被宇宙铭记。'}
            </div>
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  )
}

export default EnergyDetailDrawer
