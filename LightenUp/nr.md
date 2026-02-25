这是一个非常完整且具有深度的产品构思。将“朋友圈”的易用性与“能量层级”的心理学深度结合，能够极大地提升用户的粘性。

为了让这个想法真正落地，我为你进行了 **模块功能的深度优化** ，并设计了支撑这些功能的 **MySQL 数据库架构** 。

---

### 第一部分：深度优化的功能模块设计

我们将整个模块命名为 **EnergyFlow (能量流)** 。

#### 1. 核心发布模块：能量罗盘 (The Energy Compass)

- **优化点：** 增加“即时反馈”与“贴纸随机性”。
- **功能逻辑：**
  - **触发：** 点击 `+`，背景模糊，弹出六色轮盘。
  - **动态文案：** 选中“🔴焦虑”时，文案变为“抱抱，允许情绪流经你”；选中“🟡勇气”时，文案变为“这一刻，你很棒”。
  - **智能贴纸池：** 用户选中大类（如焦虑）后，进入编辑页。系统不仅仅提供一个贴纸，而是从后台的“焦虑贴纸包”中随机推荐 3 个（如：头秃、雷雨云、发抖），用户也可手动更换。保证每次发布不单调。
- **关联数据：** `energy_value` (能量值), `sticker_id` (贴纸ID).

#### 2. 信息流模块：能量共振场 (Resonance Feed)

- **优化点：** 视觉分层与差异化互动。
- **UI 渲染：**
  - **低频区（焦虑/愤怒）：** 卡片背景采用低饱和度的红/灰色调，点赞按钮变为🔋（充电/抱抱）。**点击效果：** 屏幕飘起“电池”或“爱心”粒子，给予发布者抚慰。
  - **高频区（喜悦/开悟）：** 卡片背景带有高光或金色边框，点赞按钮变为✨（共鸣/沾喜气）。**点击效果：** 屏幕炸开金粉效果。
- **隐私控制：** 增加“匿名树洞”选项。允许用户发布低频能量时选择“匿名”，只显示能量标签不显示昵称，减轻社交压力。

#### 3. 数据分析模块：能量账本 (Energy Ledger)

- **优化点：** 引入“能量闭环”概念 (The Loop)。
- **自动闭环 (Auto-Pairing)：**
  - 系统算法：当用户在发布“🟡勇气”或“🔵喜悦”时，系统检索过去 7 天内是否有未闭环的“🔴焦虑”动态。
  - 提示：“系统检测到你周二很焦虑，现在你完成了挑战，是否将这条动态关联为‘蜕变结局’？”
  - 确认后，生成一张 Before/After 拼接图，并标记该事件为 `Closed Loop`（已闭环）。
- **图表可视化：**
  - **心流曲线：** 并不是简单的折线，而是类似股票K线图，标出最高点和最低点。
  - **关键词云：** “你本周在【焦虑】时，最常提到的词是‘论文’；在【平静】时，最常提到的是‘图书馆’。”

---

### 第二部分：MySQL 数据库设计 (Database Schema)

为了支持上述功能，我们需要设计高扩展性的表结构。

**设计原则：**

1. **扩展性：** 能量类型（6种）和贴纸不写死在代码里，而是用配置表，方便后续增加新的情绪。
2. **多模态：** 图片、视频分开存储。
3. **闭环逻辑：** 必须有字段能把“Before”和“After”两个帖子连起来。

#### 1. 基础配置表 (Config Tables)

**表名：`cfg_energy_types` (能量类型配置表)**

_用于存储6种核心情绪的定义、颜色和基础能量值。_

**SQL**

```
CREATE TABLE `cfg_energy_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '显示名称：焦虑/愤怒/勇气...',
  `level_value` int(11) NOT NULL COMMENT '霍金斯能量值：100, 150, 200...',
  `color_hex` varchar(10) NOT NULL COMMENT 'UI主题色：#FF4D4F',
  `icon_code` varchar(20) NOT NULL COMMENT '关联的表情代码：anxiety_face, smile_face',
  `description` varchar(255) DEFAULT NULL COMMENT '文案提示：赶due、压力大...',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='能量类型定义表';
```

**表名：`cfg_stickers` (情绪贴纸资源表)**

_存储具体的IP贴纸，每种能量类型下可以有多个贴纸。_

**SQL**

```
CREATE TABLE `cfg_stickers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `energy_type_id` int(11) NOT NULL COMMENT '关联能量类型ID',
  `sticker_url` varchar(255) NOT NULL COMMENT '贴纸图片资源地址',
  `sticker_name` varchar(50) DEFAULT NULL COMMENT '贴纸名：头秃、发抖',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否上架',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='贴纸资源库';
```

#### 2. 核心业务表 (Core Data Tables)

**表名：`energy_moments` (能量动态主表)**

_这是最核心的表，存储用户的每一条动态。_

**SQL**

```
CREATE TABLE `energy_moments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL COMMENT '发布用户ID',
  `energy_type_id` int(11) NOT NULL COMMENT '选中的能量类型ID (FK)',
  `sticker_id` int(11) DEFAULT NULL COMMENT '选中的具体贴纸ID',
  `content_text` text COMMENT '动态文字内容',
  `location` varchar(100) DEFAULT NULL COMMENT '地理位置',
  `visibility` tinyint(4) DEFAULT '1' COMMENT '可见性：0私密, 1公开, 2匿名树洞',

  -- 核心：能量闭环逻辑
  `related_moment_id` bigint(20) DEFAULT NULL COMMENT '关联的前置动态ID (用于Before/After闭环)',
  `is_closed_loop` tinyint(1) DEFAULT '0' COMMENT '是否已形成闭环（用于筛选蜕变相册）',

  `like_count` int(11) DEFAULT '0' COMMENT '充能/点赞数',
  `comment_count` int(11) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_time` (`user_id`, `created_at`),
  KEY `idx_energy` (`energy_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='能量时刻动态表';
```

**表名：`moment_media` (动态媒体附件表)**

_存储九宫格图片或视频。_

**SQL**

```
CREATE TABLE `moment_media` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `moment_id` bigint(20) NOT NULL COMMENT '关联动态ID',
  `media_type` tinyint(4) NOT NULL COMMENT '1:图片, 2:视频',
  `file_url` varchar(512) NOT NULL COMMENT '文件OSS地址',
  `sort_order` tinyint(4) DEFAULT '0' COMMENT '九宫格排序：1-9',
  PRIMARY KEY (`id`),
  KEY `idx_moment` (`moment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态媒体附件表';
```

#### 3. 互动与分析表 (Interaction & Analytics)

**表名：`moment_interactions` (互动表：充能与评论)**

_记录谁给谁充了能，区别于普通的点赞。_

**SQL**

```
CREATE TABLE `moment_interactions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `moment_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL COMMENT '操作者ID',
  `interaction_type` tinyint(4) NOT NULL COMMENT '1:充能/点赞(Like), 2:评论(Comment)',
  `energy_reaction` varchar(20) DEFAULT NULL COMMENT '根据能量类型变化的反馈：charge(充电), resonate(共鸣)',
  `comment_content` varchar(500) DEFAULT NULL COMMENT '评论内容',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_moment` (`moment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='互动记录表';
```

---

### 第三部分：开发逻辑指引 (Data Flow)

**1. 预置数据 (Initial Data Seeding)**

在开发初期，你需要向 `cfg_energy_types` 表插入这6条数据，以驱动前端的罗盘显示：

| **id** | **name**  | **level_value** | **color_hex** | **icon_code**      |
| ------ | --------- | --------------- | ------------- | ------------------ |
| 1      | 焦虑/恐惧 | 100             | #FF4D4F       | 😰 (Anxiety)       |
| 2      | 愤怒/抱怨 | 150             | #CF1322       | 😡 (Anger)         |
| 3      | 勇气/行动 | 200             | #FAAD14       | 😤 (Determination) |
| 4      | 平静/理智 | 400             | #52C41A       | 🧐 (Reason)        |
| 5      | 喜悦/感恩 | 540             | #FFC069       | 😊 (Smile)         |
| 6      | 开悟/合一 | 700             | #722ED1       | 🧘 (Enlightenment) |

**2. 生成“蜕变相册”的后端逻辑**

当用户打开“数据周报”时，后端执行逻辑：

1. **查询低频点：** `SELECT * FROM energy_moments WHERE user_id = ? AND energy_type_id IN (1, 2) AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`。
2. **查询高频点：** 查找在该时间点之后发布的类型为 (3, 4, 5, 6) 的动态。
3. **智能匹配：** 如果两者有相同的 Hashtag（如 #论文），则自动配对。
4. **展示：** 前端将两条动态的图片取出，中间加上“Energy Shift”动画，生成分享卡片。

**3. 能量曲线计算**

前端绘制图表时，只需调用 API 获取该用户一段时间内的 `created_at` 和 `cfg_energy_types.level_value`，即可绘制出精确的情绪波动 K 线图。

这套设计方案从前端的强制情绪标记，到后端的结构化存储，完美闭环了“情绪追踪”的核心诉求。
