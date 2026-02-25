## 目标行为
1. 元素拖拽移动时支持吸附到：画布边缘（left/right/top/bottom）、画布中心线（X/Y）、其它元素的边缘与中心（left/center/right、top/middle/bottom）。
2. 命中吸附时显示实时参考线（Guide Line）。
3. 拖拽过程中显示实时“间距数值（px）”：
   - 与画布边缘的最近距离（可配置最大显示距离）。
   - 与最近的其它元素之间的水平/垂直间距（仅在另一轴有重叠时显示，避免无意义的距离）。

## 现状与插入点
- 当前仅在 [useFabricCanvas.ts](file:///e:/AiDome/momo/daydo/src/ai-image-editor/canvas/useFabricCanvas.ts#L43-L113) 做了“画布中心吸附 + 简单参考线”，是最合适的扩展入口（`object:moving` + `mouse:up` 清理）。

## 技术方案
### 1) 抽离几何/渲染逻辑为可复用模块
- 新增一个纯工具模块（建议放在 `canvas/utils/` 下），提供：
  - `getAabbRect(obj)`：使用 `obj.getBoundingRect(true, true)` 获取旋转/缩放后的轴对齐包围盒（更稳健）。
  - `computeSnap(...)`：根据候选参考线（画布/其它对象）计算最优 X/Y 吸附偏移（阈值 10px 可复用现有常量）。
  - `computeMeasurements(...)`：计算应显示的水平/垂直间距线段与像素文本位置。
  - `clearGuides(canvas)`：移除 `name` 以 `guide-`/`measure-` 开头的对象。
  - `drawGuides(canvas, ...)`：绘制参考线与测距线/文字（所有辅助对象 `selectable:false, evented:false, excludeFromExport:true`）。

### 2) 扩展 object:moving：吸附 + 参考线 + 间距
- 在 `object:moving` 中：
  1. 清理上一帧辅助对象。
  2. 计算移动目标的 AABB（支持单对象与 ActiveSelection）。
  3. 构建候选参考线：
     - 画布：x=0/width/width/2，y=0/height/height/2（分别对应边缘/中心）。
     - 其它对象：对每个可见且可交互（`selectable===true`）的对象取 AABB 的 left/center/right、top/middle/bottom。
  4. 计算最优吸附：只做“同类对齐”（边-边、中心-中心），选最小偏移且在阈值内的结果。
  5. 应用偏移：用 `obj.set({ left: (obj.left||0)+dx, top: (obj.top||0)+dy })` 并 `obj.setCoords()`。
  6. 绘制命中的 Guide Line（可同时命中 X/Y）。
  7. 计算并绘制测距线与 px 文本（默认只显示最近的 1 条水平 + 1 条垂直，避免画面过乱；最大显示距离做成常量）。

### 3) mouse:up 清理
- 保留现有 `mouse:up` 清理逻辑，但改为调用统一 `clearGuides(canvas)`。

## 文件变更范围（预计）
- 修改：
  - [useFabricCanvas.ts](file:///e:/AiDome/momo/daydo/src/ai-image-editor/canvas/useFabricCanvas.ts)（替换现有简易吸附实现为新模块调用）
- 新增：
  - `daydo/src/ai-image-editor/canvas/utils/snapGuides.ts`（或同级命名，承载计算与绘制）
  - `daydo/src/ai-image-editor/canvas/utils/snapGuides.test.ts`（Jest：覆盖“画布中心/边缘吸附”“对象对对象边/中心吸附”“测距计算”的核心纯函数）

## 验证方式
- 单元测试：运行 CRA Jest，验证吸附偏移与测距结果。
- 交互验证（手动）：
  - 拖动对象靠近画布边缘/中心线应吸附并显示参考线。
  - 拖动对象靠近其它对象的边缘/中心应吸附并显示参考线。
  - 拖动时出现水平/垂直测距线与 px 文本，并在鼠标松开后消失。

## 兼容性与约束
- 以 AABB 为准：旋转对象的“边缘/中心”按包围盒计算（实现简单且表现一致）。后续如果要做“真实旋转边缘吸附”，再升级到基于角点/投影的算法。