"use server";

import { revalidatePath } from "next/cache";

import { recordAdminAction } from "@/lib/admin/audit";
import { requireSuperAdmin } from "@/lib/auth";
import { uploadMarketingAsset } from "@/lib/marketing/assets";
import { createBroadcast, sendNextBatch, sendTestMessage } from "@/lib/marketing/broadcast";
import { isSafeUrl, type BroadcastLink } from "@/lib/marketing/render";

/**
 * The marketing composer's actions.
 *
 * EVERY ONE OF THEM CALLS `requireSuperAdmin()` ITSELF. A server action is an
 * RPC endpoint anybody can POST to — the guard on the page that renders the
 * form protects the form, not the action behind it. Getting this wrong here
 * would hand the whole user base's inbox to any signed-in account.
 */

export interface ComposeState {
  error?: string;
  notice?: string;
  broadcastId?: string;
  queued?: number;
}

export interface UploadState {
  error?: string;
  links?: BroadcastLink[];
}

/** Put one or more files in the public marketing bucket, return their links. */
export async function uploadAssets(_prev: UploadState, formData: FormData): Promise<UploadState> {
  await requireSuperAdmin();

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "No file chosen." };
  if (files.length > 10) return { error: "Ten files at a time is the limit." };

  const links: BroadcastLink[] = [];
  for (const file of files) {
    const result = await uploadMarketingAsset(file);
    // One bad file reports itself and keeps whatever already uploaded, rather
    // than throwing the admin back to an empty form.
    if (result.error) return { error: result.error, links };
    if (result.url) links.push({ label: result.label ?? file.name, url: result.url });
  }
  return { links };
}

/** Pictures in the message itself. Smaller than the 20 MB a linked file may
 *  be: an inline picture is downloaded by every reader who opens the mail, and
 *  a heavy one reads as a spam signal before anybody sees it. */
const EMAIL_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const EMAIL_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export interface ImageState {
  error?: string;
  url?: string;
}

/** One picture for the message body, into the same public bucket as the files. */
export async function uploadEmailImage(_prev: ImageState, formData: FormData): Promise<ImageState> {
  await requireSuperAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No picture chosen." };
  if (!EMAIL_IMAGE_TYPES.has(file.type)) return { error: "Use a JPEG, PNG, GIF or WebP picture." };
  if (file.size > EMAIL_IMAGE_MAX_BYTES) return { error: "Keep pictures under 2 MB — every reader downloads them." };

  const result = await uploadMarketingAsset(file);
  return result.url ? { url: result.url } : { error: result.error ?? "Upload failed." };
}

/** The links box arrives as JSON; anything that is not an http(s) link is dropped. */
function parseLinks(raw: string): BroadcastLink[] | null {
  if (!raw.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l): l is BroadcastLink => Boolean(l) && typeof (l as BroadcastLink).url === "string")
      .map((l) => ({ label: String(l.label ?? "").trim(), url: String(l.url).trim() }))
      .filter((l) => isSafeUrl(l.url));
  } catch {
    return null;
  }
}

export interface TestState {
  error?: string;
  notice?: string;
}

/**
 * Send the message as it stands to the signed-in admin, and to nobody else.
 *
 * ⚠️ THE ADDRESS IS THE SESSION'S, NEVER THE FORM'S. A "send a test to…" box
 * would make this action a way to mail any address from our domain with our
 * template on it — an open relay with a nicer face.
 */
export async function sendTestEmail(_prev: TestState, formData: FormData): Promise<TestState> {
  const { user } = await requireSuperAdmin();
  const to = user.email;
  if (!to) return { error: "Your account has no email address to send a test to." };

  const links = parseLinks(String(formData.get("links") ?? ""));
  if (!links) return { error: "Those links couldn't be read. Remove them and add them again." };

  const result = await sendTestMessage({
    to,
    userId: user.id,
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? ""),
    links,
  });
  return result.sent ? { notice: `Test sent to ${to}.` } : { error: result.detail ?? "Couldn't send the test." };
}

/**
 * Queue a broadcast. Does NOT send it — `drainBroadcast` does, in batches,
 * because ~180 SMTP round trips do not fit in one invocation.
 */
export async function composeBroadcast(
  _prev: ComposeState,
  formData: FormData,
): Promise<ComposeState> {
  const { user } = await requireSuperAdmin();

  const subject = String(formData.get("subject") ?? "");
  // The editor's HTML; `createBroadcast` cleans it before it is stored.
  const body = String(formData.get("body") ?? "");

  /* The recipient list arrives as ids, and the addresses are re-resolved
     server-side in `createBroadcast`. If the form could name addresses, this
     action would be an open relay wearing our domain. */
  const profileIds = String(formData.get("profile_ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const links = parseLinks(String(formData.get("links") ?? ""));
  if (!links) return { error: "Those links couldn't be read. Remove them and add them again." };

  const { id, error, queued } = await createBroadcast({
    subject,
    body,
    links,
    profileIds,
    createdBy: user.id,
  });
  if (error || !id) return { error: error ?? "Couldn't queue that." };

  await recordAdminAction({
    action: "platform.broadcast",
    targetKind: "platform",
    targetId: id,
    detail: { subject: subject.trim(), recipients: queued, links: links.length },
    actor: { id: user.id, email: user.email },
  });

  revalidatePath("/admin/marketing");
  return { broadcastId: id, queued, notice: `Queued for ${queued} ${queued === 1 ? "person" : "people"}.` };
}

export interface DrainState {
  done: boolean;
  sent: number;
  failed: number;
  remaining: number;
  error?: string;
}

/** Send the next batch. The composer calls this in a loop until `done`. */
export async function drainBroadcast(broadcastId: string): Promise<DrainState> {
  await requireSuperAdmin();
  if (!broadcastId) return { done: true, sent: 0, failed: 0, remaining: 0, error: "No broadcast." };

  const result = await sendNextBatch(broadcastId);
  if (result.done) revalidatePath("/admin/marketing");
  return {
    done: result.done,
    sent: result.sentNow,
    failed: result.failedNow,
    remaining: result.remaining,
    error: result.error ?? undefined,
  };
}
