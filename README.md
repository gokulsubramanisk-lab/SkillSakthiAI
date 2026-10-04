# Kaushal Saathi — AI-Enabled Career Counselling & Family Decision-Support Platform

**Smart India Hackathon 2026 · Problem Statement SIH26241 · Theme: Smart Education · Category: Software**
**Team ID 125818 · Team SYSTRONICS**

A voice-first, Indic-language, AI-powered career counselling and family decision-support platform
for vocational education. It removes literacy/text barriers, matches students to **district-level**
hiring pipelines, reduces family career anxiety with a transparent ROI calculator, detects emotional
distress and escalates to human counsellors, and answers **only** from verified MSDE/NSDC records.

---

## Feature → implementation map

| # | Feature | Where it lives |
|---|---|---|
| 1.1 / 1.6 | Voice-first Indic AI & dialect engine | `/voice`, `src/components/VoiceConsole.tsx`, `src/lib/i18n.ts` |
| 1.2 | District-level labour market vector matching | `/match`, `src/lib/matching.ts`, `src/lib/embeddings.ts` |
| 1.3 | Proactive emotional SOS & counsellor escalation | `/counselor`, `src/lib/sentiment.ts`, `src/lib/escalation.ts` |
| 1.4 / 1.9 | Family ROI & career safety calculator | `/parent`, `src/lib/roi.ts` |
| 1.5 / 1.8 | Hallucination-free government RAG vault + trust tags | `/vault`, `src/lib/rag.ts` |
| 1.7 | Family comparison screen (3 paths side by side) | `/compare`, `src/app/api/comparisons` |
| 1.10 | Skill-gap prescriptions → local ITI modules | `/skill-gap`, `src/lib/skill-gap.ts` |
| — | API docs, deployment, manuals, audit & research report | `/docs` |

## Architecture

```
Voice Gateway (browser STT/TTS, 10 Indic locales)
        ↓
NLU & Sentiment Engine  ──► distress level 0–3, dropout risk
        ↓
Vector Store (384-dim embeddings: skills, careers, gov documents)
        ↓
Zero-Hallucination RAG  ──► retrieval floor → extractive grounding → sentence verification
        ↓
Citation Injector (agency + official source URL on every claim)
        ↓
┌───────────────┬──────────────┬────────────────┬─────────────────┐
│ Labour Matcher│ ROI Calculator│ Escalation Router│ Family Compare │
└───────────────┴──────────────┴────────────────┴─────────────────┘
        ↓
Audit log (ai_responses + audit_logs) → /api/audit
```

## Zero-hallucination guarantee

1. Retrieval is restricted to `gov_documents` (MSDE / NSDC / DGT / NCVET), each with a source URL.
2. If the best hybrid similarity (vector + lexical) is **below 0.18**, the generator **refuses** and
   opens a counsellor case instead of answering.
3. The default answer is **extractive** — sentences are lifted verbatim from retrieved documents and
   tagged `[#documentId]`.
4. When an LLM is configured, its draft is **verified sentence-by-sentence** against the retrieved
   context; unsupported sentences are dropped and low-coverage drafts are discarded entirely.
5. Every response records grounding status, retrieved ids and latency for audit.

## Running locally

```bash
npm install
export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
npx drizzle-kit push      # create the schema
npm run build && npm start
```

Reference data (districts, careers, NSQF skills, ITI modules, labour statistics, welfare schemes and
the 18-document government vault) is seeded automatically on first request, or via
`POST /api/admin/seed`.

### Optional AI provider

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Enables the verified-LLM answer path (still guardrailed). |
| `CHAT_MODEL` | Chat model id, default `gpt-4o-mini`. |
| `EMBEDDING_PROVIDER=openai` | Switch embeddings to the remote provider. |
| `EMBEDDING_MODEL` | Default `text-embedding-3-small` (384 dims). |

Without any key the platform runs **fully offline** on deterministic local embeddings and extractive
grounding — important for rural edge deployments.

## Demo script (2 minutes)

1. `/voice` → press the 😟 quick prompt → watch distress detection open an SOS case.
2. `/counselor` → switch profile to *Dr. Meena Rao (Counsellor)* → work the prioritised queue.
3. `/match` → Patna + a few skills → ranked local trades with openings and placement rates.
4. `/parent` → see what the family pays vs the five-year net gain and break-even months.
5. `/compare` → three paths side by side → save the family shortlist.
6. `/vault` → press *Test an out-of-scope question* → the guardrail refuses instead of hallucinating.

## Security & privacy

- Role-based access control (student / parent / counsellor / admin); counsellor routes return 403 for
  other roles.
- Opaque `httpOnly` session cookies; session state lives in PostgreSQL, never in the browser.
- Immutable audit log of AI responses, citations, escalations and case transitions.
- Minimal retention, server-side secrets only, DPDP-aligned data handling.

## Research validation

- **Broadband India Forum** — voice AI for rural digital inclusion.
- **UJSRT (2026)** — RAG-based career matching.
- **Westman et al., IAFOR Journal of Education** — case management and staff prioritisation.
- **F1000Research (2026)** — structured transparency reduces career anxiety.
- **Pilot Study (2025)** — zero-hallucination RAG in educational platforms.
