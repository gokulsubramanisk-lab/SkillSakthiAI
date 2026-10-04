// Proactive Emotional SOS engine.
// Real-time sentiment + distress + dropout-risk detection over voice transcripts
// and typed text, covering Devanagari, Tamil, Bengali and romanised Indic input.
// Operational model follows Westman et al. (IAFOR Journal of Education):
// detect -> classify severity -> route to a human with prioritisation.

import type { DistressSignal } from "./types";

type Lexicon = { weight: number; terms: string[] };

const CRISIS: Lexicon = {
  weight: 3,
  terms: [
    "suicide", "kill myself", "end my life", "no reason to live", "mar jaunga",
    "jeena nahi", "khudkhushi", "आत्महत्या", "मर जाऊंगा", "जीना नहीं",
    "जगायचं नाही", "আত্মহত্যা", "தற்கொலை", "worthless life", "sab khatam",
  ],
};

const DISTRESS: Lexicon = {
  weight: 2,
  terms: [
    "depressed", "hopeless", "panic", "crying", "ro raha", "bahut tension",
    "pareshan", "ghabrahat", "dar lag", "darr lagta", "stress", "pressure",
    "beizzati", "insult", "father angry", "papa gussa", "shaadi kar denge",
    "घबराहट", "परेशान", "तनाव", "डर लग", "रो रहा", "दबाव", "अवसाद",
    "চিন্তা", "ভয়", "பயம்", "கவலை", "quit", "chhod dunga", "drop out",
    "dropout", "padhai chhod", "छोड़ दूंगा", "पढ़ाई छोड़", "सोडून देईन",
    "no money", "paisa nahi", "fees nahi", "फीस नहीं", "पैसा नहीं",
  ],
};

const CONFUSION: Lexicon = {
  weight: 1,
  terms: [
    "confused", "samajh nahi", "samjh nahi", "nahi pata", "pata nahi",
    "don't understand", "dont understand", "not sure", "kaunsa chunu",
    "kya karu", "समझ नहीं", "पता नहीं", "क्या करूँ", "कौन सा चुनूँ",
    "गोंधळ", "বুঝতে পারছি না", "புரியவில்லை", "which is better", "help me decide",
  ],
};

const POSITIVE: Lexicon = {
  weight: -1,
  terms: [
    "thank", "dhanyavad", "shukriya", "accha", "achha", "good", "happy",
    "excited", "confident", "samajh gaya", "धन्यवाद", "अच्छा", "समझ गया",
    "खुश", "நன்றி", "ধন্যবাদ", "ready to join", "interested",
  ],
};

const DROPOUT_TERMS = [
  "drop out", "dropout", "quit", "chhod dunga", "chhod dungi", "padhai chhod",
  "छोड़ दूंगा", "छोड़ दूंगी", "पढ़ाई छोड़", "leave the course", "band kar",
  "सोडून देईन", "நிறுத்த", "ছেড়ে দেব",
];

function scan(text: string, lexicon: Lexicon): string[] {
  const lower = text.toLowerCase();
  return lexicon.terms.filter((term) => lower.includes(term));
}

export function analyseDistress(text: string): DistressSignal {
  const crisis = scan(text, CRISIS);
  const distress = scan(text, DISTRESS);
  const confusion = scan(text, CONFUSION);
  const positive = scan(text, POSITIVE);

  const raw =
    crisis.length * CRISIS.weight +
    distress.length * DISTRESS.weight +
    confusion.length * CONFUSION.weight +
    positive.length * POSITIVE.weight;

  // Normalise into a -1..1 sentiment score (negative == distressed).
  const score = Math.max(-1, Math.min(1, -raw / 4));

  let level: DistressSignal["level"] = 0;
  if (crisis.length > 0) level = 3;
  else if (distress.length >= 2) level = 3;
  else if (distress.length === 1) level = 2;
  else if (confusion.length > 0) level = 1;

  const dropoutRisk =
    DROPOUT_TERMS.some((term) => text.toLowerCase().includes(term)) || level >= 2;

  const label: DistressSignal["label"] =
    level === 3 ? "crisis" : level === 2 ? "distressed" : level === 1 ? "confused" : "calm";

  const recommendedAction =
    level === 3
      ? "Immediate escalation: assign senior counsellor within 15 minutes and share helpline."
      : level === 2
        ? "Escalate to district counsellor queue with high priority; reassure with ROI evidence."
        : level === 1
          ? "Simplify the explanation, offer a side-by-side comparison, monitor next turns."
          : "Continue self-service guidance.";

  return {
    score: Number(score.toFixed(3)),
    level,
    label,
    dropoutRisk,
    triggers: [...crisis, ...distress, ...confusion].slice(0, 8),
    recommendedAction,
  };
}

export function severityFromLevel(level: number): "low" | "medium" | "high" {
  if (level >= 3) return "high";
  if (level === 2) return "medium";
  return "low";
}
