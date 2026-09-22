export const MIN_TEAM_SIZE = 5;

export function meetsThreshold(count: number, min = MIN_TEAM_SIZE): boolean {
  return count >= min;
}

export function averageScore(
  scores: readonly number[],
  minResponses = MIN_TEAM_SIZE
): number | null {
  if (scores.length < minResponses) return null;
  const total = scores.reduce((acc, s) => acc + s, 0);
  return Math.round((total / scores.length) * 100) / 100;
}

export function participationRate(
  submitted: number,
  totalMembers: number,
  min = MIN_TEAM_SIZE
): number | null {
  if (!meetsThreshold(totalMembers, min) || totalMembers === 0) return null;
  return Math.round((submitted / totalMembers) * 10000) / 100;
}

export function sentimentBands(
  scores: readonly number[],
  minResponses = MIN_TEAM_SIZE
): { positive: number | null; neutral: number | null; negative: number | null } {
  if (scores.length < minResponses) {
    return { positive: null, neutral: null, negative: null };
  }
  const total = scores.length;
  const pct = (n: number) => Math.round((n / total) * 10000) / 100;
  return {
    positive: pct(scores.filter((s) => s >= 4).length),
    neutral: pct(scores.filter((s) => s === 3).length),
    negative: pct(scores.filter((s) => s <= 2).length),
  };
}

export function trendSeries(
  grouped: Array<{ key: string; label: string; scores: number[] }>,
  min = MIN_TEAM_SIZE
): Array<{ key: string; label: string; avg: number | null; count: number }> {
  return grouped.map((day) => ({
    key: day.key,
    label: day.label,
    count: day.scores.length,
    avg: averageScore(day.scores, min),
  }));
}