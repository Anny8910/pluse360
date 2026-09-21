import { sql } from "drizzle-orm";
import {
  index,
  integer,
  boolean,
  date,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  check,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import {
  analyticsScopeTypeEnum,
  concernSeverityEnum,
  concernStatusEnum,
  concernVisibilityEnum,
  reportStatusEnum,
  userRoleEnum,
} from "./enums";
import { MOOD_TAGS, RECOGNITION_CATEGORIES, CONCERN_CATEGORIES } from "./constants";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("organizations_slug_unique").on(t.slug)]
);

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    name: text("name").notNull(),
    image: text("image"),
    role: userRoleEnum("role").notNull(),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    managerId: uuid("manager_id").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
    jobTitle: text("job_title"),
    location: text("location"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("users_organization_email_unique").on(t.organizationId, t.email),
    index("users_organization_department_idx").on(t.organizationId, t.departmentId),
    index("users_organization_team_idx").on(t.organizationId, t.teamId),
  ]
);

export const dailyPulses = pgTable(
  "daily_pulses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pulseDate: date("pulse_date", { mode: "date" }).notNull(),
    sentimentScore: integer("sentiment_score").notNull(),
    moodTags: jsonb("mood_tags")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    bestMoment: text("best_moment"),
    improvementText: text("improvement_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("daily_pulses_employee_date_unique").on(t.employeeId, t.pulseDate),
    index("daily_pulses_employee_date_idx").on(t.employeeId, t.pulseDate),
    index("daily_pulses_org_date_idx").on(t.organizationId, t.pulseDate),
    check(
      "daily_pulses_sentiment_range",
      sql`${t.sentimentScore} between 1 and 5`
    ),
  ]
);

export const recognitions = pgTable(
  "recognitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    giverId: uuid("giver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recognitionDate: date("recognition_date", { mode: "date" }).notNull(),
    category: text("category").notNull(),
    message: text("message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("recognitions_recipient_date_idx").on(t.recipientId, t.recognitionDate),
    index("recognitions_giver_date_idx").on(t.giverId, t.recognitionDate),
    index("recognitions_org_date_idx").on(t.organizationId, t.recognitionDate),
    check("recognitions_no_self", sql`${t.giverId} <> ${t.recipientId}`),
  ]
);

export const concerns = pgTable(
  "concerns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    reporterId: uuid("reporter_id").references(() => users.id, {
      onDelete: "set null",
    }),
    category: text("category").notNull(),
    description: text("description"),
    anonymous: boolean("anonymous").notNull().default(false),
    visibility: concernVisibilityEnum("visibility")
      .notNull()
      .default("hr_only"),
    status: concernStatusEnum("status").notNull().default("new"),
    severity: concernSeverityEnum("severity").notNull().default("low"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("concerns_org_created_idx").on(t.organizationId, t.createdAt),
    index("concerns_status_created_idx").on(t.status, t.createdAt),
  ]
);

export const concernMentions = pgTable(
  "concern_mentions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    concernId: uuid("concern_id")
      .notNull()
      .references(() => concerns.id, { onDelete: "cascade" }),
    mentionedEmployeeId: uuid("mentioned_employee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("concern_mentions_concern_employee_unique").on(
      t.concernId,
      t.mentionedEmployeeId
    ),
  ]
);

export const hrNotes = pgTable(
  "hr_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    concernId: uuid("concern_id")
      .notNull()
      .references(() => concerns.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    note: text("note").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("hr_notes_concern_idx").on(t.concernId)]
);

export const monthlyReports = pgTable(
  "monthly_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    status: reportStatusEnum("status").notNull().default("draft"),
    reportJson: jsonb("report_json").$type<unknown>(),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("monthly_reports_org_year_month_unique").on(t.organizationId, t.year, t.month),
  ]
);

export const analyticsSnapshots = pgTable(
  "analytics_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    snapshotDate: date("snapshot_date", { mode: "date" }).notNull(),
    scopeType: analyticsScopeTypeEnum("scope_type").notNull(),
    scopeId: uuid("scope_id"),
    participationRate: numeric("participation_rate", { precision: 5, scale: 2 }),
    averagePulse: numeric("average_pulse", { precision: 3, scale: 2 }),
    positiveRate: numeric("positive_rate", { precision: 5, scale: 2 }),
    neutralRate: numeric("neutral_rate", { precision: 5, scale: 2 }),
    negativeRate: numeric("negative_rate", { precision: 5, scale: 2 }),
    recognitionCount: integer("recognition_count"),
    concernCount: integer("concern_count"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("analytics_snapshots_org_date_idx").on(t.organizationId, t.snapshotDate),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_logs_org_created_idx").on(t.organizationId, t.createdAt),
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
  ]
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    dailyPulseEnabled: boolean("daily_pulse_enabled").notNull().default(true),
    emailEnabled: boolean("email_enabled").notNull().default(false),
    slackEnabled: boolean("slack_enabled").notNull().default(false),
    teamsEnabled: boolean("teams_enabled").notNull().default(false),
    reminderTime: text("reminder_time"),
    timezone: text("timezone"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

// --- Better Auth tables -----------------------------------------------------
// session/account/verification are owned by Better Auth. ids are supplied as
// UUID strings by Better Auth (`advanced.database.generateId: "uuid"`); the
// uuid default above is a safety net only.

export const session = pgTable(
  "session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("session_user_id_idx").on(t.userId),
    index("session_expires_at_idx").on(t.expiresAt),
  ]
);

export const account = pgTable(
  "account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("account_provider_account_unique").on(t.providerId, t.accountId),
    index("account_user_id_idx").on(t.userId),
  ]
);

export const verification = pgTable(
  "verification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("verification_identifier_idx").on(t.identifier),
    index("verification_expires_at_idx").on(t.expiresAt),
  ]
);
// Export option lists for reuse in validation/UI (schema-level source of truth).
export { MOOD_TAGS, RECOGNITION_CATEGORIES, CONCERN_CATEGORIES };

export type Organization = typeof organizations.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type DailyPulse = typeof dailyPulses.$inferSelect;
export type Recognition = typeof recognitions.$inferSelect;
export type Concern = typeof concerns.$inferSelect;
export type ConcernMention = typeof concernMentions.$inferSelect;
export type HrNote = typeof hrNotes.$inferSelect;
export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;