import dotenv from 'dotenv'
import path from 'path'

// 加载环境变量
const result = dotenv.config({ path: path.join(__dirname, '../../.env') })

if (result.error) {
  console.error('Error loading .env file:', result.error)
  process.exit(1)
}

// 验证必要的环境变量
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key])

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars)
  process.exit(1)
}
