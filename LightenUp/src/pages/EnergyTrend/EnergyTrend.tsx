import React, { useEffect, useMemo, useState } from 'react'
import moment from 'moment'
import { EnergyService } from '../../api/energyService'
import { TrendPoint } from '../../api/energyTypes'
import TrendChart from './components/TrendChart'
import StatsOverview from './components/StatsOverview'
import EnergyTimeline from './components/EnergyTimeline'
import EnergyMatrix from './components/EnergyMatrix'
import {
  ENERGY_RANGE_OPTIONS,
  EnergyMatrixRange,
  getEnergyRangePeriod,
} from './components/energyRange'
import './EnergyTrend.scss'

export default function EnergyTrend() {
  const [data, setData] = useState<{
    raw: TrendPoint[]
  }>({ raw: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matrixRange, setMatrixRange] = useState<EnergyMatrixRange>('7d')
  const currentPeriod = useMemo(() => getEnergyRangePeriod(moment(), matrixRange), [matrixRange])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    Promise.all([
      EnergyService.getTrend({
        start_date: currentPeriod.start.format('YYYY-MM-DD'),
        end_date: currentPeriod.end.format('YYYY-MM-DD'),
        limit: currentPeriod.fetchLimit,
        group_by: 'raw',
      }),
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
  }, [currentPeriod])

  return (
    <div className="energy-trend-container">
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

        {!loading && !error && (
          <>
            <div className="trend-toolbar">
              <div className="toolbar-copy">
                <h2 className="toolbar-title">能量趋势</h2>
                <span className="toolbar-subtitle">{currentPeriod.label}</span>
              </div>
              <div className="range-switch">
                {ENERGY_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={option.value === matrixRange ? 'range-btn active' : 'range-btn'}
                    onClick={() => setMatrixRange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <EnergyMatrix range={matrixRange} />

            {data.raw.length > 0 && <StatsOverview points={data.raw} />}
          </>
        )}

        {!loading && !error && data.raw.length > 0 && (
          <>
            <div className="desktop-only">
              <TrendChart 
                points={data.raw} 
                title="能量波段图" 
                subtitle={`${currentPeriod.label} 能量记录轨迹`} 
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
