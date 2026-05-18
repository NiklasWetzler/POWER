import { eq, and, gt, lt, sql } from "drizzle-orm";
import { db, appointmentsTable, customerMessagesTable } from "@workspace/db";
import { logger } from "./logger";

const FIVE_MINUTES = 5 * 60_000;
const ONE_HOUR = 60 * 60_000;
void (24 * ONE_HOUR);

function formatDe(d: Date): string {
  return (
    d.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }) +
    " um " +
    d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) +
    " Uhr"
  );
}

async function runReminderTick(): Promise<void> {
  const now = new Date();
  const in23h = new Date(now.getTime() + 23 * ONE_HOUR);
  const in25h = new Date(now.getTime() + 25 * ONE_HOUR);
  const inOneHour = new Date(now.getTime() + ONE_HOUR);

  // 24-hour reminders: window 23h–25h ahead, not yet sent
  const due24 = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.status, "accepted"),
        eq(appointmentsTable.reminder24hSent, false),
        gt(appointmentsTable.finalAt, in23h),
        lt(appointmentsTable.finalAt, in25h),
      ),
    );

  for (const a of due24) {
    if (!a.finalAt) continue;
    await db.insert(customerMessagesTable).values({
      customerId: a.customerId,
      subject: "Erinnerung: Termin morgen",
      body:
        `Kurze Erinnerung — euer Termin mit NIWE Weddings ist morgen:\n\n` +
        `📅 ${formatDe(a.finalAt)}\n\n` +
        `Falls noch etwas dazwischenkommt, meldet euch bitte rechtzeitig.\n— NIWE Weddings`,
    });
    await db
      .update(appointmentsTable)
      .set({ reminder24hSent: true, updatedAt: new Date() })
      .where(eq(appointmentsTable.id, a.id));
  }

  // 1-hour reminders: any accepted appt within next ~1h (+5min buffer), not yet sent
  const due1 = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.status, "accepted"),
        eq(appointmentsTable.reminder1hSent, false),
        gt(appointmentsTable.finalAt, now),
        lt(appointmentsTable.finalAt, inOneHour),
      ),
    );

  for (const a of due1) {
    if (!a.finalAt) continue;
    await db.insert(customerMessagesTable).values({
      customerId: a.customerId,
      subject: "Erinnerung: Termin in 1 Stunde",
      body:
        `Euer Termin mit NIWE Weddings beginnt in Kürze:\n\n` +
        `📅 ${formatDe(a.finalAt)}\n\n` +
        `Wir freuen uns auf euch!\n— NIWE Weddings`,
    });
    await db
      .update(appointmentsTable)
      .set({ reminder1hSent: true, updatedAt: new Date() })
      .where(eq(appointmentsTable.id, a.id));
  }

  if (due24.length || due1.length) {
    logger.info({ d24: due24.length, d1: due1.length }, "appointment reminders sent");
  }
}

export function startReminderCron(): void {
  // run once shortly after boot, then every 5 minutes
  setTimeout(() => {
    void runReminderTick().catch((err) => logger.error({ err }, "reminder tick failed"));
  }, 10_000);
  setInterval(() => {
    void runReminderTick().catch((err) => logger.error({ err }, "reminder tick failed"));
  }, FIVE_MINUTES);
  logger.info("appointment reminder cron started (every 5 min)");
  // silence unused import (sql kept for potential future use)
  void sql;
}
