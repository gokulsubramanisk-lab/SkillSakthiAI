"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge, Card, EmptyState, SalaryCurve, ScoreBar, Spinner, Stat, TrustTag, money } from "@/components/ui";
import type { RoiProjection } from "@/lib/types";

type Reference = {
  districts: { code: string; name: string; state: string }[];
  careers: { id: number; name: string }[];
  schemes: { id: number; name: string; benefitAmount: string | null; sourceUrl: string; eligibilityCriteria: string | null }[];
  session: { districtCode: string | null; name: string; role: string } | null;
};

export default function ParentCalculator() {
  const params = useSearchParams();
  const [reference, setReference] = useState<Reference | null>(null);
  const [districtCode, setDistrictCode] = useState("");
  const [careerIds, setCareerIds] = useState<number[]>([]);
  const [projections, setProjections] = useState<RoiProjection[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const run = useCallback(
    async (ids: number[], district: string, save = false) => {
      if (!district || ids.length === 0) return;
      setLoading(true);
      try {
        const res = await fetch("/api/roi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ districtCode: district, careerIds: ids, save }),
        });
        const data = (await res.json()) as { projections: RoiProjection[] };
        setProjections(data.projections ?? []);
        if (save) setSavedNote("Snapshot saved to the parent workspace.");
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
        const district =
          districtParam ?? data.session?.districtCode ?? data.districts[0]?.code ?? "";
        const ids = careerParam
          ? [Number(careerParam)]
          : data.careers.slice(0, 2).map((c) => c.id);
        setDistrictCode(district);
        setCareerIds(ids);
        void run(ids, district);
      })
      .catch(() => undefined);
  }, [params, run]);

  function toggleCareer(id: number) {
    setCareerIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  if (!reference) return <Spinner label="Loading local labour market data…" />;

  const totalSupport = projections.reduce((sum, p) => sum + p.schemeSupport, 0);
  const best = projections.reduce<RoiProjection | null>(
    (acc, p) => (!acc || p.fiveYearNetGain > acc.fiveYearNetGain ? p : acc),
    null,
  );

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm font-semibold text-slate-700">
            Our district
            <select
              value={districtCode}
              onChange={(e) => {
                setDistrictCode(e.target.value);
                void run(careerIds, e.target.value);
              }}
              className="mt-1 block rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-indigo-500"
            >
              {reference.districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}, {d.state}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => void run(careerIds, districtCode)}
            disabled={loading}
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Calculating…" : "🧮 Recalculate"}
          </button>
          <button
            onClick={() => void run(careerIds, districtCode, true)}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-indigo-400"
          >
            💾 Save snapshot
          </button>
          {savedNote ? (
            <span className="text-sm font-medium text-emerald-700">{savedNote}</span>
          ) : null}
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-700">
          Courses we are considering ({careerIds.length}/3)
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {reference.careers.map((c) => {
            const on = careerIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleCareer(c.id)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  on
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-indigo-300"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </Card>

      {projections.length === 0 ? (
        <EmptyState title="Select a course to see the family's return on investment" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Best 5-year net gain"
              value={money(best?.fiveYearNetGain ?? 0)}
              hint={best?.careerName}
              tone="emerald"
            />
            <Stat
              label="Government support available"
              value={money(totalSupport)}
              hint="Across the shortlisted courses"
              tone="emerald"
            />
            <Stat
              label="Fastest break-even"
              value={`${Math.min(...projections.map((p) => p.breakEvenMonths))} months`}
              hint="Investment recovered from salary"
            />
            <Stat
              label="Highest safety score"
              value={`${Math.max(...projections.map((p) => p.employmentSafetyScore))}/100`}
              hint="Placement + retention weighted"
              tone="amber"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {projections.map((p) => (
              <Card key={p.careerId} className="rise">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{p.careerName}</h3>
                    <p className="text-xs text-slate-500">
                      {p.districtName} district · {p.jobOpenings} openings tracked ·{" "}
                      {(p.placementRate * 100).toFixed(0)}% placed
                    </p>
                  </div>
                  <Badge
                    tone={
                      p.safetyBand === "High" ? "emerald" : p.safetyBand === "Moderate" ? "amber" : "rose"
                    }
                  >
                    {p.safetyBand} job safety
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase text-slate-400">What the family pays</p>
                      <p className="text-2xl font-extrabold text-slate-900">
                        {money(p.netTrainingCost)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {money(p.grossTrainingCost)} fee − {money(p.schemeSupport)} scheme support
                      </p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-3">
                      <p className="text-xs uppercase text-emerald-700/70">5-year net gain</p>
                      <p className="text-2xl font-extrabold text-emerald-800">
                        {money(p.fiveYearNetGain)}
                      </p>
                      <p className="text-xs text-emerald-700">
                        Break-even in {p.breakEvenMonths} months
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Monthly salary growth
                    </p>
                    <SalaryCurve points={p.yearlyEarnings} />
                    <div className="mt-2 space-y-2">
                      <ScoreBar
                        label="Employment safety"
                        value={p.employmentSafetyScore / 100}
                        tone={p.employmentSafetyScore >= 75 ? "emerald" : "amber"}
                        suffix={`${p.employmentSafetyScore}/100`}
                      />
                      <ScoreBar
                        label="Annual growth rate"
                        value={Math.min(1, p.annualGrowthRate * 5)}
                        tone="indigo"
                        suffix={`${(p.annualGrowthRate * 100).toFixed(1)}%/yr`}
                      />
                    </div>
                  </div>
                </div>

                <p className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3 text-sm leading-relaxed text-indigo-950">
                  🧘 {p.anxietyReductionNote}
                </p>

                {p.schemeName ? (
                  <p className="mt-2 text-xs text-slate-600">
                    Applied scheme: <strong>{p.schemeName}</strong>{" "}
                    {p.schemeSourceUrl ? (
                      <a
                        href={p.schemeSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline"
                      >
                        official page
                      </a>
                    ) : null}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.citations.map((c) => (
                    <TrustTag
                      key={c.documentId}
                      agency={c.agency}
                      sourceUrl={c.sourceUrl}
                      docId={c.documentId}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="text-lg font-bold text-slate-900">
              Welfare schemes your family can claim
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {reference.schemes.map((s) => (
                <div key={s.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="mt-1 text-sm font-bold text-emerald-700">
                    up to {money(Number(s.benefitAmount ?? 0))}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{s.eligibilityCriteria}</p>
                  <a
                    href={s.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-indigo-600 underline"
                  >
                    Official source ↗
                  </a>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
