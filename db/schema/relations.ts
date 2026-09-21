import { relations } from "drizzle-orm";
import {
  analyticsSnapshots,
  auditLogs,
  concernMentions,
  concerns,
  dailyPulses,
  departments,
  hrNotes,
  monthlyReports,
  notificationPreferences,
  organizations,
  recognitions,
  teams,
  users,
} from "./tables";

export const organizationsRelations = relations(organizations, ({ many }) => ({
  departments: many(departments),
  teams: many(teams),
  users: many(users),
  dailyPulses: many(dailyPulses),
  recognitions: many(recognitions),
  concerns: many(concerns),
  monthlyReports: many(monthlyReports),
  analyticsSnapshots: many(analyticsSnapshots),
  auditLogs: many(auditLogs),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [departments.organizationId],
    references: [organizations.id],
  }),
  teams: many(teams),
  users: many(users),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  department: one(departments, {
    fields: [teams.departmentId],
    references: [departments.id],
  }),
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  manager: one(users, {
    fields: [users.managerId],
    references: [users.id],
    relationName: "manager",
  }),
  reports: many(users, { relationName: "manager" }),
  dailyPulses: many(dailyPulses),
  recognitionsGiven: many(recognitions, {
    relationName: "recognitionsGiven",
  }),
  recognitionsReceived: many(recognitions, {
    relationName: "recognitionsReceived",
  }),
  concernsReported: many(concerns),
  concernMentions: many(concernMentions),
  hrNotes: many(hrNotes),
  notificationPreferences: one(notificationPreferences),
}));

export const dailyPulsesRelations = relations(dailyPulses, ({ one }) => ({
  organization: one(organizations, {
    fields: [dailyPulses.organizationId],
    references: [organizations.id],
  }),
  employee: one(users, {
    fields: [dailyPulses.employeeId],
    references: [users.id],
  }),
}));

export const recognitionsRelations = relations(recognitions, ({ one }) => ({
  organization: one(organizations, {
    fields: [recognitions.organizationId],
    references: [organizations.id],
  }),
  giver: one(users, {
    fields: [recognitions.giverId],
    references: [users.id],
    relationName: "recognitionsGiven",
  }),
  recipient: one(users, {
    fields: [recognitions.recipientId],
    references: [users.id],
    relationName: "recognitionsReceived",
  }),
}));

export const concernsRelations = relations(concerns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [concerns.organizationId],
    references: [organizations.id],
  }),
  reporter: one(users, {
    fields: [concerns.reporterId],
    references: [users.id],
  }),
  mentions: many(concernMentions),
  hrNotes: many(hrNotes),
}));

export const concernMentionsRelations = relations(concernMentions, ({ one }) => ({
  concern: one(concerns, {
    fields: [concernMentions.concernId],
    references: [concerns.id],
  }),
  mentionedEmployee: one(users, {
    fields: [concernMentions.mentionedEmployeeId],
    references: [users.id],
  }),
}));

export const hrNotesRelations = relations(hrNotes, ({ one }) => ({
  concern: one(concerns, {
    fields: [hrNotes.concernId],
    references: [concerns.id],
  }),
  author: one(users, {
    fields: [hrNotes.authorId],
    references: [users.id],
  }),
}));

export const monthlyReportsRelations = relations(monthlyReports, ({ one }) => ({
  organization: one(organizations, {
    fields: [monthlyReports.organizationId],
    references: [organizations.id],
  }),
}));

export const analyticsSnapshotsRelations = relations(
  analyticsSnapshots,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [analyticsSnapshots.organizationId],
      references: [organizations.id],
    }),
  })
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationPreferences.userId],
      references: [users.id],
    }),
  })
);