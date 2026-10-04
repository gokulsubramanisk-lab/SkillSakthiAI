import { logAudit } from "@/lib/auth";
import { ensureSession } from "@/lib/bootstrap";
import { matchCareers } from "@/lib/matching";
import { answerWithCitations } from "@/lib/rag";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    districtCode?: string;
    skillNames?: string[];
    interests?: string;
    educationLevel?: string;
  };

  if (!body.districtCode) {
    return Response.json({ error: "districtCode is required" }, { status: 400 });
  }

  const session = await ensureSession("student");
  const matches = await matchCareers({
    districtCode: body.districtCode,
    skillNames: body.skillNames ?? [],
    interests: body.interests,
    educationLevel: body.educationLevel,
    limit: 6,
  });

  // Attach a verified government explanation for the top recommendation.
  const explanation = matches[0]
    ? await answerWithCitations(
        `${matches[0].name} training admission eligibility and employment outcome`,
        { language: session?.language ?? "en-IN", topK: 3 },
      )
    : null;

  if (session) {
    await logAudit(session.userId, "match.run", {
      districtCode: body.districtCode,
      skills: body.skillNames?.length ?? 0,
      top: matches[0]?.name ?? null,
    });
  }

  return Response.json({ matches, explanation });
}
