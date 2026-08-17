"use client";

import { useActionState, useState } from "react";

import { describeDays } from "@/lib/console/timetable-days";

import { type GroupFormState, setGroupSchedule } from "../actions";
import { type RoomChoice, ScheduleFields } from "../schedule-fields";
import { useActionFeedback } from "@/components/console/toast";

/**
 * Change when an existing group meets.
 *
 * A CLASS CAN HOLD SEVERAL BOOKINGS, and this has to respect that. "IELTS
 * Evening, Tue+Wed 08:00" and "IELTS Evening, Tue+Wed 15:30" are two
 * independent series — four rows — and a center really does run the same group
 * twice a day. So each series is edited on its own, and clearing one never
 * touches the other. The first version of this reconciled every slot on the
 * group into a single series; against the live data it would have deleted
 * three of four bookings.
 *
 * Editing reconciles rather than replaces: a day left ticked keeps its row, its
 * id and its `effective_from`, so changing a time does not restart the term.
 */

const MUTED = "#6E6C87";
const FAINT = "#777581";
const LINE = "#EAE8E1";
const INDIGO = "#4340CB";

export interface ScheduleSeries {
  seriesId: string;
  weekdays: number[];
  startsAt: string;
  endsAt: string;
  roomId: string | null;
}

export function SchedulePanel({
  groupId,
  rooms,
  branchId,
  series,
}: {
  groupId: string;
  rooms: RoomChoice[];
  branchId: string;
  series: ScheduleSeries[];
}) {
  // Which booking is open for editing, by series id — or "new" for an extra
  // one. Nothing is open by default when there is more than one: the list has
  // to be readable before it is editable.
  const [editing, setEditing] = useState<string | null>(
    series.length === 0 ? "new" : series.length === 1 ? series[0].seriesId : null,
  );

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {series.map((s) =>
        editing === s.seriesId ? (
          <ScheduleForm
            key={s.seriesId}
            groupId={groupId}
            rooms={rooms}
            branchId={branchId}
            current={s}
            onDone={() => (series.length > 1 ? setEditing(null) : undefined)}
            canCancel={series.length > 1}
          />
        ) : (
          <button
            key={s.seriesId}
            type="button"
            onClick={() => setEditing(s.seriesId)}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              gap: 10,
              textAlign: "left",
              background: "#fff",
              border: `1px solid ${LINE}`,
              borderRadius: 9,
              padding: "9px 11px",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#16162E" }}>
              {describeDays(s.weekdays)}
            </span>
            <span style={{ fontSize: 12.5, color: MUTED }}>
              {s.startsAt}–{s.endsAt}
              {s.roomId ? ` · ${rooms.find((r) => r.id === s.roomId)?.name ?? "room"}` : ""}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: INDIGO }}>Change</span>
          </button>
        ),
      )}

      {editing === "new" ? (
        <ScheduleForm
          groupId={groupId}
          rooms={rooms}
          branchId={branchId}
          current={null}
          onDone={() => setEditing(null)}
          canCancel={series.length > 0}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          style={{
            justifySelf: "start",
            background: "transparent",
            border: 0,
            padding: 0,
            fontFamily: "inherit",
            fontSize: 12.5,
            color: INDIGO,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {series.length === 0 ? "Put it on the timetable" : "Add another time"}
        </button>
      )}

      {series.length === 0 ? (
        <p style={{ margin: 0, fontSize: 11.5, color: FAINT, lineHeight: 1.5 }}>
          Not on the timetable. Part-month fees and salary fall back to the center&apos;s assumed
          lesson count until it is.
        </p>
      ) : null}
    </div>
  );
}

function ScheduleForm({
  groupId,
  rooms,
  branchId,
  current,
  onDone,
  canCancel,
}: {
  groupId: string;
  rooms: RoomChoice[];
  branchId: string;
  current: ScheduleSeries | null;
  onDone: () => void;
  canCancel: boolean;
}) {
  const [state, formAction, pending] = useActionState(setGroupSchedule, {} as GroupFormState);
  useActionFeedback(state);

  return (
    <form
      action={formAction}
      style={{
        display: "grid",
        gap: 12,
        border: `1px solid ${LINE}`,
        borderRadius: 9,
        padding: 11,
      }}
    >
      <input type="hidden" name="group_id" value={groupId} />
      {/* Which booking this edits. Absent on a new one, which is what tells the
          action to add a series rather than reconcile an existing one. */}
      {current ? <input type="hidden" name="series_id" value={current.seriesId} /> : null}

      <ScheduleFields
        rooms={rooms}
        branchId={branchId}
        initial={current ?? undefined}
        optional={current == null}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            height: 32,
            padding: "0 14px",
            borderRadius: 8,
            border: "none",
            background: INDIGO,
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Saving…" : current ? "Save this time" : "Add this time"}
        </button>
        {canCancel ? (
          <button
            type="button"
            onClick={onDone}
            style={{
              background: "transparent",
              border: 0,
              fontFamily: "inherit",
              fontSize: 12.5,
              color: MUTED,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        ) : null}
        {state.notice ? (
          <span style={{ fontSize: 12.5, color: "#16794C" }}>{state.notice}</span>
        ) : null}
        {state.error ? (
          <span style={{ fontSize: 12.5, color: "#B3261E" }} role="alert">
            {state.error}
          </span>
        ) : null}
      </div>

      {current ? (
        <p style={{ margin: 0, fontSize: 11.5, color: FAINT, lineHeight: 1.5 }}>
          Untick every day and save to take this booking off the timetable. The group stays.
        </p>
      ) : null}
    </form>
  );
}
