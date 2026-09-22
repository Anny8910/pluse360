"use client";

import { useActionState } from "react";
import { KeyRound, Pencil, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  type DepartmentOption,
  type ManagerOption,
  type TeamOption,
  UserEditForm,
  UserPasswordForm,
} from "@/components/admin/forms";
import { setUserActive } from "@/lib/admin/actions";

interface UserRowMeta {
  id: string;
  name: string;
  email: string;
  active: boolean;
  role: string;
  departmentId: string | null;
  teamId: string | null;
  managerId: string | null;
  jobTitle: string | null;
  location: string | null;
}

export function UserRowActions({
  user,
  departments,
  teams,
  managers,
  locked,
}: {
  user: UserRowMeta;
  departments: DepartmentOption[];
  teams: TeamOption[];
  managers: ManagerOption[];
  locked: boolean;
}) {
  const [, action, pending] = useActionState(setUserActive, undefined);

  return (
    <div className="flex items-center gap-1.5">
      <Dialog>
        <DialogTrigger
          render={<Button variant="ghost" size="icon-sm" title="Edit user" />}
          aria-label={`Edit ${user.name}`}
        >
          <Pencil aria-hidden="true" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {user.name}</DialogTitle>
            <DialogDescription>
              Update profile details, role, and reporting lines.
            </DialogDescription>
          </DialogHeader>
          <UserEditForm
            user={{
              id: user.id,
              name: user.name,
              role: user.role,
              departmentId: user.departmentId,
              teamId: user.teamId,
              managerId: user.managerId,
              jobTitle: user.jobTitle,
              location: user.location,
            }}
            departments={departments}
            teams={teams}
            managers={managers}
          />
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger
          render={<Button variant="ghost" size="icon-sm" title="Reset password" />}
          aria-label={`Reset password for ${user.name}`}
        >
          <KeyRound aria-hidden="true" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Provide a new temporary password for {user.name}.
            </DialogDescription>
          </DialogHeader>
          <UserPasswordForm id={user.id} email={user.email} />
        </DialogContent>
      </Dialog>

      <form action={action}>
        <input type="hidden" name="id" value={user.id} />
        <input
          type="hidden"
          name="active"
          value={user.active ? "false" : "true"}
        />
        <Button
          type="submit"
          variant={user.active ? "destructive" : "outline"}
          size="icon-sm"
          aria-label={user.active ? "Deactivate" : "Reactivate"}
          title={user.active ? "Deactivate" : "Reactivate"}
          disabled={locked || pending}
        >
          {user.active ? (
            <UserX aria-hidden="true" />
          ) : (
            <UserCheck aria-hidden="true" />
          )}
        </Button>
      </form>
    </div>
  );
}