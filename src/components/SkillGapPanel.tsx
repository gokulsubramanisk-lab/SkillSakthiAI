"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge, Card, EmptyState, ScoreBar, Spinner, TrustTag, money } from "@/components/ui";
import type { SkillGapPrescription } from "@/lib/types";

type Reference = {
  districts: { code: string; name: string; state: string }[];
  careers: { id: number; name: string; nsqfLevel: number | null }[];
  skills: { id: number; name: string }[];
  mySkills: string[];
  session: { districtCode: string | null } | null;
};

export default function SkillGapPanel() {
  const params = useSearchParams();
  const [reference, setReference] = useState<Reference | null>(null);
  const [districtCode, setDistrictCode] = useState("");
  const [careerId, setCareerId] = useState<number | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<SkillGapPrescription | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(
    async (career: number, district: string, skillNames: string[]) => {
      setLoading(true);
      try {
        const res = await fetch("/api/skill-gap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ careerId: career, districtCode: district, skillNames }),
        });
        const data = (await res.json()) as { prescription?: SkillGapPrescription };
        setResult(data.prescription ?? null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const careerParam = params.get("career");
    const districtParam = params.get("district");
    fetch("/api/reference")
      .then((r) => r.json())
      .then((data: Reference) => {
        setReference(data);
        const district = districtParam ?? data.session?.districtCode ?? data.districts[0]?.code ?? "";
        const career = careerParam ? Number(careerParam) : data.careers[0]?.id;
        setDistrictCode(district);
        setCareerId(career ?? null);
        setSelected(data.mySkills ?? []);
        if (career && district) void run(career, district, data.mySkills ?? []);
      })
      .catch(() => undefined);
  }, [params, run]);

  if (!reference) return <Spinner label="Loading NSQF skill catalogue…" />;

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <label className="text-sm font-semibold text-slate-700">
            Target career
            <select
              value={careerId ?? ""}
              onChange={(e) => setCareerId(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-indigo-500"
            >
              {reference.careers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (NSQF L{c.nsqfLevel ?? "-"})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            District (where training must happen)
            <select
              value={districtCode}
              onChange={(e) => setDistrictCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-indigo-500"
            >
              {reference.districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}, {d.state}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => careerId && void run(careerId, districtCode, selected)}
            disabled={loading || !careerId}
            className="self-end rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Diagnosing…" : "🎯 Prescribe modules"}
          </button>
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-700">Skills the student already has</p>
        <div className="mt-2 flex max-h-44 flex-wrap gap-2 overflow-y-auto scroll-thin rounded-2xl bg-slate-50 p-3">
          {reference.skills.map((s) => {
            const on = selected.includes(s.name);
            return (
              <button
                key={s.id}
                onClick={() =>
                  setSelected((prev) =>
                    prev.includes(s.name) ? prev.filter((x) => x !== s.name) : [...prev, s.name],
                  )
                }
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  on ? "bg-emerald-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
                }`}
              >
                {on ? "✓ " : ""}
                {s.name}
              </button>
            );
          })}
        </div>
      </Card>

      {!result ? (
        <EmptyState title="No diagnosis yet" hint="Pick a target career and district." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
          <Card className="rise">
            <h3 className="text-xl font-bold text-slate-900">{result.careerName}</h3>
            <p className="text-sm text-slate-500">
              NSQF journey: Level {result.nsqfCurrent} → Level {result.nsqfTarget}
            </p>
            <div className="mt-4">
              <ScoreBar
                label="Job readiness"
                value={result.readinessPercent / 100}
                tone={result.readinessPercent >= 70 ? "emerald" : "amber"}
                suffix={`${result.readinessPercent}%`}
              />
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase text-slate-400">Already competent</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {result.matchedSkills.length ? (
                  result.matchedSkills.map((s) => (
                    <Badge key={s} tone="emerald">
                      ✓ {s}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">None recorded yet.</span>
                )}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase text-slate-400">Gap to close</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {result.missingSkills.map((s) => (
                  <Badge key={s} tone="rose">
                    ! {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-dashed border-slate-200 pt-3">
              {result.citations.map((c) => (
                <TrustTag
                  key={c.documentId}
                  agency={c.agency}
                  sourceUrl={c.sourceUrl}
                  docId={c.documentId}
                />
              ))}
            </div>
          </Card>

          <Card className="rise">
            <h3 className="text-lg font-bold text-slate-900">
              Prescribed local training modules
            </h3>
            <p className="text-sm text-slate-500">
              Exact government modules in this district that close the gap for local employment.
            </p>
            <div className="mt-4 space-y-3">
              {result.modules.length === 0 ? (
                <EmptyState title="No local module mapped for this district yet" />
              ) : (
                result.modules.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-slate-200 bg-white/80 p-4 transition hover:border-indigo-300"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{m.title}</p>
                        <p className="text-xs text-slate-500">
                          {m.itiName} · code {m.code} · NSQF L{m.nsqfLevel ?? "-"}
                        </p>
                      </div>
                      <Badge tone="indigo">{m.durationMonths ?? "-"} months</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-bold text-slate-800">{money(m.tuitionCost)}</span>
                      <span className="text-xs text-slate-400">tuition (before scheme support)</span>
                    </div>
                    {m.coversSkills.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.coversSkills.map((s) => (
                          <Badge key={s} tone="amber">
                            covers {s}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    {m.sourceUrl ? (
                      <a
                        href={m.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-semibold text-indigo-600 underline"
                      >
                        Official curriculum ↗
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
