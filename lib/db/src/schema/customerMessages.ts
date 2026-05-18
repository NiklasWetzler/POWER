import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { customersTable } from "./customers";

export const customerMessagesTable = pgTable("customer_messages", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  pdfFilename: text("pdf_filename"),
  pdfBase64: text("pdf_base64"),
  icalAppointmentId: integer("ical_appointment_id"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CustomerMessage = typeof customerMessagesTable.$inferSelect;
