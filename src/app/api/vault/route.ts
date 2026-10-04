// Government RAG Vault browser: inspect exactly what the AI is allowed to say.

import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { govDocuments } from "@/db/schema";
import { ensureSeeded } from "@/lib/bootstrap";
import { RETRIEVAL_FLOOR, retrieve } from "@/lib/rag";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSeeded();
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();

  const documents = await db
    .select({
      id: govDocuments.id,
      title: govDocuments.title,
      category: sql<string>`${govDocuments.category}::text`,
      sourceUrl: govDocuments.sourceUrl,
      sourceAgency: sql<string>`${govDocuments.sourceAgency}::text`,
      body: govDocuments.body,
      updatedAt: govDocuments.updatedAt,
    })
    .from(govDocuments)
    .orderBy(asc(govDocuments.id));

  if (!query) {
    return Response.json({ documents, results: [], floor: RETRIEVAL_FLOOR, query });
  }

  const retrieved = await retrieve(query, { topK: 5 });
  const results = retrieved.map((doc) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    sourceUrl: doc.sourceUrl,
    sourceAgency: doc.sourceAgency,
    similarity: doc.similarity,
    passesFloor: doc.similarity >= RETRIEVAL_FLOOR,
    snippet: doc.body.slice(0, 260),
  }));

  return Response.json({ documents, results, floor: RETRIEVAL_FLOOR, query });
}
