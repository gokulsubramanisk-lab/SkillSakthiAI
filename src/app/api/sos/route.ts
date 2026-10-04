import { ensureSession } from "@/lib/bootstrap";
import { getSession, logAudit } from "@/lib/auth";
import { listCases, modulesByIds, openSosCase } from "@/lib/escalation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSession("counselor");
  const session = await getSession();
  if (!session || !["counselor", "admin"].includes(session.role)) {
    return Response.json(
      { error: "Counsellor or admin role required", cases: [] },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam === "open" || statusParam === "assigned" || statusParam === "resolved"
      ? statusParam
      : undefined;

  const cases = await listCases(status);
  const moduleIds = [
    ...new Set(
      cases.flatMap((c) => (Array.isArray(c.recommendedModules) ? (c.recommendedModules as number[]) : [])),
    ),
  ];
  const modules = await modulesByIds(moduleIds);

  return Response.json({ cases, modules, viewer: session });
}

/** Manual "Talk to a human" SOS raised from any family screen. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    messageId?: number;
    severity?: "low" | "medium" | "high";
  };
  const session = await ensureSession("student");
  if (!session || !body.messageId) {
    return Response.json({ error: "messageId is required" }, { status: 400 });
  }
  const caseId = await openSosCase({
    sessionId: session.sessionId,
    messageId: body.messageId,
    severity: body.severity ?? "medium",
    userId: session.userId,
    districtCode: session.districtCode,
  });
  await logAudit(session.userId, "sos.manual", { caseId });
  return Response.json({ caseId });
}
