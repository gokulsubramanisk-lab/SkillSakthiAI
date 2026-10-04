import { NextResponse } from "next/server";
import { computeCareerMatches } from "@/lib/matching/career-matcher";
import { ensureDbInitialized } from "@/db/init";

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const body = await req.json();

    const matches = await computeCareerMatches({
      skills: body.skills || ["Basic Electronics", "Electrical Fundamentals"],
      education: body.education || "12th Completed",
      district: body.district || "Vellore",
      state: body.state || "Tamil Nadu",
      interests: body.interests || ["Electronics", "Electrical Repair"],
      budgetMax: body.budgetMax || 30000,
    });

    return NextResponse.json({ matches });
  } catch (err: any) {
    console.error("POST /api/careers/match error:", err);
    return NextResponse.json({ error: "Failed to compute career matches" }, { status: 500 });
  }
}
