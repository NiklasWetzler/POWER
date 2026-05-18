import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";

export const questionnaireSubmissionsTable = pgTable("questionnaire_submissions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customersTable.id),
  formType: text("form_type").notNull().default("musikfragebogen"),
  brautpaar: text("brautpaar").notNull(),
  datum: text("datum"),
  location: text("location"),
  formData: text("form_data").notNull(),
  signatureBase64: text("signature_base64"),
  generatedPdfBase64: text("generated_pdf_base64"),
  status: text("status").notNull().default("open"),
  emailSent: text("email_sent").notNull().default("false"),
  adminConfirmed: boolean("admin_confirmed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuestionnaireSubmissionSchema = createInsertSchema(questionnaireSubmissionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertQuestionnaireSubmission = z.infer<typeof insertQuestionnaireSubmissionSchema>;
export type QuestionnaireSubmission = typeof questionnaireSubmissionsTable.$inferSelect;
