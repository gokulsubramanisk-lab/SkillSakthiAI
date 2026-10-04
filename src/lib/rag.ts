// Hallucination-Free Government RAG Vault.
//
// Hard rules enforced here:
//  1. Retrieval is restricted to rows in `gov_documents`, every one of which
//     carries an MSDE / NSDC / NCVET / ITI source URL.
//  2. If the best retrieved similarity is under RETRIEVAL_FLOOR, the system
//     REFUSES to answer and escalates to a human counsellor.
//  3. If an LLM is configured, its draft is verified sentence-by-sentence
//     against the retrieved context; unsupported sentences are dropped and, if
//     too much is unsupported, we fall back to the extractive answer.
//  4. Every answer carries citations (document id, agency, source URL).

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { govDocuments } from "@/db/schema";
import { cosineSimilarity, embed, lexicalOverlap } from "./embeddings";
import type { Citation, GroundedAnswer } from "./types";

export const RETRIEVAL_FLOOR = 0.18;
const VERIFICATION_FLOOR = 0.62;

type DocRow = {
  id: number;
  title: string;
  body: string;
  category: string;
  sourceUrl: string;
  sourceAgency: Citation["agency"];
  embedding: unknown;
};

export type RetrievedDoc = DocRow & { similarity: number };

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?।])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
}

export async function retrieve(
  query: string,
  options: { topK?: number; category?: string } = {},
): Promise<RetrievedDoc[]> {
  const topK = options.topK ?? 4;
  const queryVector = await embed(query);

  const rows = (await db
    .select({
      id: govDocuments.id,
      title: govDocuments.title,
      body: govDocuments.body,
      category: sql<string>`${govDocuments.category}::text`,
      sourceUrl: govDocuments.sourceUrl,
      sourceAgency: sql<Citation["agency"]>`${govDocuments.sourceAgency}::text`,
      embedding: govDocuments.embedding,
    })
    .from(govDocuments)) as DocRow[];

  const scored = rows.map((row) => {
    const vector = Array.isArray(row.embedding) ? (row.embedding as number[]) : [];
    const vectorScore = vector.length ? cosineSimilarity(queryVector, vector) : 0;
    const lexical = lexicalOverlap(query, `${row.title} ${row.body}`);
    // Hybrid score: semantic vectors + lexical anchor (robust for short voice queries).
    return { ...row, similarity: Number((vectorScore * 0.65 + lexical * 0.35).toFixed(4)) };
  });

  const filtered = options.category
    ? scored.filter((r) => r.category === options.category)
    : scored;

  return filtered.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

function buildCitations(docs: RetrievedDoc[], query: string): Citation[] {
  return docs.map((doc) => {
    const sentences = splitSentences(doc.body);
    let best = sentences[0] ?? doc.body.slice(0, 220);
    let bestScore = -1;
    for (const sentence of sentences) {
      const score = lexicalOverlap(query, sentence);
      if (score > bestScore) {
        bestScore = score;
        best = sentence;
      }
    }
    return {
      documentId: doc.id,
      title: doc.title,
      agency: doc.sourceAgency,
      sourceUrl: doc.sourceUrl,
      snippet: best.length > 320 ? `${best.slice(0, 317)}…` : best,
      similarity: doc.similarity,
    };
  });
}

function extractiveAnswer(docs: RetrievedDoc[], query: string): string {
  const picks: string[] = [];
  for (const doc of docs.slice(0, 3)) {
    const sentences = splitSentences(doc.body);
    const ranked = sentences
      .map((sentence) => ({ sentence, score: lexicalOverlap(query, sentence) }))
      .sort((a, b) => b.score - a.score);
    const top = ranked.slice(0, 2).filter((r) => r.score > 0 || picks.length === 0);
    for (const row of top) picks.push(`${row.sentence} [#${doc.id}]`);
  }
  return picks.slice(0, 4).join(" ");
}

/** Fraction of the draft's sentences that are lexically supported by context. */
function verifyAgainstContext(draft: string, context: string): { kept: string; coverage: number } {
  const sentences = draft
    .split(/(?<=[.!?।])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return { kept: "", coverage: 0 };
  const supported = sentences.filter((sentence) => lexicalOverlap(sentence, context) >= 0.5);
  return {
    kept: supported.join(" "),
    coverage: supported.length / sentences.length,
  };
}

async function llmDraft(query: string, context: string, language: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.CHAT_MODEL ?? "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You are a government vocational-education counsellor for rural Indian families. " +
              "Answer ONLY using the CONTEXT. Never add facts, numbers, schemes or URLs that are " +
              "absent from CONTEXT. Cite document ids inline as [#id]. If the CONTEXT does not " +
              "answer the question, reply exactly: INSUFFICIENT_CONTEXT. " +
              `Reply in the language with BCP-47 code ${language}. Keep it under 90 words, simple spoken style.`,
          },
          { role: "user", content: `CONTEXT:\n${context}\n\nQUESTION: ${query}` },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function answerWithCitations(
  query: string,
  options: { language?: string; category?: string; topK?: number } = {},
): Promise<GroundedAnswer & { retrievedIds: number[] }> {
  const started = Date.now();
  const language = options.language ?? "hi-IN";
  const docs = await retrieve(query, { topK: options.topK ?? 4, category: options.category });
  const best = docs[0]?.similarity ?? 0;

  if (docs.length === 0 || best < RETRIEVAL_FLOOR) {
    return {
      answer:
        "This question is not covered by the verified MSDE/NSDC records in our vault, so no AI answer will be generated. " +
        "Your query has been routed to a human counsellor who will verify it from official sources and respond.",
      citations: [],
      grounded: false,
      confidence: Number(best.toFixed(3)),
      escalate: true,
      escalationReason: "no_verified_source",
      mode: "refusal",
      model: "guardrail",
      provider: "zero-hallucination-guard",
      latencyMs: Date.now() - started,
      retrievedIds: docs.map((d) => d.id),
    };
  }

  const context = docs
    .map((d) => `[#${d.id}] ${d.title} (${d.sourceAgency} — ${d.sourceUrl})\n${d.body}`)
    .join("\n\n");
  const citations = buildCitations(docs, query);
  const fallback = extractiveAnswer(docs, query);

  const draft = await llmDraft(query, context, language);
  if (draft && !draft.includes("INSUFFICIENT_CONTEXT")) {
    const { kept, coverage } = verifyAgainstContext(draft, context);
    if (coverage >= VERIFICATION_FLOOR && kept.length > 40) {
      return {
        answer: kept,
        citations,
        grounded: true,
        confidence: Number(Math.min(1, best + coverage * 0.2).toFixed(3)),
        escalate: false,
        mode: "llm-verified",
        model: process.env.CHAT_MODEL ?? "gpt-4o-mini",
        provider: "openai-compatible",
        latencyMs: Date.now() - started,
        retrievedIds: docs.map((d) => d.id),
      };
    }
  }

  return {
    answer: fallback || docs[0].body.slice(0, 400),
    citations,
    grounded: true,
    confidence: Number(best.toFixed(3)),
    escalate: false,
    mode: "extractive",
    model: "extractive-grounding-v1",
    provider: "local-rag",
    latencyMs: Date.now() - started,
    retrievedIds: docs.map((d) => d.id),
  };
}

export async function citationsForDocumentIds(ids: number[]): Promise<Citation[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({
      id: govDocuments.id,
      title: govDocuments.title,
      body: govDocuments.body,
      sourceUrl: govDocuments.sourceUrl,
      sourceAgency: sql<Citation["agency"]>`${govDocuments.sourceAgency}::text`,
    })
    .from(govDocuments)
    .where(inArray(govDocuments.id, ids));
  return rows.map((row) => ({
    documentId: row.id,
    title: row.title,
    agency: row.sourceAgency,
    sourceUrl: row.sourceUrl,
    snippet: row.body.slice(0, 220),
    similarity: 1,
  }));
}

export async function documentByTitle(title: string, category: string) {
  const rows = await db
    .select()
    .from(govDocuments)
    .where(
      and(
        eq(govDocuments.title, title),
        sql`${govDocuments.category}::text = ${category}`,
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
