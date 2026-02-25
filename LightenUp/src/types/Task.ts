export interface TimeEntry {
  id: string
  hours: number
  date: string
  note: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  deadline: string
  timeframe: 'daily' | 'monthly' | 'yearly'
  status: 'pending' | 'in_progress' | 'completed'
  estimatedHours: number
  actualHours: number
  timeEntries: TimeEntry[]
}

export interface TaskGroup {
  id: string
  name: string
  tasks: Task[]
}
