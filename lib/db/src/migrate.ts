import type pg from "pg";

export async function ensureSchema(
  pool: InstanceType<typeof pg.Pool>,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS discord_users (
        discord_id    VARCHAR(32)  PRIMARY KEY,
        username      VARCHAR(64)  NOT NULL,
        global_name   VARCHAR(64),
        discriminator VARCHAR(8)   NOT NULL DEFAULT '0',
        avatar        VARCHAR(256),
        created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
        last_seen_at  TIMESTAMP    NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid    VARCHAR      NOT NULL PRIMARY KEY,
        sess   JSON         NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON user_sessions (expire);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        name       VARCHAR(255) NOT NULL,
        graph      JSONB        NOT NULL,
        created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS payload JSONB
    `);

    await client.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS owner_id VARCHAR(32)
          REFERENCES discord_users(discord_id) ON DELETE CASCADE
    `);

    await client.query(`
      DO $$
      BEGIN
        CREATE TABLE scheduled_jobs (
          id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_id        VARCHAR(32)  REFERENCES discord_users(discord_id) ON DELETE CASCADE,
          label           VARCHAR(255) NOT NULL DEFAULT 'Scheduled Message',
          schedule_type   VARCHAR(10)  NOT NULL DEFAULT 'cron',
          cron_expression VARCHAR(100),
          run_at          TIMESTAMP,
          webhook_url     TEXT,
          channel_id      VARCHAR(32),
          bot_token       TEXT,
          payload         JSONB        NOT NULL DEFAULT '{}',
          active          BOOLEAN      NOT NULL DEFAULT TRUE,
          last_run_at     TIMESTAMP,
          next_run_at     TIMESTAMP,
          created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
          updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
        );
      EXCEPTION
        WHEN duplicate_table THEN NULL;
        WHEN unique_violation THEN NULL;
      END
      $$
    `);

    await client.query(`
      DO $$
      BEGIN
        CREATE TABLE user_authorized_guilds (
          id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id   VARCHAR(32) NOT NULL REFERENCES discord_users(discord_id) ON DELETE CASCADE,
          guild_id  VARCHAR(32) NOT NULL,
          added_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
          CONSTRAINT user_guild_unique UNIQUE (user_id, guild_id)
        );
      EXCEPTION
        WHEN duplicate_table THEN NULL;
        WHEN unique_violation THEN NULL;
      END
      $$
    `);
  } finally {
    client.release();
  }
}
