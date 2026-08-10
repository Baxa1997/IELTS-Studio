"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Timetable writes.
 *
 * Authority differs from finance on purpose: a teacher may schedule the classes
 * they own (RLS: `can_manage_group`), because the person who knows when a class
 * meets is the person teaching it. Rooms belong to the center, so only a
 * center_admin creates them.
 */

export interface ActionState {
  error?: string;
  ok?: string;
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Add or move one weekly slot.
 *
 * A clash is a WARNING, not a rejection. Centers double-book on purpose — a
 * room split between two small groups, a teacher covering the first half hour —
 * and a scheduler that refuses is a scheduler people stop using. The grid shows
 * the collision instead, in red, on both blocks.
 */
export async function saveSlot(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") return { error: "Only staff can edit the timetable." };

  const groupId = str(formData, "group_id");
  if (!groupId) return { error: "Pick a class." };

  const weekday = Number(str(formData, "weekday"));
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return { error: "Pick a day." };

  const startsAt = str(formData, "starts_at");
  const endsAt = str(formData, "ends_at");
  if (!TIME.test(startsAt) || !TIME.test(endsAt)) return { error: "Use times like 15:30." };
  if (endsAt <= startsAt) return { error: "The lesson has to end after it starts." };

  const pattern = str(formData, "pattern") || "weekly";
  if (!["weekly", "odd", "even"].includes(pattern)) return { error: "Unknown repeat pattern." };

  const roomId = str(formData, "room_id") || null;
  const id = str(formData, "id") || null;

  const supabase = await createClient();
  const payload = {
    organization_id: profile.organization_id,
    group_id: groupId,
    room_id: roomId,
    weekday,
    starts_at: startsAt,
    ends_at: endsAt,
    pattern,
  };

  const { error } = id
    ? await supabase.from("lesson_slots").update(payload).eq("id", id)
    : await supabase.from("lesson_slots").insert(payload);
  if (error) return { error: error.message };

  // Was anything else already in that room at that hour? Say so, don't block.
  let warning = "";
  if (roomId) {
    const { data: clashes } = await supabase
      .from("lesson_slots")
      .select("id, starts_at, ends_at, groups:group_id ( name )")
      .eq("room_id", roomId)
      .eq("weekday", weekday);
    const overlapping = ((clashes ?? []) as unknown as Record<string, unknown>[]).filter((s) => {
      if (id && s.id === id) return false;
      const from = String(s.starts_at).slice(0, 5);
      const to = String(s.ends_at).slice(0, 5);
      return startsAt < to && from < endsAt;
    });
    if (overlapping.length > 0) {
      const other = overlapping[0];
      const group = (Array.isArray(other.groups) ? other.groups[0] : other.groups) as {
        name?: string;
      } | null;
      warning = ` Note: ${group?.name ?? "another class"} is already in that room then.`;
    }
  }

  revalidatePath("/console/calendar");
  revalidatePath(`/console/groups/${groupId}`);
  return { ok: `${id ? "Slot moved." : "Slot added."}${warning}` };
}

export async function deleteSlot(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") return { error: "Only staff can edit the timetable." };

  const id = str(formData, "id");
  if (!id) return { error: "Nothing to remove." };

  const supabase = await createClient();
  const { error } = await supabase.from("lesson_slots").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/console/calendar");
  return { ok: "Slot removed." };
}

export async function saveRoom(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") return { error: "Only the center owner can manage rooms." };

  const name = str(formData, "name");
  if (!name) return { error: "Give the room a name." };

  const capacityRaw = str(formData, "capacity");
  const capacity = capacityRaw === "" ? null : Number(capacityRaw);
  if (capacity != null && (!Number.isInteger(capacity) || capacity < 0)) {
    return { error: "Capacity has to be a whole number." };
  }

  const supabase = await createClient();
  const id = str(formData, "id") || null;
  const payload = {
    organization_id: profile.organization_id,
    name,
    capacity,
    color: str(formData, "color") || null,
    active: str(formData, "active") !== "off",
  };

  const { error } = id
    ? await supabase.from("rooms").update(payload).eq("id", id)
    : await supabase.from("rooms").insert(payload);
  if (error) {
    if (error.code === "23505") return { error: "There is already a room with that name." };
    return { error: error.message };
  }

  revalidatePath("/console/calendar");
  return { ok: id ? "Room updated." : `${name} added.` };
}

export async function deleteRoom(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") return { error: "Only the center owner can manage rooms." };

  const id = str(formData, "id");
  if (!id) return { error: "Nothing to remove." };

  // The FK is ON DELETE SET NULL, so the classes booked into it stay on the
  // timetable and simply lose their room — better than losing the slot.
  const supabase = await createClient();
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/console/calendar");
  return { ok: "Room removed. Classes booked in it are now unassigned." };
}
