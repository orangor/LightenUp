-- 创建hbscx相关数据表

-- 1. 用户表 (扩展现有用户表或创建新的hbscx用户表)
CREATE TABLE IF NOT EXISTS hbscx_users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    plan ENUM('free', 'premium') DEFAULT 'free',
    ai_usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_plan (plan)
);

-- 2. 模板表
CREATE TABLE IF NOT EXISTS hbscx_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    template_data JSON NOT NULL,
    preview_url VARCHAR(500) NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_premium (is_premium),
    INDEX idx_name (name)
);

-- 3. 海报表
CREATE TABLE IF NOT EXISTS hbscx_posters (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NULL,
    template_id VARCHAR(36) NULL,
    title VARCHAR(255) NOT NULL,
    canvas_data JSON NOT NULL,
    preview_url VARCHAR(500) NULL,
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES hbscx_users(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES hbscx_templates(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_template_id (template_id),
    INDEX idx_status (status),
    INDEX idx_title (title)
);

-- 4. AI使用记录表
CREATE TABLE IF NOT EXISTS hbscx_ai_usage (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NULL,
    service_type VARCHAR(100) NOT NULL,
    request_data JSON NULL,
    response_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES hbscx_users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_service_type (service_type),
    INDEX idx_created_at (created_at)
);

-- 5. 模板分类表 (用于管理模板分类)
CREATE TABLE IF NOT EXISTS hbscx_template_categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_sort_order (sort_order),
    INDEX idx_active (is_active)
);

-- 插入默认模板分类
INSERT INTO hbscx_template_categories (name, display_name, description, sort_order) VALUES
('technology', '科技', '科技相关模板', 1),
('marketing', '营销', '营销推广模板', 2),
('business', '商务', '商务办公模板', 3),
('fashion', '时尚', '时尚潮流模板', 4),
('education', '教育', '教育培训模板', 5),
('food', '美食', '美食餐饮模板', 6),
('sports', '体育', '体育运动模板', 7),
('travel', '旅游', '旅游出行模板', 8),
('music', '音乐', '音乐娱乐模板', 9),
('realestate', '房地产', '房地产模板', 10),
('festival', '节日', '节日庆典模板', 11),
('automotive', '汽车', '汽车行业模板', 12),
('healthcare', '医疗', '医疗健康模板', 13),
('finance', '金融', '金融理财模板', 14),
('wedding', '婚礼', '婚礼庆典模板', 15);