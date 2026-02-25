import { Request, Response } from 'express'
import { Post } from '../decorators/route.decorator'
import OpenAI from 'openai'

// 安全配置DeepSeek客户端
const createDeepseekClient = () =>
  new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-dc2c93e0afe34d91ab4fbd8ed942484f',
    timeout: 30000,
    maxRetries: 2,
  })

const deepseek = createDeepseekClient()

export default class ModeController {
  private static handleStreamError(res: Response, error: Error) {
    if (!res.headersSent) {
      res.status(500)
    }
    if (!res.writableEnded) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          code: 500,
          message: 'Stream processing failed',
        })}\n\n`
      )
      res.end()
    }
    console.error('Stream Error:', error)
  }

  @Post('/api/mode/chat-stream', '请求DEEPSEEK', '请求DEEPSEEK', {
    required: ['messages'], // ✅ 正确参数名
    properties: [
      {
        type: 'array',
        name: 'messages',
        items: {
          type: 'object',
          properties: [
            { type: 'string', name: 'role', enum: ['system', 'user', 'assistant'] },
            { type: 'string', name: 'content' },
          ],
        },
      },
    ],
    example: {
      // ✅ 正确示例
      messages: [{ role: 'user', content: '解释量子计算' }],
    },
    responseExample: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  static async chatStream(req: Request, res: Response) {
    // 前置参数校验
    if (!req.body?.messages || !Array.isArray(req.body.messages)) {
      return res.status(400).json({ error: '需要有效的 messages 数组参数' })
    }

    // 初始化流式响应
    try {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      res.flushHeaders()
    } catch (headerError) {
      console.error('设置响应头失败:', headerError)
      return
    }

    // 连接状态管理
    let isStreamActive = true
    const cleanup = () => {
      isStreamActive = false
      if (!res.writableEnded) res.end()
    }

    req.on('close', cleanup)
    req.on('error', cleanup)

    try {
      // API请求处理
      const stream = await deepseek.chat.completions.create({
        model: 'deepseek-reasoner', // 'deepseek-chat'
        messages: req.body.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        temperature: 0.7,
      })

      // 流数据处理
      for await (const chunk of stream) {
        if (!isStreamActive) break

        try {
          const delta = chunk.choices[0].delta
          // 处理 reasoning_content（如果存在）
          if ('reasoning_content' in delta) {
            const reasoningContent = delta.reasoning_content || ''
            const content = delta.content || ''
            if (delta.reasoning_content !== null) {
              res.write(`data: ${JSON.stringify({ type: 'reasoning', content: reasoningContent })}\n\n`)
            } else {
              res.write(`data: ${JSON.stringify({ type: 'content', content: content })}\n\n`)
            }
          }

          // 安全调用flush（需确保已配置compression中间件）
          if (typeof res.flush === 'function') {
            res.flush()
          }
        } catch (writeError) {
          console.error('写入流数据失败:', writeError)
          break
        }
      }

      // 正常结束
      if (isStreamActive) {
        res.write('event: end\ndata: {"status":"completed"}\n\n')
      }
    } catch (error) {
      // 错误处理
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      console.error('流式请求失败:', errorMessage)

      if (isStreamActive) {
        res.write(
          `event: error\ndata: ${JSON.stringify({
            code: 500,
            message: errorMessage,
          })}\n\n`
        )
      }
    } finally {
      cleanup()
    }
  }
}
