"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ReportShowcase = dynamic(
  () => import("./demo-screens").then((mod) => mod.ReportShowcase),
  { ssr: false, loading: () => <ReportPlaceholder /> },
);

export function DeferredReportShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{ready ? <ReportShowcase /> : <ReportPlaceholder />}</div>;
}

function ReportPlaceholder() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading reports"
      style={{
        minHeight: 260,
        marginTop: 28,
        borderRadius: 18,
        border: "1px solid #E5E2D2",
        background: "linear-gradient(110deg,#faf9f4 8%,#fff 18%,#faf9f4 33%)",
        backgroundSize: "200% 100%",
        animation: "lp-demo-shimmer 1.6s linear infinite",
      }}
    />
  );
}
