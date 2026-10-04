"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Card, ScoreBar, Spinner, TrustTag } from "@/components/ui";
import { LANGUAGES, t } from "@/lib/i18n";
import type { CounselReply } from "@/lib/types";

// --- Minimal Web Speech API typings (not in lib.dom for all targets) ---
type SpeechAlternative = { transcript: string; confidence: number };
type SpeechResult = { isFinal: boolean; length: number; 0: SpeechAlternative };
type SpeechResultList = { length: number; [index: number]: SpeechResult };
type SpeechEvent = { resultIndex: number; results: SpeechResultList };
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}
type RecognitionCtor = new () => RecognitionLike;

const QUICK_PROMPTS = [
  { label: "ITI की फीस और स्कॉलरशिप?", text: "ITI ki fees kitni hai aur scholarship milti hai kya" },
  { label: "Solar technician की सैलरी?", text: "solar pv technician training duration and salary" },
  { label: "Apprenticeship में स्टाइपेंड?", text: "apprenticeship stipend rules for ITI passout" },
  { label: "क्या ये सर्टिफिकेट असली है?", text: "how to verify that a training certificate is government recognised" },
  { label: "😟 मुझे कुछ समझ नहीं आ रहा", text: "mujhe kuch samajh nahi aa raha bahut tension hai papa gussa hai padhai chhod dunga" },
];

type Turn =
  | { kind: "user"; id: string; text: string }
  | { kind: "assistant"; id: string; reply: CounselReply };

function AnswerText({ text }: { text: string }) {
  const parts = text.split(/(\[#\d+\])/g);
  return (
    <p className="text-[15px] leading-relaxed text-slate-800">
      {parts.map((part, i) => {
        const match = part.match(/^\[#(\d+)\]$/);
        if (!match) return <span key={i}>{part}</span>;
        return (
          <sup
            key={i}
            className="mx-0.5 rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-bold text-emerald-800"
            title={`Verified source document #${match[1]}`}
          >
            #{match[1]}
          </sup>
        );
      })}
    </p>
  );
}

const DISTRESS_TONE: Record<string, { tone: "emerald" | "amber" | "rose"; emoji: string }> = {
  calm: { tone: "emerald", emoji: "🙂" },
  confused: { tone: "amber", emoji: "🤔" },
  distressed: { tone: "rose", emoji: "😟" },
  crisis: { tone: "rose", emoji: "🚨" },
};

export default function VoiceConsole() {
  const [language, setLanguage] = useState("hi-IN");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const strings = useMemo(() => t(language), [language]);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    setSttSupported(Boolean(Ctor));
  }, []);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 600));
      utterance.lang = language;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    },
    [language],
  );

  const send = useCallback(
    async (text: string, modality: "voice" | "text") => {
      const clean = text.trim();
      if (!clean || busy) return;
      setBusy(true);
      setNotice(null);
      setDraft("");
      setInterim("");
      setTurns((prev) => [...prev, { kind: "user", id: `u${Date.now()}`, text: clean }]);
      try {
        const res = await fetch("/api/counsel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean, language, modality, type: "general_info" }),
        });
        const reply = (await res.json()) as CounselReply & { error?: string };
        if (!res.ok || reply.error) {
          setNotice(reply.error ?? "Could not reach the counselling engine.");
        } else {
          setTurns((prev) => [...prev, { kind: "assistant", id: `a${reply.messageId}`, reply }]);
          speak(reply.speak);
        }
      } catch {
        setNotice("Network error — please retry.");
      } finally {
        setBusy(false);
      }
    },
    [busy, language, speak],
  );

  const toggleListening = useCallback(() => {
    const w = window as unknown as {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setSttSupported(false);
      setNotice("This browser has no speech engine. Please use the text box below.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Ctor();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalText = "";
    recognition.onresult = (event) => {
      let live = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else live += result[0].transcript;
      }
      setInterim(live);
      if (finalText) setDraft(finalText);
    };
    recognition.onerror = (event) => {
      setNotice(
        event.error === "not-allowed"
          ? "Microphone permission denied — you can still type your question."
          : `Speech engine error: ${event.error}`,
      );
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
      if (finalText.trim()) void send(finalText, "voice");
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [language, listening, send]);

  async function escalateToHuman(messageId: number) {
    const res = await fetch("/api/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, severity: "medium" }),
    });
    const data = (await res.json()) as { caseId?: number };
    setNotice(
      data.caseId
        ? `Case #${data.caseId} created. A counsellor from your district has been alerted.`
        : "Could not raise the case.",
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
      <Card className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Voice counselling session</h2>
            <p className="text-sm text-slate-500">{strings.askAnything}</p>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName} · {l.name}
              </option>
            ))}
          </select>
        </div>

        <div
          ref={feedRef}
          className="scroll-thin mt-4 h-[clamp(320px,46vh,520px)] space-y-4 overflow-y-auto rounded-2xl bg-slate-50/80 p-4"
        >
          {turns.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="text-4xl">🎙️</p>
                <p className="mt-2 font-semibold text-slate-700">{strings.tapToSpeak}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Answers come only from verified MSDE / NSDC records.
                </p>
              </div>
            </div>
          ) : null}

          {turns.map((turn) =>
            turn.kind === "user" ? (
              <div key={turn.id} className="rise flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-[15px] text-white shadow-sm">
                  {turn.text}
                </p>
              </div>
            ) : (
              <div key={turn.id} className="rise space-y-3">
                <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone={turn.reply.answer.grounded ? "emerald" : "rose"}>
                      {turn.reply.answer.grounded ? "✅ Grounded" : "⛔ Refused — no verified source"}
                    </Badge>
                    <Badge tone="slate">{turn.reply.answer.mode}</Badge>
                    <Badge tone="sky">
                      confidence {(turn.reply.answer.confidence * 100).toFixed(0)}%
                    </Badge>
                    <Badge tone="slate">{turn.reply.answer.latencyMs} ms</Badge>
                  </div>
                  <AnswerText text={turn.reply.answer.answer} />

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => speak(turn.reply.speak)}
                      className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                    >
                      🔊 {strings.speakAnswer}
                    </button>
                    <button
                      onClick={() => escalateToHuman(turn.reply.messageId)}
                      className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      🙋 Talk to a human counsellor
                    </button>
                  </div>

                  {turn.reply.answer.citations.length > 0 ? (
                    <div className="mt-4 space-y-2 border-t border-dashed border-slate-200 pt-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Government sources used
                      </p>
                      {turn.reply.answer.citations.map((c) => (
                        <div key={c.documentId} className="rounded-xl bg-emerald-50/60 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-800">
                              #{c.documentId} · {c.title}
                            </p>
                            <TrustTag agency={c.agency} sourceUrl={c.sourceUrl} />
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">{c.snippet}</p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            retrieval similarity {(c.similarity * 100).toFixed(1)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {turn.reply.sosCaseId ? (
                  <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
                    🚨 <strong>SOS case #{turn.reply.sosCaseId} opened.</strong>{" "}
                    {turn.reply.distress.recommendedAction}
                  </div>
                ) : null}
              </div>
            ),
          )}

          {busy ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <Spinner label="Retrieving verified government records…" />
            </div>
          ) : null}
        </div>

        {notice ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
            {notice}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={toggleListening}
            className={`grid h-16 w-16 shrink-0 place-items-center rounded-full text-2xl text-white shadow-lg transition ${
              listening ? "mic-live bg-rose-600" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            aria-label={listening ? strings.stop : strings.tapToSpeak}
          >
            {listening ? "■" : "🎤"}
          </button>
          <div className="min-w-[200px] flex-1">
            <input
              value={listening && interim ? interim : draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send(draft, "text");
              }}
              placeholder={listening ? strings.listening : strings.typeInstead}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base outline-none focus:border-indigo-500"
            />
            {!sttSupported ? (
              <p className="mt-1 text-xs text-slate-500">
                Speech recognition is unavailable in this browser — typing works identically.
              </p>
            ) : null}
          </div>
          <button
            onClick={() => void send(draft, "text")}
            disabled={busy || !draft.trim()}
            className="rounded-2xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
          >
            {strings.send}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => void send(p.text, "text")}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-700"
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-5">
        <Card>
          <h3 className="text-lg font-bold text-slate-900">Emotional state monitor</h3>
          <p className="text-sm text-slate-500">
            Every turn is scored for confusion, distress and dropout risk.
          </p>
          {(() => {
            const last = [...turns].reverse().find((x) => x.kind === "assistant");
            if (!last || last.kind !== "assistant") {
              return (
                <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No signal yet — start speaking to begin monitoring.
                </p>
              );
            }
            const d = last.reply.distress;
            const tone = DISTRESS_TONE[d.label] ?? DISTRESS_TONE.calm;
            return (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge tone={tone.tone}>
                    {tone.emoji} {d.label.toUpperCase()}
                  </Badge>
                  <Badge tone={d.dropoutRisk ? "rose" : "emerald"}>
                    dropout risk: {d.dropoutRisk ? "yes" : "no"}
                  </Badge>
                </div>
                <ScoreBar
                  label="Distress level"
                  value={d.level / 3}
                  tone={d.level >= 2 ? "rose" : d.level === 1 ? "amber" : "emerald"}
                  suffix={`${d.level}/3`}
                />
                <ScoreBar
                  label="Sentiment"
                  value={(d.score + 1) / 2}
                  tone={d.score < -0.2 ? "rose" : "emerald"}
                  suffix={d.score.toFixed(2)}
                />
                {d.triggers.length ? (
                  <p className="text-xs text-slate-500">
                    Triggers detected: {d.triggers.map((x) => `“${x}”`).join(", ")}
                  </p>
                ) : null}
                <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  {d.recommendedAction}
                </p>
              </div>
            );
          })()}
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-slate-900">How the guardrail works</h3>
          <ol className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <strong>1.</strong> Your speech is transcribed on-device by the browser speech engine.
            </li>
            <li>
              <strong>2.</strong> The query is embedded and matched against the government vault only.
            </li>
            <li>
              <strong>3.</strong> If the best match scores below the retrieval floor, the AI refuses
              and opens a counsellor case instead of guessing.
            </li>
            <li>
              <strong>4.</strong> Any LLM draft is verified sentence-by-sentence against the retrieved
              text; unsupported sentences are dropped.
            </li>
            <li>
              <strong>5.</strong> Citations, latency and grounding status are written to the audit log.
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
