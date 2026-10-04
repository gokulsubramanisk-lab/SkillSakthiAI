import { db } from "@/db";
import { occupations, trainingPrograms } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface SkillGapAnalysis {
  occupation: any;
  currentSkills: string[];
  missingCompetencies: string[];
  recommendedTraining: any[];
  progressionPath: string[];
}

export async function analyzeSkillGap(
  occupationId: string,
  userSkills: string[]
): Promise<SkillGapAnalysis | null> {
  const occs = await db.select().from(occupations).where(eq(occupations.id, occupationId));
  if (occs.length === 0) return null;

  const occ = occs[0];
  const coreSkills: string[] = occ.coreSkills || [];

  const missingCompetencies = coreSkills.filter(
    (cs) => !userSkills.some((us) => us.toLowerCase().includes(cs.toLowerCase()) || cs.toLowerCase().includes(us.toLowerCase()))
  );

  const programs = await db
    .select()
    .from(trainingPrograms)
    .where(eq(trainingPrograms.occupationId, occupationId));

  return {
    occupation: occ,
    currentSkills: userSkills,
    missingCompetencies: missingCompetencies.length > 0 ? missingCompetencies : ["Advanced Diagnostic Tools"],
    recommendedTraining: programs,
    progressionPath: occ.progressionPath || [],
  };
}
