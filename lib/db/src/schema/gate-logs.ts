import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gateLogsTable = pgTable("gate_logs", {
  id: serial("id").primaryKey(),
  gatePassId: integer("gate_pass_id").notNull(),
  studentId: integer("student_id").notNull(),
  type: text("type", { enum: ["in", "out"] }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  guardId: integer("guard_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGateLogSchema = createInsertSchema(gateLogsTable).omit({ id: true, createdAt: true });
export type InsertGateLog = z.infer<typeof insertGateLogSchema>;
export type GateLog = typeof gateLogsTable.$inferSelect;
