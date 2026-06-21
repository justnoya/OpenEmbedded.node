import { Router } from "express";
import { db, projectsTable, eq } from "@workspace/db";
import {
  ListProjectsResponseItem,
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/v1/projects", async (req, res) => {
  try {
    const projects = await db
      .select()
      .from(projectsTable)
      .orderBy(projectsTable.updatedAt);
    const parsed = projects.map((p) =>
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
    req.log.error({ err }, "Failed to list projects");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/v1/projects", async (req, res) => {
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
    req.log.error({ err }, "Failed to create project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/v1/projects/:id", async (req, res) => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  try {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, params.data.id))
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
    req.log.error({ err }, "Failed to get project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/v1/projects/:id", async (req, res) => {
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
      .where(eq(projectsTable.id, params.data.id))
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
    req.log.error({ err }, "Failed to update project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/v1/projects/:id", async (req, res) => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  try {
    await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, params.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete project");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
