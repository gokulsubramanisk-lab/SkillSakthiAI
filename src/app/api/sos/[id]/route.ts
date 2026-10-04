import { logAudit, requireRole } from "@/lib/auth";
import { ensureSeeded } from "@/lib/bootstrap";
import { updateCase } from "@/lib/escalation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await ensureSeeded();
  const session = await requireRole(["counselor", "admin"]);
  if (!session) {
    return Response.json({ error: "Counsellor or admin role required" }, { status: 403 });
  }

  const { id } = await context.params;
  const caseId = Number(id);
  if (!Number.isFinite(caseId)) {
    return Response.json({ error: "Invalid case id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: "assign" | "resolve" };
  const action = body.action === "resolve" ? "resolve" : "assign";

  const updated = await updateCase(caseId, action, session.userId);
  if (!updated) return Response.json({ error: "Case not found" }, { status: 404 });

  await logAudit(session.userId, `sos.${action}`, { caseId });
  return Response.json({ case: updated });
}
