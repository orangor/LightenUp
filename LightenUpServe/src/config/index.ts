// 不需要再次加载 dotenv，因为已经在 env.ts 中加载了
const config = {
  database: {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    port: Number(process.env.DB_PORT) || 3306,
  },
}

export default config
