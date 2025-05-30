import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const seatAssignments = pgTable("seat_assignments", {
  id: serial("id").primaryKey(),
  seatNumber: integer("seat_number").notNull(),
  studentName: text("student_name").notNull(),
  studentId: text("student_id"),
  contact: text("contact"),
  shift: text("shift").notNull(), // 'morning', 'evening', 'fullday'
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSeatAssignmentSchema = createInsertSchema(seatAssignments).omit({
  id: true,
  assignedAt: true,
}).extend({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export const updateSeatAssignmentSchema = insertSeatAssignmentSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSeatAssignment = z.infer<typeof insertSeatAssignmentSchema>;
export type SeatAssignment = typeof seatAssignments.$inferSelect;

export type ShiftType = 'morning' | 'evening' | 'fullday';

export interface SeatInfo {
  seatNumber: number;
  status: 'vacant' | ShiftType | 'partial'; // partial = morning OR evening only
  assignments: SeatAssignment[]; // Array to handle multiple shifts
  availableShifts: ShiftType[]; // What shifts are still available
}

export interface LibraryStats {
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  occupancyRate: number;
  morningShift: number;
  eveningShift: number;
  fullDayShift: number;
}
