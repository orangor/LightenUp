import React, { useMemo } from 'react'
import { TrendPoint } from '../../../api/energyTypes'
import { getEnergyColor } from '../utils'
import './StatsOverview.scss'

// 统计概览组件
const StatsOverview = ({ points }: { points: TrendPoint[] }) => {
  const stats = useMemo(() => {
    if (!points || points.length === 0) return null;
    const values = points.map(p => Number(p.level_value));
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const current = values[values.length - 1];
    
    return { max, min, avg, current };
  }, [points]);

  if (!stats) return null;

  return (
    <div className="stats-overview">
      <div className="stat-item main-stat">
        <div className="stat-label">当前能量</div>
        <div className="stat-value" style={{ color: getEnergyColor(stats.current) }}>
          {stats.current}
        </div>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <div className="stat-label">平均</div>
        <div className="stat-value">{stats.avg}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">最高</div>
        <div className="stat-value" style={{ color: getEnergyColor(stats.max) }}>{stats.max}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">最低</div>
        <div className="stat-value" style={{ color: getEnergyColor(stats.min) }}>{stats.min}</div>
      </div>
    </div>
  )
}

export default StatsOverview
