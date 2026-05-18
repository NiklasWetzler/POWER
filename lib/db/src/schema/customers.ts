import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  angebotsnummer: text("angebotsnummer").notNull(),
  hochzeitsdatum: text("hochzeitsdatum"),
  telefon: text("telefon"),
  strasse: text("strasse"),
  plz: text("plz"),
  ort: text("ort"),
  location: text("location"),
  // DJ-Vertrag Konditionen (vom Admin festgelegt)
  djKuenstler: text("dj_kuenstler"),
  djSpielzeit: text("dj_spielzeit"),
  djBemerkung: text("dj_bemerkung"),
  djGage: text("dj_gage"),
  djVerlaengerung: text("dj_verlaengerung"),
  djAnzahlungProzent: text("dj_anzahlung_prozent"),
  djAnzahlungFrist: text("dj_anzahlung_frist"),
  djSondervereinbarungen: text("dj_sondervereinbarungen"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
