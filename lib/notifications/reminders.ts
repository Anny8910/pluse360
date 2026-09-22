import { reminderTimeParts } from "@/lib/validation/notifications";

export interface ReminderCandidate {
  id: string;
  timezone?: string | null;
  channels: { email: boolean; slack: boolean; teams: boolean };
  enabled: boolean;
  reminderTime: string | null;
}

export interface ReminderContext {
  wallClock: (timezone?: string | null) => Date;
  pulseKeyFor: (candidate: ReminderCandidate) => string;
  hasPulseKey: (key: string) => boolean;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function isDue(
  candidate: ReminderCandidate,
  today: Date,
  alreadyPulsed: boolean
): boolean {
  if (!candidate.enabled || alreadyPulsed) return false;
  if (!candidate.channels.email && !candidate.channels.slack && !candidate.channels.teams)
    return false;
  const parts = reminderTimeParts(candidate.reminderTime);
  if (!parts) return false;

  const current = minutesOfDay(today);
  const target = parts.hour * 60 + parts.minute;
  return Math.abs(current - target) <= 3;
}

export function pickDueCandidates(
  candidates: ReminderCandidate[],
  context: ReminderContext
): ReminderCandidate[] {
  return candidates.filter((c) => {
    const today = context.wallClock(c.timezone);
    const key = context.pulseKeyFor(c);
    return isDue(c, today, context.hasPulseKey(key));
  });
}

export function dueChannels(
  candidate: ReminderCandidate
): Array<"email" | "slack" | "teams"> {
  return (
    ["email", "slack", "teams"] as const
  ).filter((ch) => candidate.channels[ch]);
}