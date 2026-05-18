import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { customersTable } from "./customers";

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(),
  body: text("body").notNull(),
  readByAdminAt: timestamp("read_by_admin_at", { withTimezone: true }),
  readByCustomerAt: timestamp("read_by_customer_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ChatMessage = typeof chatMessagesTable.$inferSelect;
