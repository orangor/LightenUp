import { Pool, createPool } from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'

// 确保加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') })

const db: Pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// 测试连接
db.getConnection()
  .then((connection) => {
    connection.release()
  })
  .catch((err) => {
    console.error('Database connection failed:', err)
  })

export default db
