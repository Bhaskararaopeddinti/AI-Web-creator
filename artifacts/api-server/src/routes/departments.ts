import { Router, type IRouter } from "express";
import { db, departmentsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { CreateDepartmentBody, DeleteDepartmentParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/departments", requireAuth, async (_req, res): Promise<void> => {
  const depts = await db.select().from(departmentsTable);
  const result = await Promise.all(depts.map(async (d) => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.departmentId, d.id));
    return { id: d.id, name: d.name, studentCount: count ?? 0, createdAt: d.createdAt.toISOString() };
  }));
  res.json(result);
});

router.post("/departments", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateDepartmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [dept] = await db.insert(departmentsTable).values(parsed.data).returning();
  res.status(201).json({ id: dept.id, name: dept.name, studentCount: 0, createdAt: dept.createdAt.toISOString() });
});

router.delete("/departments/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = DeleteDepartmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(departmentsTable).where(eq(departmentsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
