import React, { useEffect, useState } from 'react'
import { EnergyService } from '../../api/energyService'
import { TrendPoint } from '../../api/energyTypes'
import { useNavigate } from 'react-router-dom'
import TrendChart from './components/TrendChart'
import StatsOverview from './components/StatsOverview'
import EnergyTimeline from './components/EnergyTimeline'
import EnergyMatrix from './components/EnergyMatrix'
import './EnergyTrend.scss'

export default function EnergyTrend() {
  const [data, setData] = useState<{
    raw: TrendPoint[]
  }>({ raw: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    setLoading(true)

    Promise.all([
      EnergyService.getTrend({ limit: 50, group_by: 'raw' }),
    ])
      .then(([resRaw]) => {
        if (!mounted) return
        setData({
          raw: resRaw.points || [],
        })
      })
      .catch((e) => {
        if (!mounted) return
        setError(e?.message || '加载失败')
      })
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="energy-trend-container">
      <header className="header">
       
      
      </header>

      <main className="content-wrapper">
        {loading && (
          <div className="status-state">
            <div className="spinner"></div>
            <span>感应能量波长中...</span>
          </div>
        )}
        
        {error && (
          <div className="status-state error">
            <svg style={{ width: 48, height: 48, marginBottom: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && data.raw.length > 0 && (
          <>
            {/* 能量矩阵组件 - 支持响应式，无需 desktop-only 包裹 */}
            {/* 矩阵组件内部现在自行管理数据获取，不再依赖父组件传递的 points */}
            <EnergyMatrix />

            <StatsOverview points={data.raw} />
          </>
        )}

        {!loading && !error && (
          <>
            <div className="desktop-only">
              <TrendChart 
                points={data.raw} 
                title="能量波段图" 
                subtitle="近50次能量记录轨迹" 
              />
            </div>
            
            <div className="mobile-only">
              <EnergyTimeline points={data.raw} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
