import path from "path";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbHost: process.env.DB_HOST ?? "localhost",
  dispatchDataDir: process.env.DISPATCH_DATA_DIR ?? path.join(process.cwd(), "data")
};
