import { Router, type IRouter } from "express";
import { db, gatePassesTable, usersTable, gateLogsTable, hostelsTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/analytics/summary", requireAuth, requireRole("admin", "warden"), async (_req, res): Promise<void> => {
  const [{ totalStudents }] = await db.select({ totalStudents: sql<number>`count(*)::int` })
    .from(usersTable).where(eq(usersTable.role, "student"));

  const [{ totalPasses }] = await db.select({ totalPasses: sql<number>`count(*)::int` }).from(gatePassesTable);

  const [{ pendingPasses }] = await db.select({ pendingPasses: sql<number>`count(*)::int` })
    .from(gatePassesTable).where(eq(gatePassesTable.status, "pending"));

  const [{ approvedPasses }] = await db.select({ approvedPasses: sql<number>`count(*)::int` })
    .from(gatePassesTable).where(eq(gatePassesTable.status, "approved"));

  const [{ rejectedPasses }] = await db.select({ rejectedPasses: sql<number>`count(*)::int` })
    .from(gatePassesTable).where(eq(gatePassesTable.status, "rejected"));

  const [{ currentlyOutside }] = await db.select({ currentlyOutside: sql<number>`count(*)::int` })
    .from(gatePassesTable).where(eq(gatePassesTable.status, "out"));

  const now = new Date();
  const latePassesRaw = await db.select().from(gatePassesTable).where(eq(gatePassesTable.status, "out"));
  const lateReturns = latePassesRaw.filter(p => new Date(p.expectedReturnTime) < now).length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [{ todayPasses }] = await db.select({ todayPasses: sql<number>`count(*)::int` })
    .from(gatePassesTable).where(gte(gatePassesTable.createdAt, todayStart));

  // Pass type breakdown
  const typeBreakdown = await db.select({
    type: gatePassesTable.outingType,
    count: sql<number>`count(*)::int`,
  }).from(gatePassesTable).groupBy(gatePassesTable.outingType);

  // Weekly trend (last 7 days)
  const weeklyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(gatePassesTable)
      .where(and(gte(gatePassesTable.createdAt, d), sql`${gatePassesTable.createdAt} < ${nextD}`));
    weeklyTrend.push({ date: d.toISOString().split("T")[0], count: count ?? 0 });
  }

  res.json({
    totalStudents: totalStudents ?? 0,
    totalPasses: totalPasses ?? 0,
    pendingPasses: pendingPasses ?? 0,
    approvedPasses: approvedPasses ?? 0,
    rejectedPasses: rejectedPasses ?? 0,
    currentlyOutside: currentlyOutside ?? 0,
    lateReturns,
    todayPasses: todayPasses ?? 0,
    passTypeBreakdown: typeBreakdown.map(t => ({ type: t.type, count: t.count ?? 0 })),
    weeklyTrend,
  });
});

router.get("/analytics/live-count", requireAuth, async (_req, res): Promise<void> => {
  const outPasses = await db.select().from(gatePassesTable).where(eq(gatePassesTable.status, "out"));

  const enriched = await Promise.all(outPasses.map(async (gp) => {
    const [student] = await db.select({ name: usersTable.name, rollNumber: usersTable.rollNumber, roomNumber: usersTable.roomNumber, hostelId: usersTable.hostelId })
      .from(usersTable).where(eq(usersTable.id, gp.studentId));
    let hostelName: string | null = null;
    if (student?.hostelId) {
      const [h] = await db.select({ name: hostelsTable.name }).from(hostelsTable).where(eq(hostelsTable.id, student.hostelId));
      hostelName = h?.name ?? null;
    }
    return {
      id: gp.id, studentId: gp.studentId, studentName: student?.name ?? null,
      studentRollNumber: student?.rollNumber ?? null, hostelName, roomNumber: student?.roomNumber ?? null,
      outingType: gp.outingType, reason: gp.reason, destination: gp.destination,
      outgoingTime: gp.outgoingTime.toISOString(), expectedReturnTime: gp.expectedReturnTime.toISOString(),
      actualOutTime: gp.actualOutTime?.toISOString() ?? null, actualInTime: null,
      status: gp.status, wardenRemarks: gp.wardenRemarks, approvedById: gp.approvedById,
      approvedByName: null, qrToken: gp.qrToken, isLate: new Date() > new Date(gp.expectedReturnTime),
      createdAt: gp.createdAt.toISOString(),
    };
  }));

  res.json({ count: enriched.length, students: enriched });
});

router.get("/analytics/outing-stats", requireAuth, requireRole("admin", "warden"), async (_req, res): Promise<void> => {
  const byType = await db.select({ type: gatePassesTable.outingType, count: sql<number>`count(*)::int` })
    .from(gatePassesTable).groupBy(gatePassesTable.outingType);

  const byStatus = await db.select({ status: gatePassesTable.status, count: sql<number>`count(*)::int` })
    .from(gatePassesTable).groupBy(gatePassesTable.status);

  // By hostel (approx)
  const hostels = await db.select().from(hostelsTable);
  const byHostel = await Promise.all(hostels.map(async (h) => {
    const students = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.hostelId, h.id));
    const studentIds = students.map(s => s.id);
    let count = 0;
    if (studentIds.length > 0) {
      const passes = await db.select().from(gatePassesTable);
      count = passes.filter(p => studentIds.includes(p.studentId)).length;
    }
    return { hostelId: h.id, hostelName: h.name, count };
  }));

  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1); d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setMonth(nextD.getMonth() + 1);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(gatePassesTable)
      .where(and(gte(gatePassesTable.createdAt, d), sql`${gatePassesTable.createdAt} < ${nextD}`));
    monthlyTrend.push({ date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, count: count ?? 0 });
  }

  res.json({
    byType: byType.map(t => ({ type: t.type, count: t.count ?? 0 })),
    byStatus: byStatus.map(s => ({ status: s.status, count: s.count ?? 0 })),
    byHostel,
    monthlyTrend,
  });
});

router.get("/gate-logs", requireAuth, requireRole("security", "admin", "warden"), async (req, res): Promise<void> => {
  const rawLimit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
  const limit = isNaN(rawLimit) ? 50 : rawLimit;

  const logs = await db.select().from(gateLogsTable).orderBy(sql`${gateLogsTable.timestamp} DESC`).limit(limit);

  const enriched = await Promise.all(logs.map(async (log) => {
    const [student] = await db.select({ name: usersTable.name, rollNumber: usersTable.rollNumber })
      .from(usersTable).where(eq(usersTable.id, log.studentId));
    let guardName: string | null = null;
    if (log.guardId) {
      const [guard] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, log.guardId));
      guardName = guard?.name ?? null;
    }
    return {
      id: log.id, gatePassId: log.gatePassId, studentId: log.studentId,
      studentName: student?.name ?? null, studentRollNumber: student?.rollNumber ?? null,
      type: log.type, timestamp: log.timestamp.toISOString(),
      guardId: log.guardId, guardName,
    };
  }));

  res.json(enriched);
});

export default router;
