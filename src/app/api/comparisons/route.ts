// Family Comparison Screen: shared space where a family evaluates up to three
// career paths side by side on cost, duration and projected salary growth.

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { careers, familyComparisonItems, familyComparisons } from "@/db/schema";
import { logAudit } from "@/lib/auth";
import { ensureSession } from "@/lib/bootstrap";
import { compareRoi } from "@/lib/roi";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await ensureSession("parent");
  if (!session) return Response.json({ comparisons: [] });

  const rows = await db
    .select({
      id: familyComparisons.id,
      label: familyComparisons.label,
      createdAt: familyComparisons.createdAt,
      careerName: careers.name,
      totalCost: familyComparisonItems.totalCost,
      durationMonths: familyComparisonItems.durationMonths,
      projected: familyComparisonItems.projectedFiveYearNetEarnings,
      safety: familyComparisonItems.employmentSafetyScore,
    })
    .from(familyComparisons)
    .leftJoin(
      familyComparisonItems,
      eq(familyComparisonItems.comparisonId, familyComparisons.id),
    )
    .leftJoin(careers, eq(careers.id, familyComparisonItems.careerId))
    .orderBy(desc(familyComparisons.createdAt))
    .limit(30);

  const grouped = new Map<
    number,
    { id: number; label: string | null; createdAt: Date; items: typeof rows }
  >();
  for (const row of rows) {
    const entry = grouped.get(row.id) ?? {
      id: row.id,
      label: row.label,
      createdAt: row.createdAt,
      items: [] as typeof rows,
    };
    if (row.careerName) entry.items.push(row);
    grouped.set(row.id, entry);
  }

  return Response.json({ comparisons: [...grouped.values()] });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    careerIds?: number[];
    districtCode?: string;
    label?: string;
  };

  if (!body.districtCode || !body.careerIds?.length) {
    return Response.json({ error: "districtCode and careerIds are required" }, { status: 400 });
  }

  const session = await ensureSession("parent");
  if (!session) return Response.json({ error: "No active session" }, { status: 401 });

  const projections = await compareRoi(body.careerIds.slice(0, 3), body.districtCode);

  const [comparison] = await db
    .insert(familyComparisons)
    .values({
      parentId: session.userId,
      label: body.label ?? `Family shortlist — ${projections[0]?.districtName ?? ""}`,
    })
    .returning({ id: familyComparisons.id });

  if (projections.length) {
    await db.insert(familyComparisonItems).values(
      projections.map((p) => ({
        comparisonId: comparison.id,
        careerId: p.careerId,
        totalCost: String(p.netTrainingCost),
        durationMonths: p.trainingMonths,
        projectedFiveYearNetEarnings: String(p.fiveYearNetGain),
        employmentSafetyScore: p.employmentSafetyScore,
      })),
    );
  }

  await logAudit(session.userId, "comparison.save", {
    comparisonId: comparison.id,
    careerIds: body.careerIds,
  });

  return Response.json({ comparisonId: comparison.id, projections });
}
