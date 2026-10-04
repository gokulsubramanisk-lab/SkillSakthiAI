// Voice-first counselling turn:
// transcript -> distress detection -> zero-hallucination RAG -> citations
// -> optional SOS escalation -> full audit trail.

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiResponses, conversations, messages } from "@/db/schema";
import { logAudit } from "@/lib/auth";
import { ensureSession } from "@/lib/bootstrap";
import { openSosCase } from "@/lib/escalation";
import { answerWithCitations } from "@/lib/rag";
import { analyseDistress, severityFromLevel } from "@/lib/sentiment";
import type { CounselReply } from "@/lib/types";

export const dynamic = "force-dynamic";

type ConversationType = "career_match" | "roi" | "skill_gap" | "general_info";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    text?: string;
    language?: string;
    modality?: "voice" | "text";
    type?: ConversationType;
  };

  const text = (body.text ?? "").trim();
  if (!text) return Response.json({ error: "text is required" }, { status: 400 });

  const session = await ensureSession("student");
  if (!session) return Response.json({ error: "No active session" }, { status: 401 });

  const language = body.language ?? session.language ?? "hi-IN";
  const type: ConversationType = body.type ?? "general_info";
  const modality = body.modality ?? "voice";

  // Re-use the running conversation thread for this session + intent.
  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.sessionId, session.sessionId), eq(conversations.type, type)))
    .orderBy(desc(conversations.createdAt))
    .limit(1);

  const conversationId =
    existing?.id ??
    (
      await db
        .insert(conversations)
        .values({ sessionId: session.sessionId, type })
        .returning({ id: conversations.id })
    )[0].id;

  const distress = analyseDistress(text);

  const [userMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      senderRole: "user",
      modality,
      content: text,
      transcript: modality === "voice" ? text : null,
      language,
      sentimentScore: String(distress.score),
      distressLevel: distress.level,
      sosFlag: distress.level >= 2,
    })
    .returning({ id: messages.id });

  const answer = await answerWithCitations(text, { language });

  const [assistantMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      senderRole: "assistant",
      modality,
      content: answer.answer,
      language,
      sentimentScore: "0",
      distressLevel: 0,
      sosFlag: answer.escalate,
    })
    .returning({ id: messages.id });

  await db.insert(aiResponses).values({
    conversationId,
    messageId: assistantMessage.id,
    provider: answer.provider,
    model: answer.model,
    groundedInDocuments: answer.grounded,
    retrievedDocumentIds: answer.retrievedIds,
    latencyMs: answer.latencyMs,
  });

  let sosCaseId: number | null = null;
  if (distress.level >= 2 || answer.escalate) {
    sosCaseId = await openSosCase({
      sessionId: session.sessionId,
      messageId: userMessage.id,
      severity: answer.escalate && distress.level < 2 ? "low" : severityFromLevel(distress.level),
      userId: session.userId,
      districtCode: session.districtCode,
    });
  }

  await logAudit(session.userId, "counsel.turn", {
    conversationId,
    grounded: answer.grounded,
    mode: answer.mode,
    distressLevel: distress.level,
    sosCaseId,
    citations: answer.citations.map((c) => c.documentId),
  });

  const reply: CounselReply = {
    conversationId,
    messageId: assistantMessage.id,
    transcript: text,
    language,
    distress,
    answer,
    sosCaseId,
    speak:
      answer.answer.replace(/\[#\d+\]/g, "").trim() +
      (sosCaseId ? " A human counsellor has also been alerted to help your family." : ""),
  };

  return Response.json(reply);
}
