import { pgTable, text, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { customersTable } from "./customers";

export const formAssignmentsTable = pgTable(
  "form_assignments",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customersTable.id, { onDelete: "cascade" }),
    formId: text("form_id").notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    customerFormUnique: uniqueIndex("form_assignments_customer_form_unique").on(t.customerId, t.formId),
  }),
);

export type FormAssignment = typeof formAssignmentsTable.$inferSelect;
