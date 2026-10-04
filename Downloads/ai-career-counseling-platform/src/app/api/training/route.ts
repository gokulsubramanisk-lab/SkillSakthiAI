import { NextResponse } from "next/server";
import { db } from "@/db";
import { trainingPrograms, sources } from "@/db/schema";
import { ensureDbInitialized } from "@/db/init";

export async function GET() {
  try {
    await ensureDbInitialized();
    const programs = await db.select().from(trainingPrograms);
    const srcs = await db.select().from(sources);

    const result = programs.map((p) => {
      const src = srcs.find((s) => s.id === p.sourceId);
      return {
        ...p,
        source: src ? { organization: src.organization, title: src.title, url: src.url } : null,
      };
    });

    return NextResponse.json({ trainingPrograms: result });
  } catch (err: any) {
    console.error("GET /api/training error:", err);
    return NextResponse.json({ trainingPrograms: [] });
  }
}
