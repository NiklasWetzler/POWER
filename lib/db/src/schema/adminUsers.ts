import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminUsersTable = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  profilePicBase64: text("profile_pic_base64"),
  profilePicMime: text("profile_pic_mime"),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  inviteToken: text("invite_token"),
  inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsersTable).omit({
  id: true,
  createdAt: true,
});
export type AdminUser = typeof adminUsersTable.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export const adminActivityTable = pgTable("admin_activity", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminUsersTable.id, { onDelete: "set null" }),
  adminName: text("admin_name").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: integer("target_id"),
  targetLabel: text("target_label"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AdminActivity = typeof adminActivityTable.$inferSelect;
