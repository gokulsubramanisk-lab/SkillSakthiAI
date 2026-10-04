import { ensureSession } from "@/lib/bootstrap";
import { studentSkillNames } from "@/lib/escalation";
import { prescribeSkillGap } from "@/lib/skill-gap";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    careerId?: number;
    districtCode?: string;
    skillNames?: string[];
  };

  if (!body.careerId || !body.districtCode) {
    return Response.json({ error: "careerId and districtCode are required" }, { status: 400 });
  }

  const session = await ensureSession("student");
  const skillNames =
    body.skillNames ?? (session ? await studentSkillNames(session.userId) : []);

  const prescription = await prescribeSkillGap(body.careerId, body.districtCode, skillNames);
  if (!prescription) return Response.json({ error: "Career not found" }, { status: 404 });

  return Response.json({ prescription, skillNames });
}
