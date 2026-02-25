-- ----------------------------
-- EnergyFlow (能量流) 模块数据表
-- ----------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 能量类型配置表
-- ----------------------------
DROP TABLE IF EXISTS `cfg_energy_types`;
CREATE TABLE `cfg_energy_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '显示名称',
  `level_value` int(11) NOT NULL COMMENT '能量值 (e.g. 100, 540)',
  `color_hex` varchar(10) NOT NULL COMMENT 'UI主题色',
  `icon_code` varchar(20) NOT NULL COMMENT '前端图标映射Key',
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='能量类型配置表';

-- ----------------------------
-- 2. 情绪贴纸库
-- ----------------------------
DROP TABLE IF EXISTS `cfg_stickers`;
CREATE TABLE `cfg_stickers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `energy_type_id` int(11) NOT NULL,
  `sticker_url` varchar(255) NOT NULL,
  `sticker_name` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='情绪贴纸库';

-- ----------------------------
-- 3. 能量动态表
-- ----------------------------
DROP TABLE IF EXISTS `energy_moments`;
CREATE TABLE `energy_moments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '关联 users.id',
  `energy_type_id` int(11) NOT NULL,
  `sticker_id` int(11) NOT NULL COMMENT '必填：选中的具体贴纸ID',
  `content_text` text COMMENT '文字内容',
  `location` varchar(100) DEFAULT NULL,
  `visibility` tinyint(4) DEFAULT '1' COMMENT '0:私密, 1:公开, 2:匿名树洞',
  `related_moment_id` bigint(20) DEFAULT NULL COMMENT '关联的前置动态ID (Before)',
  `is_closed_loop` tinyint(1) DEFAULT '0' COMMENT '是否形成闭环',
  `like_count` int(11) DEFAULT '0',
  `comment_count` int(11) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_energy` (`user_id`, `energy_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='能量动态表';

-- ----------------------------
-- 4. 动态媒体附件表
-- ----------------------------
DROP TABLE IF EXISTS `moment_media`;
CREATE TABLE `moment_media` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `moment_id` bigint(20) NOT NULL COMMENT '关联动态ID',
  `media_type` tinyint(4) NOT NULL COMMENT '1:图片, 2:视频',
  `file_url` varchar(512) NOT NULL COMMENT '文件资源地址',
  `sort_order` tinyint(4) DEFAULT '0' COMMENT '排序：1-9',
  PRIMARY KEY (`id`),
  KEY `idx_moment` (`moment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态媒体附件表';

-- ----------------------------
-- 5. 互动记录表
-- ----------------------------
DROP TABLE IF EXISTS `moment_interactions`;
CREATE TABLE `moment_interactions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `moment_id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT '操作者ID，关联 users.id',
  `interaction_type` tinyint(4) NOT NULL COMMENT '1:充能(Like), 2:评论',
  `reaction_style` varchar(20) DEFAULT NULL COMMENT 'charge/resonate',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='互动记录表';

-- ----------------------------
-- 6. 初始化能量类型数据
-- ----------------------------
INSERT INTO `cfg_energy_types` (`id`, `name`, `level_value`, `color_hex`, `icon_code`, `description`) VALUES
(1, '焦虑/恐惧', 100, '#FF4D4F', '😰', '赶due、压力大...'),
(2, '愤怒/抱怨', 150, '#CF1322', '😡', '不公平、生气...'),
(3, '勇气/行动', 200, '#FAAD14', '😤', '尝试、挑战...'),
(4, '平静/理智', 400, '#52C41A', '🧐', '冷静、思考...'),
(5, '喜悦/感恩', 540, '#FFC069', '😊', '开心、满足...'),
(6, '开悟/合一', 700, '#722ED1', '🧘', '顿悟、升华...');

SET FOREIGN_KEY_CHECKS = 1;
