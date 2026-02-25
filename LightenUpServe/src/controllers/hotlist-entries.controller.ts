import { Request, Response } from 'express'
import { Get, Post, Put, Delete } from '../decorators/route.decorator'
import HotlistEntryModel from '../models/hotlist-entry.model'
import { ValidationError } from '../utils/errors'

export default class HotlistEntriesController {
  @Get(
    '/api/hotlist-entries',
    '查询热榜条目',
    '按平台、日期、标题、排名、热度等筛选，支持分页与排序',
    {
      // 为 Swagger 生成查询参数说明
      properties: [
        {
          name: 'platform',
          type: 'string',
          description: '平台名称（如知乎、微博、抖音等）',
          required: false,
          example: '知乎',
        },
        {
          name: 'startDate',
          type: 'string',
          format: 'date',
          description: '开始日期（YYYY-MM-DD）',
          required: false,
          example: '2025-11-01',
        },
        {
          name: 'endDate',
          type: 'string',
          format: 'date',
          description: '结束日期（YYYY-MM-DD）',
          required: false,
          example: '2025-11-05',
        },
        {
          name: 'title',
          type: 'string',
          description: '标题关键词（模糊匹配）',
          required: false,
          example: 'AI',
        },
        {
          name: 'minRank',
          type: 'integer',
          description: '最小排名（越小越靠前）',
          required: false,
          example: 1,
        },
        {
          name: 'maxRank',
          type: 'integer',
          description: '最大排名',
          required: false,
          example: 50,
        },
        {
          name: 'minHeat',
          type: 'integer',
          description: '最小热度值',
          required: false,
          example: 1000,
        },
        {
          name: 'maxHeat',
          type: 'integer',
          description: '最大热度值',
          required: false,
          example: 100000,
        },
        {
          name: 'page',
          type: 'integer',
          description: '页码（从1开始）',
          required: false,
          example: 1,
        },
        {
          name: 'limit',
          type: 'integer',
          description: '每页数量（默认20，建议≤100）',
          required: false,
          example: 20,
        },
        {
          name: 'sortBy',
          type: 'string',
          description: '排序字段',
          enum: ['date', 'rank', 'heat', 'created_at'],
          required: false,
          example: 'date',
        },
        {
          name: 'sortOrder',
          type: 'string',
          description: '排序方向',
          enum: ['asc', 'desc'],
          required: false,
          example: 'desc',
        },
      ],
    }
  )
  static async list(req: Request, res: Response) {
    const {
      platform,
      startDate,
      endDate,
      title,
      minRank,
      maxRank,
      minHeat,
      maxHeat,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query

    const result = await HotlistEntryModel.list({
      platform: platform as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      title: title as string | undefined,
      minRank: minRank ? Number(minRank) : undefined,
      maxRank: maxRank ? Number(maxRank) : undefined,
      minHeat: minHeat ? Number(minHeat) : undefined,
      maxHeat: maxHeat ? Number(maxHeat) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: (sortBy as any) || undefined,
      sortOrder: (sortOrder as any) || undefined,
    })

    return result
  }

  @Get('/api/hotlist-entries/stats', '热榜统计', '按平台统计条目数量')
  static async stats(req: Request, res: Response) {
    const { platform, startDate, endDate } = req.query
    const data = await HotlistEntryModel.stats({
      platform: platform as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    })
    return { stats: data }
  }

  @Get('/api/hotlist-entries/:id', '获取条目详情', '根据ID获取热榜条目详情')
  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      throw new ValidationError('无效的条目ID')
    }
    const entry = await HotlistEntryModel.findById(id)
    if (!entry) {
      throw new ValidationError('条目不存在')
    }
    return { entry }
  }

  @Post('/api/hotlist-entries', '创建条目', '创建新的热榜条目', {
    required: ['platform'],
    properties: [
      { name: 'platform', type: 'string', description: '平台名称' },
      { name: 'date', type: 'string', description: '日期' },
      { name: 'title', type: 'string', description: '标题' },
      { name: 'url', type: 'string', description: '链接' },
      { name: 'description', type: 'string', description: '描述' },
      { name: 'rank', type: 'string', description: '排名' },
      { name: 'heat', type: 'string', description: '热度' },
      { name: 'times', type: 'string', description: '更新时间' },
    ],
    example: {
      platform: '知乎',
      date: '2025-11-05',
      title: '某条热门话题',
      url: 'https://example.com',
    },
  })
  static async create(req: Request, res: Response) {
    const id = await HotlistEntryModel.create(req.body)
    return { entry_id: id }
  }

  @Put('/api/hotlist-entries/:id', '更新条目', '更新指定ID的热榜条目')
  static async update(req: Request, res: Response) {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      throw new ValidationError('无效的条目ID')
    }
    await HotlistEntryModel.update(id, req.body)
    return { entry_id: id, message: '更新成功' }
  }

  @Delete('/api/hotlist-entries/:id', '删除条目', '删除指定ID的热榜条目')
  static async remove(req: Request, res: Response) {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      throw new ValidationError('无效的条目ID')
    }
    await HotlistEntryModel.delete(id)
    return { entry_id: id, message: '删除成功' }
  }
}