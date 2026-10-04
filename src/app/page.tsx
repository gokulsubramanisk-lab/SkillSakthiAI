import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeeded } from "@/lib/bootstrap";
import { Badge, Card, SectionTitle, Stat } from "@/components/ui";
import { LANGUAGES } from "@/lib/i18n";

export const dynamic = "force-dynamic";

async function count(table: string): Promise<number> {
  const result = await db.execute<{ c: string }>(
    sql.raw(`select count(*)::text as c from ${table}`),
  );
  const rows = result.rows as { c: string }[];
  return Number(rows[0]?.c ?? "0");
}

const FEATURES = [
  {
    id: "1.1",
    icon: "🎙️",
    title: "Voice-First Indic AI & Dialect Engine",
    body: "Families speak naturally in regional languages and dialects. Speech recognition and speech synthesis remove the literacy and text barrier completely.",
    proof: "Broadband India Forum — voice AI for rural digital inclusion",
    href: "/voice",
  },
  {
    id: "1.2",
    icon: "📍",
    title: "District-Level Labour Market Vector Matching",
    body: "Skill profiles are embedded as vectors and semantically matched to hyper-local district hiring pipelines, not generic national advice.",
    proof: "UJSRT (2026) — RAG-based career matching",
    href: "/match",
  },
  {
    id: "1.3",
    icon: "🆘",
    title: "Proactive Emotional SOS & Counsellor Escalation",
    body: "Confusion, distress and dropout risk are detected live during the conversation and routed to human mentors with severity-based prioritisation.",
    proof: "Westman et al., IAFOR Journal of Education",
    href: "/counselor",
  },
  {
    id: "1.4",
    icon: "📊",
    title: "Family ROI & Career Safety Calculator",
    body: "Anxious parents see real salary growth, placement rates and break-even months for their own district — the root cause of vocational dropout, answered with data.",
    proof: "F1000Research (2026) — transparency reduces career anxiety",
    href: "/parent",
  },
  {
    id: "1.5",
    icon: "🔐",
    title: "Hallucination-Free Government RAG Vault",
    body: "Generation is locked to MSDE and NSDC records through strict semantic retrieval. Below the retrieval floor the AI refuses and hands over to a human.",
    proof: "Pilot Study (2025) — RAG in educational platforms",
    href: "/vault",
  },
  {
    id: "1.6",
    icon: "🗣️",
    title: "Voice-First Regional AI Engine",
    body: "Ten Indic locales with dialect-tolerant matching, spoken answers and large touch targets designed for Tier-2/3 and rural households.",
    proof: "Broadband India Forum",
    href: "/voice",
  },
  {
    id: "1.7",
    icon: "⚖️",
    title: "Family Comparison Screen",
    body: "A shared digital space where the family puts three career paths side-by-side on financial cost, completion duration and projected salary growth.",
    proof: "Dual-profile family decision support",
    href: "/compare",
  },
  {
    id: "1.8",
    icon: "✅",
    title: "Government Trust Tags & Strict RAG",
    body: "Every career option and welfare scheme carries a visible citation indicator proving direct synchronisation with official MSDE and NSDC records.",
    proof: "Pilot Study (2025) — citation injection",
    href: "/vault",
  },
  {
    id: "1.9",
    icon: "🧮",
    title: "The Parent Calculator",
    body: "A dedicated visual dashboard using hard local labour metrics to actively prove job safety and reduce family career anxiety.",
    proof: "F1000Research (2026)",
    href: "/parent",
  },
  {
    id: "1.10",
    icon: "🎯",
    title: "Emotional SOS & Skill-Gap Prescriptions",
    body: "Distress triggers human routing, and the engine outputs the precise local ITI training module needed to bridge the gap and secure district employment.",
    proof: "Westman et al. + NSQF mapping",
    href: "/skill-gap",
  },
];

const PIPELINE = [
  ["Voice Gateway", "Indic STT + TTS, dialect-tolerant tokenisation"],
  ["NLU & Sentiment Engine", "Intent, entities, distress & dropout-risk scoring"],
  ["Vector Store", "384-dim embeddings for skills, jobs, courses, gov docs"],
  ["Zero-Hallucination RAG", "Retrieval floor, extractive grounding, claim verification"],
  ["Citation Injector", "Trust tags with agency + source URL on every claim"],
  ["Labour Market Matcher", "District hiring pipelines, openings, placement rates"],
  ["ROI Calculator", "Cost vs salary growth, break-even, safety banding"],
  ["Escalation Router", "SLA-driven counsellor case management"],
  ["Family Comparison", "Three-path side-by-side evaluation"],
  ["Parent Dashboard", "Visual ROI + employment safety metrics"],
];

export default async function HomePage() {
  await ensureSeeded();
  const [documents, districts, careers, modules, cases] = await Promise.all([
    count("gov_documents"),
    count("districts"),
    count("careers"),
    count("training_modules"),
    count("sos_cases"),
  ]);

  return (
    <div className="space-y-12">
      <section className="rise overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 p-8 shadow-[0_24px_70px_-30px_rgba(30,41,59,0.45)] backdrop-blur sm:p-12">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="indigo">Smart Education</Badge>
          <Badge tone="emerald">Zero-hallucination RAG</Badge>
          <Badge tone="amber">Voice-first · 10 Indic locales</Badge>
          <Badge tone="sky">SIH26241 · Team 125818</Badge>
        </div>
        <h1 className="mt-5 max-w-4xl text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.05] tracking-tight text-slate-950">
          Kaushal Saathi — the family decides together, with verified government data.
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-slate-600">
          A voice-first, Indic-language career counselling and family decision-support platform
          for vocational education. It speaks the family&apos;s dialect, matches the student to
          <strong className="text-slate-800"> district-level</strong> hiring pipelines, proves the
          <strong className="text-slate-800"> return on investment</strong> to anxious parents,
          detects <strong className="text-slate-800">emotional distress</strong> in real time, and
          never answers beyond the <strong className="text-slate-800">MSDE / NSDC</strong> record.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/voice"
            className="rounded-2xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
          >
            🎙️ Start a voice counselling session
          </Link>
          <Link
            href="/parent"
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition hover:border-indigo-400 hover:text-indigo-700"
          >
            📊 Open the Parent Calculator
          </Link>
          <Link
            href="/vault"
            className="rounded-2xl border border-emerald-300 bg-emerald-50 px-6 py-3.5 text-base font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            🔐 Inspect the RAG vault
          </Link>
        </div>

        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Verified gov documents" value={documents} hint="MSDE · NSDC · DGT · NCVET" />
          <Stat label="Districts covered" value={districts} hint="Hyper-local labour data" />
          <Stat label="Vocational pathways" value={careers} hint="NSQF aligned" />
          <Stat label="Local ITI modules" value={modules} hint="Skill-gap prescriptions" />
          <Stat label="SOS cases tracked" value={cases} tone="rose" hint="Human escalation" />
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Core capabilities"
          title="Ten modules, built for the family — not just the student"
          subtitle="Every capability below is live in this prototype and backed by the research validation cited on the card."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature) => (
            <Link key={feature.id} href={feature.href} className="group">
              <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:border-indigo-300 group-hover:shadow-[0_18px_50px_-20px_rgba(79,70,229,0.5)]">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-xl ring-1 ring-indigo-100">
                    {feature.icon}
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Feature {feature.id}
                    </p>
                    <h3 className="text-base font-bold text-slate-900">{feature.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.body}</p>
                <p className="mt-4 border-t border-dashed border-slate-200 pt-3 text-xs font-medium text-emerald-700">
                  📑 {feature.proof}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <SectionTitle
            eyebrow="System architecture"
            title="Modular, auditable request pipeline"
            subtitle="Each stage is isolated so it can scale horizontally and be audited independently for government deployment."
          />
          <ol className="grid gap-2.5 sm:grid-cols-2">
            {PIPELINE.map(([name, detail], index) => (
              <li
                key={name}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-5">
          <Card>
            <h3 className="text-lg font-bold text-slate-900">Security, privacy & compliance</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>🔑 Role-based access control — student, parent, counsellor, admin workspaces.</li>
              <li>🍪 Opaque httpOnly session cookies; no personal data in the browser store.</li>
              <li>🧾 Immutable audit log for every AI response, citation set and escalation.</li>
              <li>🛡️ Transport encryption, server-side secrets, DPDP-aligned minimal retention.</li>
              <li>🚫 Distress transcripts are visible only to the assigned counsellor role.</li>
            </ul>
          </Card>
          <Card>
            <h3 className="text-lg font-bold text-slate-900">Languages & dialects</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <span
                  key={l.code}
                  className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                  title={l.dialects.join(", ")}
                >
                  {l.nativeName}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Dialect drift (e.g. “bijli”/“bijlee”, “weldar”/“welder”) is absorbed by character
              trigram features in the embedding layer.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
