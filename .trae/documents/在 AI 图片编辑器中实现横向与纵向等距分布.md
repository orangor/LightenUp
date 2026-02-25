## 项目结构概览
- 画布与管理：Fabric 初始化与选择逻辑在 [useFabricCanvas.ts](file:///e:/AiDome/momo/daydo/src/ai-image-editor/canvas/useFabricCanvas.ts)，图层增删改在 [layerManager.ts](file:///e:/AiDome/momo/daydo/src/ai-image-editor/canvas/layerManager.ts)，并已拆分到 services 目录（add/modify/serialize 等）。
- 组件与交互：页面入口 [index.tsx](file:///e:/AiDome/momo/daydo/src/ai-image-editor/index.tsx) 持有 managerRef；左侧是图层与素材操作 [LeftPanel.tsx](file:///e:/AiDome/momo/daydo/src/ai-image-editor/components/panels/LeftPanel.tsx)，右侧是属性面板 [RightPanel.tsx](file:///e:/AiDome/momo/daydo/src/ai-image-editor/components/panels/RightPanel.tsx)。
- 类型与工具：图层类型在 [types/layer.ts](file:///e:/AiDome/momo/daydo/src/ai-image-editor/types/layer.ts)，文本渐变在 [textBackground.ts](file:///e:/AiDome/momo/daydo/src/ai-image-editor/canvas/utils/textBackground.ts)。

## 等距分布功能说明
- 支持横向（X 轴）与纵向（Y 轴）两种等距分布，依据当前选中对象集合的外接边界进行“空间平均分布”。
- 只调整对象的 left/top，不改变缩放与旋转；跳过锁定的图层。
- 选中对象数量≥2时生效；数量≥3时体现平均间距，否则保持端点对齐。

## 技术实现方案
- 新增服务：创建 [distribute.ts]（位于 canvas/services）提供 distributeEqual(axis: 'horizontal'|'vertical') 方法：
  - 从 canvas.getActiveObjects() 获取选中对象数组，过滤掉 locked 对象。
  - 计算每个对象在轴向的尺寸（考虑 scaleX/scaleY）与 left/top；按轴向位置排序。
  - 计算选区外接边界的最小端与最大端、总占用宽/高，得出可分配空间与平均间距。
  - 按顺序设置对象的新位置：前一个对象的右/下边 + 平均间距；调用 setCoords()，最后 requestRenderAll()。
  - 最后通过 manager.notify() 并 manager.saveState() 持久化历史。
- 管理器接口：在 [layerManager.ts](file:///e:/AiDome/momo/daydo/src/ai-image-editor/canvas/layerManager.ts) 增加两个方法：distributeHorizontal() 与 distributeVertical()，内部委托到 distribute.ts。
- UI 入口：在 [RightPanel.tsx](file:///e:/AiDome/momo/daydo/src/ai-image-editor/components/panels/RightPanel.tsx) 的“操作”区域新增两个按钮：横向等距、纵向等距；禁用条件为选中对象不足或全部锁定。
- 快捷键（可选）：在 [index.tsx](file:///e:/AiDome/momo/daydo/src/ai-image-editor/index.tsx) 的 useHotkeys 增加组合键，如 Ctrl+Alt+H（横向）、Ctrl+Alt+V（纵向）。

## 细节与边界处理
- 旋转对象：以未旋转的包围盒尺寸近似计算间距；旋转保持不变。
- 背景层：通常锁定且不可选，逻辑自然跳过。
- ActiveSelection：优先使用 canvas.getActiveObjects()，避免依赖 ActiveSelection 的内部 _objects。
- 小数与抖动：位置保留小数不强制取整，尽量避免累计误差；最终统一 requestRenderAll 并 saveState。

## 验证与兼容
- 单元验证：选取 2/3/多对象测试横纵分布与历史记录；验证锁定对象不参与、渐变文本背景不受影响。
- 类型与构建：保持现有导出不变，新增服务模块按现有 services 规范；通过现有构建脚本验证。

请确认以上方案，我将按此计划实现并提交修改。