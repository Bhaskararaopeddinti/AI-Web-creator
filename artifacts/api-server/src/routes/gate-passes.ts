import { Router, type IRouter } from "express";
import { db, gatePassesTable, usersTable, hostelsTable, notificationsTable, gateLogsTable } from "@workspace/db";
import { eq, and, ilike, SQL, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  ListGatePassesQueryParams, CreateGatePassBody,
  GetGatePassParams, UpdateGatePassStatusParams, UpdateGatePassStatusBody,
  MarkGatePassOutParams, MarkGatePassInParams, GetGatePassQrParams, VerifyGatePassParams,
} from "@workspace/api-zod";
import crypto from "crypto";
import QRCode from "qrcode";

const router: IRouter = Router();

async function enrichGatePass(gp: typeof gatePassesTable.$inferSelect) {
  const [student] = await db.select({
    name: usersTable.name, rollNumber: usersTable.rollNumber,
    roomNumber: usersTable.roomNumber, hostelId: usersTable.hostelId,
  }).from(usersTable).where(eq(usersTable.id, gp.studentId));

  let hostelName: string | null = null;
  if (student?.hostelId) {
    const [h] = await db.select({ name: hostelsTable.name }).from(hostelsTable).where(eq(hostelsTable.id, student.hostelId));
    hostelName = h?.name ?? null;
  }

  let approvedByName: string | null = null;
  if (gp.approvedById) {
    const [approver] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, gp.approvedById));
    approvedByName = approver?.name ?? null;
  }

  const isLate = gp.status === "out" && new Date() > new Date(gp.expectedReturnTime);

  return {
    id: gp.id, studentId: gp.studentId,
    studentName: student?.name ?? null, studentRollNumber: student?.rollNumber ?? null,
    hostelName, roomNumber: student?.roomNumber ?? null,
    outingType: gp.outingType, reason: gp.reason, destination: gp.destination,
    outgoingTime: gp.outgoingTime.toISOString(),
    expectedReturnTime: gp.expectedReturnTime.toISOString(),
    actualOutTime: gp.actualOutTime?.toISOString() ?? null,
    actualInTime: gp.actualInTime?.toISOString() ?? null,
    status: gp.status, wardenRemarks: gp.wardenRemarks,
    approvedById: gp.approvedById, approvedByName,
    qrToken: gp.qrToken, isLate,
    createdAt: gp.createdAt.toISOString(),
  };
}

router.get("/gate-passes", requireAuth, async (req, res): Promise<void> => {
  const params = ListGatePassesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { status, studentId, hostelId, search, page = 1, limit = 20 } = params.data;

  const conditions: SQL[] = [];

  // Role-based filtering
  if (req.user!.role === "student") {
    conditions.push(eq(gatePassesTable.studentId, req.user!.id));
  } else if (studentId) {
    conditions.push(eq(gatePassesTable.studentId, studentId));
  }

  if (status) conditions.push(eq(gatePassesTable.status, status));

  const allPasses = conditions.length > 0
    ? await db.select().from(gatePassesTable).where(and(...conditions)).orderBy(desc(gatePassesTable.createdAt))
    : await db.select().from(gatePassesTable).orderBy(desc(gatePassesTable.createdAt));

  let enriched = await Promise.all(allPasses.map(enrichGatePass));

  // Filter by hostelId/search after enrichment
  if (hostelId) enriched = enriched.filter(p => p.hostelName !== null);
  if (search) {
    const s = search.toLowerCase();
    enriched = enriched.filter(p =>
      p.studentName?.toLowerCase().includes(s) ||
      p.studentRollNumber?.toLowerCase().includes(s) ||
      p.destination?.toLowerCase().includes(s)
    );
  }

  const total = enriched.length;
  const offset = (page - 1) * limit;
  const sliced = enriched.slice(offset, offset + limit);

  res.json({ data: sliced, total, page, limit });
});

router.post("/gate-passes", requireAuth, requireRole("student"), async (req, res): Promise<void> => {
  const parsed = CreateGatePassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [gp] = await db.insert(gatePassesTable).values({
    studentId: req.user!.id,
    outingType: parsed.data.outingType,
    reason: parsed.data.reason,
    destination: parsed.data.destination,
    outgoingTime: new Date(parsed.data.outgoingTime),
    expectedReturnTime: new Date(parsed.data.expectedReturnTime),
  }).returning();

  // Notify wardens
  const wardens = await db.select().from(usersTable).where(eq(usersTable.role, "warden"));
  if (wardens.length > 0) {
    await db.insert(notificationsTable).values(
      wardens.map(w => ({
        userId: w.id, title: "New Gate Pass Request",
        message: `${req.user!.name} has applied for a gate pass`,
        type: "gate_pass_applied" as const, gatePassId: gp.id,
      }))
    );
  }

  await db.insert(notificationsTable).values({
    userId: req.user!.id,
    title: "Gate Pass Request Submitted",
    message: "Your gate pass request has been submitted and sent to the warden.",
    type: "gate_pass_applied",
    gatePassId: gp.id,
  });

  res.status(201).json(await enrichGatePass(gp));
});

router.get("/gate-passes/verify/:token", requireAuth, requireRole("security"), async (req, res): Promise<void> => {
  const params = VerifyGatePassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [gp] = await db.select().from(gatePassesTable).where(eq(gatePassesTable.qrToken, params.data.token));
  if (!gp) {
    res.status(404).json({ error: "Invalid or expired gate pass" });
    return;
  }
  res.json(await enrichGatePass(gp));
});

router.get("/gate-passes/:id/qr", requireAuth, async (req, res): Promise<void> => {
  const params = GetGatePassQrParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [gp] = await db.select().from(gatePassesTable).where(eq(gatePassesTable.id, params.data.id));
  if (!gp || !gp.qrToken) {
    res.status(404).json({ error: "Gate pass not found or not approved yet" });
    return;
  }
  const qrDataUrl = await QRCode.toDataURL(gp.qrToken, { width: 300, margin: 2 });
  res.json({ qrDataUrl, token: gp.qrToken });
});

router.get("/gate-passes/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetGatePassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [gp] = await db.select().from(gatePassesTable).where(eq(gatePassesTable.id, params.data.id));
  if (!gp) {
    res.status(404).json({ error: "Gate pass not found" });
    return;
  }
  res.json(await enrichGatePass(gp));
});

router.patch("/gate-passes/:id/status", requireAuth, requireRole("warden", "admin"), async (req, res): Promise<void> => {
  const params = UpdateGatePassStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateGatePassStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const qrToken = parsed.data.status === "approved" ? crypto.randomUUID() : undefined;

  const [gp] = await db.update(gatePassesTable).set({
    status: parsed.data.status,
    wardenRemarks: parsed.data.wardenRemarks ?? null,
    approvedById: req.user!.id,
    ...(qrToken ? { qrToken } : {}),
  }).where(eq(gatePassesTable.id, params.data.id)).returning();

  if (!gp) {
    res.status(404).json({ error: "Gate pass not found" });
    return;
  }

  // Notify student
  await db.insert(notificationsTable).values({
    userId: gp.studentId,
    title: parsed.data.status === "approved" ? "Gate Pass Approved" : "Gate Pass Rejected",
    message: parsed.data.status === "approved"
      ? `Your gate pass has been approved. You can now proceed.`
      : `Your gate pass has been rejected. ${parsed.data.wardenRemarks ?? ""}`,
    type: parsed.data.status === "approved" ? "gate_pass_approved" : "gate_pass_rejected",
    gatePassId: gp.id,
  });

  const wardens = await db.select().from(usersTable).where(eq(usersTable.role, "warden"));
  if (wardens.length > 0) {
    await db.insert(notificationsTable).values(
      wardens.map(w => ({
        userId: w.id,
        title: "Gate Pass Status Updated",
        message: `A gate pass for ${gp.id} was ${parsed.data.status}.`,
        type: "general" as const,
        gatePassId: gp.id,
      }))
    );
  }

  res.json(await enrichGatePass(gp));
});

router.patch("/gate-passes/:id/mark-out", requireAuth, requireRole("security"), async (req, res): Promise<void> => {
  const params = MarkGatePassOutParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const now = new Date();
  const [gp] = await db.update(gatePassesTable).set({
    status: "out", actualOutTime: now,
  }).where(and(eq(gatePassesTable.id, params.data.id), eq(gatePassesTable.status, "approved"))).returning();

  if (!gp) {
    res.status(404).json({ error: "Gate pass not found or not in approved state" });
    return;
  }

  await db.insert(gateLogsTable).values({
    gatePassId: gp.id, studentId: gp.studentId, type: "out", timestamp: now, guardId: req.user!.id,
  });

  res.json(await enrichGatePass(gp));
});

router.patch("/gate-passes/:id/mark-in", requireAuth, requireRole("security"), async (req, res): Promise<void> => {
  const params = MarkGatePassInParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const now = new Date();
  const [existing] = await db.select().from(gatePassesTable).where(eq(gatePassesTable.id, params.data.id));
  if (!existing || existing.status !== "out") {
    res.status(404).json({ error: "Gate pass not found or not in out state" });
    return;
  }

  const isLate = now > existing.expectedReturnTime;
  const [gp] = await db.update(gatePassesTable).set({
    status: "returned", actualInTime: now, isLate,
  }).where(eq(gatePassesTable.id, params.data.id)).returning();

  await db.insert(gateLogsTable).values({
    gatePassId: gp!.id, studentId: gp!.studentId, type: "in", timestamp: now, guardId: req.user!.id,
  });

  if (isLate) {
    // Get wardens and notify
    const wardens = await db.select().from(usersTable).where(eq(usersTable.role, "warden"));
    if (wardens.length > 0) {
      await db.insert(notificationsTable).values(
        wardens.map(w => ({
          userId: w.id, title: "Late Return Alert",
          message: `A student returned late from their outing.`,
          type: "late_return" as const, gatePassId: gp!.id,
        }))
      );
    }
  }

  res.json(await enrichGatePass(gp!));
});

export default router;
