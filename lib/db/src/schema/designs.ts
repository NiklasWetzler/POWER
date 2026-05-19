import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { customersTable } from "./customers";

/**
 * Card-designer drafts. A "draft" is created only AFTER the customer logs in
 * and starts filling wedding data — anonymous template browsing/swiping never
 * touches the database (privacy by design).
 */
export const designDraftsTable = pgTable("design_drafts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  // einladung | tischkarte | menuekarte | dankeskarte
  kind: text("kind").notNull(),
  // Template identifier from the shared template registry
  templateId: text("template_id").notNull(),
  // Free-form wedding data the template fills in (names, date, location, …)
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  // Photo for "dankeskarte" templates, added later by the customer (base64 data URL)
  photoBase64: text("photo_base64"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DesignDraft = typeof designDraftsTable.$inferSelect;
