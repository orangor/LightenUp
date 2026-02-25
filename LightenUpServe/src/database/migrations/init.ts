import db from '../../config/database'
import logger from '../../utils/logger'

const initDatabase = async (): Promise<void> => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `)
    logger.info('Database initialized successfully')
  } catch (error) {
    logger.error('Error initializing database:', error)
    throw error
  }
}

export default initDatabase
