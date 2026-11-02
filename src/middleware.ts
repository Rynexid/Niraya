import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

export default async function middleware(req: any) {
  const demo = req.cookies.get("niraya_demo")?.value;
  const { pathname } = req.nextUrl;

  if (demo === "1" && pathname !== "/login" && pathname !== "/signup") {
    return NextResponse.next();
  }

  return auth.middleware({
    loginUrl: "/login",
    publicRoutes: ["/login", "/signup"],
  })(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
