import { NextResponse } from "next/server";
import { createCounselorCase } from "@/lib/counselor/escalation";
import { getCurrentUser } from "@/lib/auth/jwt";
import { ensureDbInitialized } from "@/db/init";

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const tokenUser = await getCurrentUser();
    const userId = tokenUser?.userId || "usr_student_01";
    const body = await req.json();

    const caseId = await createCounselorCase({
      userId,
      conversationId: body.conversationId,
      priority: body.priority || "HIGH",
      reason: body.reason || "Student requested direct counselor support",
      conversationSummary: body.conversationSummary || "Direct student request",
      detectedConcern: body.detectedConcern || "Manual Escalation Request",
    });

    return NextResponse.json({ success: true, caseId });
  } catch (err: any) {
    console.error("POST /api/counselor/escalate error:", err);
    return NextResponse.json({ error: "Escalation failed" }, { status: 500 });
  }
}
