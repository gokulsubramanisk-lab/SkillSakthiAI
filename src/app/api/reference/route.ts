import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { careers, districts, skills, studentSkills, welfareSchemes } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { ensureSeeded } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const session = await getSession();

  const [districtRows, careerRows, skillRows, schemeRows] = await Promise.all([
    db.select().from(districts).orderBy(asc(districts.name)),
    db
      .select({
        id: careers.id,
        name: careers.name,
        nsqfLevel: careers.nsqfLevel,
        description: careers.description,
        sourceUrl: careers.sourceUrl,
        sourceAgency: careers.sourceAgency,
        minTrainingMonths: careers.minTrainingMonths,
        avgStartSalary: careers.avgStartSalary,
        avgFiveYearSalary: careers.avgFiveYearSalary,
        employmentSafetyScore: careers.employmentSafetyScore,
        typicalTrainingCost: careers.typicalTrainingCost,
      })
      .from(careers)
      .orderBy(asc(careers.name)),
    db.select().from(skills).orderBy(asc(skills.name)),
    db.select().from(welfareSchemes),
  ]);

  const mySkills = session
    ? (
        await db
          .select({ name: skills.name })
          .from(studentSkills)
          .innerJoin(skills, eq(skills.id, studentSkills.skillId))
          .where(eq(studentSkills.studentId, session.userId))
      ).map((r) => r.name)
    : [];

  return Response.json({
    districts: districtRows,
    careers: careerRows,
    skills: skillRows,
    schemes: schemeRows,
    mySkills,
    session,
  });
}
