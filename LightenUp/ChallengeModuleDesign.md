# 挑战赛模块 (Avatar 伴随式养成) 产品设计方案

## 1. 整体架构与视觉基调

### 设计理念
本模块旨在通过游戏化元素提升用户粘性，采用“3D/2D 虚拟人物展厅 (Showroom) + 任务卡片轮播 + 详情抽屉”的沉浸式架构。核心逻辑是将枯燥的“打卡”包装为“英雄之旅”，通过视觉反馈（Avatar 形象与环境特效）强化用户的成就感。

### 视觉布局
- **Avatar 展示区 (60%)**: 屏幕主体，展示虚拟人物及环境特效。
- **核心交互区 (40%)**: 底部操作区，包括卡片轮播、打卡按钮等。

---

## 2. 核心数据结构定义

### 2.1 挑战 (Challenge)
```typescript
interface Challenge {
  id: string;
  name: string;             // 挑战名称 (e.g., "30天论文定稿计划")
  startDate: string;        // 开始日期 (ISO 8601)
  endDate: string;          // 结束日期 (ISO 8601)
  totalDays: number;        // 总天数
  goal: string;             // 挑战目的 (北极星指标)
  description: string;      // 挑战内容/动作规范
  status: 'active' | 'completed' | 'abandoned';
  
  // 状态追踪
  beforeState: {
    description: string;    // 现状描述
    media: string[];        // 图片/视频 URL
    negativeTags: string[]; // 负面标签 (e.g., "拖延", "效率低")
  };
  
  afterState: {
    expectedResult: string; // 预期结果 (新建时填)
    positiveTags: string[]; // 正面标签 (e.g., "自信", "高效")
    actualResult?: {        // 实际结果 (结束后填)
      description: string;
      media: string[];
    };
  };

  progress: {
    currentDay: number;
    checkInCount: number;
    lastCheckInDate?: string;
  };
}
```

### 2.2 打卡记录 (CheckInRecord)
```typescript
interface CheckInRecord {
  id: string;
  challengeId: string;
  date: string;             // 打卡日期
  content: string;          // 富文本内容
  media: {
    type: 'image' | 'video';
    url: string;
  }[];
  attachments: {            // PDF/Word/Excel/ZIP
    name: string;
    url: string;
    type: string;
  }[];
  mood: 'energetic' | 'struggling' | 'breakthrough' | 'normal'; // 每日状态
}
```

---

## 3. 界面与功能模块设计

### 3.1 目录结构规划
建议在 `src/pages` 和 `src/components` 下新增 `challenge` 目录：

```
src/
  pages/
    challenge/
      ChallengeHome.tsx       // 主视觉展厅 (Showroom)
      ChallengeList.tsx       // 任务看板 (列表视图)
      ChallengeWizard.tsx     // 发起挑战向导
      ChallengeDetail.tsx     // 详情与蜕变档案 (抽屉内容)
  components/
    challenge/
      AvatarView.tsx          // 虚拟人物展示组件 (含特效)
      ChallengeCard.tsx       // 挑战卡片 (Cover FlowItem)
      CheckInPanel.tsx        // 沉浸式打卡面板 (毛玻璃浮层)
      StatusBadge.tsx         // 状态/情绪标签组件
      BeforeAfterView.tsx     // 对比视界组件
```

### 3.2 页面功能详解

#### 1. 主视觉展厅 (ChallengeHome)
- **顶部导航**: 
  - 左侧：标题 "修炼场"
  - 右侧：[+] 新建 (跳转 Wizard), [三] 列表 (跳转 List)
  - 居中：当前选中挑战的 `goal`
- **Avatar 区域**:
  - 根据 `challenge.status` 和 `lastCheckInDate` 渲染特效。
  - 负面状态：黑雾环绕 (使用 CSS animation 或 Canvas 粒子)。
  - 正面状态：发光、自信动作。
- **底部操作区**:
  - 使用 Swiper 或类似库实现 Cover Flow 卡片切换。
  - 卡片展示：名称、进度条。
  - **核心按钮**: [立即打卡] (触发 CheckInPanel) / [今日已完成]。

#### 2. 沉浸式打卡面板 (CheckInPanel)
- **交互**: 底部弹出的 Modal/Drawer，高度 2/3 屏幕，背景模糊。
- **功能**:
  - 多媒体上传 (调用相机/相册)。
  - 富文本输入 + 附件上传。
  - 情绪选择 (Radio Group)。
  - 提交动画：粒子飞入 Avatar，负面标签破碎效果。

#### 3. 任务看板 (ChallengeList)
- **视图**: 列表展示所有挑战。
- **Tab**: 进行中 / 已完成 / 已放弃。
- **操作**: 左滑编辑/删除。

#### 4. 详情与蜕变档案 (ChallengeDetail)
- **入口**: 点击首页卡片或列表项。
- **展示**:
  - 基础信息。
  - **对比视界**: Before (左) vs After (右/锁定)。
  - **轨迹地图**: 游戏化路线图展示打卡历史 (SVG/Canvas 绘制)。

#### 5. 发起挑战向导 (ChallengeWizard)
- **形式**: 分步对话式 (Step-by-step form)。
- **步骤**:
  1.  **悬挂北极星**: 输入名称、目的、时间。
  2.  **直视暗影**: 输入 Before 状态、负面标签、上传图片。
  3.  **规划高光**: 输入 After 预期、正面标签。

#### 6. 结算与结营
- **触发**: 挑战结束日期。
- **流程**: 强制填写 After 实际情况 -> 生成“英雄蜕变海报” (使用 `html2canvas` 或类似库)。

---

## 4. 路由配置 (Navigation)

需要修改 `src/config/navigation.tsx` 以注册新页面。

```typescript
// src/config/navigation.tsx

// 1. 引入新页面组件
import ChallengeHome from '../pages/challenge/ChallengeHome';
import ChallengeList from '../pages/challenge/ChallengeList';

// 2. 更新 NAV_ITEMS (添加一级菜单或在首页入口)
export const NAV_ITEMS: NavItem[] = [
  // ... existing items
  { 
    path: '/challenge', 
    text: '修炼场', 
    icon: '⚔️' // 示例图标
  },
  // ...
];

// 3. 更新 ROUTES
export const ROUTES: RouteConfig[] = [
  // ... existing routes
  { path: '/challenge', element: <ChallengeHome />, isProtected: true },
  { path: '/challenge/list', element: <ChallengeList />, isProtected: true },
  // 详情页和向导建议作为 Modal 或子路由处理，也可配置独立路由
  // { path: '/challenge/create', element: <ChallengeWizard />, isProtected: true },
];
```

## 5. 技术选型建议

- **Avatar 渲染**: 若需 3D，可使用 `react-three-fiber`；若为 2D 图片切换 + CSS 特效，直接使用 `framer-motion` 做动画。
- **轮播交互**: `swiper` 或 `react-spring` 实现 Cover Flow 效果。
- **图表/地图**: `recharts` 或手动 SVG 绘制打卡路径。
- **海报生成**: `html2canvas`。
