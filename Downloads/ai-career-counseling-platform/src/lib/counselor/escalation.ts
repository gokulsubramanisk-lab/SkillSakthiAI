import { db } from "@/db";
import { counselorCases, counselorNotes, notifications, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface CreateCaseParams {
  userId: string;
  conversationId?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  reason: string;
  conversationSummary: string;
  detectedConcern: string;
}

export async function createCounselorCase(params: CreateCaseParams) {
  const caseId = "case_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

  await db.insert(counselorCases).values({
    id: caseId,
    userId: params.userId,
    conversationId: params.conversationId,
    priority: params.priority || "MEDIUM",
    reason: params.reason,
    conversationSummary: params.conversationSummary,
    detectedConcern: params.detectedConcern,
    status: "NEW",
  });

  // Create notification for student
  await db.insert(notifications).values({
    id: "notif_" + Date.now() + "_std",
    userId: params.userId,
    title: "Counselor Escalation Initiated",
    message: "A certified human career counselor has been assigned to your case and will review your request.",
    type: "counselor",
    link: "/counselor",
  });

  // Find counselors and notify them
  const counselors = await db.select().from(users).where(eq(users.role, "counselor"));
  for (const c of counselors) {
    await db.insert(notifications).values({
      id: "notif_" + Date.now() + "_" + c.id,
      userId: c.id,
      title: `New ${params.priority || "MEDIUM"} Priority Case`,
      message: `Student needs guidance: ${params.reason}`,
      type: "counselor",
      link: `/counselor/cases/${caseId}`,
    });
  }

  return caseId;
}

export async function getCounselorCases() {
  return await db.select().from(counselorCases).orderBy(desc(counselorCases.createdAt));
}
