# 晨曦微光 (Morning Glow) 设计体系规范

> **核心理念**：打破纯白背景的“平淡”与“冷感”，通过**光影流动**、**玻璃拟态**与**宝石质感**，赋予界面极高的情绪价值和治愈感。让每一次交互都像是在触摸清晨的第一缕阳光。

---

## 1. 色彩体系 (Color Palette)

### 1.1 沉浸式背景 (Atmosphere)
不再使用死板的纯色背景，而是模拟晨曦微光的弥散渐变。

*   **基底色**: `#F8F9FE`
*   **Mesh Gradient (CSS 实现)**:
    ```css
    background-image: 
      radial-gradient(at 0% 0%, rgba(235, 244, 255, 1) 0, transparent 50%), 
      radial-gradient(at 50% 0%, rgba(243, 232, 255, 0.8) 0, transparent 50%), 
      radial-gradient(at 100% 0%, rgba(255, 241, 236, 0.8) 0, transparent 50%);
    ```

### 1.2 情绪宝石色板 (Emotional Gemstones)
重新定义能量状态颜色，赋予其“内发光”的宝石质感。

| 语义 | 颜色 | 色值 | 描述 |
| :--- | :--- | :--- | :--- |
| **焦虑/恐惧** | 🟣 **静谧紫** | `#7B61FF` | Deep Serenity Purple。代表内省与深邃，而非冰冷的拒绝。 |
| **愤怒/烦躁** | 🔴 **珊瑚红** | `#FF6B6B` | Soft Coral Red。柔和的警示，降低攻击性。 |
| **平静/理智** | 🟢 **薄荷绿** | `#38D9A9` | Mint Green。清透、高含氧量，带来呼吸感与治愈。 |
| **喜悦/爱** | 🟡 **暖阳金** | `#FFD166` | Warm Sunlight Gold。凝固的阳光，温暖而充满力量。 |

### 1.3 文本色 (Typography Colors)
*   **主要文本**: `#2D3748` (Slate 800)
*   **次要文本**: `#718096` (Slate 500)
*   **辅助/标签**: `#A0AEC0` (Slate 400)
*   **核心数字**: 使用线性渐变 `linear-gradient(135deg, #2D3748 0%, #4A5568 100%)`

---

## 2. UI 质感 (UI Materials)

### 2.1 玻璃拟态容器 (Premium Glassmorphism)
卡片不再是实心白，而是通透的磨砂玻璃，让背景的微光隐约透出。

```css
.glass-card {
  background-color: rgba(255, 255, 255, 0.7); /* 70%-75% 透明度 */
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border: none; /* 移除实线边框 */
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6); /* 内描边增加质感 */
}
```

### 2.2 环境色阴影 (Color Dodge Shadow)
弃用纯黑阴影，使用带有环境色倾向的微弱光晕。

```css
box-shadow: 
  0 20px 40px -10px rgba(50, 50, 93, 0.05),
  0 10px 20px -5px rgba(0, 0, 0, 0.02);
```

### 2.3 微噪点纹理 (Noise Texture)
在全局容器上叠加一层极低透明度的噪点，消除数字渐变的“塑料感”，增加纸质纹理。

```css
&::before {
  /* SVG Noise Filter */
  background-image: url("data:image/svg+xml,..."); 
  opacity: 0.03;
  pointer-events: none;
}
```

---

## 3. 空间与排版 (Space & Typography)

### 3.1 极致留白 (Breathable Space)
*   **容器内边距**: 默认 `padding: 32px` 或 `40px`。
*   **大圆角**: 卡片统一使用 `border-radius: 32px` (2rem)，呈现果冻般的亲和力。
*   **间距**: 元素间距使用 `8px` 的倍数，大模块间距推荐 `32px` 或 `48px`。

### 3.2 字体栈 (Font Stack)
优先使用系统级现代无衬线字体。
*   `font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;`
*   **大数字展示**: 使用 `"SF Pro Display"` 或 `"DIN Alternate"`，字重 `700` 或 `800`，字间距 `letter-spacing: -1px`。

---

## 4. 组件样式指南 (Component Guide)

### 4.1 能量光点 (Energy Bubble)
模拟玻璃弹珠的物理堆叠感。
*   **样式**: 圆形，`2px` 纯白描边 (`border: 2px solid #ffffff`)。
*   **阴影**: 内部体积感 `inset 0 -2px 4px rgba(0,0,0,0.05)` + 外部投影。
*   **交互**: Hover 时亮度增加 `brightness(1.1)`，产生光晕 `box-shadow: 0 0 0 4px rgba(255,255,255,0.4)`。

### 4.2 趋势图表 (Trend Chart)
*   **曲线**: `stroke: #7B61FF`，叠加 `drop-shadow(0 4px 8px rgba(123, 97, 255, 0.2))` 发光滤镜。
*   **面积图**: 线性渐变填充，由 `#7B61FF` (30% opacity) 到透明。
*   **网格线**: 极淡的虚线 `stroke: rgba(0, 0, 0, 0.03)`，几乎隐形。

### 4.3 详情抽屉/弹窗 (Drawer/Modal)
*   **桌面端**: 右侧悬浮面板，大圆角，极柔和阴影。
*   **移动端**: 底部 Sheet 模式，拖拽手柄，符合 iOS 物理手感。

---

## 5. 动效规范 (Motion)

### 5.1 物理弹簧 (Spring Physics)
所有入场、弹出动画拒绝线性匀速，必须使用物理弹簧模型。
*   **配置**: `type: "spring", stiffness: 260, damping: 20`
*   **效果**: 带有愉悦的阻尼回弹感。

### 5.2 有机散布 (Organic Jitter)
在展示密集数据点时（如矩阵图），加入 `±8px` 的随机 X/Y 轴偏移，模拟自然散落的效果，避免死板对齐。

### 5.3 呼吸感 (Pulse)
关键节点（如当前时间点）使用呼吸动画。
```css
@keyframes pulse-ring {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(123, 97, 255, 0.3); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(123, 97, 255, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(123, 97, 255, 0); }
}
```
