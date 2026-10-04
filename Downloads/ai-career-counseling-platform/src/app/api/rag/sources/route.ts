import { NextResponse } from "next/server";
import { db } from "@/db";
import { sources, documents } from "@/db/schema";
import { ensureDbInitialized } from "@/db/init";

export async function GET() {
  try {
    await ensureDbInitialized();
    const srcs = await db.select().from(sources);
    const docs = await db.select().from(documents);

    const result = srcs.map((s) => {
      const docCount = docs.filter((d) => d.sourceId === s.id).length;
      return {
        ...s,
        documentCount: docCount,
      };
    });

    return NextResponse.json({ sources: result });
  } catch (err: any) {
    console.error("GET /api/rag/sources error:", err);
    return NextResponse.json({ sources: [] });
  }
}
