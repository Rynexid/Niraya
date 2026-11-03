"use client";

import dynamic from "next/dynamic";

const PageComp = dynamic(() => import("@/features/pos/pages/pos-page").then((m) => m.default), { ssr: false });

export default function Page() {
  return <PageComp />;
}
