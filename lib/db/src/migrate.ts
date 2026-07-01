// @ts-nocheck
import type pg from "pg";

export async function ensureSchema(
  pool: InstanceType<typeof pg.Pool>,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      DO $oe$
      BEGIN
        CREATE TABLE discord_users (
          discord_id    VARCHAR(32)  PRIMARY KEY,
          username      VARCHAR(64)  NOT NULL,
          global_name   VARCHAR(64),
          discriminator VARCHAR(8)   NOT NULL DEFAULT '0',
          avatar        VARCHAR(256),
          created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
          last_seen_at  TIMESTAMP    NOT NULL DEFAULT NOW()
        );
      EXCEPTION
        WHEN duplicate_table   THEN NULL;
        WHEN unique_violation  THEN NULL;
        WHEN duplicate_object  THEN NULL;
      END $oe$
    `);

    await client.query(`
      DO $oe$
      BEGIN
        CREATE TABLE user_sessions (
          sid    VARCHAR      NOT NULL PRIMARY KEY,
          sess   JSON         NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        );
      EXCEPTION
        WHEN duplicate_table   THEN NULL;
        WHEN unique_violation  THEN NULL;
        WHEN duplicate_object  THEN NULL;
      END $oe$
    `);

    await client.query(`
      DO $oe$
      BEGIN
        CREATE INDEX "IDX_session_expire" ON user_sessions (expire);
      EXCEPTION
        WHEN duplicate_table   THEN NULL;
        WHEN unique_violation  THEN NULL;
        WHEN duplicate_object  THEN NULL;
      END $oe$
    `);

    await client.query(`
      DO $oe$
      BEGIN
        CREATE TABLE projects (
          id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
          name       VARCHAR(255) NOT NULL,
          graph      JSONB        NOT NULL,
          created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
        );
      EXCEPTION
        WHEN duplicate_table   THEN NULL;
        WHEN unique_violation  THEN NULL;
        WHEN duplicate_object  THEN NULL;
      END $oe$
    `);

    await client.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS payload  JSONB
    `);

    await client.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS owner_id VARCHAR(32)
          REFERENCES discord_users(discord_id) ON DELETE CASCADE
    `);

    await client.query(`
      DO $oe$
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
        WHEN duplicate_table   THEN NULL;
        WHEN unique_violation  THEN NULL;
        WHEN duplicate_object  THEN NULL;
      END $oe$
    `);

    await client.query(`
      DO $oe$
      BEGIN
        CREATE TABLE user_authorized_guilds (
          id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id   VARCHAR(32) NOT NULL REFERENCES discord_users(discord_id) ON DELETE CASCADE,
          guild_id  VARCHAR(32) NOT NULL,
          added_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
          CONSTRAINT user_guild_unique UNIQUE (user_id, guild_id)
        );
      EXCEPTION
        WHEN duplicate_table   THEN NULL;
        WHEN unique_violation  THEN NULL;
        WHEN duplicate_object  THEN NULL;
      END $oe$
    `);

    /* ── Bot registrations — one per project ──────────────────────────────── */
    await client.query(`
      DO $oe$
      BEGIN
        CREATE TABLE bot_registrations (
          id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_id          VARCHAR(32)  NOT NULL REFERENCES discord_users(discord_id) ON DELETE CASCADE,
          project_id        UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          application_id    VARCHAR(32)  NOT NULL,
          public_key        VARCHAR(128) NOT NULL,
          token_encrypted   TEXT         NOT NULL,
          bot_name          VARCHAR(255),
          bot_avatar        TEXT,
          deployed_at       TIMESTAMP,
          interaction_url   TEXT,
          created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
          updated_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
          CONSTRAINT bot_reg_project_unique UNIQUE (project_id)
        );
      EXCEPTION
        WHEN duplicate_table   THEN NULL;
        WHEN unique_violation  THEN NULL;
        WHEN duplicate_object  THEN NULL;
      END $oe$
    `);

    /* ── Per-application index for fast interaction lookups ─────────────── */
    await client.query(`
      DO $oe$
      BEGIN
        CREATE INDEX idx_bot_reg_app_id ON bot_registrations (application_id);
      EXCEPTION
        WHEN duplicate_table   THEN NULL;
        WHEN unique_violation  THEN NULL;
        WHEN duplicate_object  THEN NULL;
      END $oe$
    `);

    /* ── Interaction handlers — custom_id → response payload ─────────────── */
    await client.query(`
      DO $oe$
      BEGIN
        CREATE TABLE bot_interaction_handlers (
          id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
          bot_id           UUID         NOT NULL REFERENCES bot_registrations(id) ON DELETE CASCADE,
          application_id   VARCHAR(32)  NOT NULL,
          owner_id         VARCHAR(32)  NOT NULL,
          custom_id        VARCHAR(200) NOT NULL,
          response_type    VARCHAR(20)  NOT NULL DEFAULT 'send_new',
          response_payload JSONB        NOT NULL,
          created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
          CONSTRAINT bot_handler_unique UNIQUE (bot_id, custom_id)
        );
      EXCEPTION
        WHEN duplicate_table   THEN NULL;
        WHEN unique_violation  THEN NULL;
        WHEN duplicate_object  THEN NULL;
      END $oe$
    `);

    /* ── Index for the hot path: application_id + custom_id lookup ───────── */
    await client.query(`
      DO $oe$
      BEGIN
        CREATE INDEX idx_bot_handler_lookup ON bot_interaction_handlers (application_id, custom_id);
      EXCEPTION
        WHEN duplicate_table   THEN NULL;
        WHEN unique_violation  THEN NULL;
        WHEN duplicate_object  THEN NULL;
      END $oe$
    `);

    /* ── Moderation columns on discord_users ─────────────────────────────── */
    await client.query(`
      ALTER TABLE discord_users
        ADD COLUMN IF NOT EXISTS status            VARCHAR(16)  NOT NULL DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS suspended_until   TIMESTAMP,
        ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(512)
    `);

  } finally {
    client.release();
  }
}
