export interface Challenge {
  id: string
  name: string // 挑战名称 (e.g., "30天论文定稿计划")
  startDate: string // 开始日期 (ISO 8601)
  endDate: string // 结束日期 (ISO 8601)
  totalDays: number // 总天数
  goal: string // 挑战目的 (北极星指标)
  description: string // 挑战内容/动作规范
  status: 'active' | 'completed' | 'abandoned'

  // 状态追踪
  beforeState: {
    description: string // 现状描述
    media: string[] // 图片/视频 URL
    negativeTags: string[] // 负面标签 (e.g., "拖延", "效率低")
  }

  afterState: {
    expectedResult: string // 预期结果 (新建时填)
    positiveTags: string[] // 正面标签 (e.g., "自信", "高效")
    actualResult?: {
      // 实际结果 (结束后填)
      description: string
      media: string[]
    }
  }

  progress: {
    currentDay: number
    checkInCount: number
    lastCheckInDate?: string
  }
}

export interface CheckInRecord {
  id: string
  challengeId: string
  date: string // 打卡日期
  content: string // 富文本内容
  media: {
    type: 'image' | 'video'
    url: string
  }[]
  attachments: {
    // PDF/Word/Excel/ZIP
    name: string
    url: string
    type: string
  }[]
  mood: 'energetic' | 'struggling' | 'breakthrough' | 'normal' // 每日状态
}
