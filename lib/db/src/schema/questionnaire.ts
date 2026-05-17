import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questionnaireSubmissionsTable = pgTable("questionnaire_submissions", {
  id: serial("id").primaryKey(),
  brautpaar: text("brautpaar").notNull(),
  datum: text("datum"),
  location: text("location"),
  formData: text("form_data").notNull(),
  status: text("status").notNull().default("open"),
  emailSent: text("email_sent").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuestionnaireSubmissionSchema = createInsertSchema(questionnaireSubmissionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertQuestionnaireSubmission = z.infer<typeof insertQuestionnaireSubmissionSchema>;
export type QuestionnaireSubmission = typeof questionnaireSubmissionsTable.$inferSelect;
