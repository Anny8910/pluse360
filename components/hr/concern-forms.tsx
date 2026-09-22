"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addHrNote,
  createConcern,
  updateConcern,
  type HrActionResult,
} from "@/lib/hr/actions";
import {
  CONCERN_CATEGORIES,
  CONCERN_SEVERITY_VALUES,
  CONCERN_STATUS_VALUES,
  CONCERN_VISIBILITY_VALUES,
} from "@/db/schema";

const selectClass =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none";

function FormStatus({ state }: { state: HrActionResult | undefined }) {
  if (!state) return null;
  if (state.ok) {
    return <p className="text-emerald-600 text-sm dark:text-emerald-400">Saved.</p>;
  }
  return <p className="text-destructive text-sm">{state.error}</p>;
}

export function ConcernCreateForm() {
  const [state, action, pending] = useActionState(createConcern, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="concern-category">Category</Label>
          <select
            id="concern-category"
            name="category"
            className={selectClass}
            defaultValue={CONCERN_CATEGORIES[0]}
          >
            {CONCERN_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="concern-severity">Severity</Label>
          <select
            id="concern-severity"
            name="severity"
            className={selectClass}
            defaultValue="low"
          >
            {CONCERN_SEVERITY_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="concern-visibility">Visibility</Label>
          <select
            id="concern-visibility"
            name="visibility"
            className={selectClass}
            defaultValue="hr_only"
          >
            {CONCERN_VISIBILITY_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="concern-description">Description</Label>
        <Textarea
          id="concern-description"
          name="description"
          rows={3}
          maxLength={2000}
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="anonymous"
          value="true"
          className="h-4 w-4 accent-foreground"
        />
        Log this concern anonymously
      </label>
      <FormStatus state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Log concern"}
        </Button>
      </div>
    </form>
  );
}

export function ConcernUpdateForm({
  id,
  status,
  severity,
}: {
  id: string;
  status: string;
  severity: string;
}) {
  const [state, action, pending] = useActionState(updateConcern, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        className={selectClass}
        aria-label="Status"
        defaultValue={status}
      >
        {CONCERN_STATUS_VALUES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        name="severity"
        className={selectClass}
        aria-label="Severity"
        defaultValue={severity}
      >
        {CONCERN_SEVERITY_VALUES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <FormStatus state={state} />
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Update"}
        </Button>
      </div>
    </form>
  );
}

export function HrNoteForm({ concernId }: { concernId: string }) {
  const [state, action, pending] = useActionState(addHrNote, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="concernId" value={concernId} />
      <Label htmlFor={`hr-note-${concernId}`} className="sr-only">
        Add a note
      </Label>
      <Textarea
        id={`hr-note-${concernId}`}
        name="note"
        rows={2}
        maxLength={2000}
        placeholder="Add an internal note…"
      />
      <FormStatus state={state} />
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}