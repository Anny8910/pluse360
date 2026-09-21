// Static enumerations and option lists for Pulse360.
// These reflect the master build document (§7, §9, §11, §12, §14).

export const ROLE_ENUM_VALUES = ["employee", "manager", "hr", "admin"] as const;

export const CONCERN_VISIBILITY_VALUES = [
  "hr_only",
  "manager_and_hr",
  "anonymous_to_management",
] as const;

export const CONCERN_STATUS_VALUES = [
  "new",
  "reviewed",
  "investigating",
  "action_taken",
  "resolved",
] as const;

export const CONCERN_SEVERITY_VALUES = ["low", "medium", "high"] as const;

export const REPORT_STATUS_VALUES = ["draft", "generated", "published"] as const;

export const ANALYTICS_SCOPE_VALUES = ["company", "department", "team"] as const;

export const MOOD_TAGS = [
  "Productive",
  "Stressful",
  "Collaborative",
  "Frustrating",
  "Motivating",
  "Routine",
  "Challenging",
  "Fun",
  "Overwhelming",
  "Appreciated",
  "Isolated",
] as const;

export const RECOGNITION_CATEGORIES = [
  "Collaboration",
  "Problem solving",
  "Mentorship",
  "Ownership",
  "Customer focus",
  "Communication",
  "Creativity",
  "Leadership",
  "Execution",
  "Support",
] as const;

export const CONCERN_CATEGORIES = [
  "process",
  "collaboration",
  "manager",
  "customer",
  "workload",
  "communication",
  "meetings",
  "other",
] as const;