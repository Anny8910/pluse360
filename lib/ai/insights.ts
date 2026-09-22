export interface InsightInput {
  thresholdMet: boolean;
  participationToday: number | null;
  weekAverage: number | null;
  weekPositive: number | null;
  weekNegative: number | null;
  openConcerns: number;
  totalPulses: number;
}

export function buildInsights(input: InsightInput): string[] {
  const out: string[] = [];

  if (!input.thresholdMet) {
    return [
      "Organization insights unlock once at least 5 employees are active and sharing pulses.",
    ];
  }

  if (input.participationToday !== null) {
    if (input.participationToday >= 80) {
      out.push("Participation is strong today — most of the organization has checked in.");
    } else if (input.participationToday >= 50) {
      out.push("Around half the organization has checked in today; a gentle nudge could lift participation.");
    } else {
      out.push("Participation is low today — consider reaching out to teams that have not checked in.");
    }
  }

  if (input.weekAverage !== null) {
    if (input.weekAverage >= 4) {
      out.push("Sentiment over the last week is positive and stable.");
    } else if (input.weekAverage >= 3) {
      out.push("Sentiment over the last week is neutral — no strong signals either way.");
    } else {
      out.push("Sentiment over the last week is below the midpoint and may warrant follow-up.");
    }
  }

  if (input.weekNegative !== null && input.weekNegative > 40) {
    out.push(`A large share of pulses (${input.weekNegative}%) were negative — worth a closer look.`);
  } else if (input.weekPositive !== null && input.weekPositive > 60) {
    out.push(`Check-ins lean positive (${input.weekPositive}% positive).`);
  }

  if (input.openConcerns > 0) {
    out.push(
      `${input.openConcerns} open concern${input.openConcerns === 1 ? "" : "s"} need${input.openConcerns === 1 ? "s" : ""} attention.`
    );
  } else {
    out.push("No open concerns right now.");
  }

  if (input.totalPulses > 0) {
    out.push(`${input.totalPulses.toLocaleString()} pulses recorded so far.`);
  }

  return out;
}

export async function withAssistantImprovements(insights: string[]): Promise<string[]> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return insights;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Rewrite these workplace pulse insights into 3 short, actionable sentences. Output JSON array of strings.",
          },
          { role: "user", content: JSON.stringify(insights) },
        ],
      }),
    });
    if (!response.ok) return insights;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return insights;
    const parsed = JSON.parse(content) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string").slice(0, 5)
      : insights;
  } catch {
    return insights;
  }
}