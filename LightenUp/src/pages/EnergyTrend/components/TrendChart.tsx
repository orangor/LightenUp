import React, { useMemo } from 'react'
import moment from 'moment'
import { TrendPoint } from '../../../api/energyTypes'
import { getEnergyColor } from '../utils'
import './TrendChart.scss'

type SvgPoint = { x: number; y: number }

// 使用贝塞尔曲线平滑折线
function buildSmoothPath(points: SvgPoint[]) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`
  
  let path = `M ${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i]
    const next = points[i + 1]
    const cpX = (curr.x + next.x) / 2
    path += ` C ${cpX},${curr.y} ${cpX},${next.y} ${next.x},${next.y}`
  }
  return path
}

function buildSmoothAreaPath(points: SvgPoint[], innerH: number, paddingL: number, paddingT: number) {
  if (points.length === 0) return ''
  const linePath = buildSmoothPath(points)
  const lastX = points[points.length - 1].x
  const firstX = points[0].x
  const bottomY = paddingT + innerH
  return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
}

// 提取图表组件
const TrendChart = ({
  points,
  title,
  subtitle,
}: {
  points: TrendPoint[]
  title: string
  subtitle?: string
}) => {
  const chartData = useMemo(() => {
    if (!points || points.length === 0) return null
    const parsed = points
      .map((p) => {
        const timeLabel = moment(p.created_at).format('MM-DD HH:mm')
        let label = `${timeLabel} · ${Math.round(p.level_value)}`
        if (p.energy_name) {
          label += ` (${p.energy_name})`
        }
        return {
          t: new Date(p.created_at).getTime(),
          v: Number(p.level_value),
          label,
        }
      })
      .sort((a, b) => a.t - b.t)

    const minT = parsed[0].t
    const maxT = parsed[parsed.length - 1].t
    const minV = Math.min(...parsed.map((d) => d.v), 0)
    const maxV = Math.max(...parsed.map((d) => d.v), 800)

    const width = Math.max(800, parsed.length * 40) // 动态宽度，保证点不拥挤
    const height = 240
    const padding = { l: 40, r: 24, t: 24, b: 32 }
    const innerW = width - padding.l - padding.r
    const innerH = height - padding.t - padding.b

    const tx = (t: number) => {
      if (maxT === minT) return padding.l + innerW / 2
      return padding.l + ((t - minT) / (maxT - minT)) * innerW
    }
    const ty = (v: number) => {
      if (maxV === minV) return padding.t + innerH / 2
      return padding.t + innerH - ((v - minV) / (maxV - minV)) * innerH
    }

    const svgPoints: SvgPoint[] = parsed.map((d) => ({ x: tx(d.t), y: ty(d.v) }))
    const ticks = 5
    const yTicks = new Array(ticks).fill(0).map((_, i) => {
      const ratio = i / (ticks - 1)
      const v = Math.round(minV + (maxV - minV) * ratio)
      return { y: ty(v), v }
    })

    const xLabels = [
      parsed[0],
      parsed[Math.floor(parsed.length / 2)],
      parsed[parsed.length - 1],
    ].filter(Boolean)
    
    const uniqueXLabels = Array.from(new Set(xLabels.map((d) => d.t))).map((t) =>
      xLabels.find((d) => d.t === t)
    ) as typeof parsed

    const xTicks = uniqueXLabels.map((d) => ({
      x: tx(d.t),
      label: moment(d.t).format('MM/DD'),
    }))

    return { width, height, padding, innerH, svgPoints, yTicks, xTicks, parsed }
  }, [points])

  if (!points || points.length === 0) {
    return (
      <div className="trend-card empty-card">
        <div className="empty-content">
          <span className="empty-icon">🌱</span>
          <p>暂无数据，去发布一条能量动态试试～</p>
        </div>
      </div>
    )
  }

  if (!chartData) return null

  return (
    <div className="trend-card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      <div className="chart-wrapper">
        <svg
          className="chart-svg"
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ minWidth: `${chartData.width}px` }}
        >
          <defs>
            <linearGradient id="trend-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7B61FF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7B61FF" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 面积图 (先绘制在底层) */}
          <path
            d={buildSmoothAreaPath(chartData.svgPoints, chartData.innerH, chartData.padding.l, chartData.padding.t)}
            className="area-path"
            fill="url(#trend-gradient)"
          />
          
          {/* 辅助网格线和文字 */}
          {chartData.yTicks.map((t, i) => (
            <g key={`y-${i}`}>
              <line
                x1={chartData.padding.l}
                y1={t.y}
                x2={chartData.width - chartData.padding.r}
                y2={t.y}
                className="grid-line"
              />
              <text
                x={chartData.padding.l - 12}
                y={t.y + 4}
                textAnchor="end"
                className="axis-text"
              >
                {t.v}
              </text>
            </g>
          ))}

          {/* X轴文字 */}
          {chartData.xTicks.map((t, i) => (
            <g key={`x-${i}`}>
              <text
                x={t.x}
                y={chartData.height - chartData.padding.b + 20}
                textAnchor="middle"
                className="axis-text"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* 趋势折线 (添加滤镜) */}
          <path
            d={buildSmoothPath(chartData.svgPoints)}
            className="line-path"
            fill="none"
            filter="url(#glow)"
            stroke="#7B61FF" 
          />

          {/* 数据点 */}
          {chartData.svgPoints.map((p, i) => {
            const val = chartData.parsed[i].v;
            return (
              <g key={`p-${i}`} className="data-point-group">
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={4} 
                  className="data-point"
                  style={{ stroke: getEnergyColor(val) }}
                >
                  <title>{chartData.parsed[i].label}</title>
                </circle>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="chart-tooltip-hint">滑动查看更多，点击圆点查看详情</div>
    </div>
  )
}

export default TrendChart
