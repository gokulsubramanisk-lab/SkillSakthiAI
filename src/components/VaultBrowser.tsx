"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Card, ScoreBar, Spinner, Stat, TrustTag } from "@/components/ui";
import type { AuditMetrics } from "@/lib/types";

type Doc = {
  id: number;
  title: string;
  category: string;
  sourceUrl: string;
  sourceAgency: string;
  body: string;
};

type Result = Doc & { similarity: number; passesFloor: boolean; snippet: string };

export default function VaultBrowser() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [floor, setFloor] = useState(0.18);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vault${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const data = (await res.json()) as {
        documents: Doc[];
        results: Result[];
        floor: number;
      };
      setDocuments(data.documents ?? []);
      setResults(data.results ?? []);
      setFloor(data.floor ?? 0.18);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
    fetch("/api/audit")
      .then((r) => r.json())
      .then((d: { metrics: AuditMetrics }) => setMetrics(d.metrics))
      .catch(() => undefined);
  }, [load]);

  const blocked = results.length > 0 && results.every((r) => !r.passesFloor);

  return (
    <div className="space-y-5">
      {metrics ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat
            label="Grounding rate"
            value={`${(metrics.groundingRate * 100).toFixed(1)}%`}
            hint="Answers tied to vault docs"
            tone="emerald"
          />
          <Stat
            label="Hallucination rate"
            value={`${(metrics.hallucinationRate * 100).toFixed(1)}%`}
            hint="Ungrounded answers served"
            tone={metrics.hallucinationRate > 0 ? "rose" : "emerald"}
          />
          <Stat
            label="Citation coverage"
            value={`${(metrics.citationCoverage * 100).toFixed(1)}%`}
            hint="Responses carrying sources"
          />
          <Stat
            label="Refusals → human"
            value={metrics.refusals}
            hint="Guardrail escalations"
            tone="amber"
          />
          <Stat
            label="Documents indexed"
            value={metrics.documentsIndexed}
            hint={metrics.byAgency.map((a) => `${a.agency}:${a.documents}`).join(" · ")}
          />
        </div>
      ) : null}

      <Card>
        <h2 className="text-xl font-bold text-slate-900">Retrieval simulator</h2>
        <p className="text-sm text-slate-500">
          Type any question to see exactly which verified records the AI is allowed to use, and
          whether they clear the retrieval floor of {(floor * 100).toFixed(0)}%.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load(query)}
            placeholder="e.g. apprenticeship stipend, ITI fees, NSQF level 4"
            className="min-w-[240px] flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => void load(query)}
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
          >
            🔍 Retrieve
          </button>
          <button
            onClick={() => void load("how many planets orbit a black hole in Bihar")}
            className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100"
          >
            🧪 Test an out-of-scope question
          </button>
        </div>

        {loading ? <div className="mt-4"><Spinner /></div> : null}

        {results.length > 0 ? (
          <div className="mt-4 space-y-2">
            {blocked ? (
              <p className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
                ⛔ Every candidate scored below the retrieval floor — the generator would REFUSE and
                route this family to a human counsellor instead of inventing an answer.
              </p>
            ) : null}
            {results.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    #{r.id} · {r.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge tone={r.passesFloor ? "emerald" : "rose"}>
                      {r.passesFloor ? "usable" : "below floor"}
                    </Badge>
                    <TrustTag agency={r.sourceAgency} sourceUrl={r.sourceUrl} />
                  </div>
                </div>
                <div className="mt-2">
                  <ScoreBar
                    label="Hybrid similarity (vector + lexical)"
                    value={Math.min(1, r.similarity * 2)}
                    tone={r.passesFloor ? "emerald" : "rose"}
                    suffix={r.similarity.toFixed(3)}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-600">{r.snippet}…</p>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-slate-900">
          Vault contents ({documents.length} verified records)
        </h2>
        <p className="text-sm text-slate-500">
          This is the complete universe of facts the generator may use. Nothing else can be said.
        </p>
        <div className="mt-4 space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <button
                onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
                className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
              >
                <span>
                  <span className="font-semibold text-slate-900">
                    #{doc.id} · {doc.title}
                  </span>
                  <span className="ml-2 text-xs uppercase tracking-wide text-slate-400">
                    {doc.category}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <TrustTag agency={doc.sourceAgency} sourceUrl={doc.sourceUrl} />
                  <span className="text-xs text-slate-400">
                    {expanded === doc.id ? "▲" : "▼"}
                  </span>
                </span>
              </button>
              {expanded === doc.id ? (
                <p className="mt-3 border-t border-dashed border-slate-200 pt-3 text-sm leading-relaxed text-slate-700">
                  {doc.body}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
