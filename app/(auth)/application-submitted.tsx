import { HAIRLINE, INDIGO, MUTED, SANS, SERIF } from "@/app/(auth)/brand-form";

/**
 * What a center sees the moment their application goes in — shown in place of
 * the form, on both the sign-up tab and the sign-in modal.
 *
 * It says plainly that nothing is live yet and that approval is a human
 * decision, because the alternative is an applicant who thinks they have an
 * account, tries to sign in, and hits a wall they weren't warned about.
 */
export function ApplicationSubmitted({
  note,
  signInWith,
  onClose,
}: {
  /** Extra line from the server, e.g. why the login is the way in. */
  note?: string;
  /** The login this center will use — the one thing they must not forget. */
  signInWith?: string;
  /** Rendered as a button when the panel is inside the dialog. */
  onClose?: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
      {/* Indigo, not the usual success green — this is the brand's accent, and
          a green tick would also overstate things: nothing is approved yet. */}
      <div
        aria-hidden
        style={{
          width: 54,
          height: 54,
          margin: "0 auto 16px",
          borderRadius: "50%",
          background: "#F0F0FB",
          color: INDIGO,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 27,
          lineHeight: 1,
        }}
      >
        ✓
      </div>

      <h2
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 25,
          lineHeight: 1.15,
          letterSpacing: "-.015em",
          margin: 0,
        }}
      >
        Application received
      </h2>

      <p
        style={{
          fontFamily: SANS,
          fontSize: 14.5,
          lineHeight: 1.62,
          color: MUTED,
          margin: "12px auto 0",
          maxWidth: 380,
        }}
      >
        Thank you. We review every organization by hand, so your center is
        <strong style={{ color: INDIGO }}> not active yet</strong>. As soon as it&apos;s approved
        we&apos;ll send a confirmation email and you can sign in and set it up.
      </p>

      {signInWith ? (
        <div
          style={{
            margin: "18px auto 0",
            maxWidth: 380,
            padding: "12px 14px",
            background: "#F7F7FC",
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: ".07em",
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            Your login
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 18,
              color: INDIGO,
              marginTop: 4,
              wordBreak: "break-all",
            }}
          >
            {signInWith}
          </div>
        </div>
      ) : null}

      {note ? (
        <p
          style={{
            fontFamily: SANS,
            fontSize: 13.5,
            lineHeight: 1.55,
            color: MUTED,
            margin: "14px auto 0",
            maxWidth: 380,
            padding: "10px 14px",
            background: "#FFFCF4",
            border: "1px solid #E4C98A",
            borderRadius: 11,
          }}
        >
          {note}
        </p>
      ) : null}

      <p
        style={{
          fontFamily: SANS,
          fontSize: 12.5,
          color: MUTED,
          margin: "16px 0 0",
          paddingTop: 16,
          borderTop: `1px solid ${HAIRLINE}`,
        }}
      >
        We&apos;ve emailed you a copy of this. Check your spam folder if it doesn&apos;t arrive.
      </p>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 18,
            width: "100%",
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 14.5,
            color: "#fff",
            background: INDIGO,
            border: "none",
            borderRadius: 12,
            padding: "12px 18px",
            cursor: "pointer",
          }}
        >
          Done
        </button>
      ) : null}
    </div>
  );
}
