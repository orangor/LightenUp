# EnergyFlow (能量流) 模块设计方案

## 1. 设计理念与目标

**EnergyFlow** 是一个基于霍金斯能量层级理论的情绪追踪与社交共振模块。它旨在将抽象的情绪具象化，通过“能量罗盘”引导用户觉察当下状态，利用“能量共振场”实现差异化的社交互动，最终通过“能量账本”帮助用户看见自己的情绪流动与成长闭环。

核心价值：

1.  **觉察 (Awareness)**：将情绪量化为能量值。
2.  **流动 (Flow)**：鼓励情绪的表达与转化（从低频到高频）。
3.  **共振 (Resonance)**：基于能量层级的深层社交连接。

---

## 2. 数据库设计 (Database Schema)

基于 MySQL，设计高扩展性的表结构以支持能量类型配置、动态发布及闭环逻辑。

### 2.1 基础配置表

#### `cfg_energy_types` (能量类型配置)

存储 6 种核心情绪定义（焦虑、愤怒、勇气、平静、喜悦、开悟）。

```sql
CREATE TABLE `cfg_energy_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '显示名称',
  `level_value` int(11) NOT NULL COMMENT '能量值 (e.g. 100, 540)',
  `color_hex` varchar(10) NOT NULL COMMENT 'UI主题色',
  `icon_code` varchar(20) NOT NULL COMMENT '前端图标映射Key',
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `cfg_stickers` (情绪贴纸库)

支持动态配置贴纸，避免硬编码。

```sql
CREATE TABLE `cfg_stickers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `energy_type_id` int(11) NOT NULL,
  `sticker_url` varchar(255) NOT NULL,
  `sticker_name` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.2 核心业务表

#### `energy_moments` (能量动态)

核心存储表，包含闭环逻辑字段。**注意：user_id 为 int(11)，与 users 表保持一致。**

```sql
CREATE TABLE `energy_moments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '关联 users.id',
  `energy_type_id` int(11) NOT NULL,
  `sticker_id` int(11) NOT NULL COMMENT '必填：选中的具体贴纸ID',
  `content_text` text COMMENT '文字内容',
  `location` varchar(100) DEFAULT NULL,
  `visibility` tinyint(4) DEFAULT '1' COMMENT '0:私密, 1:公开, 2:匿名树洞',

  -- 能量闭环核心字段
  `related_moment_id` bigint(20) DEFAULT NULL COMMENT '关联的前置动态ID (Before)',
  `is_closed_loop` tinyint(1) DEFAULT '0' COMMENT '是否形成闭环',

  `like_count` int(11) DEFAULT '0',
  `comment_count` int(11) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_energy` (`user_id`, `energy_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `moment_media` (动态媒体附件)

存储九宫格图片或视频资源。

```sql
CREATE TABLE `moment_media` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `moment_id` bigint(20) NOT NULL COMMENT '关联动态ID',
  `media_type` tinyint(4) NOT NULL COMMENT '1:图片, 2:视频',
  `file_url` varchar(512) NOT NULL COMMENT '文件资源地址',
  `sort_order` tinyint(4) DEFAULT '0' COMMENT '排序：1-9',
  PRIMARY KEY (`id`),
  KEY `idx_moment` (`moment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `moment_interactions` (互动记录)

记录“充能”与“共鸣”行为。**注意：user_id 为 int(11)，与 users 表保持一致。**

```sql
CREATE TABLE `moment_interactions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `moment_id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT '操作者ID，关联 users.id',
  `interaction_type` tinyint(4) NOT NULL COMMENT '1:充能(Like), 2:评论',
  `reaction_style` varchar(20) DEFAULT NULL COMMENT 'charge/resonate',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 3. 后端接口设计 (API Design)

遵循 `LightenUpServe` 的装饰器路由模式，控制器位于 `src/controllers/energy.controller.ts`。

### 3.1 核心 Controller 定义

```typescript
import { Get, Post } from '../decorators/route.decorator'

class EnergyController {
  // 1. 获取能量配置（罗盘数据）
  @Get('/api/energy/config', '获取能量配置', '返回能量类型和贴纸数据')
  static async getConfig(req: Request, res: Response) {
    // Return { types: [], stickers: [] }
  }

  // 2. 发布能量动态
  @Post('/api/energy/moments', '发布动态', '发布一条新的能量动态', {
    required: ['energyTypeId', 'stickerId'], // stickerId 必须存在
    properties: [
      { name: 'energyTypeId', type: 'number' },
      { name: 'stickerId', type: 'number', description: '必填：表情包ID' },
      { name: 'content', type: 'string' },
      { name: 'media', type: 'array', items: { type: 'object' }, description: '媒体文件列表: [{type: 1, url: "..."}]' },
      { name: 'visibility', type: 'number' },
      { name: 'relatedMomentId', type: 'number', description: '可选，关联的旧动态ID' },
    ],
  })
  static async createMoment(req: Request, res: Response) {
    // 业务逻辑：
    // 1. 插入 energy_moments
    // 2. 批量插入 moment_media
    // 3. 如果 relatedMomentId 存在，更新旧动态 is_closed_loop = 1
    // 4. 触发“闭环达成”成就推送
  }

  // 3. 获取能量流（信息流）
  @Get('/api/energy/feed', '获取能量流', '分页获取动态列表')
  static async getFeed(req: Request, res: Response) {
    // Query params: page, type (all/follow), energy_level (high/low)
    // Return data includes: moment info, media list, sticker info
  }

  // ... 其他接口保持不变
}
```

---

## 4. 前端架构与组件 (Frontend)

基于 `LightenUp` 现有架构，在 `src/pages` 和 `src/components` 下扩展。

### 4.1 目录结构

```
src/
  pages/
    energy/
      EnergyHome.tsx       // 模块主页
      EnergyPublish.tsx    // [更新] 沉浸式发布页 (支持多媒体上传)
  components/
    energy/
      EnergyCompass.tsx    // 核心组件：可交互的六色罗盘
      ResonanceFeed.tsx    // 信息流组件
      EnergyCard.tsx       // [更新] 单条动态卡片 (增加 MediaGrid 展示)
      MediaUploader.tsx    // [新增] 多媒体上传组件 (九宫格/视频)
      StickerPicker.tsx    // 贴纸选择器
```

### 4.2 关键组件逻辑

#### 1. 能量罗盘 (EnergyCompass) - 发布入口

- **交互升级**：点击 `+` 唤起。
- **第一步**：旋转罗盘选择“能量层级”（如：焦虑）。
- **第二步（强制）**：弹出该层级下的 `StickerPicker`，**用户必须选中一个表情包**才能进入编辑页。这强化了“情绪具象化”的过程。

#### 2. 沉浸式发布页 (EnergyPublish) - 朋友圈体验

- **头部**：显示选中的“能量色”背景 + 选中的“表情包”动画。
- **文本域**：输入此刻的想法（支持话题 Hashtag）。
- **多媒体区 (MediaUploader)**：
  - **图片模式**：支持 1-9 张图片上传，拖拽排序，类似朋友圈九宫格。
  - **视频模式**：支持上传 1 个短视频（限制时长，如 60s）。
  - _注：图片和视频互斥，不可同时上传。_
- **隐私/闭环设置**：选择可见范围，或关联之前的动态。

#### 3. 能量共振场 (ResonanceFeed) & 卡片 (EnergyCard)

- **卡片结构**：
  - **Header**：头像、昵称（或匿名）、**能量表情包（大图标展示）**。
  - **Content**：文本内容。
  - **Media**：
    - 若为图片：根据数量自动适配 1张（大图）、4张（2x2）、9张（3x3）布局。
    - 若为视频：展示视频封面，点击播放。
  - **Footer**：时间、位置、充能/共鸣按钮。
- **视觉分层**：保持高低频的色调差异，低频动态的媒体容器可以加一层淡淡的灰色滤镜，高频动态则加高光边框。

---

## 5. 路由与开发优先级

路由配置保持不变。

### 开发优先级调整

1.  **P0**: 数据库建表 (`energy_moments`, `moment_media`, `cfg_stickers`)。
2.  **P0**: 后端 API 开发 (发布接口支持多媒体参数)。
3.  **P0**: 前端 **发布流程** 实现：
    - 罗盘选择 -> **强制选表情** -> 填写内容/上传图片 -> 发布。
    - 实现 `MediaUploader` 组件。
4.  **P1**: 信息流展示 (`EnergyCard` 适配九宫格/视频渲染)。
5.  **P2**: 互动功能与闭环逻辑。
