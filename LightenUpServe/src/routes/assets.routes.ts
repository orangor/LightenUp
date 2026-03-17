import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { AssetModels } from '../models/asset.model'
import { ValidationError } from '../utils/errors'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

function getPublicBaseUrl(req: express.Request): string {
  const configured = process.env.PUBLIC_BASE_URL || process.env.PUBLIC_URL
  if (configured && configured.trim()) return configured.trim().replace(/\/+$/, '')
  return `${req.protocol}://${req.get('host')}`
}

function getExt(originalName: string, mime?: string): string {
  const ext = path.extname(originalName || '').toLowerCase()
  if (ext) return ext
  if (mime === 'image/png') return '.png'
  if (mime === 'image/jpeg') return '.jpg'
  if (mime === 'image/webp') return '.webp'
  return ''
}

router.post('/assets/upload', upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) throw new ValidationError('缺少上传文件（字段名：file）')

  const allowed = new Set(['image/png', 'image/jpeg', 'image/webp'])
  if (!allowed.has(file.mimetype)) {
    throw new ValidationError('不支持的图片类型')
  }

  const assetId = uuidv4()
  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const ext = getExt(file.originalname, file.mimetype)
  if (!ext) throw new ValidationError('无法识别文件后缀')

  const relPath = path.posix.join('images', yyyy, mm, `${assetId}${ext}`)
  // 使用 __dirname 确保在开发(src/routes)和生产(dist/routes)环境中都能正确找到项目根目录下的 uploads
  const diskDir = path.join(__dirname, '../../uploads', 'assets', 'images', yyyy, mm)
  const diskPath = path.join(diskDir, `${assetId}${ext}`)

  fs.mkdirSync(diskDir, { recursive: true })
  fs.writeFileSync(diskPath, file.buffer)

  const url = `${getPublicBaseUrl(req)}/assets/${relPath}`

  await AssetModels.createAsset(assetId, 'image', url)

  res.sendSuccess({
    assetId,
    url,
    type: 'image',
  })
})

export default router

