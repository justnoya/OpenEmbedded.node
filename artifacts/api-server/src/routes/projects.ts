// @ts-nocheck
import { Router } from "express";
import { db, projectsTable, eq, and } from "@workspace/db";
import type { Project } from "@workspace/db";
import {
  ListProjectsResponseItem,
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";
import { requireActive } from "../middleware/userStatus";

const router = Router();

/* ── All project routes require authentication ───────────────────────────────
 *  OWASP A01 — Broken Access Control
 *  Every query is scoped to req.tokenUser.sub (the authenticated Discord ID).
 * ─────────────────────────────────────────────────────────────────────────── */

/* ── Shared DB error logger ───────────────────────────────────────────────── */
function logDbError(req: import("express").Request, err: unknown, msg: string) {
  const e = err as Error & { cause?: unknown; query?: string };
  const cause = e.cause as Error | undefined;
  req.log.error({
    type: e.constructor?.name,
    message: e.message,
    cause: cause ? { type: cause.constructor?.name, message: cause.message } : undefined,
    query: e.query?.slice(0, 200),
  }, msg);
}

/* ── GET /v1/projects ─────────────────────────────────────────────────────── */
router.get("/v1/projects", requireAuth, requireActive, async (req, res) => {
  const userId = req.tokenUser!.sub;
  try {
    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.ownerId, userId))
      .orderBy(projectsTable.updatedAt);

    const parsed = projects.map((p: Project) =>
      ListProjectsResponseItem.parse({
        id: p.id,
        name: p.name,
        graph: p.graph,
        payload: p.payload ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })
    );
    res.json(parsed);
  } catch (err) {
    logDbError(req, err, "Failed to list projects");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── POST /v1/projects ────────────────────────────────────────────────────── */
router.post("/v1/projects", requireAuth, requireActive, async (req, res) => {
  const userId = req.tokenUser!.sub;
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [project] = await db
      .insert(projectsTable)
      .values({
        name: parsed.data.name,
        graph: parsed.data.graph as { nodes: unknown[]; edges: unknown[] },
        ownerId: userId,
      })
      .returning();
    res.status(201).json({
      id: project.id,
      name: project.name,
      graph: project.graph,
      payload: project.payload ?? null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  } catch (err) {
    logDbError(req, err, "Failed to create project");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── GET /v1/projects/:id ─────────────────────────────────────────────────── */
router.get("/v1/projects/:id", requireAuth, requireActive, async (req, res) => {
  const userId = req.tokenUser!.sub;
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  try {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, params.data.id),
          eq(projectsTable.ownerId, userId),
        ),
      )
      .limit(1);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json({
      id: project.id,
      name: project.name,
      graph: project.graph,
      payload: project.payload ?? null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  } catch (err) {
    logDbError(req, err, "Failed to get project");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── PUT /v1/projects/:id ─────────────────────────────────────────────────── */
router.put("/v1/projects/:id", requireAuth, requireActive, async (req, res) => {
  const userId = req.tokenUser!.sub;
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  const body = UpdateProjectBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.data.name !== undefined) updateData.name = body.data.name;
    if (body.data.graph !== undefined) updateData.graph = body.data.graph;
    if (body.data.payload !== undefined) updateData.payload = body.data.payload;

    const [project] = await db
      .update(projectsTable)
      .set(updateData)
      .where(
        and(
          eq(projectsTable.id, params.data.id),
          eq(projectsTable.ownerId, userId),
        ),
      )
      .returning();

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json({
      id: project.id,
      name: project.name,
      graph: project.graph,
      payload: project.payload ?? null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  } catch (err) {
    logDbError(req, err, "Failed to update project");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── DELETE /v1/projects/:id ──────────────────────────────────────────────── */
router.delete("/v1/projects/:id", requireAuth, requireActive, async (req, res) => {
  const userId = req.tokenUser!.sub;
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  try {
    const result = await db
      .delete(projectsTable)
      .where(
        and(
          eq(projectsTable.id, params.data.id),
          eq(projectsTable.ownerId, userId),
        ),
      )
      .returning({ id: projectsTable.id });

    if (result.length === 0) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    logDbError(req, err, "Failed to delete project");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
