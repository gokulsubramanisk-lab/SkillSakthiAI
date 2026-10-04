"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, ScoreBar, Spinner, TrustTag, money } from "@/components/ui";
import type { CareerMatch, GroundedAnswer } from "@/lib/types";

type Reference = {
  districts: { code: string; name: string; state: string; regionType: string }[];
  skills: { id: number; name: string; nsqfLevel: number | null }[];
  mySkills: string[];
  session: { districtCode: string | null; name: string } | null;
};

export default function MatchExplorer() {
  const [reference, setReference] = useState<Reference | null>(null);
  const [districtCode, setDistrictCode] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [interests, setInterests] = useState("");
  const [matches, setMatches] = useState<CareerMatch[]>([]);
  const [explanation, setExplanation] = useState<GroundedAnswer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/reference")
      .then((r) => r.json())
      .then((data: Reference) => {
        setReference(data);
        setDistrictCode(data.session?.districtCode ?? data.districts[0]?.code ?? "");
        setSelected(data.mySkills ?? []);
      })
      .catch(() => undefined);
  }, []);

  function toggle(skill: string) {
    setSelected((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }

  async function run() {
    if (!districtCode) return;
    setLoading(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ districtCode, skillNames: selected, interests }),
      });
      const data = (await res.json()) as { matches: CareerMatch[]; explanation: GroundedAnswer | null };
      setMatches(data.matches ?? []);
      setExplanation(data.explanation ?? null);
    } finally {
      setLoading(false);
    }
  }

  if (!reference) return <Spinner label="Loading district reference data…" />;

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              District
              <select
                value={districtCode}
                onChange={(e) => setDistrictCode(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-indigo-500"
              >
                {reference.districts.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}, {d.state} ({d.regionType})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Interests / what the student enjoys
              <input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="machines, electricity, hospital work…"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </label>
            <button
              onClick={run}
              disabled={loading}
              className="w-full rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Matching…" : "📍 Match to local hiring pipelines"}
            </button>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700">
              Current skills ({selected.length} selected)
            </p>
            <p className="text-xs text-slate-500">
              Tap every skill the student already has — even informal, family-trade skills.
            </p>
            <div className="mt-2 flex max-h-56 flex-wrap gap-2 overflow-y-auto scroll-thin rounded-2xl bg-slate-50 p-3">
              {reference.skills.map((skill) => {
                const on = selected.includes(skill.name);
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggle(skill.name)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      on
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-indigo-300"
                    }`}
                  >
                    {skill.name}
                    <span className={`ml-1 ${on ? "text-indigo-100" : "text-slate-400"}`}>
                      L{skill.nsqfLevel ?? "-"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {matches.length === 0 ? (
        <EmptyState
          title="No match run yet"
          hint="Choose a district and the student's existing skills, then run the matcher."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {matches.map((m, index) => (
            <Card key={m.careerId} className="rise">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{m.name}</h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{m.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-indigo-600">
                    {(m.finalScore * 100).toFixed(0)}
                  </p>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">match score</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <ScoreBar label="Semantic fit" value={m.semanticScore} tone="indigo" />
                <ScoreBar label="Local demand" value={m.demandScore} tone="emerald" />
                <ScoreBar label="Job safety" value={m.safetyScore} tone="amber" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[11px] uppercase text-slate-400">Openings</p>
                  <p className="font-bold text-slate-800">{m.jobOpenings}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[11px] uppercase text-slate-400">Placement</p>
                  <p className="font-bold text-slate-800">{(m.placementRate * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[11px] uppercase text-slate-400">Local salary</p>
                  <p className="font-bold text-slate-800">{money(m.avgSalary)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[11px] uppercase text-slate-400">NSQF</p>
                  <p className="font-bold text-slate-800">L{m.nsqfLevel ?? "-"}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.matchedSkills.map((s) => (
                  <Badge key={s} tone="emerald">
                    ✓ {s}
                  </Badge>
                ))}
                {m.missingSkills.slice(0, 3).map((s) => (
                  <Badge key={s} tone="amber">
                    + {s}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-slate-200 pt-3">
                {m.sourceUrl && m.sourceAgency ? (
                  <TrustTag agency={m.sourceAgency} sourceUrl={m.sourceUrl} />
                ) : null}
                <Link
                  href={`/skill-gap?career=${m.careerId}&district=${m.districtCode}`}
                  className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  🎯 Skill-gap plan
                </Link>
                <Link
                  href={`/parent?career=${m.careerId}&district=${m.districtCode}`}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-400"
                >
                  📊 Show parents the ROI
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {explanation ? (
        <Card>
          <h3 className="text-lg font-bold text-slate-900">
            Why this is credible — verified government explanation
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {explanation.answer.replace(/\[#(\d+)\]/g, " (source #$1)")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {explanation.citations.map((c) => (
              <TrustTag
                key={c.documentId}
                agency={c.agency}
                sourceUrl={c.sourceUrl}
                docId={c.documentId}
              />
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
