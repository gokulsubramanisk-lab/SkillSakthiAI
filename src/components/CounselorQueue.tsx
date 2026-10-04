"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui";

type CaseRow = {
  id: number;
  severity: "low" | "medium" | "high";
  status: "open" | "assigned" | "resolved";
  createdAt: string;
  studentName: string;
  districtCode: string | null;
  language: string;
  triggerText: string;
  distressLevel: number | null;
  sentimentScore: string | null;
  counselorName: string | null;
  recommendedModules: number[] | null;
  slaMinutes: number;
};

type ModuleRow = {
  id: number;
  code: string;
  title: string;
  itiName: string | null;
  districtCode: string;
  sourceUrl: string | null;
};

const SEVERITY_STYLE: Record<string, { tone: "rose" | "amber" | "slate"; label: string }> = {
  high: { tone: "rose", label: "🚨 CRISIS · 15 min SLA" },
  medium: { tone: "amber", label: "⚠️ DISTRESS · 2 hr SLA" },
  low: { tone: "slate", label: "🔎 REVIEW · 24 hr SLA" },
};

export default function CounselorQueue() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "assigned" | "resolved">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/sos" : `/api/sos?status=${filter}`;
      const res = await fetch(url);
      const data = (await res.json()) as {
        cases?: CaseRow[];
        modules?: ModuleRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Access denied");
        setCases([]);
      } else {
        setError(null);
        setCases(data.cases ?? []);
        setModules(data.modules ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: number, action: "assign" | "resolve") {
    await fetch(`/api/sos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    void load();
  }

  if (loading && cases.length === 0) return <Spinner label="Loading escalation queue…" />;

  if (error) {
    return (
      <Card>
        <h3 className="text-lg font-bold text-slate-900">Restricted workspace</h3>
        <p className="mt-2 text-sm text-slate-600">
          {error}. Switch to the <strong>Dr. Meena Rao (Counsellor)</strong> profile from the header
          selector to open the escalation desk.
        </p>
      </Card>
    );
  }

  const openCount = cases.filter((c) => c.status !== "resolved").length;
  const crisis = cases.filter((c) => c.severity === "high" && c.status !== "resolved").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="!p-4">
          <p className="text-xs font-bold uppercase text-slate-400">Active cases</p>
          <p className="text-3xl font-extrabold text-slate-900">{openCount}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-bold uppercase text-slate-400">Crisis priority</p>
          <p className="text-3xl font-extrabold text-rose-600">{crisis}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-bold uppercase text-slate-400">Total tracked</p>
          <p className="text-3xl font-extrabold text-slate-900">{cases.length}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "open", "assigned", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
              filter === f
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-indigo-300"
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={() => void load()}
          className="ml-auto rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          ⟳ Refresh
        </button>
      </div>

      {cases.length === 0 ? (
        <EmptyState
          title="No escalations in this view"
          hint="Trigger one from the Voice Counsellor by expressing distress (try the 😟 quick prompt)."
        />
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const style = SEVERITY_STYLE[c.severity] ?? SEVERITY_STYLE.low;
            const recommended = (c.recommendedModules ?? [])
              .map((id) => modules.find((m) => m.id === id))
              .filter((m): m is ModuleRow => Boolean(m));
            return (
              <Card
                key={c.id}
                className={`rise ${
                  c.severity === "high" && c.status !== "resolved"
                    ? "!border-rose-300 !bg-rose-50/60"
                    : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={style.tone}>{style.label}</Badge>
                      <Badge tone={c.status === "resolved" ? "emerald" : "slate"}>
                        {c.status}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        case #{c.id} · {new Date(c.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">{c.studentName}</h3>
                    <p className="text-xs text-slate-500">
                      District {c.districtCode ?? "—"} · language {c.language} · distress level{" "}
                      {c.distressLevel ?? 0}/3 · sentiment {c.sentimentScore ?? "0"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {c.status !== "resolved" ? (
                      <>
                        <button
                          onClick={() => void act(c.id, "assign")}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                        >
                          Assign to me
                        </button>
                        <button
                          onClick={() => void act(c.id, "resolve")}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          Mark resolved
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                <blockquote className="mt-3 rounded-2xl border-l-4 border-rose-400 bg-white/80 p-3 text-sm italic text-slate-700">
                  “{c.triggerText}”
                </blockquote>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Assigned counsellor</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {c.counselorName ?? "Unassigned — pick up from queue"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Skill-gap prescription to discuss
                    </p>
                    {recommended.length === 0 ? (
                      <p className="text-sm text-slate-500">No module mapped yet.</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {recommended.map((m) => (
                          <li key={m.id} className="text-sm text-slate-700">
                            • {m.title}{" "}
                            <span className="text-xs text-slate-400">
                              ({m.itiName}, {m.districtCode})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
