## 目标与约束
- 使用 Fabric.js 构建基于 Canvas 的图层编辑器，严格遵守素材生成与非交互 V1 约束。
- 对齐现有项目架构（React 18 + TypeScript + antd + axios），沿用统一 API 客户端与受保护路由。

## 依赖与工程
- 新增依赖：fabric（必要），@types/fabric（若版本无内置类型）。
- 保持 CRA 构建；不引入额外 webpack 改造；路径使用相对导入（当前未配置 '@' 别名）。
- 与现有 API 客户端集成：使用 src/api/HttpClient.ts 实例与 apiService.ts 服务模式。

## 路由与导航
- 在配置路由中增加受保护页面：/ai-image-editor（与现有 [routes/index.tsx](file:///e:/AiDome/momo/daydo/src/routes/index.tsx) 的 ProtectedRoute 一致）。
- 在 [config/navigation.tsx](file:///e:/AiDome/momo/daydo/src/config/navigation.tsx) 的 NAV_ITEMS 添加入口项（例如“AI编辑”）。
- 保持 Chat 与 BottomNav 行为不变（参考 [index.tsx](file:///e:/AiDome/momo/daydo/src/index.tsx#L1-L56)）。

## 目录与文件
- /src/ai-image-editor
  - index.tsx：编辑器页面容器（布局、状态、按钮与 Canvas）。
  - canvas/useFabricCanvas.ts：创建与管理 fabric.Canvas；暴露 ref、ratio 切换、清理。
  - canvas/layerManager.ts：图层增删与顺序；保证 background 在最底层、image 追加在其上；集中设置对象属性（selectable=false、evented=false、hasControls=false）。
  - canvas/importImage.ts：本地/服务器图片统一导入；FileReader -> DataURL -> fabric.Image.fromURL；按规则缩放。
  - canvas/exportImage.ts：canvas.toDataURL({ format:'png', multiplier:2 })；结合 file-saver 下载。
  - components/PromptInput.tsx：antd Input.TextArea，受控 prompt。
  - components/RatioSelector.tsx：1:1 / 9:16 / 16:9 切换（仅 setWidth/setHeight）。
  - components/GenerateButton.tsx：触发 AI 素材生成并设置为 background 层。
  - components/ImportImageButton.tsx：本地导入 input[type=file]；默认 image 层，位于背景之上。
  - services/aiImageService.ts：调用 POST /api/ai/image/material；沿用统一 axios 客户端。
  - types/layer.ts：LayerType 与 CanvasLayer 类型定义。
  - styles.scss：页面与 Canvas 容器样式。

## 类型与状态
- LayerType：'background' | 'image'
- CanvasLayer：{ id:string; type:LayerType; fabricObject:fabric.Object; locked:boolean }
- ImageEditorState：{ prompt:string; ratio:'1:1'|'9:16'|'16:9'; loading:boolean; layers:CanvasLayer[] }

## Canvas 初始化
- new fabric.Canvas('editor', { width:1080, height:1080, preserveObjectStacking:true, selection:false })
- 全局禁用交互：canvas.isDrawingMode = false；对象统一 set({ selectable:false, evented:false, hasControls:false, hoverCursor:'default' })。

## 比例映射与切换
- 映射：1:1→1080×1080；9:16→1080×1920；16:9→1920×1080。
- 切换规则：仅调用 canvas.setWidth / setHeight；不清空 canvas；不重新生成/导入图片；维持现有对象几何与层序。

## 图片导入与添加规则
- 统一入口：fabric.Image.fromURL(dataUrlOrHttpUrl, (img)=>{ ... })。
- 背景图（AI 生成）：按“铺满”策略（cover）缩放并居中；替换已有 background 层。
- 普通图片（本地/服务器）：按“适配”策略（contain）等比缩放；添加为 image 层，位于背景之上。
- 对象属性：非交互、不可选中；layerManager 控制 add/remove/sendToBack/bringToFront。

## 导出
- 高清 PNG：canvas.toDataURL({ format:'png', multiplier:2 })；使用 file-saver 保存。

## 与 API 客户端集成
- 端点：POST /api/ai/image/material；请求体 { prompt, type:'background' }；返回 { imageUrl, width, height }。
- 复用现有 HttpClient 与 apiService 模式（参考 [apiService.ts](file:///e:/AiDome/momo/daydo/src/api/apiService.ts) 与 [HttpClient.ts](file:///e:/AiDome/momo/daydo/src/api/HttpClient.ts)）。
- 错误处理：沿用统一拦截器与 antd message；401/403 走既有刷新与跳转逻辑。

## 页面交互流（V1）
1) 输入画面描述（PromptInput）。
2) 点击“生成背景”（GenerateButton）：请求素材，加载为 background 层。
3) 本地导入（ImportImageButton）：追加 image 层，位于背景之上。
4) 切换比例（RatioSelector）：仅调整 Canvas 宽高。
5) 导出 PNG（导出按钮）：toDataURL + 下载。

## 示例关键代码（简化）
- useFabricCanvas：

```ts
const ratioMap = { '1:1':[1080,1080], '9:16':[1080,1920], '16:9':[1920,1080] } as const;
export function useFabricCanvas() {
  const ref = useRef<fabric.Canvas | null>(null);
  useEffect(()=>{ ref.current = new fabric.Canvas('editor',{width:1080,height:1080,preserveObjectStacking:true,selection:false}); return ()=>{ ref.current?.dispose(); } },[]);
  const setRatio = (r:keyof typeof ratioMap) => { const [w,h]=ratioMap[r]; ref.current?.setWidth(w); ref.current?.setHeight(h); ref.current?.renderAll(); };
  return { canvas:ref, setRatio };
}
```

- 导入图片（统一）：

```ts
export async function importImage(canvas:fabric.Canvas, url:string, type:'background'|'image') {
  return new Promise<void>((resolve,reject)=>{
    fabric.Image.fromURL(url, (img)=>{
      img.set({ selectable:false, evented:false, hasControls:false });
      const cw = canvas.getWidth(), ch = canvas.getHeight();
      const { width:iw=1, height:ih=1 } = img;
      const scale = type==='background' ? Math.max(cw/iw, ch/ih) : Math.min(cw/iw, ch/ih);
      img.scale(scale).set({ left:(cw - (iw*scale))/2, top:(ch - (ih*scale))/2 });
      if (type==='background') { /* 替换背景层 */ }
      canvas.add(img); if (type==='background') canvas.sendToBack(img); canvas.renderAll(); resolve();
    }, { crossOrigin:'anonymous' });
  });
}
```

## 测试与验证
- 页面可视验证：运行 dev，进入 /#/ai-image-editor；验证生成、导入、比例切换与导出。
- 兼容性：验证微信内置浏览器下行为（项目已处理滑动手势，见 [index.tsx](file:///e:/AiDome/momo/daydo/src/index.tsx#L12-L33)）。
- 性能：1080×1920／1920×1080 下渲染与导出是否流畅；必要时限制 multiplier 或使用对象缓存。

## 迁入步骤（实施顺序）
1) 安装 fabric（及类型）。
2) 创建 /src/ai-image-editor 目录与文件骨架。
3) 接入统一 API 客户端并实现 aiImageService。
4) 实现 useFabricCanvas 与 layerManager。
5) 实现导入/导出与 UI 组件。
6) 增加路由与导航入口（受保护）。
7) 联调与验证。

## 未来扩展（不在 V1 范围）
- 拖拽/缩放/旋转、文本层、模板系统、历史记录；与 Fabric 控件态解耦后逐步开放。
- 多图生成与素材管理（批量导入、素材库）。

如确认该方案，我将按上述顺序创建页面与模块，并集成到现有路由与导航。