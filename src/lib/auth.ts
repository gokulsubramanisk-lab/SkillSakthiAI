// Session + role based access control.
// Sessions are opaque UUIDs stored in Postgres and referenced by an
// httpOnly cookie, so no personally identifiable data ever leaves the server.

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users, userSessions } from "@/db/schema";
import type { Role } from "./types";

export const SESSION_COOKIE = "sih26241_session";

export type SessionContext = {
  sessionId: string;
  userId: number;
  name: string;
  role: Role;
  language: string;
  districtCode: string | null;
};

export async function createSession(userId: number): Promise<SessionContext | null> {
  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!user) return null;

  const inserted = await db
    .insert(userSessions)
    .values({
      userId: user.id,
      roleSnapshot: user.role,
      status: "active",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
    })
    .returning({ id: userSessions.id });

  const sessionId = inserted[0].id;
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "session.create",
    details: { role: user.role, sessionId },
  });

  return {
    sessionId,
    userId: user.id,
    name: user.name,
    role: user.role,
    language: user.language,
    districtCode: user.districtCode,
  };
}

export async function getSession(): Promise<SessionContext | null> {
  try {
    const store = await cookies();
    const sessionId = store.get(SESSION_COOKIE)?.value;
    if (!sessionId) return null;

    const rows = await db
      .select({
        sessionId: userSessions.id,
        userId: users.id,
        name: users.name,
        role: users.role,
        language: users.language,
        districtCode: users.districtCode,
      })
      .from(userSessions)
      .innerJoin(users, eq(users.id, userSessions.userId))
      .where(eq(userSessions.id, sessionId))
      .limit(1);

    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function requireRole(roles: Role[]): Promise<SessionContext | null> {
  const session = await getSession();
  if (!session) return null;
  return roles.includes(session.role) ? session : null;
}

export async function logAudit(
  userId: number | null,
  action: string,
  details: Record<string, unknown>,
) {
  await db.insert(auditLogs).values({ userId: userId ?? null, action, details });
}
