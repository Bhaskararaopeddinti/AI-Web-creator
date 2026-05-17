import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db, usersTable, hostelsTable, departmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken } from "../middlewares/auth";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, role, rollNumber, phone, hostelId, departmentId, roomNumber, parentPhone } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    name, email, passwordHash, role,
    rollNumber: rollNumber ?? null,
    phone: phone ?? null,
    hostelId: hostelId ?? null,
    departmentId: departmentId ?? null,
    roomNumber: roomNumber ?? null,
    parentPhone: parentPhone ?? null,
  }).returning();

  const token = signToken({ id: user.id, email: user.email, role: user.role as "student" | "warden" | "security" | "admin", name: user.name });

  res.status(201).json({
    token,
    user: {
      id: user.id, name: user.name, email: user.email, role: user.role,
      rollNumber: user.rollNumber, phone: user.phone, hostelId: user.hostelId,
      departmentId: user.departmentId, roomNumber: user.roomNumber,
      parentPhone: user.parentPhone, isActive: user.isActive, createdAt: user.createdAt.toISOString(),
      hostelName: null, departmentName: null,
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // Fetch hostel and department names
  let hostelName: string | null = null;
  let departmentName: string | null = null;
  if (user.hostelId) {
    const [hostel] = await db.select().from(hostelsTable).where(eq(hostelsTable.id, user.hostelId));
    hostelName = hostel?.name ?? null;
  }
  if (user.departmentId) {
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, user.departmentId));
    departmentName = dept?.name ?? null;
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role as "student" | "warden" | "security" | "admin", name: user.name });

  res.json({
    token,
    user: {
      id: user.id, name: user.name, email: user.email, role: user.role,
      rollNumber: user.rollNumber, phone: user.phone, hostelId: user.hostelId,
      departmentId: user.departmentId, roomNumber: user.roomNumber,
      parentPhone: user.parentPhone, isActive: user.isActive, createdAt: user.createdAt.toISOString(),
      hostelName, departmentName,
    },
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  let hostelName: string | null = null;
  let departmentName: string | null = null;
  if (user.hostelId) {
    const [hostel] = await db.select().from(hostelsTable).where(eq(hostelsTable.id, user.hostelId));
    hostelName = hostel?.name ?? null;
  }
  if (user.departmentId) {
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, user.departmentId));
    departmentName = dept?.name ?? null;
  }

  res.json({
    id: user.id, name: user.name, email: user.email, role: user.role,
    rollNumber: user.rollNumber, phone: user.phone, hostelId: user.hostelId,
    departmentId: user.departmentId, roomNumber: user.roomNumber,
    parentPhone: user.parentPhone, isActive: user.isActive, createdAt: user.createdAt.toISOString(),
    hostelName, departmentName,
  });
});

export default router;
