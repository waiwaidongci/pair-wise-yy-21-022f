import path from "path";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbHost: process.env.DB_HOST ?? "localhost",
  dispatchStateFile: process.env.DISPATCH_STATE_FILE ?? path.resolve(process.cwd(), "data", "dispatch-state.json"),
  dispatchHoldTtlMs: Number(process.env.DISPATCH_HOLD_TTL_MS ?? 120_000)
};
