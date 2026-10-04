// Skill-Gap Diagnostics -> precise local ITI training module prescriptions.
// Maps the learner's current skills onto NSQF levels and outputs the exact
// government module that closes the gap for district employment.

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { careers, skills, trainingModuleSkills, trainingModules } from "@/db/schema";
import { citationsForDocumentIds } from "./rag";
import type { SkillGapPrescription } from "./types";

function num(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function prescribeSkillGap(
  careerId: number,
  districtCode: string,
  studentSkillNames: string[],
): Promise<SkillGapPrescription | null> {
  const [career] = await db.select().from(careers).where(eq(careers.id, careerId)).limit(1);
  if (!career) return null;

  const moduleRows = await db
    .select({
      moduleId: trainingModules.id,
      code: trainingModules.code,
      title: trainingModules.title,
      itiName: trainingModules.itiName,
      nsqfLevel: trainingModules.nsqfLevel,
      durationMonths: trainingModules.durationMonths,
      tuitionCost: trainingModules.tuitionCost,
      districtCode: trainingModules.districtCode,
      sourceUrl: trainingModules.sourceUrl,
      govDocumentId: trainingModules.govDocumentId,
      skillName: skills.name,
      skillNsqf: skills.nsqfLevel,
    })
    .from(trainingModules)
    .innerJoin(trainingModuleSkills, eq(trainingModuleSkills.trainingModuleId, trainingModules.id))
    .innerJoin(skills, eq(skills.id, trainingModuleSkills.skillId))
    .where(
      and(eq(trainingModules.careerId, careerId), eq(trainingModules.districtCode, districtCode)),
    );

  const owned = new Set(studentSkillNames.map((s) => s.trim().toLowerCase()));
  const requiredSkills = [...new Set(moduleRows.map((r) => r.skillName))];
  const matchedSkills = requiredSkills.filter((s) => owned.has(s.toLowerCase()));
  const missingSkills = requiredSkills.filter((s) => !owned.has(s.toLowerCase()));

  const grouped = new Map<number, (typeof moduleRows)[number][]>();
  for (const row of moduleRows) {
    const list = grouped.get(row.moduleId) ?? [];
    list.push(row);
    grouped.set(row.moduleId, list);
  }

  const modules = [...grouped.entries()]
    .map(([moduleId, rows]) => {
      const first = rows[0];
      const coversSkills = rows
        .map((r) => r.skillName)
        .filter((name) => missingSkills.includes(name));
      return {
        id: moduleId,
        code: first.code,
        title: first.title,
        itiName: first.itiName,
        nsqfLevel: first.nsqfLevel,
        durationMonths: first.durationMonths,
        tuitionCost: num(first.tuitionCost),
        districtCode: first.districtCode,
        sourceUrl: first.sourceUrl,
        govDocumentId: first.govDocumentId,
        coversSkills,
      };
    })
    .filter((m) => m.coversSkills.length > 0 || missingSkills.length === 0)
    .sort((a, b) => b.coversSkills.length - a.coversSkills.length);

  const nsqfCurrent = matchedSkills.length
    ? Math.max(
        1,
        Math.round(
          moduleRows
            .filter((r) => matchedSkills.includes(r.skillName))
            .reduce((sum, r) => sum + (r.skillNsqf ?? 3), 0) /
            Math.max(1, matchedSkills.length),
        ),
      )
    : 2;

  const citations = await citationsForDocumentIds(
    [career.govDocumentId, ...modules.map((m) => m.govDocumentId)].filter(
      (v): v is number => typeof v === "number",
    ),
  );

  return {
    careerId: career.id,
    careerName: career.name,
    nsqfCurrent,
    nsqfTarget: career.nsqfLevel ?? 4,
    matchedSkills,
    missingSkills,
    readinessPercent: requiredSkills.length
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 0,
    modules: modules.map(({ govDocumentId: _ignored, ...rest }) => rest),
    citations,
  };
}
