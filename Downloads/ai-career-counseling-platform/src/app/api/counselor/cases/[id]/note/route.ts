import { NextResponse } from "next/server";
import { db } from "@/db";
import { counselorCases, counselorNotes, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/jwt";
import { ensureDbInitialized } from "@/db/init";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const tokenUser = await getCurrentUser();
    const { id: caseId } = await params;
    const { noteText, status, counselorName = "Dr. Ananya Sharma" } = await req.json();

    const existingCase = await db.select().from(counselorCases).where(eq(counselorCases.id, caseId));
    if (existingCase.length === 0) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (noteText) {
      await db.insert(counselorNotes).values({
        id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        caseId,
        counselorId: tokenUser?.userId || "usr_counselor_01",
        counselorName,
        noteText,
      });
    }

    const updates: any = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (tokenUser?.userId) updates.assignedCounselorId = tokenUser.userId;

    await db.update(counselorCases).set(updates).where(eq(counselorCases.id, caseId));

    // Notify student
    await db.insert(notifications).values({
      id: "notif_" + Date.now(),
      userId: existingCase[0].userId,
      title: "Counselor Note Added",
      message: `Counselor ${counselorName} updated your guidance case.`,
      type: "counselor",
      link: "/counselor",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/counselor/cases/[id]/note error:", err);
    return NextResponse.json({ error: "Failed to update case" }, { status: 500 });
  }
}
