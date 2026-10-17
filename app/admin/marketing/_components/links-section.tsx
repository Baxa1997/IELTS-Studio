"use client";

import { useRef, useState, useTransition } from "react";

import { EditorSection } from "@/app/admin/_components/editor-chrome";
import { Empty, FAINT, INK } from "@/app/admin/_components/ui";
import type { BroadcastLink } from "@/lib/marketing/render";
import { SOFT_RULE } from "@/lib/theme/tokens";

import { uploadAssets } from "../actions";
import { clipStyle, field, ghostBtn, secondaryBtn } from "./composer-styles";

/**
 * The links and files listed under the message.
 *
 * Owns only what it alone uses — the half-typed link and the upload in flight.
 * The list itself is the composer's, because the send carries it.
 */
export function LinksSection({
  links,
  onLinks,
  busy,
  uploadsEnabled,
  onError,
}: {
  links: BroadcastLink[];
  onLinks: (update: (prev: BroadcastLink[]) => BroadcastLink[]) => void;
  busy: boolean;
  uploadsEnabled: boolean;
  /** A message to show, or null to clear the one showing. */
  onError: (message: string | null) => void;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, startUpload] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function addLink() {
    const href = url.trim();
    if (!href) return;
    if (!/^https?:\/\//i.test(href)) {
      onError("A link has to start with http:// or https://");
      return;
    }
    onLinks((prev) => [...prev, { label: label.trim() || href, url: href }]);
    setLabel("");
    setUrl("");
    onError(null);
  }

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const form = new FormData();
    for (const file of Array.from(files)) form.append("files", file);
    onError(null);
    startUpload(async () => {
      const result = await uploadAssets({}, form);
      if (result.links?.length) onLinks((prev) => [...prev, ...result.links!]);
      if (result.error) onError(result.error);
      if (fileInput.current) fileInput.current.value = "";
    });
  }

  return (
    <EditorSection
      title={`Links and files${links.length ? ` · ${links.length}` : ""}`}
      note="Listed under the message. Files are uploaded and sent as links, never as attachments — attachments on a bulk send hurt deliverability and hit size limits. 20 MB each."
    >
      {links.length === 0 ? (
        <Empty>Nothing attached yet.</Empty>
      ) : (
        <div>
          {links.map((l, i) => (
            <div
              key={`${l.url}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 4px",
                borderBottom: `1px solid ${SOFT_RULE}`,
                fontSize: 13,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: INK, fontWeight: 500, ...clipStyle }}>{l.label}</div>
                <div style={{ fontSize: 11.5, color: FAINT, ...clipStyle }}>{l.url}</div>
              </div>
              <button
                type="button"
                onClick={() => onLinks((prev) => prev.filter((_, j) => j !== i))}
                disabled={busy}
                style={ghostBtn}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          disabled={busy}
          style={{ ...field, flex: "1 1 150px", minWidth: 0 }}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          disabled={busy}
          style={{ ...field, flex: "2 1 230px", minWidth: 0 }}
        />
        <button type="button" onClick={addLink} disabled={busy} style={secondaryBtn}>
          Add link
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          disabled={busy || uploading || !uploadsEnabled}
          onClick={() => fileInput.current?.click()}
          style={{ ...secondaryBtn, opacity: uploadsEnabled ? 1 : 0.5 }}
        >
          {uploading ? "Uploading…" : "Upload files"}
        </button>
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        <span style={{ fontSize: 12, color: FAINT }}>PDF, image, video or Office document</span>
      </div>
    </EditorSection>
  );
}
