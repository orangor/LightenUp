// import db from '../config/database'
// import logger from '../utils/logger'
// import { AppError } from '../utils/errors'

// export const initializeDatabase = async (): Promise<void> => {
//   try {
//     await initializeUserTable()
//     await initializeHbscxTables()
//     logger.info('Database initialization successful')
//   } catch (error) {
//     logger.error('Database initialization failed:', error)
//     throw new AppError('数据库初始化失败', 500)
//   }
// }

// const initializeUserTable = async (): Promise<void> => {
//   try {
//     await db.execute(`
//       CREATE TABLE IF NOT EXISTS users (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         email VARCHAR(255) NOT NULL UNIQUE,
//         password VARCHAR(255) NOT NULL,
//         email_verified BOOLEAN DEFAULT FALSE,
//         verification_token VARCHAR(255) NULL,
//         reset_token VARCHAR(255) NULL,
//         reset_token_expires DATETIME NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//       )
//     `)
//     logger.info('Users table initialized')
//   } catch (error) {
//     logger.error('Failed to initialize users table:', error)
//     throw error
//   }
// }

// const initializeHbscxTables = async (): Promise<void> => {
//   try {
//     // 1. 创建hbscx用户表
//     await db.execute(`
//       CREATE TABLE IF NOT EXISTS hbscx_users (
//         id VARCHAR(36) PRIMARY KEY,
//         email VARCHAR(255) NOT NULL UNIQUE,
//         name VARCHAR(255) NOT NULL,
//         plan ENUM('free', 'premium') DEFAULT 'free',
//         ai_usage_count INT DEFAULT 0,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         INDEX idx_email (email),
//         INDEX idx_plan (plan)
//       )
//     `)

//     // 2. 创建模板分类表
//     await db.execute(`
//       CREATE TABLE IF NOT EXISTS hbscx_template_categories (
//         id VARCHAR(36) PRIMARY KEY,
//         name VARCHAR(100) NOT NULL UNIQUE,
//         display_name VARCHAR(100) NOT NULL,
//         description TEXT NULL,
//         sort_order INT DEFAULT 0,
//         is_active BOOLEAN DEFAULT TRUE,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         INDEX idx_name (name),
//         INDEX idx_sort_order (sort_order),
//         INDEX idx_active (is_active)
//       )
//     `)

//     // 3. 创建模板表
//     await db.execute(`
//       CREATE TABLE IF NOT EXISTS hbscx_templates (
//         id VARCHAR(36) PRIMARY KEY,
//         name VARCHAR(255) NOT NULL,
//         category VARCHAR(100) NOT NULL,
//         template_data JSON NOT NULL,
//         preview_url VARCHAR(500) NULL,
//         is_premium BOOLEAN DEFAULT FALSE,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         INDEX idx_category (category),
//         INDEX idx_premium (is_premium),
//         INDEX idx_name (name),
//         FOREIGN KEY (category) REFERENCES hbscx_template_categories(name) ON UPDATE CASCADE
//       )
//     `)

//     // 4. 创建海报表
//     await db.execute(`
//       CREATE TABLE IF NOT EXISTS hbscx_posters (
//         id VARCHAR(36) PRIMARY KEY,
//         user_id VARCHAR(36) NULL,
//         template_id VARCHAR(36) NULL,
//         title VARCHAR(255) NOT NULL,
//         canvas_data JSON NOT NULL,
//         preview_url VARCHAR(500) NULL,
//         status ENUM('draft', 'published') DEFAULT 'draft',
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES hbscx_users(id) ON DELETE SET NULL,
//         FOREIGN KEY (template_id) REFERENCES hbscx_templates(id) ON DELETE SET NULL,
//         INDEX idx_user_id (user_id),
//         INDEX idx_template_id (template_id),
//         INDEX idx_status (status),
//         INDEX idx_title (title)
//       )
//     `)

//     // 5. 创建AI使用记录表
//     await db.execute(`
//       CREATE TABLE IF NOT EXISTS hbscx_ai_usage (
//         id VARCHAR(36) PRIMARY KEY,
//         user_id VARCHAR(36) NULL,
//         service_type VARCHAR(100) NOT NULL,
//         request_data JSON NULL,
//         response_data JSON NULL,
//         tokens_used INT DEFAULT 0,
//         cost DECIMAL(10,4) DEFAULT 0.0000,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES hbscx_users(id) ON DELETE SET NULL,
//         INDEX idx_user_id (user_id),
//         INDEX idx_service_type (service_type),
//         INDEX idx_created_at (created_at)
//       )
//     `)

//     // 检查并添加缺失的列
//     await addMissingColumns()

//     // 插入默认模板分类
//     await insertDefaultCategories()

//     logger.info('HBSCX tables initialized successfully')
//   } catch (error) {
//     logger.error('Failed to initialize HBSCX tables:', error)
//     throw error
//   }
// }

// // 添加缺失列的函数（用于数据库升级）
// const addMissingColumns = async (): Promise<void> => {
//   try {
//     // 检查 hbscx_ai_usage 表是否有 tokens_used 和 cost 列
//     const [columns] = await db.execute(`
//       SELECT COLUMN_NAME
//       FROM INFORMATION_SCHEMA.COLUMNS
//       WHERE TABLE_SCHEMA = DATABASE()
//       AND TABLE_NAME = 'hbscx_ai_usage'
//     `)

//     const columnNames = (columns as any[]).map(col => col.COLUMN_NAME)

//     if (!columnNames.includes('tokens_used')) {
//       await db.execute(`
//         ALTER TABLE hbscx_ai_usage
//         ADD COLUMN tokens_used INT DEFAULT 0
//       `)
//       logger.info('Added tokens_used column to hbscx_ai_usage table')
//     }

//     if (!columnNames.includes('cost')) {
//       await db.execute(`
//         ALTER TABLE hbscx_ai_usage
//         ADD COLUMN cost DECIMAL(10,4) DEFAULT 0.0000
//       `)
//       logger.info('Added cost column to hbscx_ai_usage table')
//     }
//   } catch (error) {
//     logger.error('Failed to add missing columns:', error)
//     // 不抛出错误，因为这可能是首次创建表
//   }
// }

// const insertDefaultCategories = async (): Promise<void> => {
//   try {
//     // 检查是否已有数据
//     const [rows] = await db.execute('SELECT COUNT(*) as count FROM hbscx_template_categories')
//     const count = (rows as any[])[0].count

//     if (count === 0) {
//       // 需要生成UUID的默认分类
//       const { v4: uuidv4 } = require('uuid')

//       const categories = [
//         { id: uuidv4(), name: 'business', display_name: '商务', description: '商务相关模板', sort_order: 1 },
//         { id: uuidv4(), name: 'technology', display_name: '科技', description: '科技相关模板', sort_order: 2 },
//         { id: uuidv4(), name: 'education', display_name: '教育', description: '教育相关模板', sort_order: 3 },
//         { id: uuidv4(), name: 'lifestyle', display_name: '生活', description: '生活相关模板', sort_order: 4 },
//         { id: uuidv4(), name: 'creative', display_name: '创意', description: '创意设计模板', sort_order: 5 }
//       ]

//       for (const category of categories) {
//         await db.execute(
//           'INSERT INTO hbscx_template_categories (id, name, display_name, description, sort_order) VALUES (?, ?, ?, ?, ?)',
//           [category.id, category.name, category.display_name, category.description, category.sort_order]
//         )
//       }

//       logger.info('Default template categories inserted')
//     }
//   } catch (error) {
//     logger.error('Failed to insert default categories:', error)
//     // 不抛出错误，因为可能是重复插入
//   }
// }
