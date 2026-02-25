declare module 'express-rate-limit' {
  import { RequestHandler } from 'express'

  interface Options {
    windowMs?: number
    max?: number
  }

  function rateLimit(options?: Options): RequestHandler
  export default rateLimit
}
