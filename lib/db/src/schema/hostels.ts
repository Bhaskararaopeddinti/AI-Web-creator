import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hostelsTable = pgTable("hostels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  totalRooms: integer("total_rooms"),
  wardenId: integer("warden_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHostelSchema = createInsertSchema(hostelsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHostel = z.infer<typeof insertHostelSchema>;
export type Hostel = typeof hostelsTable.$inferSelect;
