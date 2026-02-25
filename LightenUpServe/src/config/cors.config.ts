export const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // 使用环境变量，默认允许所有
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  maxAge: 86400, // 预检请求缓存24小时
}
