import { NextResponse } from "next/server";
import { db } from "@/db";
import { occupations, sources } from "@/db/schema";
import { ensureDbInitialized } from "@/db/init";

export async function GET() {
  try {
    await ensureDbInitialized();
    const occs = await db.select().from(occupations);
    const srcs = await db.select().from(sources);

    const fullData = occs.map((o) => {
      const src = srcs.find((s) => s.id === o.sourceId);
      return {
        ...o,
        source: src ? { title: src.title, organization: src.organization, url: src.url } : null,
      };
    });

    return NextResponse.json({ occupations: fullData });
  } catch (err: any) {
    console.error("GET /api/careers error:", err);
    return NextResponse.json({ occupations: [] });
  }
}
