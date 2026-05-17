import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gatePassesTable = pgTable("gate_passes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  outingType: text("outing_type", {
    enum: ["home_visit", "weekend_leave", "emergency_leave", "medical_leave"],
  }).notNull(),
  reason: text("reason").notNull(),
  destination: text("destination").notNull(),
  outgoingTime: timestamp("outgoing_time", { withTimezone: true }).notNull(),
  expectedReturnTime: timestamp("expected_return_time", { withTimezone: true }).notNull(),
  actualOutTime: timestamp("actual_out_time", { withTimezone: true }),
  actualInTime: timestamp("actual_in_time", { withTimezone: true }),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "out", "returned"],
  }).notNull().default("pending"),
  wardenRemarks: text("warden_remarks"),
  approvedById: integer("approved_by_id"),
  qrToken: text("qr_token"),
  isLate: boolean("is_late").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGatePassSchema = createInsertSchema(gatePassesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGatePass = z.infer<typeof insertGatePassSchema>;
export type GatePass = typeof gatePassesTable.$inferSelect;
