import type pg from "pg";

/**
 * Applies the full schema to whatever database the server is connected to.
 *
 * Strategy:
 *  - CREATE TABLE IF NOT EXISTS  → safe on both fresh and existing DBs
 *  - ALTER TABLE … ADD COLUMN IF NOT EXISTS → fills in any columns that were
 *    added to the schema after the table was first created in production
 *
 * Every statement is idempotent, so this can run on every cold start without
 * risk of data loss or duplicate-object errors.
 */
export async function ensureSchema(
  pool: InstanceType<typeof pg.Pool>,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      -- discord_users must exist before projects (FK target)
      CREATE TABLE IF NOT EXISTS discord_users (
        discord_id    VARCHAR(32)  PRIMARY KEY,
        username      VARCHAR(64)  NOT NULL,
        global_name   VARCHAR(64),
        discriminator VARCHAR(8)   NOT NULL DEFAULT '0',
        avatar        VARCHAR(256),
        created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
        last_seen_at  TIMESTAMP    NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        sid    VARCHAR      NOT NULL PRIMARY KEY,
        sess   JSON         NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "IDX_session_expire"
        ON user_sessions (expire);

      -- Base table (columns present from the very first deploy)
      CREATE TABLE IF NOT EXISTS projects (
        id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        name       VARCHAR(255) NOT NULL,
        graph      JSONB        NOT NULL,
        created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
      );

      -- Additive column migrations: safe to run even when the column exists
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS payload  JSONB;

      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS owner_id VARCHAR(32)
          REFERENCES discord_users(discord_id) ON DELETE CASCADE;
    `);
  } finally {
    client.release();
  }
}
