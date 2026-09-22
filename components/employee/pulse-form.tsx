"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitPulse } from "@/lib/pulse/actions";
import { MOOD_TAG_VALUES, SENTIMENT_LABELS } from "@/lib/validation/pulse";

export function PulseForm() {
  const [state, action, pending] = useActionState(submitPulse, undefined);
  const router = useRouter();

  return (
    <form action={action} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">How was your day?</legend>
        <div className="flex gap-2">
          {SENTIMENT_LABELS.map((label, i) => {
            const value = i + 1;
            return (
              <label
                key={value}
                className="flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-2 py-3 text-center has-[:checked]:border-foreground has-[:checked]:bg-foreground/5"
              >
                <input
                  type="radio"
                  name="sentimentScore"
                  value={value}
                  required
                  className="sr-only"
                />
                <span className="text-lg font-semibold">{value}</span>
                <span className="text-muted-foreground text-xs">{label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">
          What describes your day? (up to 3)
        </legend>
        <div className="flex flex-wrap gap-2">
          {MOOD_TAG_VALUES.map((tag) => (
            <label
              key={tag}
              className="has-[:checked]:border-foreground has-[:checked]:bg-foreground/5 cursor-pointer rounded-full border border-input px-3 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                name="moodTags"
                value={tag}
                className="sr-only"
              />
              {tag}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="best-moment">Best moment</Label>
        <Textarea
          id="best-moment"
          name="bestMoment"
          rows={2}
          maxLength={500}
          placeholder="What went well today? (optional)"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="improvement-text">What could be better?</Label>
        <Textarea
          id="improvement-text"
          name="improvementText"
          rows={2}
          maxLength={500}
          placeholder="Anything you'd change? (optional)"
        />
      </div>

      {state && !state.ok ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Recording…" : "Record pulse"}
        </Button>
        {state?.ok ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/employee/history")}
          >
            See my history
          </Button>
        ) : null}
      </div>
    </form>
  );
}