I will create a technical implementation plan for the "Project Full Snapshot" interface (`GET /api/projects/:projectId/full`).

The plan involves:

1. **Type Definitions**: Defining strict TypeScript interfaces for `Project`, `Canvas`, `Group`, and `Node` in `src/types/editor.ts` to ensure the response structure matches the requirements exactly.
2. **Data Access Layer (Models)**: Creating a unified model file `src/models/editor.model.ts` (or separate files) to handle database queries for:

   * `ProjectModel.findById(projectId)`

   * `CanvasModel.findByProjectId(projectId)`

   * `GroupModel.findByProjectId(projectId)`

   * `NodeModel.findByProjectId(projectId)`
3. **Controller Layer**: Implementing `ProjectController` in `src/controllers/project.controller.ts` using the `@Get` decorator.

   * It will validate the `projectId`.

   * It will execute the four queries in parallel using `Promise.all` for performance (rational optimization).

   * It will assemble the results into the strict JSON format required.

   * It will handle 404 errors if the project does not exist.

I will generate a markdown document `e:\AiDome\momo\daydoserve\docs\implementation_plan_snapshot.md` (or directly in the response if you prefer, but I'll plan to write the file for persistence) detailing this strict implementation strategy.

Wait, the user asked for a "very rational requirement plan" (需求方案) *text* first. I will provide the text response directly in the chat, formatted as a strict technical specification, before proceeding with any code generation in the next turn.

**Plan for this turn:**

1. Define the technical specification for the "Project Full Snapshot" API.
2. Outline the necessary code changes (New Models, New Controller, New Types).
3. Present this as the "Rational Requirement Plan".

