import { NextResponse } from "next/server";
import { analyzeSkillGap } from "@/lib/matching/skill-gap";
import { ensureDbInitialized } from "@/db/init";

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const { occupationId, userSkills = [] } = await req.json();

    if (!occupationId) {
      return NextResponse.json({ error: "occupationId is required" }, { status: 400 });
    }

    const gap = await analyzeSkillGap(occupationId, userSkills);
    if (!gap) {
      return NextResponse.json({ error: "Occupation not found" }, { status: 404 });
    }

    return NextResponse.json({ skillGap: gap });
  } catch (err: any) {
    console.error("POST /api/skill-gap/analyze error:", err);
    return NextResponse.json({ error: "Failed to analyze skill gap" }, { status: 500 });
  }
}
