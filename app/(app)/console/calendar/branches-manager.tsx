"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import { fieldStyle, FormMessage, SubmitButton } from "@/components/console/finance-ui";

import { type ActionState, deleteBranch, saveBranch } from "./actions";
import { useActionFeedback } from "@/components/console/toast";

/** Same reason as the rooms panel: the drawer stays open, so ask the router. */
function useRefreshingAction(
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>,
) {
  const router = useRouter();
  const result = useActionState(async (prev: ActionState, formData: FormData) => {
    const next = await action(prev, formData);
    if (next.ok) router.refresh();
    return next;
  }, {} as ActionState);
  // One place for every room/branch form: announce the result at the top of the
  // page. These panels deliberately stay OPEN — you rename three rooms in a row,
  // and closing after each one would mean reopening the drawer three times.
  useActionFeedback(result[0], { keepOpen: true });
  return result;
}

/**
 * Branches (filiallar): the sites a center runs.
 *
 * A branch owns rooms and nothing else, so this list is short on purpose —
 * name, address, phone. Everything else about a branch is answered by its
 * rooms: which groups meet there, which hours are free, who is teaching.
 *
 * Deleting a branch leaves its rooms behind, unassigned, rather than taking a
 * day's timetable down with it.
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";

export interface BranchRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
  roomCount: number;
}

export function BranchesManager({ branches }: { branches: BranchRow[] }) {
  return (
    <div>
      <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 16px", lineHeight: 1.6 }}>
        Add a branch for each address you teach at, then put its rooms in it. The timetable grows a
        row of branch tabs as soon as there is more than one — a single-site center never sees them.
      </p>

      <BranchEditor key={`new-${branches.length}`} />

      {branches.length > 0 ? (
        <div style={{ marginTop: 24, borderTop: "1px solid #F0EEE9", paddingTop: 16 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".07em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "#8B8999",
              marginBottom: 12,
            }}
          >
            {branches.length} branch{branches.length === 1 ? "" : "es"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {branches.map((branch) => (
              <BranchEditor key={branch.id} branch={branch} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BranchEditor({ branch }: { branch?: BranchRow }) {
  const [open, setOpen] = useState(!branch);
  const [state, formAction, pending] = useRefreshingAction(saveBranch);

  if (branch && !open) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          border: "1px solid #E7E5DF",
          borderRadius: 10,
          background: branch.active ? "#fff" : "#FAFAF8",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: INK, fontWeight: 500 }}>{branch.name}</div>
          <div style={{ fontSize: 11.5, color: FAINT }}>
            {branch.roomCount} room{branch.roomCount === 1 ? "" : "s"}
            {branch.address ? ` · ${branch.address}` : ""}
            {branch.active ? "" : " · closed"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            marginLeft: "auto",
            background: "none",
            border: 0,
            color: "#4340CB",
            fontFamily: "inherit",
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Edit
        </button>
        <DeleteBranchButton id={branch.id} name={branch.name} rooms={branch.roomCount} />
      </div>
    );
  }

  return (
    <form
      action={formAction}
      key={state.ok ?? "form"}
      style={{
        border: "1px solid #E7E5DF",
        borderRadius: 10,
        padding: "12px 13px",
        background: "#fff",
      }}
    >
      {branch ? <input type="hidden" name="id" value={branch.id} /> : null}

      <label style={{ fontSize: 12, color: MUTED, display: "block" }}>
        Branch name
        <input
          name="name"
          required
          defaultValue={branch?.name}
          placeholder="City centre"
          style={{ ...fieldStyle, marginTop: 4 }}
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr .9fr", gap: 10, marginTop: 10 }}>
        <label style={{ fontSize: 12, color: MUTED }}>
          Address
          <input
            name="address"
            defaultValue={branch?.address ?? ""}
            placeholder="12 Main Street"
            style={{ ...fieldStyle, marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 12, color: MUTED }}>
          Phone
          <input
            name="phone"
            defaultValue={branch?.phone ?? ""}
            placeholder="+998 90 000 00 00"
            style={{ ...fieldStyle, marginTop: 4 }}
          />
        </label>
      </div>

      {branch ? (
        <label style={{ fontSize: 12, color: MUTED, display: "block", marginTop: 10 }}>
          Status
          <select
            name="active"
            defaultValue={branch.active ? "on" : "off"}
            style={{ ...fieldStyle, marginTop: 4 }}
          >
            <option value="on">Open</option>
            <option value="off">Closed</option>
          </select>
        </label>
      ) : null}

      <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <SubmitButton pending={pending}>{branch ? "Save branch" : "Add branch"}</SubmitButton>
        {branch ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              background: "none",
              border: 0,
              color: MUTED,
              fontFamily: "inherit",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        ) : null}
      </div>
      <FormMessage state={state} />
    </form>
  );
}

function DeleteBranchButton({ id, name, rooms }: { id: string; name: string; rooms: number }) {
  const [state, formAction, pending] = useRefreshingAction(deleteBranch);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const warning =
          rooms > 0
            ? `Delete "${name}"? Its ${rooms} room${rooms === 1 ? "" : "s"} stay, with every lesson in them, but stop belonging to a branch.`
            : `Delete "${name}"?`;
        if (!window.confirm(warning)) e.preventDefault();
      }}
      style={{ display: "inline" }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        style={{
          background: "none",
          border: 0,
          color: "#A63A30",
          fontFamily: "inherit",
          fontSize: 12.5,
          cursor: "pointer",
        }}
      >
        {pending ? "…" : "Delete"}
      </button>
      {state.error ? (
        <span style={{ fontSize: 11.5, color: "#A63A30" }}> {state.error}</span>
      ) : null}
    </form>
  );
}
