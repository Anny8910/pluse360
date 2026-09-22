"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateNotificationPreferences } from "@/lib/notifications/actions";

export interface PreferencesProps {
  prefs: {
    dailyPulseEnabled: boolean;
    emailEnabled: boolean;
    slackEnabled: boolean;
    teamsEnabled: boolean;
    reminderTime: string | null;
    timezone: string | null;
  };
}

function Toggle({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-input px-3 py-2">
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={defaultValue}
        className="h-4 w-4 accent-foreground"
      />
    </label>
  );
}

export function NotificationPreferencesForm({ prefs }: PreferencesProps) {
  const [state, action, pending] = useActionState(
    updateNotificationPreferences,
    undefined
  );
  const { reminderTime, timezone, ...channels } = prefs;

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="timezone" value={timezone ?? ""} />
      <Toggle
        name="dailyPulseEnabled"
        label="Remind me to submit my daily pulse"
        defaultValue={channels.dailyPulseEnabled}
      />
      <Toggle
        name="emailEnabled"
        label="Email"
        defaultValue={channels.emailEnabled}
      />
      <Toggle
        name="slackEnabled"
        label="Slack"
        defaultValue={channels.slackEnabled}
      />
      <Toggle
        name="teamsEnabled"
        label="Microsoft Teams"
        defaultValue={channels.teamsEnabled}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reminder-time">Reminder time (24h)</Label>
        <Input
          id="reminder-time"
          name="reminderTime"
          placeholder="17:30"
          defaultValue={reminderTime ?? ""}
        />
      </div>
      {state && !state.ok ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-emerald-600 text-sm dark:text-emerald-400">
          Preferences saved.
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </form>
  );
}