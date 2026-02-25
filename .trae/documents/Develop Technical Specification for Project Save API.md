I will implement the "Upsert Nodes" (Minimum Save Interface) based on the user's strict requirements and the existing project structure.

The plan involves:

1.  **Define Save DTO Types**: Create explicit types for the save request body in `src/types/editor.ts` to ensure type safety.
2.  **Enhance `EditorModels`**: Add a static method `saveProjectFull` in `src/models/editor.model.ts` that handles the transaction logic.
    *   **Transaction Management**: Use `db.getConnection()` to start a transaction, execute queries, commit, and rollback on error.
    *   **Delete Logic**: Execute DELETE statements for nodes, groups, and canvases by `project_id`.
    *   **Insert Logic**: Execute batch INSERT statements for the new data.
3.  **Update Controller**: Add the `@Post` endpoint to `src/controllers/project.controller.ts`.
    *   Validate the `projectId` and request body structure.
    *   Call the `EditorModels.saveProjectFull` method.
    *   Return `{ success: true }`.

I will create a technical specification document `docs/implementation_plan_save.md` first to formalize this "rational plan" before coding.
