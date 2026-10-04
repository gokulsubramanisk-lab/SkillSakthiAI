// Shared domain types for the SIH26241 platform (Team 125818 - SYSTRONICS).

export type Role = "student" | "parent" | "counselor" | "admin";

export type TrustTag = {
  agency: "MSDE" | "NSDC" | "ITI" | "NSQF" | "OtherGov";
  label: string;
  sourceUrl: string;
};

export type Citation = {
  documentId: number;
  title: string;
  agency: TrustTag["agency"];
  sourceUrl: string;
  snippet: string;
  similarity: number;
};

export type GroundedAnswer = {
  answer: string;
  citations: Citation[];
  grounded: boolean;
  confidence: number;
  escalate: boolean;
  escalationReason?: string;
  mode: "extractive" | "llm-verified" | "refusal";
  model: string;
  provider: string;
  latencyMs: number;
};

export type DistressSignal = {
  score: number; // -1 (severe distress) .. 1 (positive)
  level: 0 | 1 | 2 | 3; // 0 none, 1 confusion, 2 distress, 3 crisis
  label: "calm" | "confused" | "distressed" | "crisis";
  dropoutRisk: boolean;
  triggers: string[];
  recommendedAction: string;
};

export type CareerMatch = {
  careerId: number;
  name: string;
  nsqfLevel: number | null;
  description: string | null;
  semanticScore: number;
  demandScore: number;
  safetyScore: number;
  finalScore: number;
  districtCode: string;
  districtName: string;
  jobOpenings: number;
  placementRate: number;
  avgSalary: number;
  avgFiveYearSalary: number;
  trainingMonths: number;
  trainingCost: number;
  sourceUrl: string | null;
  sourceAgency: TrustTag["agency"] | null;
  matchedSkills: string[];
  missingSkills: string[];
};

export type RoiProjection = {
  careerId: number;
  careerName: string;
  districtCode: string;
  districtName: string;
  trainingMonths: number;
  grossTrainingCost: number;
  schemeSupport: number;
  netTrainingCost: number;
  schemeName: string | null;
  schemeSourceUrl: string | null;
  monthlyStartSalary: number;
  monthlyFiveYearSalary: number;
  annualGrowthRate: number;
  yearlyEarnings: { year: number; monthlySalary: number; annualEarnings: number }[];
  fiveYearGrossEarnings: number;
  fiveYearNetGain: number;
  breakEvenMonths: number;
  employmentSafetyScore: number;
  placementRate: number;
  jobOpenings: number;
  safetyBand: "High" | "Moderate" | "Watch";
  anxietyReductionNote: string;
  citations: Citation[];
};

export type SkillGapPrescription = {
  careerId: number;
  careerName: string;
  nsqfCurrent: number;
  nsqfTarget: number;
  matchedSkills: string[];
  missingSkills: string[];
  readinessPercent: number;
  modules: {
    id: number;
    code: string;
    title: string;
    itiName: string | null;
    nsqfLevel: number | null;
    durationMonths: number | null;
    tuitionCost: number;
    districtCode: string;
    sourceUrl: string | null;
    coversSkills: string[];
  }[];
  citations: Citation[];
};

export type CounselReply = {
  conversationId: number;
  messageId: number;
  transcript: string;
  language: string;
  distress: DistressSignal;
  answer: GroundedAnswer;
  sosCaseId: number | null;
  speak: string;
};

export type AuditMetrics = {
  totalResponses: number;
  groundedResponses: number;
  groundingRate: number;
  hallucinationRate: number;
  citationCoverage: number;
  refusals: number;
  escalations: number;
  openCases: number;
  avgLatencyMs: number;
  documentsIndexed: number;
  byAgency: { agency: string; documents: number }[];
};
