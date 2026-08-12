import { FaFileCsv, FaFileExcel, FaFilePdf } from "react-icons/fa6";

/**
 * Download links that look like the file they produce.
 *
 * One component for every export in the console, because these were drifting:
 * some said "Excel", some said "XLSX", one was a bare chip with no clue what it
 * would give you. A spreadsheet icon in Excel green and a document icon in
 * Acrobat red are recognised before the label is read — which matters here,
 * because these sit in a row of otherwise identical grey chips.
 *
 * ALWAYS A PLAIN `<a download>`, never `next/link`. These URLs return a file;
 * a client-side navigation to one tries to render a spreadsheet as a page.
 */

const FORMATS = {
  xlsx: { Icon: FaFileExcel, color: "#1D6F42", label: "Excel" },
  csv: { Icon: FaFileCsv, color: "#0F6CBD", label: "CSV" },
  pdf: { Icon: FaFilePdf, color: "#B3261E", label: "PDF" },
} as const;

export type FileFormat = keyof typeof FORMATS;

export function FileIcon({ format, size = 14 }: { format: FileFormat; size?: number }) {
  const { Icon, color } = FORMATS[format];
  return <Icon size={size} color={color} aria-hidden />;
}

export function DownloadLink({
  href,
  format,
  label,
  title,
  style,
}: {
  href: string;
  format: FileFormat;
  /** Defaults to the format's own name — pass one when the row needs context. */
  label?: string;
  title?: string;
  style?: React.CSSProperties;
}) {
  const { label: fallback } = FORMATS[format];
  return (
    <a
      href={href}
      download
      title={title ?? `Download as ${fallback}`}
      className="cn-chip"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 9,
        border: "1px solid #E0DED8",
        background: "#fff",
        padding: "7px 12px",
        fontFamily: "inherit",
        fontSize: 13,
        color: "#16162E",
        textDecoration: "none",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <FileIcon format={format} />
      {label ?? fallback}
    </a>
  );
}
