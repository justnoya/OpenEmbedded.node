// @ts-nocheck
import type { RequestHandler } from "express";
import { db, usersTable, eq } from "@workspace/db";

/**
 * requireActive — must be called AFTER requireAuth so req.tokenUser is set.
 *
 * Checks the user's moderation status on every request:
 *   - "banned"     → 403 immediately, clears cookie
 *   - "suspended"  → 403 with expiry info; auto-heals if suspension has expired
 *   - "active"     → passes through
 */
export const requireActive: RequestHandler = async (req, res, next) => {
  try {
    const [user] = await db
      .select({
        status: usersTable.status,
        suspendedUntil: usersTable.suspendedUntil,
        suspensionReason: usersTable.suspensionReason,
      })
      .from(usersTable)
      .where(eq(usersTable.discordId, req.tokenUser.sub))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Account not found." });
      return;
    }

    if (user.status === "banned") {
      res.status(403).json({
        error: "Your account has been banned from OpenEmbedded.",
        code: "BANNED",
      });
      return;
    }

    if (user.status === "suspended") {
      const now = new Date();
      if (!user.suspendedUntil || user.suspendedUntil > now) {
        res.status(403).json({
          error: user.suspendedUntil
            ? `Your account is suspended until ${user.suspendedUntil.toUTCString()}.`
            : "Your account has been suspended.",
          code: "SUSPENDED",
          until: user.suspendedUntil?.toISOString() ?? null,
          reason: user.suspensionReason ?? null,
        });
        return;
      }
      // Suspension expired — auto-heal
      await db
        .update(usersTable)
        .set({ status: "active", suspendedUntil: null, suspensionReason: null })
        .where(eq(usersTable.discordId, req.tokenUser.sub));
    }

    next();
  } catch (err) {
    next(err);
  }
};
