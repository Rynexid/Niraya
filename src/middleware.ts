import { auth } from "@/server/auth";

export default async function middleware(req: any) {
  return auth.middleware({
    loginUrl: "/login",
    publicRoutes: ["/login", "/signup"],
  })(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
