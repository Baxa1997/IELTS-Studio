"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  assignTeacher,
  createGroup,
  deleteGroup,
  removeMember,
  type GroupFormState,
} from "./actions";

const FIELD =
  "border-input h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

const initial: GroupFormState = {};

/** Create a group. An admin picks the teacher; a teacher always owns the class
 *  they create, so they get no picker. */
export function CreateGroupForm({
  teachers,
  canAssignTeacher,
}: {
  teachers: { id: string; name: string }[];
  canAssignTeacher: boolean;
}) {
  const [state, formAction, pending] = useActionState(createGroup, initial);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1 space-y-2">
          <Label htmlFor="group-name">Group name</Label>
          <Input id="group-name" name="name" placeholder="IELTS evening — Sept" required />
        </div>
        {canAssignTeacher ? (
          <div className="w-48 space-y-2">
            <Label htmlFor="group-teacher">Teacher</Label>
            <select id="group-teacher" name="teacher_id" className={FIELD} defaultValue="">
              <option value="">Unassigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create group"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

/** Reassign (or clear) the teacher who owns a group. */
export function AssignTeacherForm({
  groupId,
  teacherId,
  teachers,
}: {
  groupId: string;
  teacherId: string | null;
  teachers: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(assignTeacher, initial);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="group_id" value={groupId} />
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-48 space-y-2">
          <Label htmlFor="assign-teacher">Teacher</Label>
          <select
            id="assign-teacher"
            name="teacher_id"
            className={FIELD}
            defaultValue={teacherId ?? ""}
          >
            <option value="">Unassigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

/** Delete a group. Memberships go with it; student accounts and work do not. */
export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(deleteGroup, initial);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="group_id" value={groupId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Deleting…" : "Delete group"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}

/** Remove one student from a group (their account and history are untouched). */
export function RemoveMemberButton({
  groupId,
  studentId,
}: {
  groupId: string;
  studentId: string;
}) {
  const [state, formAction, pending] = useActionState(removeMember, initial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="student_id" value={studentId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? "Removing…" : "Remove"}
      </Button>
      {state.error ? (
        <span className="text-destructive text-xs" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}

function FormMessage({ state }: { state: GroupFormState }) {
  if (state.error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {state.error}
      </p>
    );
  }
  if (state.notice) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        {state.notice}
      </p>
    );
  }
  return null;
}
