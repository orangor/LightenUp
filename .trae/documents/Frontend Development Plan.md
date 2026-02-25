# Frontend Development Plan: Project Management & Editor Integration

## 1. API Integration Layer
We need to extend the current API service to support project-related operations.

### 1.1 Type Definitions (`src/api/types.ts`)
Add the following interfaces to match the backend:
- `Project`: Basic project info.
- `ProjectFullSnapshot`: Complete project data structure (`project`, `canvases`, `groups`, `nodes`).
- `CreateProjectRequest`: Payload for creating a project.
- `SaveProjectRequest`: Payload for saving project state.

### 1.2 Service Implementation (`src/api/apiService.ts`)
Implement `ProjectService` with methods:
- `listProjects()`: GET `/api/projects`
- `createProject(name: string)`: POST `/api/projects`
- `getProjectFull(id: string)`: GET `/api/projects/:id/full`
- `saveProject(id: string, data: SaveProjectRequest)`: POST `/api/projects/:id/save`

## 2. Project List Page (New)
Create a new page to manage projects.

### 2.1 Component Structure (`src/pages/ProjectList.tsx`)
- **Layout**: Simple grid or list layout.
- **Features**:
    - **List View**: Fetch and display projects using `ProjectService.listProjects()`.
    - **Create Action**: "New Project" button -> Modal/Input -> `ProjectService.createProject()` -> Navigate to editor.
    - **Navigation**: Click on a project card -> Navigate to `/editor/:projectId`.

### 2.2 Routing (`src/config/navigation.tsx`)
- Add route: `/projects` pointing to `ProjectListPage`.
- Update route: `/ai-image-editor` to `/editor/:projectId` (and keep a redirect or default for backward compatibility if needed).

## 3. Editor Integration & Logic

### 3.1 Loading Logic (Hydration)
Modify `src/ai-image-editor/index.tsx`:
1.  **URL Params**: Read `projectId` from route parameters.
2.  **Fetch Data**: On mount, call `ProjectService.getProjectFull(projectId)`.
3.  **Data Transformation**:
    - The backend returns flat arrays of `canvases`, `groups`, and `nodes`.
    - The `LayerManager` expects `variants` with nested `layers` (ProjectData).
    - **Action**: Implement a transformer function to convert `ProjectFullSnapshot` -> `CanvasVariant[]`.
4.  **Initialization**: Update `LayerManager` initialization to accept the loaded variants.

### 3.2 Saving Strategy
Implement the mandatory save strategy in `src/ai-image-editor/index.tsx`:

1.  **Trigger Points**:
    - **Manual**: Listen for `Ctrl+S` / `Cmd+S`.
    - **Auto-save**: Debounce (1s) on `object:modified`, `object:added`, `object:removed` events from `useFabricCanvas` or `LayerManager` updates.

2.  **Save Logic**:
    - **Data Transformation**: Convert `LayerManager.variants` back to the backend format (`canvases`, `groups`, `nodes`).
    - **API Call**: `ProjectService.saveProject(projectId, payload)`.
    - **Feedback**: Show "Saving..." -> "Saved" indicator.

## 4. Technical Implementation Steps

1.  **Define Types & Service**: Update `types.ts` and `apiService.ts`.
2.  **Create Project List**: Implement `ProjectList.tsx` and register route.
3.  **Data Transformation Utilities**: Create helper functions to convert between Backend Model and Editor Model.
4.  **Refactor Editor**:
    - Add `projectId` support.
    - Implement `loadProject` flow.
    - Implement `saveProject` flow with debounce.
