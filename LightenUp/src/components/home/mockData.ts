export interface Goal {
  id: string
  title: string
  startDate: string
  endDate: string
  progress: number // 0-100
  status: 'active' | 'completed' | 'overdue'
  tags: string[]
}

export interface Category {
  id: string
  title: string
  color: string
  icon?: string
  count?: number
}

export interface Task {
  id: string
  categoryId: string
  title: string
  description?: string
  date: string
  completed: boolean
}

export const tasks: Task[] = [
  {
    id: '1',
    categoryId: '1',
    title: '聚会',
    description: '和老朋友聚餐',
    date: '2026/2/20',
    completed: false,
  },
  {
    id: '2',
    categoryId: '3',
    title: '周报',
    description: '完成本周工作总结',
    date: '2026/2/20',
    completed: true,
  },
]

export const goals: Goal[] = [
  {
    id: '1',
    title: '软件上线',
    startDate: '2025/01/01',
    endDate: '2025/03/31',
    progress: 75,
    status: 'overdue',
    tags: ['超期'],
  },
  {
    id: '2',
    title: '年度阅读计划',
    startDate: '2025/01/01',
    endDate: '2025/12/31',
    progress: 15,
    status: 'active',
    tags: ['进行中'],
  },
]

export const categories: Category[] = [
  { id: '1', title: '社交', color: '#5C5CFF' }, // Blue-ish purple
  { id: '2', title: '修行', color: '#A64DFF' }, // Purple
  { id: '3', title: '工作', color: '#007AFF' }, // Blue
  { id: '4', title: '学习', color: '#FFD60A' }, // Yellow
  { id: '5', title: '创造', color: '#FF9F0A' }, // Orange
  { id: '6', title: '健康', color: '#30D158' }, // Green
  { id: '7', title: '阅读', color: '#00C7BE' }, // Teal
  { id: '8', title: '其他', color: '#8E8E93' }, // Gray
]
