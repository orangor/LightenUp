import React, { useMemo, useState, useEffect } from 'react'
import { Tooltip } from 'antd'
import moment from 'moment'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendPoint } from '../../../api/energyTypes'
import { EnergyService } from '../../../api/energyService'
import EnergyDetailDrawer from './EnergyDetailDrawer'
import './EnergyMatrix.scss'

interface EnergyMatrixProps {
  // points: TrendPoint[] // 移除 props 中的 points，改为内部请求
}

type MatrixPoint = TrendPoint & { note?: string; jitter?: { x: number; y: number } };

// ... (keep helper functions like getColor, getSize)
const getEnergyColor = (value: number) => {
    if (value <= 150) return '#4A90E2';
    if (value <= 250) return '#FF4D4F';
    if (value <= 450) return '#52C41A';
    return '#FADB14';
}

const EnergyMatrix: React.FC<EnergyMatrixProps> = () => {
  const [selectedPoint, setSelectedPoint] = useState<MatrixPoint | null>(null);
  const [currentDate, setCurrentDate] = useState(moment());
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<TrendPoint[]>([]);

  // 获取当前周的数据
  useEffect(() => {
    const fetchWeekData = async () => {
      setLoading(true);
      try {
        const startOfWeek = currentDate.clone().startOf('isoWeek').format('YYYY-MM-DD');
        const endOfWeek = currentDate.clone().endOf('isoWeek').format('YYYY-MM-DD');
        
        const res = await EnergyService.getTrend({
          start_date: startOfWeek,
          end_date: endOfWeek,
          group_by: 'raw',
          limit: 1000 // 获取足够多的数据点以填充矩阵
        });
        
        setPoints(res.points || []);
      } catch (error) {
        console.error('Failed to fetch week energy data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekData();
  }, [currentDate]);

  // 生成当前周的日期范围 (周一到周日)
  const weekDays = useMemo(() => {
    const startOfWeek = currentDate.clone().startOf('isoWeek');
    return Array.from({ length: 7 }, (_, i) => {
      const date = startOfWeek.clone().add(i, 'days');
      const isToday = date.isSame(moment(), 'day');
      return {
        label: isToday ? '今天' : date.format('MM/DD'),
        dateStr: date.format('YYYY-MM-DD'),
        dateObj: date,
        left: `${(i / 7) * 100}%`
      };
    });
  }, [currentDate]);

  // 处理数据
  const displayPoints = useMemo(() => {
    return points; 
  }, [points]);

  const currentWeekPoints = useMemo(() => {
    return displayPoints; 
  }, [displayPoints]);

  // 计算统计数据 (基于当前周)
  const stats = useMemo(() => {
    const values = currentWeekPoints.map(p => Number(p.level_value));
    const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    
    // 生成 Sparkline 路径
    if (values.length < 2) return { avg, sparklinePath: '' };
    
    // 简单采样 20 个点作为趋势线
    const sampled = values.filter((_, i) => i % Math.max(1, Math.floor(values.length / 20)) === 0).reverse();
    const width = 120;
    const height = 40;
    const min = Math.min(...sampled);
    const max = Math.max(...sampled);
    const range = max - min || 1;
    
    const pathPoints = sampled.map((v, i) => {
      const x = (i / (sampled.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    });
    
    // 构建贝塞尔曲线
    let d = `M ${pathPoints[0]}`;
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const [x1, y1] = pathPoints[i].split(',').map(Number);
      const [x2, y2] = pathPoints[i+1].split(',').map(Number);
      const cpX = (x1 + x2) / 2;
      d += ` C ${cpX},${y1} ${cpX},${y2} ${x2},${y2}`;
    }
    
    return { avg, sparklinePath: d };
  }, [currentWeekPoints]);

  // 导航处理
  const handlePrevWeek = () => {
    setCurrentDate(prev => prev.clone().subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    const nextWeek = currentDate.clone().add(1, 'week');
    if (nextWeek.isAfter(moment(), 'isoWeek')) return;
    setCurrentDate(nextWeek);
  };

  const isCurrentWeek = currentDate.isSame(moment(), 'isoWeek');

  // 颜色映射 helper (Updated Palette)
  const getColor = (name: string, value: number) => {
    // 焦虑/恐惧/悲伤 - Deep Serenity Purple (静谧、内省)
    if (name?.includes('焦虑') || name?.includes('恐惧') || value <= 150) return '#7B61FF'; 
    
    // 愤怒/抱怨/烦躁 - Soft Coral Red (柔和警示)
    if (name?.includes('愤怒') || name?.includes('抱怨') || (value > 150 && value <= 250)) return '#FF6B6B'; 
    
    // 平静/理智/勇气 - Mint Green (清新治愈)
    if (name?.includes('平静') || name?.includes('理智') || (value > 250 && value <= 450)) return '#38D9A9'; 
    
    // 喜悦/爱/开悟 - Warm Sunlight Gold (温暖能量)
    return '#FFD166'; 
  };

  // 大小映射 helper
  const getSize = (value: number) => {
    // 范围映射: 0-1000 -> 8px-24px
    const minSize = 10;
    const maxSize = 28;
    const normalized = Math.min(Math.max((value - 100) / 600, 0), 1);
    return minSize + normalized * (maxSize - minSize);
  };

  return (
    <div className="energy-matrix-container">
      {/* 头部看板 */}
      <div className="matrix-header">
        <div className="header-left">
          <div className="title-row">
            <div className="matrix-title">七日能量星河</div>
            <div className="week-nav">
              <button className="nav-btn" onClick={handlePrevWeek}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span className="current-week">
                {weekDays[0].dateObj.format('MM/DD')} - {weekDays[6].dateObj.format('MM/DD')}
              </span>
              <button 
                className="nav-btn" 
                onClick={handleNextWeek}
                disabled={isCurrentWeek}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
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

      {/* 矩阵图表 */}
      <div className="matrix-chart">
        {/* 背景网格 - 垂直日期线 */}
        <div className="grid-lines">
          {weekDays.map((_, i) => (
            <div 
              key={i} 
              className="v-line" 
              style={{ left: `${(i / 7) * 100 + (100 / 14)}%` }} // 居中于每一天
            />
          ))}
        </div>

        {/* Y轴 - 时间 (从上到下 00:00 - 24:00) */}
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

        {/* X轴 - 日期 */}
        <div className="x-axis">
          {weekDays.map(day => (
            <div key={day.dateStr} className="x-label" style={{ width: `${100/7}%` }}>
              {day.label}
            </div>
          ))}
        </div>

        {/* 数据气泡 */}
        <div className="bubble-container">
          <AnimatePresence>
            {currentWeekPoints.map((p, i) => {
              const m = moment(p.created_at);
              const dateStr = m.format('YYYY-MM-DD');
              
              // 计算 X 轴位置 (哪一天)
              const dayIndex = weekDays.findIndex(d => d.dateStr === dateStr);
              if (dayIndex === -1) return null; // 不在当前周不显示
              
              const leftPercent = (dayIndex / 7) * 100 + (100 / 14); // 居中于当天的列
              
              // 计算 Y 轴位置 (时间 0-24h)
              const minutes = m.hour() * 60 + m.minute();
              const topPercent = (minutes / 1440) * 100;
              
              const color = getColor(p.energy_name || '', Number(p.level_value));
              const size = getSize(Number(p.level_value));
              
              // Generate stable random jitter
              const seed = Number(p.moment_id) || i;
              const pseudoRandom = (s: number) => {
                const x = Math.sin(s) * 10000;
                return x - Math.floor(x);
              };
              
              // 增大 jitter 范围以增加"有机散布"感 (±8px)
              const jitterX = (pseudoRandom(seed) - 0.5) * 16; 
              const jitterY = (pseudoRandom(seed + 1) - 0.5) * 16; 
              
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
                    onClick={() => setSelectedPoint(p)}
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
                      boxShadow: `0 0 ${size/2}px ${color}`,
                      // @ts-ignore
                      '--glow-color': color,
                    }}
                  />
                </Tooltip>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 详情抽屉 - 使用 AnimatePresence 实现进出场动画 */}
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
