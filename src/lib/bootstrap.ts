// Lazy, idempotent bootstrap so the demo works on first request in a fresh
// environment without any manual seeding step.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isSeeded, seedDatabase } from "@/db/seed";
import { createSession, getSession, type SessionContext } from "./auth";
import type { Role } from "./types";

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      if (!(await isSeeded())) {
        await seedDatabase();
      }
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  await seedPromise;
}

/**
 * Returns the active session, or transparently signs the visitor in as the
 * demo persona for the requested role (public prototype behaviour).
 */
export async function ensureSession(role: Role = "student"): Promise<SessionContext | null> {
  await ensureSeeded();
  const existing = await getSession();
  if (existing) return existing;

  const [user] = await db.select().from(users).where(eq(users.role, role)).limit(1);
  if (!user) return null;
  return createSession(user.id);
}
