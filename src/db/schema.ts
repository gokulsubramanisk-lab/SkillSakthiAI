import {
  pgTable,
  serial,
  uuid,
  text,
  integer,
  timestamp,
  numeric,
  boolean,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// --- Enums ---

export const userRoleEnum = pgEnum("user_role", [
  "student",
  "parent",
  "counselor",
  "admin",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "active",
  "completed",
  "escalated",
]);

export const sosStatusEnum = pgEnum("sos_status", [
  "open",
  "assigned",
  "resolved",
]);

export const sosSeverityEnum = pgEnum("sos_severity", [
  "low",
  "medium",
  "high",
]);

export const documentCategoryEnum = pgEnum("document_category", [
  "career",
  "scheme",
  "policy",
  "guideline",
  "iti_module",
  "nsqf",
  "faq",
]);

export const sourceAgencyEnum = pgEnum("source_agency", [
  "MSDE",
  "NSDC",
  "ITI",
  "NSQF",
  "OtherGov",
]);

export const conversationTypeEnum = pgEnum("conversation_type", [
  "career_match",
  "roi",
  "skill_gap",
  "general_info",
]);

export const senderRoleEnum = pgEnum("sender_role", [
  "user",
  "assistant",
  "system",
]);

// --- Core identity & access control ---

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    role: userRoleEnum("role").notNull(),
    phone: text("phone"),
    language: text("language").notNull().default("hi-IN"),
    districtCode: text("district_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    roleIdx: index("users_role_idx").on(table.role),
    districtIdx: index("users_district_idx").on(table.districtCode),
  }),
);

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleSnapshot: userRoleEnum("role_snapshot").notNull(),
    status: sessionStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => ({
    userIdx: index("user_sessions_user_idx").on(table.userId),
    statusIdx: index("user_sessions_status_idx").on(table.status),
  }),
);

// --- Districts & labor market ---

export const districts = pgTable(
  "districts",
  {
    code: text("code").primaryKey(),
    name: text("name").notNull(),
    state: text("state").notNull(),
    regionType: text("region_type").notNull(), // rural / urban / mixed
  },
  (table) => ({
    stateIdx: index("districts_state_idx").on(table.state),
  }),
);

export const careers = pgTable(
  "careers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    nsqfLevel: integer("nsqf_level"),
    description: text("description"),
    govDocumentId: integer("gov_document_id"),
    sourceUrl: text("source_url"),
    sourceAgency: sourceAgencyEnum("source_agency"),
    minTrainingMonths: integer("min_training_months"),
    maxTrainingMonths: integer("max_training_months"),
    avgStartSalary: numeric("avg_start_salary"),
    avgFiveYearSalary: numeric("avg_five_year_salary"),
    employmentSafetyScore: integer("employment_safety_score"), // 0-100
    typicalTrainingCost: numeric("typical_training_cost"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nsqfIdx: index("careers_nsqf_idx").on(table.nsqfLevel),
  }),
);

export const districtLaborStats = pgTable(
  "district_labor_stats",
  {
    id: serial("id").primaryKey(),
    districtCode: text("district_code")
      .notNull()
      .references(() => districts.code, { onDelete: "cascade" }),
    careerId: integer("career_id")
      .notNull()
      .references(() => careers.id, { onDelete: "cascade" }),
    avgSalary: numeric("avg_salary"),
    jobOpenings: integer("job_openings"),
    placementRate: numeric("placement_rate"), // 0-1
    attritionRate: numeric("attrition_rate"), // 0-1
    lastUpdated: timestamp("last_updated", { withTimezone: true })
      .defaultNow()
      .notNull(),
    sourceUrl: text("source_url"),
  },
  (table) => ({
    districtCareerIdx: index("district_labor_stats_dc_idx").on(
      table.districtCode,
      table.careerId,
    ),
  }),
);

// --- Skills & training modules ---

export const skills = pgTable(
  "skills",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    nsqfLevel: integer("nsqf_level"),
    description: text("description"),
    govDocumentId: integer("gov_document_id"),
  },
  (table) => ({
    nameIdx: index("skills_name_idx").on(table.name),
  }),
);

export const studentSkills = pgTable(
  "student_skills",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    proficiencyLevel: integer("proficiency_level"), // 1-5
    evidenceText: text("evidence_text"),
  },
  (table) => ({
    studentIdx: index("student_skills_student_idx").on(table.studentId),
  }),
);

export const trainingModules = pgTable(
  "training_modules",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    title: text("title").notNull(),
    nsqfLevel: integer("nsqf_level"),
    durationMonths: integer("duration_months"),
    tuitionCost: numeric("tuition_cost"),
    itiName: text("iti_name"),
    districtCode: text("district_code")
      .notNull()
      .references(() => districts.code, { onDelete: "cascade" }),
    careerId: integer("career_id")
      .references(() => careers.id, { onDelete: "cascade" }),
    govDocumentId: integer("gov_document_id"),
    sourceUrl: text("source_url"),
  },
  (table) => ({
    districtIdx: index("training_modules_district_idx").on(table.districtCode),
  }),
);

export const trainingModuleSkills = pgTable(
  "training_module_skills",
  {
    id: serial("id").primaryKey(),
    trainingModuleId: integer("training_module_id")
      .notNull()
      .references(() => trainingModules.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => ({
    moduleIdx: index("training_module_skills_module_idx").on(
      table.trainingModuleId,
    ),
  }),
);

// --- Government RAG vault ---

export const govDocuments = pgTable(
  "gov_documents",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    category: documentCategoryEnum("category").notNull(),
    body: text("body").notNull(),
    language: text("language").notNull(),
    nsqfLevel: integer("nsqf_level"),
    sourceUrl: text("source_url").notNull(),
    sourceAgency: sourceAgencyEnum("source_agency").notNull(),
    embedding: jsonb("embedding"), // number[]
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    categoryIdx: index("gov_documents_category_idx").on(table.category),
    languageIdx: index("gov_documents_language_idx").on(table.language),
  }),
);

export const welfareSchemes = pgTable(
  "welfare_schemes",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    eligibilityCriteria: text("eligibility_criteria"),
    benefitAmount: numeric("benefit_amount"),
    districtCode: text("district_code").references(() => districts.code, {
      onDelete: "set null",
    }),
    careerId: integer("career_id").references(() => careers.id, {
      onDelete: "set null",
    }),
    govDocumentId: integer("gov_document_id"),
    sourceUrl: text("source_url").notNull(),
  },
  (table) => ({
    districtIdx: index("welfare_schemes_district_idx").on(table.districtCode),
  }),
);

// --- Conversations, messages, SOS & audit ---

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => userSessions.id, { onDelete: "cascade" }),
    type: conversationTypeEnum("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdx: index("conversations_session_idx").on(table.sessionId),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderRole: senderRoleEnum("sender_role").notNull(),
    modality: text("modality").notNull(), // voice / text
    content: text("content").notNull(),
    transcript: text("transcript"),
    language: text("language"),
    sentimentScore: numeric("sentiment_score"), // -1..1
    distressLevel: integer("distress_level"), // 0-3
    sosFlag: boolean("sos_flag").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    convIdx: index("messages_conv_idx").on(table.conversationId),
  }),
);

export const sosCases = pgTable(
  "sos_cases",
  {
    id: serial("id").primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => userSessions.id, { onDelete: "cascade" }),
    triggerMessageId: integer("trigger_message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    severity: sosSeverityEnum("severity").notNull(),
    status: sosStatusEnum("status").notNull().default("open"),
    counselorId: integer("counselor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    recommendedModules: jsonb("recommended_modules"), // number[] of training module IDs
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdx: index("sos_cases_session_idx").on(table.sessionId),
    statusIdx: index("sos_cases_status_idx").on(table.status),
  }),
);

export const aiResponses = pgTable(
  "ai_responses",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    messageId: integer("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    groundedInDocuments: boolean("grounded_in_documents")
      .notNull()
      .default(false),
    retrievedDocumentIds: jsonb("retrieved_document_ids"), // number[]
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    latencyMs: integer("latency_ms"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    convIdx: index("ai_responses_conv_idx").on(table.conversationId),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("audit_logs_user_idx").on(table.userId),
  }),
);

// --- Family comparison & parent calculator ---

export const familyComparisons = pgTable(
  "family_comparisons",
  {
    id: serial("id").primaryKey(),
    parentId: integer("parent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studentId: integer("student_id").references(() => users.id, {
      onDelete: "set null",
    }),
    label: text("label"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    parentIdx: index("family_comparisons_parent_idx").on(table.parentId),
  }),
);

export const familyComparisonItems = pgTable(
  "family_comparison_items",
  {
    id: serial("id").primaryKey(),
    comparisonId: integer("comparison_id")
      .notNull()
      .references(() => familyComparisons.id, { onDelete: "cascade" }),
    careerId: integer("career_id")
      .notNull()
      .references(() => careers.id, { onDelete: "cascade" }),
    trainingModuleId: integer("training_module_id").references(
      () => trainingModules.id,
      { onDelete: "set null" },
    ),
    welfareSchemeId: integer("welfare_scheme_id").references(
      () => welfareSchemes.id,
      { onDelete: "set null" },
    ),
    totalCost: numeric("total_cost"),
    durationMonths: integer("duration_months"),
    projectedFiveYearNetEarnings: numeric(
      "projected_five_year_net_earnings",
    ),
    employmentSafetyScore: integer("employment_safety_score"),
  },
  (table) => ({
    comparisonIdx: index("family_comparison_items_comp_idx").on(
      table.comparisonId,
    ),
  }),
);

export const parentCalculatorSnapshots = pgTable(
  "parent_calculator_snapshots",
  {
    id: serial("id").primaryKey(),
    parentId: integer("parent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studentId: integer("student_id").references(() => users.id, {
      onDelete: "set null",
    }),
    districtCode: text("district_code").references(() => districts.code, {
      onDelete: "set null",
    }),
    // Serialized ROI comparison payload for quick reload on the Parent Calculator screen
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    parentIdx: index("parent_calc_snapshots_parent_idx").on(table.parentId),
  }),
);
