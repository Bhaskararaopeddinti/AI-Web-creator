import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db, usersTable, hostelsTable, departmentsTable } from "@workspace/db";
import { eq, and, ilike, SQL } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { ListUsersQueryParams, CreateUserBody, GetUserParams, UpdateUserParams, UpdateUserBody, DeleteUserParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichUser(user: typeof usersTable.$inferSelect) {
  let hostelName: string | null = null;
  let departmentName: string | null = null;
  if (user.hostelId) {
    const [h] = await db.select({ name: hostelsTable.name }).from(hostelsTable).where(eq(hostelsTable.id, user.hostelId));
    hostelName = h?.name ?? null;
  }
  if (user.departmentId) {
    const [d] = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, user.departmentId));
    departmentName = d?.name ?? null;
  }
  return {
    id: user.id, name: user.name, email: user.email, role: user.role,
    rollNumber: user.rollNumber, phone: user.phone, hostelId: user.hostelId,
    departmentId: user.departmentId, roomNumber: user.roomNumber,
    parentPhone: user.parentPhone, isActive: user.isActive, createdAt: user.createdAt.toISOString(),
    hostelName, departmentName,
  };
}

router.get("/users", requireAuth, requireRole("admin", "warden"), async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { role, search, hostelId } = params.data;

  const conditions: SQL[] = [];
  if (role) conditions.push(eq(usersTable.role, role));
  if (hostelId) conditions.push(eq(usersTable.hostelId, hostelId));
  if (search) conditions.push(ilike(usersTable.name, `%${search}%`));

  const users = conditions.length > 0
    ? await db.select().from(usersTable).where(and(...conditions))
    : await db.select().from(usersTable);

  const enriched = await Promise.all(users.map(enrichUser));
  res.json(enriched);
});

router.post("/users", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { password, ...rest } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, rest.email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ ...rest, passwordHash }).returning();
  res.status(201).json(await enrichUser(user));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(await enrichUser(user));
});

router.patch("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(await enrichUser(user));
});

router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
