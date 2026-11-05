import { redirect } from "next/navigation";

import { getCurrentUserRole } from "@/server/auth/session";

import { DashboardClientPage } from "./dashboard-client-page";

export default async function Page() {
  const role = await getCurrentUserRole();
  if (role === "user") redirect("/profile");

  return <DashboardClientPage />;
}
