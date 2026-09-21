import { pgEnum } from "drizzle-orm/pg-core";
import {
  ANALYTICS_SCOPE_VALUES,
  CONCERN_SEVERITY_VALUES,
  CONCERN_STATUS_VALUES,
  CONCERN_VISIBILITY_VALUES,
  REPORT_STATUS_VALUES,
  ROLE_ENUM_VALUES,
} from "./constants";

export const userRoleEnum = pgEnum("user_role", ROLE_ENUM_VALUES);
export const concernVisibilityEnum = pgEnum(
  "concern_visibility",
  CONCERN_VISIBILITY_VALUES
);
export const concernStatusEnum = pgEnum("concern_status", CONCERN_STATUS_VALUES);
export const concernSeverityEnum = pgEnum(
  "concern_severity",
  CONCERN_SEVERITY_VALUES
);
export const reportStatusEnum = pgEnum("report_status", REPORT_STATUS_VALUES);
export const analyticsScopeTypeEnum = pgEnum(
  "analytics_scope_type",
  ANALYTICS_SCOPE_VALUES
);