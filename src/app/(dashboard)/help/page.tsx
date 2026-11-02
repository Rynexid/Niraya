"use client";

import dynamic from "next/dynamic";

const PageComp = dynamic(() => import("@/features/help/help-page").then((m: any) => ({ default: m.HelpPage })), { ssr: false });

export default function Page() {
  return <PageComp />;
}
