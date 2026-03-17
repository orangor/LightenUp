import React, { useMemo } from 'react'
import moment from 'moment'
import { TrendPoint } from '../../../api/energyTypes'
import { getEnergyColor } from '../utils'
import './EnergyTimeline.scss'

// 移动端时间线组件
const EnergyTimeline = ({ points }: { points: TrendPoint[] }) => {
  // 时间线通常倒序排列（最新的在最上面）
  const reversedPoints = useMemo(() => [...points].reverse(), [points]);

  if (!points || points.length === 0) return null;

  return (
    <div className="energy-timeline-container">
      <div className="timeline-header">
        <h3 className="timeline-title">能量轨迹</h3>
      </div>
      <div className="timeline-list">
        {reversedPoints.map((p, index) => {
          const color = getEnergyColor(Number(p.level_value));
          const isFirst = index === 0;
          return (
            <div className="timeline-item" key={p.moment_id || index}>
              <div className="timeline-line">
                <div 
                  className={`timeline-dot ${isFirst ? 'pulse' : ''}`} 
                  style={{ backgroundColor: color, boxShadow: isFirst ? `0 0 0 4px ${color}33` : 'none' }}
                />
                {index !== reversedPoints.length - 1 && <div className="timeline-tail" />}
              </div>
              <div className="timeline-content">
                <div className="timeline-time">{moment(p.created_at).format('MM-DD HH:mm')}</div>
                <div className="timeline-card">
                  <div className="energy-info">
                    <span className="energy-value" style={{ color }}>{p.level_value}</span>
                    <span className="energy-name">{p.energy_name || '未知能量'}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EnergyTimeline
