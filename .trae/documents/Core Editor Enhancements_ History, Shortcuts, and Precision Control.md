I will implement the core editor enhancements focusing on efficiency and controllability as requested.

### 1. History System (Undo/Redo)
**File:** `src/ai-image-editor/canvas/layerManager.ts`
- Implement a robust Undo/Redo stack within `LayerManager`.
- Add `saveState()`, `undo()`, and `redo()` methods.
- Use the existing `serialize()` and `loadFromJSON()` for state snapshots.
- Ensure history is captured on both canvas interactions (drag/resize) and UI operations (add/remove/property change).

### 2. Keyboard Shortcuts System
**File:** `src/ai-image-editor/hooks/useHotkeys.ts` (New File)
- Create a custom hook to manage global keyboard shortcuts.
- **Implemented Shortcuts:**
    - `Ctrl+Z` / `Cmd+Z`: Undo
    - `Ctrl+Shift+Z` / `Cmd+Shift+Z`: Redo
    - `Delete` / `Backspace`: Delete selected layer
    - `Arrow Keys`: Move active object by 1px
    - `Shift + Arrow Keys`: Move active object by 10px

### 3. Precision Operation (Smart Snapping)
**File:** `src/ai-image-editor/canvas/useFabricCanvas.ts`
- Enhance the existing basic snapping logic.
- Add **Visual Guide Lines**: Automatically draw dynamic red lines when objects align with the canvas center (horizontal/vertical).
- Auto-remove guidelines when not snapping.

### 4. Layer Panel Enhancements
**File:** `src/ai-image-editor/components/layers/LayerList.tsx`
- **Inline Renaming**: Double-click layer name to edit.
- **Improved UI**: Better visual indication for locked/hidden states.

### 5. Integration
**File:** `src/ai-image-editor/index.tsx`
- Integrate `useHotkeys` hook.
- Wire up history events (save state on `object:modified`, `object:added`, etc.).
- Expose Undo/Redo controls in the UI (optional, but good for visibility).

This plan covers the "high priority" requirements for operation efficiency and controllability.