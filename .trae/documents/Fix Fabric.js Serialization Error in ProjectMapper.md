# Fabric.js Serialization Bug Fix Plan: `strokeDashArray.concat`

## 1. Diagnosis
The error `TypeError: this.strokeDashArray.concat is not a function` occurs during Fabric.js object serialization (`toObject`). This typically happens when `strokeDashArray` is assigned an invalid value (like an empty object `{}`) instead of an array or `null`.

**Root Cause:**
Looking at the backend response provided by the user:
```json
"props": {
  "strokeDashArray": {}, 
  "shadow": {},
  "path": {}
}
```
The backend is returning `{}` (empty object) for `strokeDashArray`, `shadow`, and `path`.
- `strokeDashArray` in Fabric.js expects an `Array<number>` or `null`.
- `shadow` expects a `fabric.Shadow` object, string, or `null`.
- `path` expects a `fabric.Path` data or `null`.

When Fabric tries to serialize the object, it calls `toObject`, which attempts to use `.concat()` on `strokeDashArray`. Since `{}` doesn't have `.concat()`, it crashes.

**Why does the backend have `{}`?**
The frontend likely serialized these properties incorrectly before saving them to the database, or the JSON serialization process turned `undefined` or `null` into `{}` or the database stored them as empty JSON objects. However, checking `ProjectMapper.ts` and `serialize.ts`, we take properties from `fabricObject.toObject()`.

The immediate fix is to **sanitize the data when loading from the backend (Frontend Side)**. We must ensure that properties like `strokeDashArray` are converted back to valid types (Array or null) before feeding them into Fabric.js.

## 2. Solution Plan

### 2.1. Sanitize Data in `ProjectMapper.ts`
We need to modify `ProjectMapper.toFrontend` in `src/ai-image-editor/services/projectMapper.ts`.
We will add a helper function `sanitizeFabricProps` to clean up the properties coming from the backend.

**Logic:**
1.  **`strokeDashArray`**: If it's an object and not an array, set it to `null`.
2.  **`shadow`**: If it's an empty object `{}`, set it to `null`.
3.  **`path`**: If it's an empty object `{}`, set it to `null`.
4.  **`stroke`**: If it's an empty object `{}`, set it to `null`.
5.  **General cleanup**: Check for other potential empty objects that should be null.

### 2.2. Update `ProjectMapper.ts`
Implement the `sanitizeFabricProps` function and apply it to both independent nodes and group children in `toFrontend`.

```typescript
function sanitizeFabricProps(props: any): any {
  const clean = { ...props }

  // Fix strokeDashArray
  if (clean.strokeDashArray && !Array.isArray(clean.strokeDashArray)) {
    clean.strokeDashArray = null
  }

  // Fix shadow (Fabric expects object with color/blur etc, or string, or null)
  // Empty object {} is invalid for shadow usually if it lacks properties, but specifically here
  // it seems to be a serialization artifact.
  if (clean.shadow && typeof clean.shadow === 'object' && Object.keys(clean.shadow).length === 0) {
    clean.shadow = null
  }
  
  // Fix other potential empty objects
  if (clean.path && typeof clean.path === 'object' && Object.keys(clean.path).length === 0) {
    clean.path = null
  }
  
  if (clean.stroke && typeof clean.stroke === 'object' && Object.keys(clean.stroke).length === 0) {
    clean.stroke = null
  }

  return clean
}
```

### 2.3. Verify `LayerManager.ts` & `serialize.ts`
The error stack trace points to `LayerManager.saveCurrentVariant` -> `serialize`. This means the crash happens **when saving**, because the invalid state (`strokeDashArray = {}`) is currently loaded in the canvas.
By fixing the **loading** (hydration) step in `ProjectMapper`, we ensure the canvas never gets into this invalid state.

However, if the user *already* has a loaded project with this bad state in memory (which seems to be the case as they said "Open historical project"), reloading the page with the fix should solve it.

Wait, the error happens when **opening** (loading) the project?
The user says "打开历史的项目" (Open historical project) -> "Uncaught runtime errors".
The stack trace shows:
`LayerManager.saveCurrentVariant` ... `serialize` ... `klass.toObject` ... `TypeError: this.strokeDashArray.concat is not a function`.

**Wait!**
The stack trace indicates the error happens during `LayerManager.saveCurrentVariant`.
Why is `saveCurrentVariant` called during loading?
In `LayerManager.ts`:
```typescript
  async loadProject(variants: CanvasVariant[]) {
    // ...
    // Switch to the first variant
    await this.switchVariant(master.id)
    // ...
  }

  async switchVariant(id: string) {
    // 1. 保存当前状态 (Save current state)
    this.saveCurrentVariant() 
    // ...
  }
```
When `switchVariant` is called, it tries to serialize the *current* state.
If the `LayerManager` was initialized with a default empty canvas, `saveCurrentVariant` should be fine.

**BUT**, if the `ProjectMapper` constructs `CanvasVariant`s with invalid data (e.g., `strokeDashArray: {}`), and then `loadProject` sets `this.variants = variants`.
Then `switchVariant` is called.
Inside `switchVariant`:
1. `saveCurrentVariant()`: This saves the *old* active variant. If this is the initial default master, it should be fine.
2. It sets `this.activeVariantId = id`.
3. `await this.loadFromJSON(target.data)`.

**Ah!** The error might be happening *after* loading, when the auto-save or some other mechanism triggers serialization. Or `loadFromJSON` populates the canvas with bad data, and then a subsequent action triggers serialization.

**Actually**, look at the stack trace again:
`LayerManager.serialize` calls `HistoryManager.createSnapshot` which calls `serialize`.
And `serialize` iterates layers and calls `toObject`.

If `ProjectMapper.toFrontend` passes `{}` as `strokeDashArray` into the `CanvasVariant` data.
Then `loadFromJSON` loads this into the Fabric objects. Fabric might accept `{}` during `initialize` but fail later during `toObject` (serialization).
So when does serialization happen?
1. `HistoryManager.init()` (maybe?)
2. `saveCurrentVariant()` (triggered by switching variants or auto-save)
3. `object:modified` event listener.

The fix in `ProjectMapper.toFrontend` is definitely the correct place. We must prevent invalid data from entering the `LayerManager` / `Fabric Canvas` in the first place.

## 3. Implementation Steps

1.  **Modify `src/ai-image-editor/services/projectMapper.ts`**:
    *   Add `sanitizeFabricProps` function.
    *   Apply it in `toFrontend` loop for both standalone nodes and group children.

2.  **Verify**:
    *   This will ensure that when `loadProjectData` calls `ProjectMapper.toFrontend`, the resulting variants contain valid `null`s instead of `{}`.
    *   Then `loadProject` -> `switchVariant` -> `loadFromJSON` will populate Fabric objects with `null`.
    *   Fabric objects with `strokeDashArray: null` serialize correctly.

This plan addresses the root cause: Backend sending empty JSON objects for properties that Fabric expects to be Arrays or Primitives.
