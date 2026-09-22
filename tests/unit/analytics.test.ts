import { describe, expect, it } from "vitest";
import {
  averageScore,
  meetsThreshold,
  participationRate,
  sentimentBands,
  trendSeries,
} from "@/lib/analytics/aggregate";

describe("analytics aggregation", () => {
  it("enforces the minimum contributors threshold", () => {
    expect(meetsThreshold(4)).toBe(false);
    expect(meetsThreshold(5)).toBe(true);
    expect(meetsThreshold(5, 3)).toBe(true);
  });

  it("averages only when enough responses exist", () => {
    expect(averageScore([4, 5, 3, 2, 4])).toBe(3.6);
    expect(averageScore([4, 5, 3, 2])).toBeNull();
  });

  it("computes participation rate or hides below threshold", () => {
    expect(participationRate(4, 10)).toBe(40);
    expect(participationRate(2, 4)).toBeNull();
    expect(participationRate(0, 10)).toBe(0);
  });

  it("bands sentiment into positive/neutral/negative", () => {
    const scores = [5, 5, 4, 3, 2];
    expect(sentimentBands(scores)).toEqual({
      positive: 60,
      neutral: 20,
      negative: 20,
    });
    expect(sentimentBands([4, 5, 2])).toEqual({
      positive: null,
      neutral: null,
      negative: null,
    });
  });

  it("builds a trend series with per-day nulls under the threshold", () => {
    const series = trendSeries([
      { key: "d1", label: "Mon", scores: [4, 5, 3, 2, 4] },
      { key: "d2", label: "Tue", scores: [4, 5] },
    ]);
    expect(series[0].avg).toBe(3.6);
    expect(series[1].avg).toBeNull();
  });
});