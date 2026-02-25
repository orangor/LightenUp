I will generate a SQL migration file `e:\AiDome\momo\daydoserve\src\database\migrations\002_create_editor_tables.sql` that contains the `CREATE TABLE` statements for the V2 AI Image Editor backend.

The SQL will include:
1.  `projects` table: `user_id` will be set to `INT` to match the existing `users` table schema (despite the markdown saying string, FK requires matching types).
2.  `canvases` table.
3.  `groups` table (created before `nodes` to allow FK reference).
4.  `nodes` table: Including JSON `props` and FKs to `projects`, `canvases`, and `groups`.
5.  `export_tasks` table.
6.  `project_versions` table.

I will use `VARCHAR(36)` for IDs (UUIDs) as specified, and standard MySQL types for other fields (`DATETIME`, `JSON`, `BOOLEAN`, etc.).
