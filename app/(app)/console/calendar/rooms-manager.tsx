"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import { FAINT, INK, MUTED } from "@/lib/theme/tokens";
import { fieldStyle, FormMessage, SubmitButton } from "@/components/console/finance-ui";

import { type ActionState, deleteRoom, saveRoom } from "./actions";
import { useActionFeedback } from "@/components/console/toast";

/**
 * `revalidatePath` refreshes the server tree, but this panel lives inside a
 * drawer that stays open across the write, so the list behind it can render
 * from the payload React already had. Asking the router directly is what makes
 * a rename show up the moment it is saved.
 */
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
 * Rooms: add, rename, recolour, close, delete.
 *
 * The first version of this offered an add form and a read-only list, which is
 * how you end up with a room called "12" that you cannot rename and cannot get
 * rid of. A room is a column of the timetable and the thing two groups cannot
 * share, so it needs the full set of edits, in one place, visible on the page
 * that uses them.
 *
 * Deleting is safe by construction: the FK is ON DELETE SET NULL, so the
 * lessons booked into a deleted room stay on the timetable and simply lose
 * their room, rather than vanishing with it.
 */

const ROOM_COLORS = ["#4340CB", "#16794C", "#B8791F", "#C2453A", "#6B44A2", "#2F5D8C"];

export interface RoomRow {
  id: string;
  name: string;
  capacity: number | null;
  color: string | null;
  active: boolean;
  branchId: string;
  lessons: number;
}

export interface BranchOption {
  id: string;
  name: string;
}

export function RoomsManager({
  rooms,
  branches,
  defaultBranchId,
}: {
  rooms: RoomRow[];
  branches: BranchOption[];
  /** The branch tab you were on, so a new room lands where you are looking. */
  defaultBranchId?: string | null;
}) {
  return (
    <div>
      <RoomEditor
        key={`new-${rooms.length}`}
        suggestedColor={ROOM_COLORS[rooms.length % ROOM_COLORS.length]}
        branches={branches}
        defaultBranchId={defaultBranchId}
      />

      {rooms.length > 0 ? (
        <div style={{ marginTop: 24, borderTop: "1px solid #D4D3CE", paddingTop: 16 }}>
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
            {rooms.length} room{rooms.length === 1 ? "" : "s"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rooms.map((room) => (
              <RoomEditor
                key={room.id}
                room={room}
                suggestedColor={room.color ?? ROOM_COLORS[0]}
                branches={branches}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RoomEditor({
  room,
  suggestedColor,
  branches,
  defaultBranchId,
}: {
  room?: RoomRow;
  suggestedColor: string;
  branches: BranchOption[];
  defaultBranchId?: string | null;
}) {
  const [open, setOpen] = useState(!room);
  const [color, setColor] = useState(room?.color ?? suggestedColor);
  const [state, formAction, pending] = useRefreshingAction(saveRoom);

  if (room && !open) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          border: "1px solid #C5C4BE",
          borderRadius: 10,
          background: room.active ? "#fff" : "#FAFAF8",
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 4,
            background: room.color ?? "#C9C7E4",
            flex: "none",
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: INK, fontWeight: 500 }}>{room.name}</div>
          <div style={{ fontSize: 11.5, color: FAINT }}>
            {branches.length > 1
              ? `${branches.find((b) => b.id === room.branchId)?.name ?? "—"} · `
              : ""}
            {room.capacity ? `${room.capacity} seats · ` : ""}
            {room.lessons} lesson{room.lessons === 1 ? "" : "s"} a week
            {room.active ? "" : " · closed"}
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
        <DeleteRoomButton id={room.id} name={room.name} lessons={room.lessons} />
      </div>
    );
  }

  return (
    <form
      action={formAction}
      key={state.ok ?? "form"}
      style={{
        border: "1px solid #C5C4BE",
        borderRadius: 10,
        padding: "12px 13px",
        background: "#fff",
      }}
    >
      {room ? <input type="hidden" name="id" value={room.id} /> : null}
      <input type="hidden" name="color" value={color} />

      {/* A room is always at a branch. With one branch there is nothing to
          decide, so the field is sent hidden and the form stays short. Moving a
          room to another branch un-rooms any lesson whose group is at the old
          one — the lesson survives, it just needs a new room. */}
      {branches.length > 1 ? (
        <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 10 }}>
          Branch
          <select
            name="branch_id"
            required
            defaultValue={room?.branchId ?? defaultBranchId ?? branches[0]?.id ?? ""}
            style={{ ...fieldStyle, marginTop: 4 }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input
          type="hidden"
          name="branch_id"
          value={room?.branchId ?? defaultBranchId ?? branches[0]?.id ?? ""}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr .8fr", gap: 10 }}>
        <label style={{ fontSize: 12, color: MUTED }}>
          Room name
          <input
            name="name"
            required
            defaultValue={room?.name}
            placeholder="Room 1"
            style={{ ...fieldStyle, marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 12, color: MUTED }}>
          Seats
          <input
            name="capacity"
            type="number"
            min={0}
            defaultValue={room?.capacity ?? ""}
            placeholder="12"
            style={{ ...fieldStyle, marginTop: 4 }}
          />
        </label>
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}
      >
        <span style={{ fontSize: 12, color: MUTED }}>Colour</span>
        {ROOM_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Colour ${c}`}
            onClick={() => setColor(c)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: c,
              border: color === c ? "2px solid #16162E" : "1px solid rgba(0,0,0,.1)",
              cursor: "pointer",
            }}
          />
        ))}
        {room ? (
          <label style={{ fontSize: 12, color: MUTED, marginLeft: "auto" }}>
            <select name="active" defaultValue={room.active ? "on" : "off"} style={fieldStyle}>
              <option value="on">Open</option>
              <option value="off">Closed</option>
            </select>
          </label>
        ) : null}
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <SubmitButton pending={pending}>{room ? "Save room" : "Add room"}</SubmitButton>
        {room ? (
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

function DeleteRoomButton({ id, name, lessons }: { id: string; name: string; lessons: number }) {
  const [state, formAction, pending] = useRefreshingAction(deleteRoom);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const warning =
          lessons > 0
            ? `Delete "${name}"? Its ${lessons} lesson${lessons === 1 ? "" : "s"} stay on the timetable but lose their room.`
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
