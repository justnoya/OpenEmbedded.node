// @ts-nocheck
import { Router } from "express";
import { db, pool, usersTable, eq } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

/* ── GET /v1/admin/users ─────────────────────────────────────────────────────
 *  Returns paginated user list with moderation stats.
 *  Query params: page (default 1), limit (default 30), search, status
 * ─────────────────────────────────────────────────────────────────────────── */
router.get("/v1/admin/users", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "30"), 10) || 30));
    const offset = (page - 1) * limit;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const statusFilter = typeof req.query.status === "string" ? req.query.status.trim() : "";

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(username ILIKE $${paramIdx} OR global_name ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (statusFilter && ["active", "suspended", "banned"].includes(statusFilter)) {
      conditions.push(`status = $${paramIdx}`);
      params.push(statusFilter);
      paramIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Use raw pool for flexibility
    const { pool } = await import("@workspace/db");

    const client = await pool.connect();
    let usersRes, statsRes, countRes;
    try {
      [usersRes, statsRes, countRes] = await Promise.all([
        client.query(
          `SELECT discord_id, username, global_name, discriminator, avatar,
                  created_at, last_seen_at, status, suspended_until, suspension_reason
           FROM discord_users
           ${where}
           ORDER BY created_at DESC
           LIMIT ${paramIdx} OFFSET ${paramIdx + 1}`,
          [...params, limit, offset]
        ),
        client.query(`
          SELECT
            COUNT(*) FILTER (WHERE status = 'active')    AS active,
            COUNT(*) FILTER (WHERE status = 'suspended') AS suspended,
            COUNT(*) FILTER (WHERE status = 'banned')    AS banned,
            COUNT(*)                                      AS total
          FROM discord_users
        `),
        client.query(
          `SELECT COUNT(*) AS total FROM discord_users ${where}`,
          params
        ),
      ]);
    } finally {
      client.release();
    }

    const stats = statsRes.rows[0];
    const total = parseInt(countRes.rows[0].total, 10);

    res.json({
      users: usersRes.rows.map((u) => ({
        id: u.discord_id,
        username: u.username,
        globalName: u.global_name,
        discriminator: u.discriminator,
        avatar: u.avatar,
        createdAt: u.created_at,
        lastSeenAt: u.last_seen_at,
        status: u.status ?? "active",
        suspendedUntil: u.suspended_until,
        suspensionReason: u.suspension_reason,
      })),
      stats: {
        total: parseInt(stats.total, 10),
        active: parseInt(stats.active, 10),
        suspended: parseInt(stats.suspended, 10),
        banned: parseInt(stats.banned, 10),
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Admin: failed to list users");
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* ── POST /v1/admin/users/:id/suspend ───────────────────────────────────────
 *  Body: { hours: number, reason?: string }
 *  hours=0 means indefinite suspension
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/admin/users/:id/suspend", async (req, res) => {
  const targetId = req.params.id;
  const adminId = req.tokenUser.sub;

  if (targetId === adminId) {
    res.status(400).json({ error: "You cannot suspend yourself." });
    return;
  }

  const hours = typeof req.body.hours === "number" ? req.body.hours : parseFloat(req.body.hours);
  if (isNaN(hours) || hours < 0) {
    res.status(400).json({ error: "Invalid duration. Provide hours >= 0 (0 = indefinite)." });
    return;
  }

  const reason =
    typeof req.body.reason === "string" ? req.body.reason.slice(0, 512) : null;

  const suspendedUntil = hours > 0 ? new Date(Date.now() + hours * 60 * 60 * 1000) : null;

  try {
    const result = await db
      .update(usersTable)
      .set({
        status: "suspended",
        suspendedUntil,
        suspensionReason: reason,
      })
      .where(eq(usersTable.discordId, targetId))
      .returning({ id: usersTable.discordId });

    if (!result.length) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    req.log.info({ adminId, targetId, hours, reason }, "Admin: user suspended");
    res.json({
      success: true,
      status: "suspended",
      suspendedUntil: suspendedUntil?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Admin: failed to suspend user");
    res.status(500).json({ error: "Failed to suspend user" });
  }
});

/* ── POST /v1/admin/users/:id/ban ───────────────────────────────────────────
 *  Body: { reason?: string }
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/admin/users/:id/ban", async (req, res) => {
  const targetId = req.params.id;
  const adminId = req.tokenUser.sub;

  if (targetId === adminId) {
    res.status(400).json({ error: "You cannot ban yourself." });
    return;
  }

  const reason =
    typeof req.body.reason === "string" ? req.body.reason.slice(0, 512) : null;

  try {
    const result = await db
      .update(usersTable)
      .set({
        status: "banned",
        suspendedUntil: null,
        suspensionReason: reason,
      })
      .where(eq(usersTable.discordId, targetId))
      .returning({ id: usersTable.discordId });

    if (!result.length) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    req.log.info({ adminId, targetId, reason }, "Admin: user banned");
    res.json({ success: true, status: "banned" });
  } catch (err) {
    req.log.error({ err }, "Admin: failed to ban user");
    res.status(500).json({ error: "Failed to ban user" });
  }
});

/* ── POST /v1/admin/users/:id/unban ────────────────────────────────────────
 *  Clears any ban or suspension — restores user to active.
 * ─────────────────────────────────────────────────────────────────────────── */
router.post("/v1/admin/users/:id/unban", async (req, res) => {
  const targetId = req.params.id;

  try {
    const result = await db
      .update(usersTable)
      .set({ status: "active", suspendedUntil: null, suspensionReason: null })
      .where(eq(usersTable.discordId, targetId))
      .returning({ id: usersTable.discordId });

    if (!result.length) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    req.log.info({ adminId: req.tokenUser.sub, targetId }, "Admin: user unbanned/unsuspended");
    res.json({ success: true, status: "active" });
  } catch (err) {
    req.log.error({ err }, "Admin: failed to unban user");
    res.status(500).json({ error: "Failed to unban user" });
  }
});

export default router;
