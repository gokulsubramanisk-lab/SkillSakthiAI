// RAG audit report: grounding rate, hallucination rate, citation coverage,
// refusals and escalations. Backs the compliance view required for
// regulatory trust in government deployments.

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { aiResponses, auditLogs, govDocuments, sosCases } from "@/db/schema";
import { ensureSeeded } from "@/lib/bootstrap";
import type { AuditMetrics } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();

  const [responses] = await db
    .select({
      total: sql<string>`count(*)::text`,
      grounded: sql<string>`count(*) filter (where ${aiResponses.groundedInDocuments})::text`,
      withCitations: sql<string>`count(*) filter (where jsonb_array_length(coalesce(${aiResponses.retrievedDocumentIds}, '[]'::jsonb)) > 0 and ${aiResponses.model} <> 'guardrail')::text`,
      // A guardrail refusal is NOT a hallucination — it is the system correctly
      // declining to answer and handing the family to a human counsellor.
      refusals: sql<string>`count(*) filter (where ${aiResponses.model} = 'guardrail')::text`,
      avgLatency: sql<string>`coalesce(round(avg(${aiResponses.latencyMs}))::text, '0')`,
    })
    .from(aiResponses);

  const [cases] = await db
    .select({
      total: sql<string>`count(*)::text`,
      open: sql<string>`count(*) filter (where ${sosCases.status}::text <> 'resolved')::text`,
    })
    .from(sosCases);

  const [docs] = await db
    .select({ total: sql<string>`count(*)::text` })
    .from(govDocuments);

  const byAgency = await db
    .select({
      agency: sql<string>`${govDocuments.sourceAgency}::text`,
      documents: sql<string>`count(*)::text`,
    })
    .from(govDocuments)
    .groupBy(sql`${govDocuments.sourceAgency}::text`);

  const recentLogs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(sql`${auditLogs.createdAt} desc`)
    .limit(12);

  const total = Number(responses?.total ?? "0");
  const grounded = Number(responses?.grounded ?? "0");
  const withCitations = Number(responses?.withCitations ?? "0");
  const refusals = Number(responses?.refusals ?? "0");
  // Served answers = everything except guardrail refusals.
  const served = Math.max(0, total - refusals);
  const hallucinated = Math.max(0, served - grounded);

  const metrics: AuditMetrics = {
    totalResponses: total,
    groundedResponses: grounded,
    groundingRate: served ? Number((grounded / served).toFixed(4)) : 1,
    hallucinationRate: served ? Number((hallucinated / served).toFixed(4)) : 0,
    citationCoverage: served ? Number((withCitations / served).toFixed(4)) : 1,
    refusals,
    escalations: Number(cases?.total ?? "0"),
    openCases: Number(cases?.open ?? "0"),
    avgLatencyMs: Number(responses?.avgLatency ?? "0"),
    documentsIndexed: Number(docs?.total ?? "0"),
    byAgency: byAgency.map((row) => ({
      agency: row.agency,
      documents: Number(row.documents),
    })),
  };

  return Response.json({ metrics, recentLogs });
}
