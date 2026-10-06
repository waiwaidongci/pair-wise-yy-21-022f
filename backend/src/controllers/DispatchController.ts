import type { NextFunction, Request, Response } from "express";
import { dispatchRepository } from "../repositories/DispatchRepository";
import { dispatchService } from "../services/DispatchService";
import type { ConfirmPayload, EnqueuePayload, HoldPayload, ReassignPayload, ReleasePayload, ReportSyncPayload, ResolvePayload } from "../types/DispatchPayload";
import { AppError } from "../utils/AppError";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

/** controller 层单独包装异常：业务错误按 code 返回，未知错误交全局 errorHandler。 */
const wrap = (handler: (req: Request) => unknown | Promise<unknown>, status = 200) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(status).json(await handler(req));
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.status).json({ code: err.code, message: err.message, details: err.details });
        return;
      }
      next(err);
    }
  };

const requireFields = (body: Record<string, unknown>, fields: string[]): void => {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === "");
  if (missing.length > 0) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, `${ERROR_MESSAGES.VALIDATION_FAILED}: ${missing.join(",")}`, 400, { missing });
  }
};

export const dispatchController = {
  state: wrap(() => dispatchService.buildStateResponse(dispatchRepository.read())),

  hold: wrap(async (req) => {
    const body = req.body as HoldPayload;
    requireFields(req.body, ["ticket_id", "dispatcher"]);
    return dispatchRepository.mutate((state) => dispatchService.hold(state, Number(body.ticket_id), String(body.dispatcher)));
  }, 201),

  release: wrap(async (req) => {
    const body = req.body as ReleasePayload;
    requireFields(req.body, ["ticket_id", "dispatcher"]);
    return dispatchRepository.mutate((state) => dispatchService.release(state, Number(body.ticket_id), String(body.dispatcher)));
  }),

  confirm: wrap(async (req) => {
    const body = req.body as ConfirmPayload;
    requireFields(req.body, ["ticket_id", "crew_id", "dispatcher"]);
    return dispatchRepository.mutate((state) => dispatchService.confirm(state, Number(body.ticket_id), Number(body.crew_id), String(body.dispatcher)));
  }),

  enqueue: wrap(async (req) => {
    const body = req.body as EnqueuePayload;
    requireFields(req.body, ["ticket_id", "crew_id", "dispatcher"]);
    return dispatchRepository.mutate((state) => dispatchService.enqueue(state, Number(body.ticket_id), Number(body.crew_id), String(body.dispatcher)));
  }, 201),

  cancelQueue: wrap(async (req) =>
    dispatchRepository.mutate((state) => dispatchService.cancelQueue(state, Number(req.params.id), String(req.body.dispatcher ?? "")))),

  dispatchQueue: wrap(async (req) =>
    dispatchRepository.mutate((state) => dispatchService.dispatchFromQueue(state, Number(req.params.id), String(req.body.dispatcher ?? "")))),

  reassign: wrap(async (req) => {
    const body = req.body as ReassignPayload;
    requireFields(req.body, ["ticket_id", "dispatcher"]);
    return dispatchRepository.mutate((state) => dispatchService.reassign(state, Number(body.ticket_id), String(body.dispatcher), body.reason));
  }),

  syncReports: wrap(async (req) => {
    const body = req.body as ReportSyncPayload;
    requireFields(req.body, ["reports"]);
    return dispatchRepository.mutate((state) => dispatchService.syncReports(state, body.reports ?? []));
  }),

  resolveReconciliation: wrap(async (req) => {
    const body = req.body as ResolvePayload;
    requireFields(req.body, ["resolver"]);
    return dispatchRepository.mutate((state) => dispatchService.resolveReconciliation(state, Number(req.params.id), String(body.resolver), body.note));
  }),

  reset: wrap(async () => {
    const state = await dispatchRepository.reset();
    return dispatchService.buildStateResponse(state);
  })
};
