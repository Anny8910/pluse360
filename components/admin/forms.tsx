"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createDepartment,
  createTeam,
  createUser,
  deleteDepartment,
  deleteTeam,
  renameDepartment,
  renameTeam,
  resetUserPassword,
  setUserActive,
  updateOrgSettings,
  updateUser,
  type AdminActionResult,
} from "@/lib/admin/actions";
import { ROLE_ENUM_VALUES } from "@/db/schema";

export interface DepartmentOption {
  id: string;
  name: string;
}
export interface TeamOption {
  id: string;
  name: string;
}
export interface ManagerOption {
  id: string;
  name: string;
  role: string;
}

const selectClass =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:ring-3";

function FormStatus({ state }: { state: AdminActionResult | undefined }) {
  if (!state) return null;
  if (state.ok) {
    return <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>;
  }
  return <p className="text-destructive text-sm">{state.error}</p>;
}

function useRefreshOnSuccess(state: AdminActionResult | undefined) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);
  return formRef;
}

// ---------------------------------------------------------------------------
// Organization settings
// ---------------------------------------------------------------------------

export function OrgSettingsForm({
  org,
}: {
  org: { name: string; slug: string; timezone: string };
}) {
  const [state, action, pending] = useActionState(updateOrgSettings, undefined);
  const formRef = useRefreshOnSuccess(state);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-name">Organization name</Label>
        <Input id="org-name" name="name" defaultValue={org.name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-slug">Slug</Label>
        <Input id="org-slug" name="slug" defaultValue={org.slug} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-timezone">Timezone</Label>
        <Input id="org-timezone" name="timezone" defaultValue={org.timezone} required />
      </div>
      <FormStatus state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export function DepartmentCreateForm() {
  const [state, action, pending] = useActionState(createDepartment, undefined);
  const formRef = useRefreshOnSuccess(state);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dept-create-name">Department name</Label>
        <Input id="dept-create-name" name="name" required />
      </div>
      <FormStatus state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Add department"}
        </Button>
      </div>
    </form>
  );
}

export function DepartmentRenameForm({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState(renameDepartment, undefined);
  const formRef = useRefreshOnSuccess(state);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`dept-rename-${id}`}>New name</Label>
        <Input id={`dept-rename-${id}`} name="name" defaultValue={name} required />
      </div>
      <FormStatus state={state} />
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

export function DepartmentDeleteForm({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState(deleteDepartment, undefined);
  const formRef = useRefreshOnSuccess(state);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Deleting…" : `Delete ${name}`}
      </Button>
      <FormStatus state={state} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export function TeamCreateForm({ departments }: { departments: DepartmentOption[] }) {
  const [state, action, pending] = useActionState(createTeam, undefined);
  const formRef = useRefreshOnSuccess(state);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="team-create-name">Team name</Label>
        <Input id="team-create-name" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="team-create-dept">Department</Label>
        <select id="team-create-dept" name="departmentId" className={selectClass} defaultValue="">
          <option value="">No department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <FormStatus state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Add team"}
        </Button>
      </div>
    </form>
  );
}

export function TeamRenameForm({
  id,
  name,
  departmentId,
  departments,
}: {
  id: string;
  name: string;
  departmentId: string | null;
  departments: DepartmentOption[];
}) {
  const [state, action, pending] = useActionState(renameTeam, undefined);
  const formRef = useRefreshOnSuccess(state);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`team-rename-${id}`}>New team name</Label>
        <Input id={`team-rename-${id}`} name="name" defaultValue={name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`team-rename-dept-${id}`}>New department</Label>
        <select
          id={`team-rename-dept-${id}`}
          name="departmentId"
          className={selectClass}
          defaultValue={departmentId ?? ""}
        >
          <option value="">No department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <FormStatus state={state} />
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

export function TeamDeleteForm({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState(deleteTeam, undefined);
  const formRef = useRefreshOnSuccess(state);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Deleting…" : `Delete ${name}`}
      </Button>
      <FormStatus state={state} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

function RoleSelect({ id, defaultValue }: { id: string; defaultValue?: string }) {
  return (
    <select id={id} name="role" className={selectClass} defaultValue={defaultValue ?? "employee"}>
      {ROLE_ENUM_VALUES.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}

function DeptSelect({
  id,
  departments,
  defaultValue,
}: {
  id: string;
  departments: DepartmentOption[];
  defaultValue?: string | null;
}) {
  return (
    <select id={id} name="departmentId" className={selectClass} defaultValue={defaultValue ?? ""}>
      <option value="">No department</option>
      {departments.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  );
}

function TeamSelect({
  id,
  teams,
  defaultValue,
}: {
  id: string;
  teams: TeamOption[];
  defaultValue?: string | null;
}) {
  return (
    <select id={id} name="teamId" className={selectClass} defaultValue={defaultValue ?? ""}>
      <option value="">No team</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

function ManagerSelect({
  id,
  managers,
  defaultValue,
}: {
  id: string;
  managers: ManagerOption[];
  defaultValue?: string | null;
}) {
  return (
    <select id={id} name="managerId" className={selectClass} defaultValue={defaultValue ?? ""}>
      <option value="">No manager</option>
      {managers.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name} ({m.role})
        </option>
      ))}
    </select>
  );
}

export function UserCreateForm({
  departments,
  teams,
  managers,
}: {
  departments: DepartmentOption[];
  teams: TeamOption[];
  managers: ManagerOption[];
}) {
  const [state, action, pending] = useActionState(createUser, undefined);
  const formRef = useRefreshOnSuccess(state);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-create-name">User name</Label>
          <Input id="user-create-name" name="name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-create-email">Email</Label>
          <Input id="user-create-email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-create-role">Role</Label>
          <RoleSelect id="user-create-role" defaultValue="employee" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-create-password">Initial password</Label>
          <Input
            id="user-create-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-create-dept">Department</Label>
          <DeptSelect id="user-create-dept" departments={departments} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-create-team">Team</Label>
          <TeamSelect id="user-create-team" teams={teams} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-create-manager">Manager</Label>
          <ManagerSelect id="user-create-manager" managers={managers} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-create-job">Job title</Label>
          <Input id="user-create-job" name="jobTitle" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-create-location">Location</Label>
          <Input id="user-create-location" name="location" />
        </div>
      </div>
      <FormStatus state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create user"}
        </Button>
      </div>
    </form>
  );
}

export function UserEditForm({
  user,
  departments,
  teams,
  managers,
}: {
  user: {
    id: string;
    name: string;
    role: string;
    departmentId: string | null;
    teamId: string | null;
    managerId: string | null;
    jobTitle: string | null;
    location: string | null;
  };
  departments: DepartmentOption[];
  teams: TeamOption[];
  managers: ManagerOption[];
}) {
  const [state, action, pending] = useActionState(updateUser, undefined);
  const formRef = useRefreshOnSuccess(state);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={user.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`user-edit-name-${user.id}`}>User name</Label>
          <Input id={`user-edit-name-${user.id}`} name="name" defaultValue={user.name} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`user-edit-role-${user.id}`}>Role</Label>
          <RoleSelect id={`user-edit-role-${user.id}`} defaultValue={user.role} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`user-edit-dept-${user.id}`}>Department</Label>
          <DeptSelect
            id={`user-edit-dept-${user.id}`}
            departments={departments}
            defaultValue={user.departmentId}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`user-edit-team-${user.id}`}>Team</Label>
          <TeamSelect id={`user-edit-team-${user.id}`} teams={teams} defaultValue={user.teamId} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`user-edit-manager-${user.id}`}>Manager</Label>
          <ManagerSelect
            id={`user-edit-manager-${user.id}`}
            managers={managers}
            defaultValue={user.managerId}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`user-edit-job-${user.id}`}>Job title</Label>
          <Input
            id={`user-edit-job-${user.id}`}
            name="jobTitle"
            defaultValue={user.jobTitle ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`user-edit-location-${user.id}`}>Location</Label>
          <Input
            id={`user-edit-location-${user.id}`}
            name="location"
            defaultValue={user.location ?? ""}
          />
        </div>
      </div>
      <FormStatus state={state} />
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

export function UserPasswordForm({ id, email }: { id: string; email: string }) {
  const [state, action, pending] = useActionState(resetUserPassword, undefined);
  const formRef = useRefreshOnSuccess(state);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`reset-password-${id}`}>New password for {email}</Label>
        <Input
          id={`reset-password-${id}`}
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      <FormStatus state={state} />
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Resetting…" : "Reset password"}
        </Button>
      </div>
    </form>
  );
}

export function UserActiveForm({
  id,
  active,
  disabled,
}: {
  id: string;
  active: boolean;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(setUserActive, undefined);
  const formRef = useRefreshOnSuccess(state);

  return (
    <form action={action} ref={formRef} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <Button
        type="submit"
        variant={active ? "destructive" : "outline"}
        size="sm"
        disabled={disabled || pending}
      >
        {pending ? "Updating…" : active ? "Deactivate" : "Reactivate"}
      </Button>
      <FormStatus state={state} />
    </form>
  );
}
