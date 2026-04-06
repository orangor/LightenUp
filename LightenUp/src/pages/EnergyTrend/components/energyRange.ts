import moment, { Moment } from 'moment'

export type EnergyMatrixRange = '7d' | '30d' | 'quarter'

export const ENERGY_RANGE_OPTIONS: Array<{ value: EnergyMatrixRange; label: string }> = [
  { value: '7d', label: '7天' },
  { value: '30d', label: '30天' },
  { value: 'quarter', label: '季度' },
]

export interface EnergyRangePeriod {
  start: Moment
  end: Moment
  dayCount: number
  title: string
  label: string
  summaryLabel: string
  fetchLimit: number
}

export const getEnergyRangePeriod = (anchor: Moment, range: EnergyMatrixRange): EnergyRangePeriod => {
  if (range === '30d') {
    const end = anchor.clone().endOf('day')
    const start = end.clone().subtract(29, 'days').startOf('day')
    return {
      start,
      end,
      dayCount: 30,
      title: '三十日能量星河',
      label: `${start.format('MM/DD')} - ${end.format('MM/DD')}`,
      summaryLabel: '近30天平均能量值',
      fetchLimit: 1500,
    }
  }

  if (range === 'quarter') {
    const start = anchor.clone().startOf('quarter').startOf('day')
    const end = anchor.clone().endOf('quarter').endOf('day')
    return {
      start,
      end,
      dayCount: end.diff(start, 'days') + 1,
      title: '季度能量星河',
      label: `${start.format('YYYY年MM月')} - ${end.format('MM月')}`,
      summaryLabel: '本季度平均能量值',
      fetchLimit: 4000,
    }
  }

  const start = anchor.clone().startOf('isoWeek').startOf('day')
  const end = anchor.clone().endOf('isoWeek').endOf('day')
  return {
    start,
    end,
    dayCount: 7,
    title: '七日能量星河',
    label: `${start.format('MM/DD')} - ${end.format('MM/DD')}`,
    summaryLabel: '近7天平均能量值',
    fetchLimit: 500,
  }
}

export const shiftEnergyRangeAnchor = (anchor: Moment, range: EnergyMatrixRange, direction: -1 | 1): Moment => {
  if (range === '30d') {
    return anchor.clone().add(direction * 30, 'days')
  }

  if (range === 'quarter') {
    return anchor.clone().add(direction, 'quarter')
  }

  return anchor.clone().add(direction, 'week')
}

export const isCurrentEnergyRange = (period: EnergyRangePeriod): boolean => {
  return moment().isBetween(period.start, period.end, 'day', '[]')
}

export const getEnergyRangeAxisLabel = (
  date: Moment,
  index: number,
  totalDays: number,
  range: EnergyMatrixRange,
): string => {
  if (range === 'quarter') {
    if (index === 0 || index === totalDays - 1 || date.date() === 1) {
      return date.format('MM/DD')
    }
    return ''
  }

  if (range === '30d') {
    if (index === 0 || index === totalDays - 1 || date.date() === 1 || index % 5 === 0) {
      return date.format('MM/DD')
    }
    return ''
  }

  return date.isSame(moment(), 'day') ? '今天' : date.format('MM/DD')
}
