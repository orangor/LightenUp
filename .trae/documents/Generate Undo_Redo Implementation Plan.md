I will generate a comprehensive implementation plan for the Undo/Redo system based on your "Frontend Memory Snapshot" specification.

The document will be created at: `e:\AiDome\momo\daydo\src\ai-image-editor\UNDO_REDO_IMPLEMENTATION.md`

### Document Content Structure
1.  **Architecture Overview**:
    *   Adopting the **Snapshot Pattern** (State Memento) as requested.
    *   **Single Source of Truth**: The `HistoryManager` will maintain the `past`, `present`, `future` stacks.
    *   **Data Structure**: Adapting existing `CanvasVariant` and `LayerManager` structures to match the requested `EditorSnapshot` format (`canvases`, `groups`, `nodes`).

2.  **Core Implementation Specifications**:
    *   **Snapshot Generation (`createSnapshot`)**:
        *   Logic to synchronize the current active canvas state into the `variants` list.
        *   Deep cloning strategy (JSON based or structured clone) to ensure immutability.
    *   **State Restoration (`restoreSnapshot`)**:
        *   Diffing strategy (optional optimization) or full reload logic.
        *   Handling canvas switching during undo/redo (if the active canvas changed).
    *   **Stack Management**:
        *   `MAX_HISTORY = 100` limit enforcement.
        *   Clear `future` stack on new commits.

3.  **Integration Points**:
    *   **Event Hooks**:
        *   `object:modified` (Fabric.js event) -> Triggers snapshot.
        *   `LayerManager` actions (add/remove/group/align) -> Triggers snapshot.
    *   **Exclusions**:
        *   Filtering out `object:moving`, `selection:created`, and auto-save events.

4.  **UI/UX Behavior**:
    *   Selection reset rules after Undo/Redo.
    *   Button state synchronization (disabled/enabled).
    *   Keyboard shortcuts configuration (Ctrl+Z, Ctrl+Shift+Z).

This document will serve as the blueprint for refactoring `canvas/utils/history.ts` and `LayerManager.ts`.