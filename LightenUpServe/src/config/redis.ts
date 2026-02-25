import Redis from 'ioredis'

// 创建 Redis 客户端
export const redis = new Redis({
  host: '43.143.51.202',
  port: 6379,
  password: '19973232abc',
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

// 监听连接状态
redis.on('connect', () => {
  console.log('Redis connected successfully')
})

redis.on('error', (err: Error) => {
  console.error('Redis connection error:', err)
})
