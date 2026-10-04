import { seedDatabase } from "@/db/seed";
import { logAudit } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const summary = await seedDatabase();
  await logAudit(null, "admin.reseed", summary);
  return Response.json({ ok: true, summary });
}
