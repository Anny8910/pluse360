// db/seed.ts
// Seeds realistic, fully fake development data (master build document §42).
//
// IMPORTANT: Every person's name/email below is invented. No real personal
// information is used.
//
// Run: npm run db:seed
// The script loads DATABASE_URL from .env.local via dotenv. It is destructive —
// it deletes existing rows in the seed organization tables before inserting.

import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import {
  MOOD_TAGS,
  RECOGNITION_CATEGORIES,
  CONCERN_CATEGORIES,
} from "./schema";

config({ path: ".env.local" });

// Deterministic PRNG so reseeding is stable across runs.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260901);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;
const intBetween = (min: number, max: number) =>
  min + Math.floor(rand() * (max - min + 1));

const dayFromToday = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

const isWeekday = (d: Date) => {
  const weekday = d.getUTCDay();
  return weekday >= 1 && weekday <= 5;
};

const datesInRange = (startOffset: number, endOffset: number) => {
  const out: Date[] = [];
  for (let i = startOffset; i <= endOffset; i++) out.push(dayFromToday(i));
  return out;
};

function sentimentScore() {
  const r = rand();
  if (r < 0.06) return 1;
  if (r < 0.18) return 2;
  if (r < 0.42) return 3;
  if (r < 0.8) return 4;
  return 5;
}

function moodTags(): string[] {
  const count = intBetween(1, 3);
  const shuffled = [...MOOD_TAGS].sort(() => rand() - 0.5);
  return shuffled.slice(0, count);
}

const FIRST_NAMES = [
  "Ananya", "Rohan", "Priya", "Arjun", "Meera", "Vikram", "Sneha", "Kabir",
  "Ishita", "Aditya", "Nisha", "Rahul", "Kavya", "Sanjay", "Divya", "Nikhil",
  "Tanvi", "Suresh", "Pooja", "Amit", "Rekha", "Vivek",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Nair", "Iyer", "Reddy", "Gupta", "Mehta", "Kapoor",
  "Joshi", "Das", "Chopra", "Malhotra", "Rao", "Bose", "Menon", "Kulkarni",
];

const JOB_TITLES = [
  "Software Engineer", "Senior Software Engineer", "Product Designer",
  "Data Analyst", "Account Executive", "Sales Development Rep",
  "Growth Marketer", "Content Strategist", "Operations Associate",
  "Customer Support Specialist", "QA Engineer", "DevOps Engineer",
];

const LOCATIONS = ["Bengaluru", "Mumbai", "Delhi", "Pune", "Remote"];

const BEST_MOMENTS = [
  "Deployed the new login flow to production",
  "Closed a deal with a long-hesitant customer",
  "A teammate walked me through the API I struggled with",
  "Finally passed a tricky code review",
  "Great standup where everyone aligned on the sprint",
  "Customer sent a thank-you note for support",
  "Finished the quarterly report ahead of schedule",
  "Shipped the onboarding revamp",
];

const IMPROVEMENT_IDEAS = [
  "Shorter standups so we can start deep work earlier",
  "Fewer overlapping meetings in the afternoon",
  "Clearer priorities on the roadmap",
  "A dedicated quiet focus block without interruptions",
  "Better documentation for the onboarding flow",
  "Faster build pipeline would help everyone",
];

const RECOGNITION_MESSAGES = [
  "Thank you for covering the release while I was out.",
  "Your clarity on the sprint plan kept us on track.",
  "Great catch on the edge case before it shipped.",
  "Love how you explain complex ideas so simply.",
  "You went above and beyond helping the new joiners.",
  "Thanks for the honest feedback on my design.",
  "You kept the customer call calm and moving.",
  "Your refactor made the module so much easier to maintain.",
];

const CONCERN_DESCRIPTIONS = [
  "The release was rushed and we skipped needed QA.",
  "Two teams are building overlapping features without coordination.",
  "Feedback in the code review felt harsh and one-sided.",
  "A customer escalation is consuming the whole week.",
  "The sprint scope kept growing without reprioritization.",
  "Standup runs long and nobody tracks action items.",
  "Meeting-heavy Tuesday means no time for deep work.",
  "Nobody owns the bug triage queue right now.",
];

async function main() {
  const { db } = await import("./index");
  const {
    analyticsSnapshots,
    auditLogs,
    concernMentions,
    concerns,
    dailyPulses,
    departments,
    hrNotes,
    notificationPreferences,
    organizations,
    recognitions,
    teams,
    users,
  } = await import("./schema");

  console.log("Clearing existing seed data…");

  await db.delete(notificationPreferences);
  await db.delete(hrNotes);
  await db.delete(concernMentions);
  await db.delete(concerns);
  await db.delete(recognitions);
  await db.delete(dailyPulses);
  await db.delete(auditLogs);
  await db.delete(analyticsSnapshots);
  await db.delete(users);
  await db.delete(teams);
  await db.delete(departments);
  await db.delete(organizations);

  // --- Organization -------------------------------------------------------
  const orgId = randomUUID();
  await db.insert(organizations).values({
    id: orgId,
    name: "Pulse360 Demo Company",
    slug: "pulse360-demo",
    timezone: "Asia/Kolkata",
  });

  // --- Departments & teams ------------------------------------------------
  const engineeringId = randomUUID();
  const salesId = randomUUID();
  const marketingId = randomUUID();
  const operationsId = randomUUID();

  const deptRows = [
    { id: engineeringId, name: "Engineering" },
    { id: salesId, name: "Sales" },
    { id: marketingId, name: "Marketing" },
    { id: operationsId, name: "Operations" },
  ].map((d) => ({ ...d, organizationId: orgId }));

  await db.insert(departments).values(deptRows);

  const frontendId = randomUUID();
  const backendId = randomUUID();
  const enterpriseSalesId = randomUUID();
  const growthId = randomUUID();
  const opsTeamId = randomUUID();

  const teamRows = [
    { id: frontendId, departmentId: engineeringId, name: "Frontend" },
    { id: backendId, departmentId: engineeringId, name: "Backend" },
    { id: enterpriseSalesId, departmentId: salesId, name: "Enterprise Sales" },
    { id: growthId, departmentId: marketingId, name: "Growth" },
    { id: opsTeamId, departmentId: operationsId, name: "Operations" },
  ].map((t) => ({ ...t, organizationId: orgId }));

  await db.insert(teams).values(teamRows);

  // --- Users ---------------------------------------------------------------
  // Roles: 1 admin, 2 HR, 4 managers (one per department), rest employees.
  function makeUser(
    i: number,
    role: "employee" | "manager" | "hr" | "admin",
    departmentId: string,
    teamId: string,
    managerId?: string
  ) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@pulse360.dev`;
    return {
      id: randomUUID(),
      organizationId: orgId,
      email,
      name: `${first} ${last}`,
      role,
      departmentId,
      teamId,
      managerId: managerId ?? null,
      jobTitle: role === "manager" ? "Head of Department" : pick(JOB_TITLES),
      location: pick(LOCATIONS),
      active: true,
    };
  }

  const adminUser = makeUser(0, "admin", operationsId, opsTeamId);
  const hr1 = makeUser(1, "hr", operationsId, opsTeamId);
  const hr2 = makeUser(2, "hr", operationsId, opsTeamId);

  const engManager = makeUser(3, "manager", engineeringId, backendId);
  const salesManager = makeUser(4, "manager", salesId, enterpriseSalesId);
  const mktManager = makeUser(5, "manager", marketingId, growthId);
  const opsManager = makeUser(6, "manager", operationsId, opsTeamId);

  const employees = [
    // Engineering
    makeUser(7, "employee", engineeringId, frontendId, engManager.id),
    makeUser(8, "employee", engineeringId, frontendId, engManager.id),
    makeUser(9, "employee", engineeringId, frontendId, engManager.id),
    makeUser(10, "employee", engineeringId, backendId, engManager.id),
    makeUser(11, "employee", engineeringId, backendId, engManager.id),
    makeUser(12, "employee", engineeringId, backendId, engManager.id),
    // Sales
    makeUser(13, "employee", salesId, enterpriseSalesId, salesManager.id),
    makeUser(14, "employee", salesId, enterpriseSalesId, salesManager.id),
    makeUser(15, "employee", salesId, enterpriseSalesId, salesManager.id),
    // Marketing
    makeUser(16, "employee", marketingId, growthId, mktManager.id),
    makeUser(17, "employee", marketingId, growthId, mktManager.id),
    makeUser(18, "employee", marketingId, growthId, mktManager.id),
    // Operations
    makeUser(19, "employee", operationsId, opsTeamId, opsManager.id),
    makeUser(20, "employee", operationsId, opsTeamId, opsManager.id),
    makeUser(21, "employee", operationsId, opsTeamId, opsManager.id),
    // Extra employees to reach ~20
    makeUser(22, "employee", engineeringId, frontendId, engManager.id),
    makeUser(23, "employee", engineeringId, backendId, engManager.id),
    makeUser(24, "employee", salesId, enterpriseSalesId, salesManager.id),
    makeUser(25, "employee", marketingId, growthId, mktManager.id),
  ];

  const allUsers = [
    adminUser,
    hr1,
    hr2,
    engManager,
    salesManager,
    mktManager,
    opsManager,
    ...employees,
  ];

  await db.insert(users).values(allUsers.map((u) => ({ ...u })));

  await db.insert(notificationPreferences).values(
    allUsers.map((u) => ({
      userId: u.id,
      dailyPulseEnabled: true,
      emailEnabled: chance(0.3),
      slackEnabled: chance(0.2),
      teamsEnabled: chance(0.1),
      reminderTime: "17:30",
      timezone: "Asia/Kolkata",
    }))
  );

  // --- Daily pulses (last ~90 days) ---------------------------------------
  const employeeIds = employees.map((e) => e.id);
  const pulseDays = datesInRange(-89, 0);
  const pulses: {
    id: string;
    organizationId: string;
    employeeId: string;
    pulseDate: Date;
    sentimentScore: number;
    moodTags: string[];
    bestMoment: string | null;
    improvementText: string | null;
  }[] = [];

  for (const day of pulseDays) {
    const weekdayP = isWeekday(day);
    for (const employeeId of employeeIds) {
      const submits = weekdayP ? chance(0.9) : chance(0.15);
      if (!submits) continue;
      pulses.push({
        id: randomUUID(),
        organizationId: orgId,
        employeeId,
        pulseDate: day,
        sentimentScore: sentimentScore(),
        moodTags: moodTags(),
        bestMoment: chance(0.3) ? pick(BEST_MOMENTS) : null,
        improvementText: chance(0.12) ? pick(IMPROVEMENT_IDEAS) : null,
      });
    }
  }

  console.log(`Inserting ${pulses.length} daily pulses…`);
  for (let i = 0; i < pulses.length; i += 100) {
    await db.insert(dailyPulses).values(pulses.slice(i, i + 100));
  }

  // --- Recognitions (last ~60 days) ---------------------------------------
  const recognitionDays = datesInRange(-59, 0);
  const recognitionsRows: {
    id: string;
    organizationId: string;
    giverId: string;
    recipientId: string;
    recognitionDate: Date;
    category: string;
    message: string | null;
  }[] = [];

  for (const day of recognitionDays) {
    if (!isWeekday(day)) continue;
    const count = intBetween(1, 3);
    for (let k = 0; k < count; k++) {
      const giverId = pick(employeeIds);
      let recipientId = pick(employeeIds);
      while (recipientId === giverId) recipientId = pick(employeeIds);
      recognitionsRows.push({
        id: randomUUID(),
        organizationId: orgId,
        giverId,
        recipientId,
        recognitionDate: day,
        category: pick(RECOGNITION_CATEGORIES),
        message: chance(0.55) ? pick(RECOGNITION_MESSAGES) : null,
      });
    }
  }

  console.log(`Inserting ${recognitionsRows.length} recognitions…`);
  for (let i = 0; i < recognitionsRows.length; i += 100) {
    await db.insert(recognitions).values(recognitionsRows.slice(i, i + 100));
  }

  // --- Concerns (last ~90 days) -------------------------------------------
  const reportedDays = datesInRange(-89, -1);
  const concernsRows: {
    id: string;
    organizationId: string;
    reporterId: string | null;
    category: string;
    description: string;
    anonymous: boolean;
    visibility: "hr_only" | "manager_and_hr" | "anonymous_to_management";
    status: "new" | "reviewed" | "investigating" | "action_taken" | "resolved";
    severity: "low" | "medium" | "high";
    resolvedAt: Date | null;
  }[] = [];

  const statuses = [
    "new", "reviewed", "reviewed", "investigating", "action_taken", "resolved", "resolved",
  ] as const;

  for (let i = 0; i < 16; i++) {
    const day = reportedDays[i * 5];
    const status = statuses[i % statuses.length];
    const severity: "low" | "medium" | "high" =
      status === "resolved" ? "low" : pick(["low", "medium", "high"] as const);
    const anonymous = chance(0.35);
    concernsRows.push({
      id: randomUUID(),
      organizationId: orgId,
      reporterId: anonymous ? null : pick(employeeIds),
      category: pick(CONCERN_CATEGORIES),
      description: pick(CONCERN_DESCRIPTIONS),
      anonymous,
      visibility: chance(0.6)
        ? "hr_only"
        : chance(0.6)
          ? "manager_and_hr"
          : "anonymous_to_management",
      status,
      severity,
      resolvedAt: status === "resolved" ? new Date(day.getTime() + 3 * 86_400_000) : null,
    });
  }

  const insertConcerns = await db
    .insert(concerns)
    .values(concernsRows)
    .returning({ id: concerns.id });

  const mentionableConcerns = concernsRows.filter(
    (c) => (c.category === "collaboration" || c.category === "manager") && !c.anonymous
  );

  const mentionsRows: {
    id: string;
    concernId: string;
    mentionedEmployeeId: string;
  }[] = [];
  for (let i = 0; i < mentionableConcerns.length && i < insertConcerns.length; i += 2) {
    if (chance(0.5)) {
      mentionsRows.push({
        id: randomUUID(),
        concernId: insertConcerns[i].id,
        mentionedEmployeeId: pick(employeeIds),
      });
    }
  }
  if (mentionsRows.length) await db.insert(concernMentions).values(mentionsRows);

  const hrNotesRows: {
    id: string;
    concernId: string;
    authorId: string;
    note: string;
  }[] = [];
  const noteTexts = [
    "Touched base with the reporter; no immediate escalation needed.",
    "Scheduling a follow-up with the team lead next week.",
    "Two reports this month mention similar friction — tracking it.",
    "Resolved after a calibration call with the manager.",
  ];
  insertConcerns.forEach((row, i) => {
    const status = concernsRows[i]?.status;
    if (status === "reviewed" || status === "investigating" || status === "action_taken" || status === "resolved") {
      hrNotesRows.push({
        id: randomUUID(),
        concernId: row.id,
        authorId: chance(0.5) ? hr1.id : hr2.id,
        note: pick(noteTexts),
      });
    }
  });
  if (hrNotesRows.length)
    for (let i = 0; i < hrNotesRows.length; i += 100) {
      await db.insert(hrNotes).values(hrNotesRows.slice(i, i + 100));
    }

  // --- Audit log sample -----------------------------------------------------
  const auditRows: {
    id: string;
    organizationId: string;
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, unknown>;
  }[] = [
    { action: "organization.created", entityType: "organizations", entityId: orgId },
    { action: "user.created", entityType: "users", entityId: adminUser.id },
    { action: "seed.data.loaded", entityType: "system", entityId: null },
  ].map((a) => ({
    id: randomUUID(),
    organizationId: orgId,
    actorId: adminUser.id,
    action: a.action,
    entityType: a.entityType,
    entityId: a.entityId,
    metadata: { seed: true },
  }));
  auditRows.push(
    ...concernsRows.map((c) => ({
      id: randomUUID(),
      organizationId: orgId,
      actorId: c.reporterId,
      action: "concern.created",
      entityType: "concerns",
      entityId: c.id,
      metadata: { anonymous: c.anonymous },
    }))
  );
  await db.insert(auditLogs).values(auditRows);

  // --- Analytics snapshots (company-level, last 30 days) ---------------------
  const snapshotDays = datesInRange(-29, 0);
  const snapshotRows: {
    id: string;
    organizationId: string;
    snapshotDate: Date;
    scopeType: "company";
    scopeId: null;
    participationRate: string;
    averagePulse: string;
    positiveRate: string;
    neutralRate: string;
    negativeRate: string;
    recognitionCount: number;
    concernCount: number;
    metadata: Record<string, unknown>;
  }[] = [];

  for (const day of snapshotDays) {
    const dayStr = day.toISOString().slice(0, 10);
    const dayPulses = pulses.filter(
      (p) => p.pulseDate.toISOString().slice(0, 10) === dayStr
    );
    const dayRecognitions = recognitionsRows.filter(
      (r) => r.recognitionDate.toISOString().slice(0, 10) === dayStr
    );
    const dayConcerns = concernsRows.length;

    const participation =
      employeeIds.length === 0
        ? 0
        : Math.round((dayPulses.length / employeeIds.length) * 10000) / 100;
    const scores = dayPulses.map((p) => p.sentimentScore);
    const avg =
      scores.length === 0
        ? 0
        : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
    const pos = scores.length ? (scores.filter((s) => s >= 4).length / scores.length) * 100 : 0;
    const neu = scores.length ? (scores.filter((s) => s === 3).length / scores.length) * 100 : 0;
    const neg = scores.length ? (scores.filter((s) => s <= 2).length / scores.length) * 100 : 0;

    snapshotRows.push({
      id: randomUUID(),
      organizationId: orgId,
      snapshotDate: day,
      scopeType: "company",
      scopeId: null,
      participationRate: participation.toFixed(2),
      averagePulse: avg.toFixed(2),
      positiveRate: Math.round(pos * 100) / 100 === 0 ? "0.00" : (Math.round(pos * 100) / 100).toFixed(2),
      neutralRate: (Math.round(neu * 100) / 100).toFixed(2),
      negativeRate: (Math.round(neg * 100) / 100).toFixed(2),
      recognitionCount: dayRecognitions.length,
      concernCount: dayConcerns,
      metadata: { seed: true },
    });
  }

  await db.insert(analyticsSnapshots).values(snapshotRows);

  console.log("Seed complete.");
  console.log(
    JSON.stringify(
      {
        organization: "Pulse360 Demo Company",
        users: allUsers.length,
        employees: employeeIds.length,
        departments: deptRows.length,
        teams: teamRows.length,
        pulses: pulses.length,
        recognitions: recognitionsRows.length,
        concerns: concernsRows.length,
        mentions: mentionsRows.length,
        hrNotes: hrNotesRows.length,
        analyticsSnapshots: snapshotRows.length,
        auditLogs: auditRows.length,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});