"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitPulse } from "@/lib/pulse/actions";
import { MOOD_TAG_VALUES, RECOGNITION_CATEGORY_VALUES, SENTIMENT_LABELS } from "@/lib/validation/pulse";

interface TeammateOption {
  id: string;
  name: string;
}

const selectClass =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none";

export function PulseForm({ teammates }: { teammates?: TeammateOption[] }) {
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

      <fieldset className="flex flex-col gap-2.5 rounded-lg border border-dashed p-4">
        <legend className="px-1 text-sm font-medium">
          Recognize a teammate (optional)
        </legend>
        <p className="text-muted-foreground text-xs">
          Thank someone for their help today — it appears in their pulse log and in
          HR’s relationship insights.
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recognition-recipient">Colleague</Label>
            <select
              id="recognition-recipient"
              name="recognitionRecipientId"
              defaultValue=""
              className={selectClass}
            >
              <option value="">No one today</option>
              {(teammates ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recognition-category">Reason</Label>
            <select
              id="recognition-category"
              name="recognitionCategory"
              defaultValue={RECOGNITION_CATEGORY_VALUES[0]}
              className={selectClass}
            >
              {RECOGNITION_CATEGORY_VALUES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recognition-message">Note (optional)</Label>
          <Textarea
            id="recognition-message"
            name="recognitionMessage"
            rows={2}
            maxLength={200}
            placeholder="What did they help with?"
          />
        </div>
      </fieldset>

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