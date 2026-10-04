"use client";

import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, SalaryCurve, ScoreBar, Spinner, TrustTag, money } from "@/components/ui";
import type { RoiProjection } from "@/lib/types";

type Reference = {
  districts: { code: string; name: string; state: string }[];
  careers: { id: number; name: string; nsqfLevel: number | null }[];
  session: { districtCode: string | null; name: string; role: string } | null;
};

export default function CompareBoard() {
  const [reference, setReference] = useState<Reference | null>(null);
  const [districtCode, setDistrictCode] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [projections, setProjections] = useState<RoiProjection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reference")
      .then((r) => r.json())
      .then((data: Reference) => {
        setReference(data);
        setDistrictCode(data.session?.districtCode ?? data.districts[0]?.code ?? "");
        setPicked(data.careers.slice(0, 3).map((c) => c.id));
      })
      .catch(() => undefined);
  }, []);

  function togglePick(id: number) {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  async function compare() {
    if (!districtCode || picked.length === 0) return;
    setLoading(true);
    setSaved(null);
    try {
      const res = await fetch("/api/roi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ districtCode, careerIds: picked }),
      });
      const data = (await res.json()) as { projections: RoiProjection[] };
      setProjections(data.projections ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function saveShortlist() {
    const res = await fetch("/api/comparisons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ districtCode, careerIds: picked, label: "Family shortlist" }),
    });
    const data = (await res.json()) as { comparisonId?: number };
    setSaved(
      data.comparisonId
        ? `Saved to the family workspace as comparison #${data.comparisonId}.`
        : "Could not save the shortlist.",
    );
  }

  if (!reference) return <Spinner label="Loading career catalogue…" />;

  const cheapest = projections.reduce<RoiProjection | null>(
    (best, p) => (!best || p.netTrainingCost < best.netTrainingCost ? p : best),
    null,
  );
  const fastest = projections.reduce<RoiProjection | null>(
    (best, p) => (!best || p.trainingMonths < best.trainingMonths ? p : best),
    null,
  );
  const highestGrowth = projections.reduce<RoiProjection | null>(
    (best, p) => (!best || p.fiveYearNetGain > best.fiveYearNetGain ? p : best),
    null,
  );
  const safest = projections.reduce<RoiProjection | null>(
    (best, p) => (!best || p.employmentSafetyScore > best.employmentSafetyScore ? p : best),
    null,
  );

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm font-semibold text-slate-700">
            District
            <select
              value={districtCode}
              onChange={(e) => setDistrictCode(e.target.value)}
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
            onClick={compare}
            disabled={loading || picked.length === 0}
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Comparing…" : "⚖️ Compare the three paths"}
          </button>
          {projections.length ? (
            <button
              onClick={saveShortlist}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-indigo-400"
            >
              💾 Save to family workspace
            </button>
          ) : null}
          {saved ? <span className="text-sm font-medium text-emerald-700">{saved}</span> : null}
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-700">
          Choose up to three career paths ({picked.length}/3)
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {reference.careers.map((c) => {
            const on = picked.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => togglePick(c.id)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  on
                    ? "bg-slate-900 text-white shadow-sm"
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
        <EmptyState
          title="The family comparison space is empty"
          hint="Pick up to three paths and press Compare to see cost, duration and salary growth side-by-side."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="!p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Lowest family cost</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{cheapest?.careerName}</p>
              <p className="text-sm text-emerald-700">{money(cheapest?.netTrainingCost ?? 0)}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Fastest to earn</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{fastest?.careerName}</p>
              <p className="text-sm text-indigo-700">{fastest?.trainingMonths} months</p>
            </Card>
            <Card className="!p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Best 5-year gain</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{highestGrowth?.careerName}</p>
              <p className="text-sm text-emerald-700">{money(highestGrowth?.fiveYearNetGain ?? 0)}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Safest employment</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{safest?.careerName}</p>
              <p className="text-sm text-amber-700">{safest?.employmentSafetyScore}/100 safety</p>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {projections.map((p) => (
              <Card key={p.careerId} className="rise flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{p.careerName}</h3>
                  <Badge
                    tone={
                      p.safetyBand === "High"
                        ? "emerald"
                        : p.safetyBand === "Moderate"
                          ? "amber"
                          : "rose"
                    }
                  >
                    {p.safetyBand} safety
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {p.districtName} · {p.jobOpenings} tracked openings
                </p>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <dt className="text-slate-500">Course fee (gross)</dt>
                    <dd className="font-semibold text-slate-800">{money(p.grossTrainingCost)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <dt className="text-slate-500">Government support</dt>
                    <dd className="font-semibold text-emerald-700">− {money(p.schemeSupport)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <dt className="text-slate-500">Family pays</dt>
                    <dd className="text-base font-extrabold text-slate-900">
                      {money(p.netTrainingCost)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <dt className="text-slate-500">Completion duration</dt>
                    <dd className="font-semibold text-slate-800">{p.trainingMonths} months</dd>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <dt className="text-slate-500">Starting salary</dt>
                    <dd className="font-semibold text-slate-800">
                      {money(p.monthlyStartSalary)}/mo
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Salary after 5 years</dt>
                    <dd className="font-semibold text-indigo-700">
                      {money(p.monthlyFiveYearSalary)}/mo
                    </dd>
                  </div>
                </dl>

                <div className="mt-3">
                  <SalaryCurve points={p.yearlyEarnings} />
                </div>

                <div className="mt-2 space-y-2">
                  <ScoreBar
                    label="Employment safety"
                    value={p.employmentSafetyScore / 100}
                    tone={p.employmentSafetyScore >= 75 ? "emerald" : "amber"}
                    suffix={`${p.employmentSafetyScore}/100`}
                  />
                  <ScoreBar label="Local placement rate" value={p.placementRate} tone="indigo" />
                </div>

                <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
                  Break-even in <strong>{p.breakEvenMonths} months</strong>; five-year net gain{" "}
                  <strong>{money(p.fiveYearNetGain)}</strong>.
                </p>

                {p.schemeName ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Scheme applied: <strong>{p.schemeName}</strong>
                  </p>
                ) : null}

                <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
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
        </>
      )}
    </div>
  );
}
