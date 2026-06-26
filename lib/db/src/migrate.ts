import type pg from "pg";

/**
 * Ensures all required tables and columns exist using the same pool the
 * server uses for queries. This is the authoritative schema bootstrap —
 * it runs at server startup before any request is accepted.
 *
 * Uses IF NOT EXISTS / DO $$ blocks so it is safe to run on every boot.
 */
export async function ensureSchema(pool: InstanceType<typeof pg.Pool>): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      -- ── discord_users ────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS discord_users (
        discord_id    VARCHAR(32)  PRIMARY KEY,
        username      VARCHAR(64)  NOT NULL,
        global_name   VARCHAR(64),
        discriminator VARCHAR(8)   NOT NULL DEFAULT '0',
        avatar        VARCHAR(256),
        created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
        last_seen_at  TIMESTAMP    NOT NULL DEFAULT NOW()
      );

      -- ── user_sessions ────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid    VARCHAR     NOT NULL PRIMARY KEY,
        sess   JSON        NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );

      -- ── projects ─────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS projects (
        id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        name       VARCHAR(255) NOT NULL,
        graph      JSONB        NOT NULL,
        payload    JSONB,
        owner_id   VARCHAR(32)  REFERENCES discord_users(discord_id) ON DELETE CASCADE,
        created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
      );

      -- ── Additive migrations (safe to re-run) ─────────────────────────────
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'projects' AND column_name = 'owner_id'
        ) THEN
          ALTER TABLE projects
            ADD COLUMN owner_id VARCHAR(32)
            REFERENCES discord_users(discord_id) ON DELETE CASCADE;
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'projects' AND column_name = 'payload'
        ) THEN
          ALTER TABLE projects ADD COLUMN payload JSONB;
        END IF;
      END $$;
    `);
  } finally {
    client.release();
  }
}
