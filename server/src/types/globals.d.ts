/**
 * Minimal ambient declarations for Bun/Node globals used by the server.
 * Avoids dependency on @types/node / @types/bun which can fail to resolve
 * in some TypeScript/Vercel environments.
 */
declare const Bun: {
  env: Record<string, string | undefined>;
};

declare const process: {
  env: Record<string, string | undefined>;
  uptime(): number;
};
