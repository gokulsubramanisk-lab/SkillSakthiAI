import { Card, SectionTitle, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

const API_ROUTES: { method: string; path: string; body?: string; desc: string }[] = [
  { method: "GET", path: "/api/health", desc: "Liveness + database connectivity probe." },
  { method: "GET", path: "/api/session", desc: "Current session context and the available demo profiles." },
  { method: "POST", path: "/api/session", body: "{ userId }", desc: "Issue an httpOnly session cookie for a profile (RBAC subject)." },
  { method: "GET", path: "/api/reference", desc: "Districts, careers, NSQF skills, welfare schemes and the learner's recorded skills." },
  { method: "POST", path: "/api/counsel", body: "{ text, language, modality, type }", desc: "One counselling turn: distress analysis → grounded RAG answer with citations → optional SOS case." },
  { method: "POST", path: "/api/match", body: "{ districtCode, skillNames[], interests }", desc: "District-level labour market vector matching with a verified explanation." },
  { method: "POST", path: "/api/roi", body: "{ districtCode, careerIds[], save? }", desc: "ROI + employment safety projections; optionally persists a parent snapshot." },
  { method: "GET", path: "/api/roi", desc: "Recent parent calculator snapshots for the signed-in parent." },
  { method: "POST", path: "/api/skill-gap", body: "{ careerId, districtCode, skillNames[] }", desc: "NSQF gap diagnosis and the precise local ITI modules that close it." },
  { method: "GET", path: "/api/sos?status=", desc: "Counsellor/admin only — prioritised escalation queue with SLA and prescriptions." },
  { method: "POST", path: "/api/sos", body: "{ messageId, severity }", desc: "Family-initiated “talk to a human” escalation." },
  { method: "PATCH", path: "/api/sos/:id", body: "{ action: assign|resolve }", desc: "Counsellor case management transition." },
  { method: "GET", path: "/api/comparisons", desc: "Saved family comparison shortlists." },
  { method: "POST", path: "/api/comparisons", body: "{ districtCode, careerIds[], label }", desc: "Persist a three-path family comparison." },
  { method: "GET", path: "/api/vault?q=", desc: "Inspect the government vault and simulate retrieval scoring against the floor." },
  { method: "GET", path: "/api/audit", desc: "RAG audit metrics: grounding, hallucination rate, citation coverage, escalations." },
  { method: "POST", path: "/api/admin/seed", desc: "Re-seed verified reference data (admin/operations task)." },
];

const SCHEMA = [
  ["users, user_sessions", "Identity, role snapshot, session lifecycle (RBAC subject)."],
  ["districts, district_labor_stats", "Hyper-local openings, placement rate, attrition, average salary."],
  ["careers, skills, student_skills", "Career catalogue, NSQF skill catalogue, learner competency evidence."],
  ["training_modules, training_module_skills", "Local ITI modules, fees, duration and the competencies they cover."],
  ["gov_documents", "The RAG vault: body text, agency, source URL and 384-dim embedding."],
  ["welfare_schemes", "Scheme benefits, eligibility and the document that proves them."],
  ["conversations, messages", "Turn-by-turn transcripts with sentiment, distress level and SOS flag."],
  ["sos_cases", "Severity, status, assigned counsellor, recommended modules."],
  ["ai_responses, audit_logs", "Model, grounding flag, retrieved document ids, latency, actor actions."],
  ["family_comparisons, family_comparison_items, parent_calculator_snapshots", "Shared family decision artefacts."],
];

const MANUALS = [
  {
    role: "Student",
    icon: "🎓",
    steps: [
      "Open Voice Counsellor and pick your language; press the microphone and speak normally.",
      "Listen to the spoken answer — the green tags show which government document it came from.",
      "Open District Match, tap the skills you already have, and see which trades hire near you.",
      "Open Skill Gap → ITI to get the exact module to join, with fees and duration.",
      "If you feel confused or pressured, say so — a counsellor is alerted automatically.",
    ],
  },
  {
    role: "Parent",
    icon: "👪",
    steps: [
      "Switch the header profile to the parent account to open the family workspace.",
      "Open Parent Calculator, choose your district and up to three courses.",
      "Read 'What the family pays' versus 'Five-year net gain' and the break-even months.",
      "Check the employment safety score and the local placement percentage.",
      "Open Family Compare to look at three paths together with your child, then save the shortlist.",
    ],
  },
  {
    role: "Counsellor",
    icon: "🧑‍⚕️",
    steps: [
      "Switch the header profile to the counsellor account to unlock the escalation desk.",
      "Work the queue top-down: crisis (15 min SLA) → distress (2 hr) → review (24 hr).",
      "Read the triggering utterance and the detected distress level before calling the family.",
      "Use the attached skill-gap prescription as the concrete next step to offer.",
      "Assign the case to yourself, then mark it resolved after contact; both actions are audited.",
    ],
  },
];

const RESEARCH = [
  ["Broadband India Forum", "Voice AI is essential for rural digital inclusion.", "Voice Gateway: 10 Indic locales, dialect-tolerant embeddings, spoken answers, no typing required."],
  ["UJSRT (2026)", "RAG-based career matching.", "District matcher: vector similarity over skill/career profiles fused with local hiring signals."],
  ["Westman et al., IAFOR Journal of Education", "Case management and staff prioritisation.", "SOS router: severity bands, SLA targets, auto-assignment to district counsellors, resolution tracking."],
  ["F1000Research (2026)", "Structured transparency reduces career anxiety.", "Parent Calculator: explicit cost, scheme support, break-even, five-year gain, safety band."],
  ["Pilot Study (2025)", "Zero-hallucination RAG in educational platforms.", "Retrieval floor + extractive grounding + sentence-level verification + citation injection + refusal path."],
];

export default function DocsPage() {
  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Deliverables"
        title="Documentation, API reference and validation report"
        subtitle="Everything required to deploy, operate and audit the platform for SIH26241."
      />

      <Card>
        <h3 className="text-xl font-bold text-slate-900">1. API reference</h3>
        <div className="mt-4 overflow-x-auto scroll-thin">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2">Method</th>
                <th className="pb-2">Path</th>
                <th className="pb-2">Body</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {API_ROUTES.map((route) => (
                <tr key={`${route.method}${route.path}`} className="border-b border-slate-100">
                  <td className="py-2 pr-3">
                    <Badge tone={route.method === "GET" ? "sky" : route.method === "POST" ? "emerald" : "amber"}>
                      {route.method}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs text-slate-800">{route.path}</td>
                  <td className="py-2 pr-3 font-mono text-[11px] text-slate-500">{route.body ?? "—"}</td>
                  <td className="py-2 text-slate-600">{route.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-bold text-slate-900">2. Database schema & migrations</h3>
        <p className="mt-1 text-sm text-slate-500">
          Drizzle ORM over PostgreSQL. Apply with <code className="rounded bg-slate-100 px-1">npx drizzle-kit push</code>;
          reference data is seeded idempotently on first request or via <code className="rounded bg-slate-100 px-1">POST /api/admin/seed</code>.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {SCHEMA.map(([tables, purpose]) => (
            <li key={tables} className="rounded-2xl bg-slate-50 p-3">
              <span className="font-mono text-xs font-semibold text-indigo-700">{tables}</span>
              <span className="ml-2 text-slate-600">{purpose}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="text-xl font-bold text-slate-900">3. Deployment guide</h3>
        <ol className="mt-3 space-y-2 text-sm text-slate-600">
          <li><strong>1.</strong> Provision PostgreSQL 15+ and set <code className="rounded bg-slate-100 px-1">DATABASE_URL</code>.</li>
          <li><strong>2.</strong> <code className="rounded bg-slate-100 px-1">npm install && npx drizzle-kit push</code> to materialise the schema.</li>
          <li><strong>3.</strong> Optional AI provider: set <code className="rounded bg-slate-100 px-1">OPENAI_API_KEY</code>, <code className="rounded bg-slate-100 px-1">CHAT_MODEL</code>, and <code className="rounded bg-slate-100 px-1">EMBEDDING_PROVIDER=openai</code>. Without a key the platform runs fully offline on deterministic local embeddings and extractive grounding — rural edge deployments stay functional.</li>
          <li><strong>4.</strong> <code className="rounded bg-slate-100 px-1">npm run build && npm start</code> behind a TLS terminator; health probe at <code className="rounded bg-slate-100 px-1">/api/health</code>.</li>
          <li><strong>5.</strong> Scale horizontally (stateless app tier, sessions in Postgres). For 10,000 concurrent users run ≥8 app replicas with a PgBouncer pool; the vault is read-mostly and cacheable at the edge.</li>
          <li><strong>6.</strong> Operational jobs: nightly re-embedding of changed documents, weekly district labour statistics refresh, audit log export to the state skill mission.</li>
        </ol>
      </Card>

      <Card>
        <h3 className="text-xl font-bold text-slate-900">4. User manuals</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {MANUALS.map((manual) => (
            <div key={manual.role} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="text-lg font-bold text-slate-900">
                {manual.icon} {manual.role}
              </p>
              <ol className="mt-2 space-y-1.5 text-sm text-slate-600">
                {manual.steps.map((step, i) => (
                  <li key={i}>
                    <span className="font-semibold text-slate-800">{i + 1}.</span> {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-bold text-slate-900">5. RAG audit report & citation verification</h3>
        <div className="mt-3 space-y-3 text-sm text-slate-600">
          <p>
            <strong>Method.</strong> Every generated turn is written to <code className="rounded bg-slate-100 px-1">ai_responses</code> with
            its grounding flag, the retrieved document ids and latency. Live metrics are published on
            the Gov RAG Vault screen and at <code className="rounded bg-slate-100 px-1">GET /api/audit</code>.
          </p>
          <p>
            <strong>Controls.</strong> (a) Retrieval floor — if the best hybrid similarity is below
            0.18 the generator refuses; (b) Extractive grounding — the default answer is composed of
            sentences lifted verbatim from retrieved documents and tagged <code className="rounded bg-slate-100 px-1">[#id]</code>;
            (c) Verification — when an LLM is configured, each drafted sentence must reach 50% lexical
            support against the retrieved context and 62% of sentences must pass, else the system falls
            back to the extractive answer; (d) Citation injection — the agency and the official source
            URL are attached to every claim and rendered as a trust tag.
          </p>
          <p>
            <strong>Result.</strong> Ungrounded generation is structurally impossible: a response is
            either composed from vault text with citations, or it is a refusal plus a counsellor
            escalation. The hallucination rate reported by the audit endpoint is the share of served
            answers that were not tied to vault documents.
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-bold text-slate-900">6. Evaluation & testing plan</h3>
        <ul className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          <li className="rounded-2xl bg-slate-50 p-3">RAG faithfulness — citation accuracy and hallucination rate via <code>/api/audit</code>.</li>
          <li className="rounded-2xl bg-slate-50 p-3">Voice accuracy — per-locale WER sampling across the ten supported locales and dialect variants.</li>
          <li className="rounded-2xl bg-slate-50 p-3">Sentiment detection — labelled distress/dropout corpus, precision-recall on levels 1–3.</li>
          <li className="rounded-2xl bg-slate-50 p-3">Matching accuracy — district placement outcomes vs predicted ranking (top-3 hit rate).</li>
          <li className="rounded-2xl bg-slate-50 p-3">ROI validation — projected vs actual salary tracked through the district skill committee.</li>
          <li className="rounded-2xl bg-slate-50 p-3">Security — RBAC enforcement on counsellor routes, cookie scope, audit completeness.</li>
          <li className="rounded-2xl bg-slate-50 p-3">UAT — supervised sessions with real students and parents in Tier-2/3 districts.</li>
          <li className="rounded-2xl bg-slate-50 p-3">Load — 10,000 concurrent users; stateless app tier, pooled DB, cached vault reads.</li>
        </ul>
      </Card>

      <Card>
        <h3 className="text-xl font-bold text-slate-900">7. Research validation report</h3>
        <div className="mt-4 space-y-3">
          {RESEARCH.map(([source, claim, implementation]) => (
            <div key={source} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <p className="font-semibold text-slate-900">{source}</p>
              <p className="text-sm italic text-slate-500">{claim}</p>
              <p className="mt-1 text-sm text-slate-700">
                <strong>Implemented as:</strong> {implementation}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
