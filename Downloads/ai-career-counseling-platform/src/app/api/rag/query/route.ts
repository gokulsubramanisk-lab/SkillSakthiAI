import { NextResponse } from "next/server";
import { performVerifiedRetrieval } from "@/lib/rag/engine";
import { ensureDbInitialized } from "@/db/init";

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const { query, district = "Vellore" } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const results = await performVerifiedRetrieval(query, { district });

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("POST /api/rag/query error:", err);
    return NextResponse.json({ error: "RAG query failed" }, { status: 500 });
  }
}
