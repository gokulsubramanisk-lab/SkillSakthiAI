import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { parentCalculatorSnapshots } from "@/db/schema";
import { logAudit } from "@/lib/auth";
import { ensureSession } from "@/lib/bootstrap";
import { compareRoi } from "@/lib/roi";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await ensureSession("parent");
  if (!session) return Response.json({ snapshots: [] });
  const snapshots = await db
    .select()
    .from(parentCalculatorSnapshots)
    .where(eq(parentCalculatorSnapshots.parentId, session.userId))
    .orderBy(desc(parentCalculatorSnapshots.createdAt))
    .limit(5);
  return Response.json({ snapshots });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    careerIds?: number[];
    districtCode?: string;
    save?: boolean;
  };

  if (!body.districtCode || !body.careerIds?.length) {
    return Response.json({ error: "districtCode and careerIds are required" }, { status: 400 });
  }

  const session = await ensureSession("parent");
  const projections = await compareRoi(body.careerIds, body.districtCode);

  if (session && body.save) {
    await db.insert(parentCalculatorSnapshots).values({
      parentId: session.userId,
      districtCode: body.districtCode,
      payload: projections,
    });
    await logAudit(session.userId, "roi.snapshot", {
      districtCode: body.districtCode,
      careerIds: body.careerIds,
    });
  }

  return Response.json({ projections });
}
