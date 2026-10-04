import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  real,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("student"), // 'student' | 'parent' | 'counselor' | 'admin'
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  state: text("state").default("Tamil Nadu"),
  district: text("district").default("Vellore"),
  educationLevel: text("education_level").default("12th Pass"),
  preferredLanguage: text("preferred_language").default("ta"),
  mobilityPreference: text("mobility_preference").default("Within District"),
  budgetLevel: text("budget_level").default("Low (< ₹25,000)"),
  summary: text("summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const studentProfiles = pgTable("student_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  interests: jsonb("interests").$type<string[]>().default([]),
  currentSkills: jsonb("current_skills").$type<string[]>().default([]),
  budgetMax: integer("budget_max").default(30000),
  linkedParentId: text("linked_parent_id"),
  parentConsentGiven: boolean("parent_consent_given").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const parentProfiles = pgTable("parent_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  linkedStudentIds: jsonb("linked_student_ids").$type<string[]>().default([]),
  maxInvestmentBudget: integer("max_investment_budget").default(100000),
  primaryConcerns: jsonb("primary_concerns").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New Conversation"),
  roleContext: text("role_context").notNull().default("student"), // 'student' | 'parent'
  language: text("language").notNull().default("ta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  audioUrl: text("audio_url"),
  intent: text("intent"),
  detectedEmotion: text("detected_emotion").default("NORMAL"), // 'NORMAL' | 'CONFUSED' | 'ANXIOUS' | 'HIGH CONCERN' | 'URGENT'
  evidenceCitations: jsonb("evidence_citations").$type<
    {
      sourceId: string;
      title: string;
      organization: string;
      url: string;
      verificationDate: string;
      snippet: string;
    }[]
  >(),
  claimValidationStatus: text("claim_validation_status").default("VERIFIED"), // 'VERIFIED' | 'PARTIAL' | 'FALLBACK' | 'UNVERIFIED'
  metadata: jsonb("metadata"), // recommendations, skill gaps, comparison data, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  sourceCode: text("source_code").notNull().unique(), // e.g. "GOV-NCVET-2024"
  organization: text("organization").notNull(), // e.g. "National Council for Vocational Education and Training"
  title: text("title").notNull(),
  url: text("url").notNull(),
  documentType: text("document_type").notNull().default("Official Notification"),
  publicationDate: text("publication_date").notNull(),
  retrievedDate: text("retrieved_date").notNull(),
  version: text("version").default("1.0"),
  verificationStatus: text("verification_status").notNull().default("Verified"),
  checksum: text("checksum"),
  language: text("language").default("English"),
  category: text("category").notNull().default("Vocational Standards"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  sourceId: text("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  filePath: text("file_path"),
  contentType: text("content_type").default("application/json"),
  fileSize: integer("file_size").default(0),
  status: text("status").default("INDEXED"), // 'PENDING' | 'INDEXED' | 'FAILED'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentChunks = pgTable("document_chunks", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  sourceId: text("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  textContent: text("text_content").notNull(),
  embedding: jsonb("embedding").$type<number[]>(),
  keywords: jsonb("keywords").$type<string[]>(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const occupations = pgTable("occupations", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  requiredQualification: text("required_qualification").notNull(),
  minAge: integer("min_age").default(18),
  salaryMin: integer("salary_min").notNull(),
  salaryMax: integer("salary_max").notNull(),
  salarySource: text("salary_source").notNull(),
  salaryVerifiedDate: text("salary_verified_date").notNull(),
  localDemandRating: integer("local_demand_rating").notNull().default(85), // 0-100
  coreSkills: jsonb("core_skills").$type<string[]>().notNull(),
  progressionPath: jsonb("progression_path").$type<string[]>().notNull(),
  sourceId: text("source_id").references(() => sources.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trainingPrograms = pgTable("training_programs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  provider: text("provider").notNull(),
  durationMonths: integer("duration_months").notNull(),
  qualificationAwarded: text("qualification_awarded").notNull(),
  costInr: integer("cost_inr").notNull(),
  governmentScheme: text("government_scheme").notNull(),
  eligibility: text("eligibility").notNull(),
  locationDistrict: text("location_district").notNull(),
  locationState: text("location_state").notNull(),
  skillsCovered: jsonb("skills_covered").$type<string[]>().notNull(),
  occupationId: text("occupation_id").references(() => occupations.id),
  sourceId: text("source_id").references(() => sources.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const laborMarketData = pgTable("labor_market_data", {
  id: text("id").primaryKey(),
  district: text("district").notNull(),
  state: text("state").notNull(),
  occupationId: text("occupation_id")
    .notNull()
    .references(() => occupations.id, { onDelete: "cascade" }),
  demandScore: integer("demand_score").notNull(), // 0-100
  salaryMin: integer("salary_min").notNull(),
  salaryMax: integer("salary_max").notNull(),
  activeJobCount: integer("active_job_count").notNull(),
  dataFreshnessDate: text("data_freshness_date").notNull(),
  sourceId: text("source_id").references(() => sources.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savedCareers = pgTable("saved_careers", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  occupationId: text("occupation_id")
    .notNull()
    .references(() => occupations.id, { onDelete: "cascade" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const familyComparisons = pgTable("family_comparisons", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  occupationIds: jsonb("occupation_ids").$type<string[]>().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roiCalculations = pgTable("roi_calculations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  occupationId: text("occupation_id").notNull(),
  trainingProgramId: text("training_program_id"),
  courseFee: integer("course_fee").notNull(),
  travelCost: integer("travel_cost").notNull(),
  accommodationCost: integer("accommodation_cost").notNull(),
  equipmentCost: integer("equipment_cost").notNull(),
  userExpectedIncome: integer("user_expected_income").notNull(),
  verifiedSalaryMin: integer("verified_salary_min").notNull(),
  verifiedSalaryMax: integer("verified_salary_max").notNull(),
  financialAssistance: integer("financial_assistance").notNull().default(0),
  calculatedPaybackMonths: real("calculated_payback_months").notNull(),
  calculatedCostIncomeRatio: real("calculated_cost_income_ratio").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const counselorCases = pgTable("counselor_cases", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  conversationId: text("conversation_id"),
  priority: text("priority").notNull().default("MEDIUM"), // 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  reason: text("reason").notNull(),
  conversationSummary: text("conversation_summary").notNull(),
  detectedConcern: text("detected_concern").notNull(),
  assignedCounselorId: text("assigned_counselor_id"),
  status: text("status").notNull().default("NEW"), // 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED'
  counselorNotes: text("counselor_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const counselorNotes = pgTable("counselor_notes", {
  id: text("id").primaryKey(),
  caseId: text("case_id")
    .notNull()
    .references(() => counselorCases.id, { onDelete: "cascade" }),
  counselorId: text("counselor_id").notNull(),
  counselorName: text("counselor_name").notNull(),
  noteText: text("note_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ragAuditLogs = pgTable("rag_audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  query: text("query").notNull(),
  retrievedChunks: jsonb("retrieved_chunks").$type<
    {
      chunkId: string;
      sourceCode: string;
      title: string;
      score: number;
    }[]
  >(),
  generatedResponse: text("generated_response").notNull(),
  citations: jsonb("citations").$type<
    {
      sourceCode: string;
      organization: string;
      url: string;
    }[]
  >(),
  validationResult: text("validation_result").notNull(), // 'PASSED' | 'WARNING' | 'FALLBACK_TRIGGERED'
  confidence: real("confidence").notNull().default(0.92),
  fallbackTriggered: boolean("fallback_triggered").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // 'info' | 'counselor' | 'career' | 'system'
  read: boolean("read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
