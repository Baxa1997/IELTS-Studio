"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney, parseMoney } from "@/lib/finance/money";

import { type RoomChoice, ScheduleFields } from "./schedule-fields";

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

/**
 * Create a group. An admin picks the teacher; a teacher always owns the class
 * they create, so they get no picker.
 *
 * Laid out for the slide-over it lives in: stacked, every control full width.
 * The old side-by-side `flex-wrap` row is what broke the add-teacher form once
 * a 460px drawer narrowed it, and this form has the same shape.
 */
export function CreateGroupForm({
  teachers,
  branches,
  rooms,
  canAssignTeacher,
  pricing,
}: {
  teachers: { id: string; name: string }[];
  /** The center's sites. There is always at least one. */
  branches: { id: string; name: string }[];
  /** Bookable rooms across the center; the schedule offers only this branch's. */
  rooms: RoomChoice[];
  canAssignTeacher: boolean;
  /** Shown to the owner only — a teacher doesn't set their own rate. Null hides
   *  the two money fields entirely. */
  pricing: { currency: string; lessonsPerMonth: number } | null;
}) {
  const [state, formAction, pending] = useActionState(createGroup, initial);
  // The branch decides which rooms the schedule may offer, so the picker has to
  // know what is currently selected rather than reading it at submit time.
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="group-name">Group name</Label>
        <Input id="group-name" name="name" placeholder="IELTS evening — Sept" required />
      </div>
      {/* One branch means no decision to make: send it silently and keep the
          form short. Two or more and the choice is real, because it decides
          which rooms the class can be booked into. */}
      {branches.length > 1 ? (
        <div className="space-y-2">
          <Label htmlFor="group-branch">Branch</Label>
          <select
            id="group-branch"
            name="branch_id"
            className={FIELD}
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            required
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            The class can only be timetabled into rooms at this branch.
          </p>
        </div>
      ) : (
        <input type="hidden" name="branch_id" value={branchId} />
      )}
      {canAssignTeacher ? (
        <div className="space-y-2">
          <Label htmlFor="group-teacher">Teacher</Label>
          <select id="group-teacher" name="teacher_id" className={FIELD} defaultValue="">
            <option value="">Unassigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            {teachers.length === 0
              ? "No teachers yet — you can create the class now and assign one later."
              : "You can leave this unassigned and set it later."}
          </p>
        </div>
      ) : null}
      <div className="space-y-3 rounded-lg border p-3">
        <p className="text-sm font-medium">When it meets</p>
        <ScheduleFields rooms={rooms} branchId={branchId} />
      </div>

      {pricing ? (
        <FeeFields currency={pricing.currency} lessonsPerMonth={pricing.lessonsPerMonth} />
      ) : null}
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create group"}
      </Button>
    </form>
  );
}

/**
 * The two prices of a class, with the per-lesson figure worked out as you type.
 *
 * The preview is the point. A center owner thinks in "200 000 a head" but pays
 * a late joiner by the lesson, and until they can see that 200 000 over twelve
 * lessons is 16 667 each, the two numbers feel like different systems. Showing
 * it here — against the class's real lesson count once it is timetabled — means
 * the arithmetic on the payslip is never a surprise.
 *
 * `lessonsPerMonth` is the center's house assumption; a class that has been
 * timetabled is billed on its real bookings instead, which is why this says
 * "about".
 */
function FeeFields({ currency, lessonsPerMonth }: { currency: string; lessonsPerMonth: number }) {
  const [fee, setFee] = useState("");
  const [rate, setRate] = useState("");

  const perLesson = (input: string): string | null => {
    const minor = parseMoney(input, currency);
    if (minor == null || minor <= 0) return null;
    return `${formatMoney(Math.round(minor / lessonsPerMonth), currency)} per lesson`;
  };

  const feePerLesson = perLesson(fee);
  const ratePerLesson = perLesson(rate);
  const feeMinor = parseMoney(fee, currency);
  const rateMinor = parseMoney(rate, currency);
  const upsideDown = feeMinor != null && rateMinor != null && rateMinor > feeMinor;

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Money</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="group-fee">Student pays ({currency})</Label>
          <Input
            id="group-fee"
            name="monthly_fee"
            inputMode="numeric"
            placeholder="550 000"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            {feePerLesson ? `about ${feePerLesson}` : "per month, per student"}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="group-rate">Teacher earns ({currency})</Label>
          <Input
            id="group-rate"
            name="teacher_rate"
            inputMode="numeric"
            placeholder="200 000"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            {ratePerLesson ? `about ${ratePerLesson}` : "per student, per month"}
          </p>
        </div>
      </div>
      {upsideDown ? (
        <p className="text-destructive text-xs" role="alert">
          The teacher earns more per student than the student pays — check the two figures.
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">
          A student who joins part-way through the month is charged for the lessons that are left,
          and the teacher is paid for the same ones. Leave either blank to decide later.
        </p>
      )}
    </div>
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
export function RemoveMemberButton({ groupId, studentId }: { groupId: string; studentId: string }) {
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
