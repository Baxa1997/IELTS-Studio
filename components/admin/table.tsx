import { FAINT, INK, LINE, MUTED, SANS } from "@/components/console/page-ui";

/**
 * Table furniture for the platform console.
 *
 * Long lists live in their own scroll container with a sticky header, rather
 * than running the page to thousands of pixels: the filters stay put, and you
 * never lose which column you're reading.
 *
 * Filtering is a plain GET form — server-rendered, no client JavaScript, and
 * every view is a URL you can bookmark or send to someone.
 */

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <form
      method="get"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: 10,
        marginBottom: 14,
      }}
    >
      {children}
      <button
        type="submit"
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 13.5,
          color: "#fff",
          background: INK,
          border: "none",
          borderRadius: 9,
          padding: "8px 15px",
          cursor: "pointer",
        }}
      >
        Apply
      </button>
    </form>
  );
}

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 11.5,
  letterSpacing: ".04em",
  textTransform: "uppercase",
  color: FAINT,
  marginBottom: 5,
};

const control: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 13.5,
  color: INK,
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 9,
  padding: "8px 11px",
  minWidth: 150,
};

export function SelectField({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label>
      <span style={fieldLabel}>{label}</span>
      <select name={name} defaultValue={value ?? options[0]?.value} style={control}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SearchField({
  name,
  label,
  value,
  placeholder,
}: {
  name: string;
  label: string;
  value?: string;
  placeholder?: string;
}) {
  return (
    <label>
      <span style={fieldLabel}>{label}</span>
      <input
        type="search"
        name={name}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        style={{ ...control, minWidth: 200 }}
      />
    </label>
  );
}

/**
 * Scrolling table body with a header that stays. `maxHeight` caps the viewport
 * the rows scroll inside; the whole thing also scrolls sideways on narrow
 * screens so the page body never does.
 */
export function ScrollTable({
  children,
  maxHeight = 520,
  caption,
}: {
  children: React.ReactNode;
  maxHeight?: number;
  caption?: string;
}) {
  return (
    <div>
      <div
        className="cn-noscrollbar"
        style={{
          maxHeight,
          overflowY: "auto",
          overflowX: "auto",
          border: `1px solid ${LINE}`,
          borderRadius: 12,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS }}>
          {children}
        </table>
      </div>
      {caption ? (
        <p style={{ fontFamily: SANS, fontSize: 12, color: FAINT, margin: "8px 0 0" }}>{caption}</p>
      ) : null}
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
      <tr>{children}</tr>
    </thead>
  );
}

export function TH({
  children,
  align = "left",
  width,
}: {
  /** Omitted for an action column, whose header is deliberately blank. */
  children?: React.ReactNode;
  align?: "left" | "right";
  width?: number | string;
}) {
  return (
    <th
      scope="col"
      style={{
        textAlign: align,
        width,
        whiteSpace: "nowrap",
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: ".05em",
        textTransform: "uppercase",
        color: FAINT,
        background: "#FBFBFD",
        borderBottom: `1px solid ${LINE}`,
        padding: "10px 14px",
      }}
    >
      {children}
    </th>
  );
}

export function TR({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  return <tr style={{ borderTop: first ? "none" : `1px solid ${LINE}` }}>{children}</tr>;
}

export function TD({
  children,
  align = "left",
  muted = false,
  numeric = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  muted?: boolean;
  numeric?: boolean;
}) {
  return (
    <td
      style={{
        textAlign: align,
        padding: "11px 14px",
        fontSize: 14,
        color: muted ? MUTED : INK,
        verticalAlign: "middle",
        fontVariantNumeric: numeric ? "tabular-nums" : undefined,
        whiteSpace: numeric ? "nowrap" : undefined,
      }}
    >
      {children}
    </td>
  );
}

export function EmptyTableRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          padding: "26px 14px",
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 13.5,
          color: FAINT,
        }}
      >
        {children}
      </td>
    </tr>
  );
}
