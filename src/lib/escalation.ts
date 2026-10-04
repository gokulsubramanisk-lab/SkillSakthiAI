// Counsellor Escalation Router + case management.
// Severity drives queue prioritisation (Westman et al., IAFOR Journal of
// Education): crisis cases are surfaced first and carry a response SLA.

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  messages,
  skills,
  sosCases,
  studentSkills,
  trainingModules,
  users,
  userSessions,
} from "@/db/schema";
import { matchCareers } from "./matching";
import { prescribeSkillGap } from "./skill-gap";

export const SLA_MINUTES: Record<"high" | "medium" | "low", number> = {
  high: 15,
  medium: 120,
  low: 1440,
};

export async function studentSkillNames(userId: number): Promise<string[]> {
  const rows = await db
    .select({ name: skills.name })
    .from(studentSkills)
    .innerJoin(skills, eq(skills.id, studentSkills.skillId))
    .where(eq(studentSkills.studentId, userId));
  return rows.map((r) => r.name);
}

/** Skill-gap prescription: the precise local ITI modules that close the gap. */
export async function recommendModules(
  userId: number,
  districtCode: string,
): Promise<number[]> {
  const skillNames = await studentSkillNames(userId);
  const matches = await matchCareers({ districtCode, skillNames, limit: 1 });
  if (matches.length === 0) {
    const fallback = await db
      .select({ id: trainingModules.id })
      .from(trainingModules)
      .where(eq(trainingModules.districtCode, districtCode))
      .limit(2);
    return fallback.map((m) => m.id);
  }
  const prescription = await prescribeSkillGap(matches[0].careerId, districtCode, skillNames);
  return (prescription?.modules ?? []).slice(0, 3).map((m) => m.id);
}

export async function openSosCase(params: {
  sessionId: string;
  messageId: number;
  severity: "low" | "medium" | "high";
  userId: number;
  districtCode: string | null;
}): Promise<number> {
  const recommended = params.districtCode
    ? await recommendModules(params.userId, params.districtCode)
    : [];

  // Auto-assign to a counsellor in the same district when one exists.
  const counsellors = await db
    .select({ id: users.id, districtCode: users.districtCode })
    .from(users)
    .where(eq(users.role, "counselor"));
  const preferred =
    counsellors.find((c) => c.districtCode === params.districtCode) ?? counsellors[0];

  const [row] = await db
    .insert(sosCases)
    .values({
      sessionId: params.sessionId,
      triggerMessageId: params.messageId,
      severity: params.severity,
      status: preferred ? "assigned" : "open",
      counselorId: preferred?.id ?? null,
      recommendedModules: recommended,
    })
    .returning({ id: sosCases.id });

  await db
    .update(userSessions)
    .set({ status: "escalated", updatedAt: new Date() })
    .where(eq(userSessions.id, params.sessionId));

  return row.id;
}

export type CaseRow = {
  id: number;
  severity: "low" | "medium" | "high";
  status: "open" | "assigned" | "resolved";
  createdAt: Date;
  studentName: string;
  studentRole: string;
  districtCode: string | null;
  language: string;
  triggerText: string;
  distressLevel: number | null;
  sentimentScore: string | null;
  counselorName: string | null;
  recommendedModules: unknown;
  slaMinutes: number;
};

export async function listCases(status?: "open" | "assigned" | "resolved"): Promise<CaseRow[]> {
  const counselors = db.$with("c").as(
    db.select({ id: users.id, name: users.name }).from(users),
  );

  const rows = await db
    .with(counselors)
    .select({
      id: sosCases.id,
      severity: sql<"low" | "medium" | "high">`${sosCases.severity}::text`,
      status: sql<"open" | "assigned" | "resolved">`${sosCases.status}::text`,
      createdAt: sosCases.createdAt,
      studentName: users.name,
      studentRole: sql<string>`${users.role}::text`,
      districtCode: users.districtCode,
      language: users.language,
      triggerText: messages.content,
      distressLevel: messages.distressLevel,
      sentimentScore: messages.sentimentScore,
      counselorName: counselors.name,
      recommendedModules: sosCases.recommendedModules,
    })
    .from(sosCases)
    .innerJoin(userSessions, eq(userSessions.id, sosCases.sessionId))
    .innerJoin(users, eq(users.id, userSessions.userId))
    .innerJoin(messages, eq(messages.id, sosCases.triggerMessageId))
    .leftJoin(counselors, eq(counselors.id, sosCases.counselorId))
    .where(status ? sql`${sosCases.status}::text = ${status}` : sql`true`)
    .orderBy(desc(sosCases.createdAt))
    .limit(50);

  const priority = { high: 0, medium: 1, low: 2 } as const;
  return rows
    .map((row) => ({ ...row, slaMinutes: SLA_MINUTES[row.severity] }))
    .sort((a, b) => {
      if (a.status === "resolved" && b.status !== "resolved") return 1;
      if (b.status === "resolved" && a.status !== "resolved") return -1;
      return priority[a.severity] - priority[b.severity];
    });
}

export async function updateCase(
  caseId: number,
  action: "assign" | "resolve",
  counselorId: number,
) {
  if (action === "assign") {
    await db
      .update(sosCases)
      .set({ counselorId, status: "assigned", updatedAt: new Date() })
      .where(eq(sosCases.id, caseId));
  } else {
    await db
      .update(sosCases)
      .set({ status: "resolved", updatedAt: new Date() })
      .where(eq(sosCases.id, caseId));
  }
  const [row] = await db.select().from(sosCases).where(eq(sosCases.id, caseId)).limit(1);
  return row ?? null;
}

export async function modulesByIds(ids: number[]) {
  if (ids.length === 0) return [];
  return db
    .select({
      id: trainingModules.id,
      code: trainingModules.code,
      title: trainingModules.title,
      itiName: trainingModules.itiName,
      districtCode: trainingModules.districtCode,
      sourceUrl: trainingModules.sourceUrl,
    })
    .from(trainingModules)
    .where(inArray(trainingModules.id, ids));
}

export async function openCaseCount(): Promise<number> {
  const rows = await db
    .select({ count: sql<string>`count(*)::text` })
    .from(sosCases)
    .where(and(sql`${sosCases.status}::text <> 'resolved'`));
  return Number(rows[0]?.count ?? "0");
}
