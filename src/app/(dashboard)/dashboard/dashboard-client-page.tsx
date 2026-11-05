"use client";

import dynamic from "next/dynamic";

const PageComp = dynamic(() => import("@/features/dashboard/dashboard-page").then((m: any) => ({ default: m.DashboardPage })), { ssr: false });

export function DashboardClientPage() {
  return <PageComp />;
}
