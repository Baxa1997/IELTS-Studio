"use client";

import dynamic from "next/dynamic";

export const DashboardCoach = dynamic(
  () => import("./dashboard-coach").then((mod) => mod.DashboardCoach),
  { ssr: false },
);
