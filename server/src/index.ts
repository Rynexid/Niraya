import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { env } from "./lib/env";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: env("CORS_ORIGIN", "http://localhost:5173"),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    credentials: true,
  })
);

app.get("/health", (c) => {
  return c.json({ status: "ok", service: "niraya-api" });
});

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

const port = Number(env("PORT", "4000"));

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Niraya API running on http://localhost:${info.port}`);
  }
);

export default app;
