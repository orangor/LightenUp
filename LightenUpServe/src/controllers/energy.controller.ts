import { Request, Response } from 'express'
import { Get, Post, Delete } from '../decorators/route.decorator'
import EnergyModel from '../models/energy.model'
import { NotFoundError, BadRequestError } from '../utils/errors'

export default class EnergyController {
  @Get('/api/energy/config', '获取能量配置', '返回能量类型和贴纸数据')
  static async getConfig(req: Request, res: Response) {
    const types = await EnergyModel.getEnergyTypes()
    const stickers = await EnergyModel.getStickers() // 获取所有激活的贴纸
    return { types, stickers }
  }

  @Post('/api/energy/moments', '发布能量动态', '发布一条新的能量动态', {
    required: ['energyTypeId', 'stickerId'],
    properties: {
      energyTypeId: { type: 'number', description: '能量类型ID' },
      stickerId: { type: 'number', description: '贴纸ID' },
      content: { type: 'string', description: '动态内容' },
      media: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            mediaType: { type: 'number', description: '1:图片, 2:视频' },
            fileUrl: { type: 'string', description: '文件URL' },
            sortOrder: { type: 'number', description: '排序' },
          },
        },
        description: '多媒体列表',
      },
      visibility: { type: 'number', description: '可见性 0:私密 1:公开 2:匿名' },
      relatedMomentId: { type: 'number', description: '关联的旧动态ID' },
      location: { type: 'string', description: '位置信息' },
    },
  })
  static async createMoment(req: Request, res: Response) {
    if (!req.user) throw new Error('未授权')
    const userId = req.user.userId
    const { energyTypeId, stickerId, content, media, visibility, relatedMomentId, location } = req.body

    // 校验 stickerId 是否属于 energyTypeId (可选，严格校验)
    // const sticker = await StickerModel.findById(stickerId);
    // if (sticker.energy_type_id !== energyTypeId) throw new BadRequestError('贴纸与能量类型不匹配');

    const momentId = await EnergyModel.createMoment({
      userId,
      energyTypeId,
      stickerId,
      content,
      media,
      visibility,
      relatedMomentId,
      location,
    })

    return { id: momentId, message: '发布成功' }
  }

  @Get('/api/energy/feed', '获取能量流', '分页获取动态列表')
  static async getFeed(req: Request, res: Response) {
    const userId = req.user?.userId
    const { type, energy_level, page, limit } = req.query as any

    const result = await EnergyModel.getFeed({
      userId,
      type: type as 'all' | 'follow',
      energyLevel: energy_level as 'high' | 'low',
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    })

    return result
  }

  @Post('/api/energy/interact', '能量互动', '点赞(充能)或评论', {
    required: ['momentId', 'type'],
    properties: {
      momentId: { type: 'number', description: '动态ID' },
      type: { type: 'number', description: '1:充能, 2:评论' },
      content: { type: 'string', description: '评论内容' },
      reactionStyle: { type: 'string', description: 'charge/resonate' },
    },
  })
  static async interact(req: Request, res: Response) {
    if (!req.user) throw new Error('未授权')
    const userId = req.user.userId
    const { momentId, type, content, reactionStyle } = req.body

    await EnergyModel.interact(userId, momentId, type, content, reactionStyle)
    return { success: true }
  }

  @Delete('/api/energy/moments/:id', '删除能量动态', '删除指定ID的动态及其关联数据')
  static async deleteMoment(req: Request, res: Response) {
    if (!req.user) throw new Error('未授权')
    const userId = req.user.userId
    const momentId = Number(req.params.id)

    if (!momentId) throw new BadRequestError('动态ID无效')

    const success = await EnergyModel.deleteMoment(momentId, userId)
    if (!success) {
      throw new NotFoundError('动态不存在或无权删除')
    }

    return { success: true, message: '删除成功' }
  }

  @Get('/api/energy/unclosed', '获取未闭环动态', '获取过去7天未闭环的低频动态')
  static async getUnclosedMoments(req: Request, res: Response) {
    if (!req.user) throw new Error('未授权')
    const userId = req.user.userId

    const moments = await EnergyModel.getUnclosedMoments(userId)
    return moments
  }

  @Get('/api/energy/trend', '获取能量趋势', '返回个人能量值时间序列（默认近30天，按时间升序）')
  static async getTrend(req: Request, res: Response) {
    if (!req.user) throw new Error('未授权')
    const userId = req.user.userId
    const { start_date, end_date, days, group_by, limit } = req.query as any

    const result = await EnergyModel.getTrend({
      userId,
      startDate: start_date,
      endDate: end_date,
      days: days ? Number(days) : 30,
      limit: limit ? Number(limit) : undefined,
      groupBy: group_by as 'raw' | 'hour' | 'day',
    })
    return result
  }
}
