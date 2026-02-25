import { Request, Response } from 'express'
import { Get } from '../decorators/route.decorator'
import { CsrfService } from '../services/csrf.service'

export default class CsrfController {
  @Get('/api/csrf-token', '获取CSRF Token', '获取新的CSRF Token', null)
  static async getCsrfToken(req: Request, res: Response) {
    const token = await CsrfService.generateToken('anonymous')
    return { csrfToken: token }
  }
}
