import { Router, type IRouter } from "express";
import { db, hostelsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { CreateHostelBody, UpdateHostelBody, UpdateHostelParams, DeleteHostelParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/hostels", requireAuth, async (_req, res): Promise<void> => {
  const hostels = await db.select().from(hostelsTable);

  const result = await Promise.all(hostels.map(async (h) => {
    const [wardenRow] = h.wardenId ? await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, h.wardenId)) : [null];
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.hostelId, h.id));
    return {
      id: h.id, name: h.name, totalRooms: h.totalRooms, wardenId: h.wardenId,
      wardenName: wardenRow?.name ?? null, studentCount: count ?? 0, createdAt: h.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

router.post("/hostels", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateHostelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [hostel] = await db.insert(hostelsTable).values(parsed.data).returning();
  res.status(201).json({ id: hostel.id, name: hostel.name, totalRooms: hostel.totalRooms, wardenId: hostel.wardenId, wardenName: null, studentCount: 0, createdAt: hostel.createdAt.toISOString() });
});

router.patch("/hostels/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateHostelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateHostelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [hostel] = await db.update(hostelsTable).set(parsed.data).where(eq(hostelsTable.id, params.data.id)).returning();
  if (!hostel) {
    res.status(404).json({ error: "Hostel not found" });
    return;
  }
  res.json({ id: hostel.id, name: hostel.name, totalRooms: hostel.totalRooms, wardenId: hostel.wardenId, wardenName: null, studentCount: 0, createdAt: hostel.createdAt.toISOString() });
});

router.delete("/hostels/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = DeleteHostelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(hostelsTable).where(eq(hostelsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
