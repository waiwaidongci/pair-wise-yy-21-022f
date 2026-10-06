import type { RequestHandler } from "express";

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const rawId = req.header("x-user-id");
  const id = rawId && Number.isFinite(Number(rawId)) ? Number(rawId) : 1;
  const role = req.header("x-role") ?? "admin";
  (req as unknown as { user: { id: number; role: string } }).user = { id, role };
  next();
};
