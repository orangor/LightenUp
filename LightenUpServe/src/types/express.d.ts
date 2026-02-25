// src/types/express.d.ts
import 'express'

declare module 'express' {
  interface Response {
    /**
     * 由 compression 中间件提供的 flush 方法
     * @see https://github.com/expressjs/compression#flush
     */
    flush?: () => void
  }
}
