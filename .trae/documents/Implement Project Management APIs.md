I will implement the requested project management APIs.

### Implementation Plan

1.  **Update `src/models/editor.model.ts`**:
    *   Add `getProjectsByUserId(userId: number)` method to fetch the project list.
    *   Add `createProject(userId: number, name: string)` method to handle project creation with a default canvas in a transaction.

2.  **Update `src/controllers/project.controller.ts`**:
    *   Add `listProjects` method mapped to `GET /api/projects`.
    *   Add `createProject` method mapped to `POST /api/projects`.
    *   Implement manual authentication checks within these methods using `authConfig.authMiddleware` logic (since decorator routes bypass the global api middleware).

3.  **Update `src/config/auth.config.ts`**:
    *   Add `'/projects'` to `authPaths` to ensure consistency with the auth policy, even if checked manually.

### Code Details

*   **GET /api/projects**: Returns `id`, `name`, `status`, `updated_at` ordered by `updated_at DESC`.
*   **POST /api/projects**: Accepts `name`, creates a project and a 1080x1080 default canvas, returns `projectId` and `canvasId`.

I will start by modifying the model, then the controller, and finally the config.