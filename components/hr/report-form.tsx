"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { generateMonthlyReport } from "@/lib/hr/actions";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const selectClass =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none";

export function ReportGenerateForm() {
  const [state, action, pending] = useActionState(generateMonthlyReport, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-year">Year</Label>
          <select
            id="report-year"
            name="year"
            className={selectClass}
            defaultValue={currentYear}
          >
            {[currentYear, currentYear - 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-month">Month</Label>
          <select
            id="report-month"
            name="month"
            className={selectClass}
            defaultValue={currentMonth}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(0, m - 1, 1).toLocaleString("en-US", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate report"}
        </Button>
      </div>
      {state && !state.ok ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-emerald-600 text-sm dark:text-emerald-400">
          Report generated.
        </p>
      ) : null}
    </form>
  );
}