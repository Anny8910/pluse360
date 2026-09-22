import { describe, expect, it } from "vitest";
import {
  dueChannels,
  isDue,
  pickDueCandidates,
  type ReminderCandidate,
} from "@/lib/notifications/reminders";
import { reminderTimeParts } from "@/lib/validation/notifications";

const base: ReminderCandidate = {
  id: "u1",
  enabled: true,
  channels: { email: true, slack: false, teams: false },
  reminderTime: "17:30",
};

const at = (hour: number, minute: number) =>
  new Date(2000, 0, 1, hour, minute);

describe("reminder engine", () => {
  it("parses reminder times", () => {
    expect(reminderTimeParts("17:30")).toEqual({ hour: 17, minute: 30 });
    expect(reminderTimeParts("9:05")).toBeNull();
    expect(reminderTimeParts(null)).toBeNull();
  });

  it("is due within a three-minute window", () => {
    expect(isDue(base, at(17, 31), false)).toBe(true);
    expect(isDue(base, at(17, 27), false)).toBe(true);
    expect(isDue(base, at(17, 26), false)).toBe(false);
    expect(isDue(base, at(17, 34), false)).toBe(false);
  });

  it("is not due when already pulsed, disabled, or no channel", () => {
    expect(isDue(base, at(17, 30), true)).toBe(false);
    expect(
      isDue({ ...base, enabled: false }, at(17, 30), false)
    ).toBe(false);
    expect(
      isDue(
        { ...base, channels: { email: false, slack: false, teams: false } },
        at(17, 30),
        false
      )
    ).toBe(false);
    expect(isDue({ ...base, reminderTime: null }, at(17, 30), false)).toBe(false);
  });

  it("picks only due candidates", () => {
    const candidates = [
      { ...base, id: "due1" },
      { ...base, id: "pulsed" },
      { ...base, id: "late", reminderTime: "08:00" },
    ];
    const due = pickDueCandidates(candidates, {
      wallClock: () => at(17, 31),
      pulseKeyFor: (c) => c.id,
      hasPulseKey: (key) => key === "pulsed",
    });
    expect(due.map((d) => d.id)).toEqual(["due1"]);
  });

  it("reports due channels", () => {
    expect(
      dueChannels({
        id: "u1",
        enabled: true,
        channels: { email: true, slack: false, teams: true },
        reminderTime: "17:30",
      })
    ).toEqual(["email", "teams"]);
  });
});