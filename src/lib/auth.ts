import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function getSession() {
  try {
    const session = await auth.getSession({ headers: await headers() } as any);
    return session;
  } catch {
    return null;
  }
}

export async function getUser() {
  const session = await getSession();
  return (session as any)?.data?.user || (session as any)?.user || null;
}
