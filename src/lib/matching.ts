// District-Level Labor Market Vector Matching (UJSRT 2026 style RAG matching).
// Student skill profile -> semantic vector -> ranked against career vectors,
// then re-weighted by *hyper-local* district hiring pipeline signals.

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  careers,
  districtLaborStats,
  districts,
  skills,
  trainingModuleSkills,
  trainingModules,
} from "@/db/schema";
import { cosineSimilarity, embed } from "./embeddings";
import type { CareerMatch } from "./types";

export type MatchInput = {
  districtCode: string;
  skillNames: string[];
  interests?: string;
  educationLevel?: string;
  limit?: number;
};

function num(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function careerSkillIndex(): Promise<Map<number, string[]>> {
  const rows = await db
    .select({
      careerId: trainingModules.careerId,
      skillName: skills.name,
    })
    .from(trainingModuleSkills)
    .innerJoin(trainingModules, eq(trainingModules.id, trainingModuleSkills.trainingModuleId))
    .innerJoin(skills, eq(skills.id, trainingModuleSkills.skillId));

  const index = new Map<number, string[]>();
  for (const row of rows) {
    if (row.careerId == null) continue;
    const list = index.get(row.careerId) ?? [];
    if (!list.includes(row.skillName)) list.push(row.skillName);
    index.set(row.careerId, list);
  }
  return index;
}

export async function matchCareers(input: MatchInput): Promise<CareerMatch[]> {
  const limit = input.limit ?? 6;

  const districtRow = (
    await db.select().from(districts).where(eq(districts.code, input.districtCode)).limit(1)
  )[0];
  if (!districtRow) return [];

  const [careerRows, statRows, skillIndex] = await Promise.all([
    db.select().from(careers),
    db
      .select()
      .from(districtLaborStats)
      .where(eq(districtLaborStats.districtCode, input.districtCode)),
    careerSkillIndex(),
  ]);

  const statsByCareer = new Map(statRows.map((row) => [row.careerId, row]));
  const maxOpenings = Math.max(1, ...statRows.map((row) => row.jobOpenings ?? 0));

  const profileText = [
    input.skillNames.join(", "),
    input.interests ?? "",
    input.educationLevel ?? "",
    `${districtRow.name} ${districtRow.state} ${districtRow.regionType}`,
  ]
    .filter(Boolean)
    .join(". ");
  const profileVector = await embed(profileText);

  const studentSkillSet = new Set(input.skillNames.map((s) => s.trim().toLowerCase()));

  const matches: CareerMatch[] = [];
  for (const career of careerRows) {
    const careerSkills = skillIndex.get(career.id) ?? [];
    const careerText = [
      career.name,
      career.description ?? "",
      careerSkills.join(", "),
      `NSQF level ${career.nsqfLevel ?? ""}`,
    ].join(". ");
    const careerVector = await embed(careerText);

    const rawSemantic = cosineSimilarity(profileVector, careerVector);
    const matchedSkills = careerSkills.filter((s) => studentSkillSet.has(s.toLowerCase()));
    const missingSkills = careerSkills.filter((s) => !studentSkillSet.has(s.toLowerCase()));
    const skillCoverage = careerSkills.length ? matchedSkills.length / careerSkills.length : 0;

    const semanticScore = Math.max(0, Math.min(1, rawSemantic * 0.6 + skillCoverage * 0.4));

    const stats = statsByCareer.get(career.id);
    const openings = stats?.jobOpenings ?? 0;
    const placement = num(stats?.placementRate, 0.5);
    const attrition = num(stats?.attritionRate, 0.2);
    const demandScore = Math.max(
      0,
      Math.min(1, (openings / maxOpenings) * 0.6 + placement * 0.4),
    );
    const baseSafety = (career.employmentSafetyScore ?? 60) / 100;
    const safetyScore = Math.max(
      0,
      Math.min(1, baseSafety * 0.5 + placement * 0.35 + (1 - attrition) * 0.15),
    );

    const finalScore = semanticScore * 0.5 + demandScore * 0.3 + safetyScore * 0.2;

    matches.push({
      careerId: career.id,
      name: career.name,
      nsqfLevel: career.nsqfLevel,
      description: career.description,
      semanticScore: Number(semanticScore.toFixed(3)),
      demandScore: Number(demandScore.toFixed(3)),
      safetyScore: Number(safetyScore.toFixed(3)),
      finalScore: Number(finalScore.toFixed(3)),
      districtCode: districtRow.code,
      districtName: districtRow.name,
      jobOpenings: openings,
      placementRate: Number(placement.toFixed(2)),
      avgSalary: num(stats?.avgSalary, num(career.avgStartSalary)),
      avgFiveYearSalary: num(career.avgFiveYearSalary),
      trainingMonths: career.minTrainingMonths ?? 12,
      trainingCost: num(career.typicalTrainingCost),
      sourceUrl: career.sourceUrl,
      sourceAgency: career.sourceAgency,
      matchedSkills,
      missingSkills,
    });
  }

  return matches.sort((a, b) => b.finalScore - a.finalScore).slice(0, limit);
}
