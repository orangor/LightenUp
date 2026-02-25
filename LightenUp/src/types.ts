export interface TimeEntry {
  id: string
  hours: number
  date: string
  note?: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  startDate: string
  deadline: string
  timeframe: 'daily' | 'monthly' | 'yearly'
  status: 'pending' | 'in_progress' | 'completed'
  estimatedHours: number
  actualHours: number
  timeEntries: TimeEntry[]
}
export const tasks: Task[] = [
  {
    id: '1',
    title: '设计数据库模式',
    description: '为新数据库系统设计模式。',
    priority: 'high',
    startDate: '2024-01-01',
    deadline: '2024-12-31',
    timeframe: 'monthly',
    status: 'pending',
    estimatedHours: 40,
    actualHours: 0,
    timeEntries: [
      {
        id: 'te1',
        hours: 8,
        date: '2024-01-10',
        note: '初步设计会议',
      },
    ],
  },
  {
    id: '2',
    title: '实现用户认证',
    description: '为网络应用程序实现用户认证。',
    priority: 'medium',
    startDate: '2024-01-01',
    deadline: '2024-11-15',
    timeframe: 'daily',
    status: 'in_progress',
    estimatedHours: 20,
    actualHours: 10,
    timeEntries: [
      {
        id: 'te2',
        hours: 2,
        date: '2024-01-11',
        note: '认证逻辑开发',
      },
      {
        id: 'te3',
        hours: 3,
        date: '2024-01-12',
        note: '测试和调试',
      },
    ],
  },
  {
    id: '3',
    title: '准备项目报告',
    description: '为项目准备一份全面的报告。',
    priority: 'low',
    startDate: '2024-01-01',
    deadline: '2024-10-30',
    timeframe: 'yearly',
    status: 'completed',
    estimatedHours: 10,
    actualHours: 8,
    timeEntries: [
      {
        id: 'te4',
        hours: 3,
        date: '2024-01-13',
        note: '数据收集',
      },
      {
        id: 'te5',
        hours: 5,
        date: '2024-01-14',
        note: '报告撰写',
      },
    ],
  },
]
export type TaskFormData = Omit<Task, 'id' | 'actualHours' | 'timeEntries'>
