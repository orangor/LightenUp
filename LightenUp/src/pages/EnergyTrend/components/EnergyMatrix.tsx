import React, { useMemo, useState, useEffect } from 'react'
import { Tooltip } from 'antd'
import moment from 'moment'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendPoint } from '../../../api/energyTypes'
import { EnergyService } from '../../../api/energyService'
import EnergyDetailDrawer from './EnergyDetailDrawer'
import {
  EnergyMatrixRange,
  getEnergyRangeAxisLabel,
  getEnergyRangePeriod,
  isCurrentEnergyRange,
  shiftEnergyRangeAnchor,
} from './energyRange'
import './EnergyMatrix.scss'

interface EnergyMatrixProps {
  range: EnergyMatrixRange
}

type MatrixPoint = TrendPoint & { note?: string; jitter?: { x: number; y: number } }

const EnergyMatrix: React.FC<EnergyMatrixProps> = ({ range }) => {
  const [selectedPoint, setSelectedPoint] = useState<MatrixPoint | null>(null)
  const [currentDate, setCurrentDate] = useState(moment())
  const [loading, setLoading] = useState(false)
  const [points, setPoints] = useState<TrendPoint[]>([])
  const currentPeriod = useMemo(() => getEnergyRangePeriod(currentDate, range), [currentDate, range])

  useEffect(() => {
    setCurrentDate(moment())
  }, [range])

  useEffect(() => {
    const fetchRangeData = async () => {
      setLoading(true)
      try {
        const res = await EnergyService.getTrend({
          start_date: currentPeriod.start.format('YYYY-MM-DD'),
          end_date: currentPeriod.end.format('YYYY-MM-DD'),
          group_by: 'raw',
          limit: currentPeriod.fetchLimit,
        })

        setPoints(res.points || [])
      } catch (error) {
        console.error('Failed to fetch energy data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRangeData()
  }, [currentPeriod])

  const daySlots = useMemo(() => {
    return Array.from({ length: currentPeriod.dayCount }, (_, i) => {
      const date = currentPeriod.start.clone().add(i, 'days')
      return {
        label: getEnergyRangeAxisLabel(date, i, currentPeriod.dayCount, range),
        dateStr: date.format('YYYY-MM-DD'),
        dateObj: date,
      }
    })
  }, [currentPeriod.dayCount, currentPeriod.start, range])

  const displayPoints = useMemo(() => {
    return points
  }, [points])

  const currentWeekPoints = useMemo(() => {
    return displayPoints
  }, [displayPoints])

  const stats = useMemo(() => {
    const values = currentWeekPoints.map((p) => Number(p.level_value))
    const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0

    if (values.length < 2) return { avg, sparklinePath: '' }

    const sampled = values.filter((_, i) => i % Math.max(1, Math.floor(values.length / 20)) === 0).reverse()
    const width = 120
    const height = 40
    const min = Math.min(...sampled)
    const max = Math.max(...sampled)
    const rangeValue = max - min || 1

    const pathPoints = sampled.map((v, i) => {
      const x = (i / (sampled.length - 1)) * width
      const y = height - ((v - min) / rangeValue) * height
      return `${x},${y}`
    })

    let d = `M ${pathPoints[0]}`
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const [x1, y1] = pathPoints[i].split(',').map(Number)
      const [x2, y2] = pathPoints[i + 1].split(',').map(Number)
      const cpX = (x1 + x2) / 2
      d += ` C ${cpX},${y1} ${cpX},${y2} ${x2},${y2}`
    }

    return { avg, sparklinePath: d }
  }, [currentWeekPoints])

  const handlePrevWeek = () => {
    setCurrentDate((prev) => shiftEnergyRangeAnchor(prev, range, -1))
  }

  const handleNextWeek = () => {
    if (isCurrentRange) return
    setCurrentDate((prev) => shiftEnergyRangeAnchor(prev, range, 1))
  }

  const isCurrentRange = isCurrentEnergyRange(currentPeriod)

  const getColor = (name: string, value: number) => {
    if (name?.includes('焦虑') || name?.includes('恐惧') || value <= 150) return '#7B61FF'
    if (name?.includes('愤怒') || name?.includes('抱怨') || (value > 150 && value <= 250)) return '#FF6B6B'
    if (name?.includes('平静') || name?.includes('理智') || (value > 250 && value <= 450)) return '#38D9A9'
    return '#FFD166'
  }

  const getSize = (value: number) => {
    const minSize = range === 'quarter' ? 8 : range === '30d' ? 9 : 10
    const maxSize = range === 'quarter' ? 20 : range === '30d' ? 24 : 28
    const normalized = Math.min(Math.max((value - 100) / 600, 0), 1)
    return minSize + normalized * (maxSize - minSize)
  }

  return (
    <div className="energy-matrix-container">
      <div className="matrix-header">
        <div className="header-left">
          <div className="title-row">
            <div className="matrix-title">{currentPeriod.title}</div>
            <div className="week-nav">
              <button className="nav-btn" onClick={handlePrevWeek}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span className="current-week">
                {currentPeriod.label}
              </span>
              <button 
                className="nav-btn" 
                onClick={handleNextWeek}
                disabled={isCurrentRange}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
          <div className="matrix-meta">{loading ? '同步中...' : currentPeriod.summaryLabel}</div>
          <div className="avg-energy">
            {stats.avg}
            <span className="unit">平均能量值</span>
          </div>
        </div>
        <div className="header-right">
          {stats.sparklinePath && (
            <svg className="sparkline" viewBox="0 0 120 40">
              <path d={stats.sparklinePath} />
            </svg>
          )}
        </div>
      </div>

      <div className="matrix-chart">
        <div className="grid-lines">
          {daySlots.map((_, i) => (
            <div 
              key={i} 
              className="v-line" 
              style={{ left: `${((i + 0.5) / daySlots.length) * 100}%` }}
            />
          ))}
        </div>

        <div className="y-axis">
          {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'].map((t, i) => (
            <div 
              key={t} 
              className="y-label" 
              style={{ top: `${(i / 6) * 100}%`, position: 'absolute', transform: 'translateY(-50%)' }}
            >
              {t}
            </div>
          ))}
        </div>

        <div className="x-axis">
          {daySlots.map((day) => (
            <div key={day.dateStr} className="x-label" style={{ width: `${100 / daySlots.length}%` }}>
              {day.label}
            </div>
          ))}
        </div>

        {!loading && currentWeekPoints.length === 0 && (
          <div className="matrix-empty">当前时间范围还没有能量记录</div>
        )}

        <div className="bubble-container">
          <AnimatePresence>
            {currentWeekPoints.map((p, i) => {
              const m = moment(p.created_at)
              const dayIndex = m.startOf('day').diff(currentPeriod.start.clone().startOf('day'), 'days')
              if (dayIndex < 0 || dayIndex >= daySlots.length) return null

              const leftPercent = ((dayIndex + 0.5) / daySlots.length) * 100
              const minutes = m.hour() * 60 + m.minute()
              const topPercent = (minutes / 1440) * 100

              const color = getColor(p.energy_name || '', Number(p.level_value))
              const size = getSize(Number(p.level_value))

              const seed = Number(p.moment_id) || i
              const pseudoRandom = (s: number) => {
                const x = Math.sin(s) * 10000
                return x - Math.floor(x)
              }

              const jitterAmplitude = range === 'quarter' ? 8 : range === '30d' ? 10 : 16
              const jitterX = (pseudoRandom(seed) - 0.5) * jitterAmplitude
              const jitterY = (pseudoRandom(seed + 1) - 0.5) * jitterAmplitude

              return (
                <Tooltip 
                  key={p.moment_id || i}
                  title={
                    <div className="tooltip-content">
                      <span className="time">{m.format('HH:mm')}</span>
                      <span className="type">{p.energy_name?.split('/')[0]}</span>
                      <span className="value">⚡️ {p.level_value}</span>
                    </div>
                  }
                  overlayClassName="matrix-tooltip"
                  color="transparent"
                >
                  <motion.div
                    className="energy-bubble"
                    onClick={() => setSelectedPoint(p as MatrixPoint)}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      x: jitterX,
                      y: jitterY
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: i * 0.02 
                    }}
                    style={{
                      top: `${topPercent}%`,
                      left: `${leftPercent}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: color,
                      boxShadow: `0 0 ${size / 2}px ${color}`,
                    }}
                  />
                </Tooltip>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedPoint && (
          <EnergyDetailDrawer 
            point={selectedPoint} 
            onClose={() => setSelectedPoint(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default EnergyMatrix
