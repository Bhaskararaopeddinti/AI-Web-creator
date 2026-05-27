import { Router, type IRouter } from "express";
import { db, gatePassesTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/ai/insights", requireAuth, requireRole("admin", "warden"), async (req, res): Promise<void> => {
  try {
    // Gather data for AI analysis
    const outPasses = await db.select().from(gatePassesTable).where(eq(gatePassesTable.status, "out"));
    const now = new Date();
    const lateStudents = outPasses.filter(p => new Date(p.expectedReturnTime) < now);

    // Frequent requesters in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const allRecent = await db.select().from(gatePassesTable);
    const recentPasses = allRecent.filter(p => new Date(p.createdAt) > thirtyDaysAgo);

    const studentCounts: Record<number, number> = {};
    for (const p of recentPasses) {
      studentCounts[p.studentId] = (studentCounts[p.studentId] ?? 0) + 1;
    }

    const suspiciousFlags: Array<{ studentId: number; studentName: string; reason: string; severity: "low" | "medium" | "high" }> = [];

    // Late returners
    for (const p of lateStudents) {
      const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, p.studentId));
      const hoursLate = Math.floor((now.getTime() - new Date(p.expectedReturnTime).getTime()) / (1000 * 60 * 60));
      suspiciousFlags.push({
        studentId: p.studentId,
        studentName: student?.name ?? "Unknown",
        reason: `Late return by ${hoursLate} hour(s) on a ${p.outingType.replace("_", " ")} outing`,
        severity: hoursLate > 12 ? "high" : hoursLate > 3 ? "medium" : "low",
      });
    }

    // Frequent requesters
    for (const [studentIdStr, count] of Object.entries(studentCounts)) {
      if (count >= 5) {
        const studentId = parseInt(studentIdStr, 10);
        const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, studentId));
        if (!suspiciousFlags.find(f => f.studentId === studentId)) {
          suspiciousFlags.push({
            studentId,
            studentName: student?.name ?? "Unknown",
            reason: `Submitted ${count} gate pass requests in the last 30 days`,
            severity: count >= 10 ? "high" : "medium",
          });
        }
      }
    }

    // Try AI call if API available
    let insights = "";
    let recommendations: string[] = [];

    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ baseURL: "https://openai-proxy.replit.com/v1", apiKey: "unused" });

      const context = `
Campus Gate Pass System Analytics:
- Currently outside campus: ${outPasses.length} students
- Late returns: ${lateStudents.length} students
- Passes in last 30 days: ${recentPasses.length}
- Suspicious patterns detected: ${suspiciousFlags.length} cases
- Suspicious flags: ${JSON.stringify(suspiciousFlags.map(f => ({ name: f.studentName, reason: f.reason })))}
      `.trim();

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a security analytics AI for a campus gate pass system. Provide concise insights and actionable recommendations based on the data provided. Be professional and direct."
          },
          {
            role: "user",
            content: `Analyze this campus gate pass data and provide: 1) A 2-3 sentence summary of the current situation, 2) 3-4 specific actionable recommendations.\n\n${context}`
          }
        ],
        max_tokens: 500,
      });

      const text = response.choices[0]?.message?.content ?? "";
      const lines = text.split("\n").filter(l => l.trim());

      // Simple parse: first non-numbered lines are insights, numbered lines are recommendations
      const recLines = lines.filter(l => /^\d+[\.\)]/.test(l.trim()));
      const insightLines = lines.filter(l => !/^\d+[\.\)]/.test(l.trim()) && l.trim().length > 0);

      insights = insightLines.join(" ").replace(/\*\*/g, "");
      recommendations = recLines.map(l => l.replace(/^\d+[\.\)]\s*/, "").replace(/\*\*/g, "").trim());
    } catch (aiErr) {
      req.log.warn({ err: aiErr }, "AI call failed, using fallback insights");

      insights = `Currently ${outPasses.length} student(s) are outside campus. ${lateStudents.length} student(s) have exceeded their expected return time. ${recentPasses.length} pass requests were made in the last 30 days.`;
      recommendations = [
        "Review all pending gate pass requests promptly to avoid delays",
        "Follow up with students who are past their expected return time",
        "Conduct a review of students with high pass frequency",
        "Ensure all gate logs are properly recorded by security personnel",
      ];
    }

    res.json({ insights, suspiciousFlags, recommendations });
  } catch (err) {
    req.log.error({ err }, "Failed to generate AI insights");
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default router;
