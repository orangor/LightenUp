// 任务优先级
export const PRIORITY_MAP = {
  high: '重要紧急',
  medium: '重要不紧急',
  low: '不重要不紧急',
  none: '不重要紧急',
} as const

// 任务状态
export const STATUS_MAP = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
} as const

// 时间范围
export const TIMEFRAME_MAP = {
  daily: '每周任务',
  monthly: '月度规划',
  yearly: '年度目标',
} as const

// 时间范围颜色
export const TIMEFRAME_COLORS = {
  daily: '#FF9500',
  monthly: '#007AFF',
  yearly: '#34C759',
} as const

// 状态颜色
export const STATUS_COLORS = {
  pending: '#FF9500',
  in_progress: '#007AFF',
  completed: '#34C759',
} as const

// 优先级颜色
export const PRIORITY_COLORS = {
  high: '#FF3B30',
  medium: '#FF9500',
  low: '#34C759',
  none: '#8E8E93',
} as const

// 时间相关文案
export const TIME_TEXT = {
  estimated: '时间',
  actual: '投入',
  hour: '小时',
  over: '超出',
  under: '节省',
  expected: '符合预期',
  input: '+',
  divide: '/',
  confirm: '确认',
  cancel: '取消',
  addNote: '添加备注（可选）',
  inputHours: '输入小时数',
} as const

// 任务创建相关文案
export const TASK_CREATE_TEXT = {
  createButton: '+',
  title: '任务标题',
  titlePlaceholder: '输入任务标题',
  description: '任务描述',
  descriptionPlaceholder: '输入任务描述',
  priority: '优先级',
  timeframe: '时间范围',
  startDate: '开始日期',
  deadline: '截止日期',
  estimatedHours: '计划投入时间(小时)',
  estimatedHoursPlaceholder: '请输入预计需要的小时数',
  cancel: '取消',
  confirm: '创建任务',
} as const

// 错误提示文案
export const ERROR_TEXT = {
  createTaskError: '创建任务错误',
  networkError: '网络错误',
  unknownError: '未知错误',
  tryAgainLater: '请稍后重试',
} as const

// 日期相关文案
export const DATE_TEXT = {
  deadline: '截止日期',
  startDate: '开始日期',
} as const

// 任务项相关文案
export const TASK_ITEM_TEXT = {
  example: {
    task: '示例任务',
    description: '任务描述',
    priority: '优先级',
    timeframe: '时间范围',
    status: '状态',
  },
} as const

// 聊天相关文案
// src/constants/dictionaries.ts
export const CHAT_TEXT = {
  title: '智能助手',
  loading: '正在思考中...',
  error: {
    tryAgain: '请稍后再试',
    noReply: '未收到回复',
  },
  input: {
    placeholder: '输入消息...',
    send: '发送',
    waiting: '正在生成回复，请稍候...', // 新增这个属性
  },
  ball: {
    icon: '💬', // 示例值，根据实际需求修改
    text: '对话', // 示例值，根据实际需求修改
  },
} as const
// 在 constants/dictionaries.ts 中添加以下类型定义
declare global {
  interface ChatText {
    ball: {
      icon: string
      text: string
    }
  }
}
// AI 助手系统提示文案
export const AI_SYSTEM_PROMPT = '' as const

export const DASHBOARD_TEXT = {
  title: '循环系统',
} as const

// 顶部导航配置已迁移至 src/config/navigation.tsx，仅在该文件维护。
// 这里不再导出 BRAND/NAV_ITEMS 以避免循环依赖。
