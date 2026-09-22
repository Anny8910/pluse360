import { describe, expect, it } from "vitest";
import {
  MOOD_TAG_VALUES,
  pulseSchema,
  sanitizeMoodTags,
} from "@/lib/validation/pulse";

describe("pulse validation", () => {
  it("accepts a valid pulse", () => {
    expect(
      pulseSchema.safeParse({
        sentimentScore: "4",
        moodTags: ["Productive", "Collaborative"],
        bestMoment: "Shipped the dashboard",
        improvementText: "<none>",
      }).success
    ).toBe(true);
  });

  it("rejects sentiment outside 1–5", () => {
    expect(pulseSchema.safeParse({ sentimentScore: "0" }).success).toBe(false);
    expect(pulseSchema.safeParse({ sentimentScore: "6" }).success).toBe(false);
    expect(
      pulseSchema.safeParse({ sentimentScore: "abc" }).success
    ).toBe(false);
  });

  it("caps mood tags at three", () => {
    const tags = ["Productive", "Stressful", "Fun", "Routine"];
    expect(
      pulseSchema.safeParse({ sentimentScore: "3", moodTags: tags }).success
    ).toBe(false);
  });

  it("sanitizes mood tags to the allowed set, unique, max 3", () => {
    expect(sanitizeMoodTags(["Productive", "Fake", "Productive"])).toEqual([
      "Productive",
    ]);
    expect(sanitizeMoodTags(MOOD_TAG_VALUES.slice(0, 6))).toHaveLength(3);
    expect(sanitizeMoodTags("Productive")).toEqual([]);
  });

  it("trims and limits note lengths", () => {
    const ok = pulseSchema.safeParse({
      sentimentScore: "5",
      bestMoment: "  good day  ",
    });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.bestMoment).toBe("good day");
    expect(
      pulseSchema.safeParse({ sentimentScore: "5", bestMoment: "x".repeat(501) }).success
    ).toBe(false);
  });
});