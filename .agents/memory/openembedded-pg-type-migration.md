---
name: OpenEmbedded pg_type migration guard
description: CREATE TABLE IF NOT EXISTS can fail with pg_type duplicate if prior run was interrupted; use DO $$ guard.
---

## Rule
For any new table in `lib/db/src/migrate.ts`, wrap the CREATE TABLE in a `DO $$ ... $$` block that:
1. Checks `information_schema.tables` to see if the table exists
2. If not, deletes any orphaned `pg_type` entry: `DELETE FROM pg_type WHERE typname = '<table>' AND typrelid = 0`
3. Then runs a plain `CREATE TABLE` (not `IF NOT EXISTS`, since we already checked)

**Why:** PostgreSQL's `CREATE TABLE IF NOT EXISTS` checks `pg_class` for existence but still inserts into `pg_type` to register the composite row type. If a previous `CREATE TABLE` was interrupted after the `pg_type` insert but before the `pg_class` commit, the next `CREATE TABLE IF NOT EXISTS` sees the table is absent (so it proceeds) but then hits a unique constraint violation in `pg_type`. The `DO $$` guard sidesteps this by explicitly cleaning up the orphaned type entry first.

**How to apply:** Use this pattern for every new table added to `ensureSchema()`. See the `scheduled_jobs` block for a working example.
