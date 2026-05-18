import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { customersTable } from "./customers";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),

  status: text("status").notNull().default("pending"),

  customerProposedAt: timestamp("customer_proposed_at", { withTimezone: true }),
  customerMessage: text("customer_message"),

  adminProposedAt: timestamp("admin_proposed_at", { withTimezone: true }),
  adminMessage: text("admin_message"),

  finalAt: timestamp("final_at", { withTimezone: true }),

  reminder24hSent: boolean("reminder_24h_sent").notNull().default(false),
  reminder1hSent: boolean("reminder_1h_sent").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Appointment = typeof appointmentsTable.$inferSelect;
