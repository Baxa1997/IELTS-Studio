"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import type { Inbox } from "@/lib/notifications/load";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INK = "#1A2138";
const MUTED = "#5A6076";
const FAINT = "#8A8FA0";
const LINE = "#ECEAF2";
const INDIGO = "#3B43B5";

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

/**
 * The bell. This is the ONLY channel that reaches every user: a center student
 * may have no real email address, so anything that depends on a mailbox reaches
 * some of them and not others.
 *
 * Reading is a navigation, not a state machine — opening an item takes you to it
 * and marks it read there. The dropdown itself only shows and links.
 */
export function NotificationBell({ inbox }: { inbox: Inbox }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={inbox.unread > 0 ? `Notifications (${inbox.unread} unread)` : "Notifications"}
        aria-expanded={open}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          color: "#C3C8E9",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: 6,
        }}
      >
        <Bell size={18} />
        {inbox.unread > 0 ? (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              minWidth: 16,
              height: 16,
              borderRadius: 999,
              background: "#F0857A",
              color: "#1A2138",
              fontFamily: SANS,
              fontSize: 10.5,
              fontWeight: 800,
              lineHeight: "16px",
              textAlign: "center",
              padding: "0 4px",
            }}
          >
            {inbox.unread > 9 ? "9+" : inbox.unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          {/* click-away */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "transparent", border: "none", zIndex: 70 }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: "min(320px, calc(100vw - 32px))",
              background: "#fff",
              border: `1px solid ${LINE}`,
              borderRadius: 14,
              boxShadow: "0 16px 40px rgba(26,33,56,0.18)",
              zIndex: 71,
              overflow: "hidden",
              fontFamily: SANS,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "11px 14px",
                borderBottom: `1px solid ${LINE}`,
              }}
            >
              <strong style={{ fontSize: 13.5, color: INK }}>Notifications</strong>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                style={{ fontSize: 12.5, fontWeight: 600, color: INDIGO, textDecoration: "none" }}
              >
                See all
              </Link>
            </div>

            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {inbox.items.length === 0 ? (
                <p style={{ padding: "16px 14px", fontSize: 13, color: FAINT, margin: 0 }}>
                  Nothing yet. Homework and marked work show up here.
                </p>
              ) : (
                inbox.items.map((n, i) => {
                  const body = (
                    <>
                      <span
                        style={{
                          display: "block",
                          fontSize: 13.5,
                          fontWeight: n.read ? 500 : 700,
                          color: INK,
                        }}
                      >
                        {n.title}
                      </span>
                      {n.body ? (
                        <span style={{ display: "block", fontSize: 12.5, color: MUTED, marginTop: 2 }}>
                          {n.body}
                        </span>
                      ) : null}
                      <span style={{ display: "block", fontSize: 11.5, color: FAINT, marginTop: 3 }}>
                        {ago(n.createdAt)}
                      </span>
                    </>
                  );
                  const style: React.CSSProperties = {
                    display: "block",
                    padding: "11px 14px",
                    borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                    background: n.read ? "#fff" : "#F8F7FE",
                    textDecoration: "none",
                  };
                  return n.href ? (
                    <Link key={n.id} href={n.href} onClick={() => setOpen(false)} style={style}>
                      {body}
                    </Link>
                  ) : (
                    <div key={n.id} style={style}>
                      {body}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
