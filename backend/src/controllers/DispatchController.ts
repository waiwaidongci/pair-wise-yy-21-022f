import type { Request, Response } from "express";
import { dispatchService } from "../services/DispatchService";

function dispatcherId(req: Request): number {
  return (req as Request & { user?: { id: number } }).user?.id ?? 1;
}

export const dispatchController = {
  console: (_req: Request, res: Response) => {
    res.json(dispatchService.getConsole());
  },

  evaluate: (req: Request, res: Response) => {
    const { ticketId, crewId } = req.body as { ticketId?: number; crewId?: number };
    res.json(dispatchService.evaluateCrew(Number(ticketId), Number(crewId)));
  },

  confirm: (req: Request, res: Response) => {
    const { ticketId, crewId } = req.body as { ticketId?: number; crewId?: number };
    const result = dispatchService.confirmDispatch(Number(ticketId), Number(crewId), dispatcherId(req));
    const status = result.status === "CONFLICT" ? 409 : result.status === "QUEUED" ? 202 : 200;
    res.status(status).json(result);
  },

  reassign: (req: Request, res: Response) => {
    const { ticketId, newCrewId } = req.body as { ticketId?: number; newCrewId?: number };
    res.json(dispatchService.reassign(Number(ticketId), Number(newCrewId), dispatcherId(req)));
  },

  callback: (req: Request, res: Response) => {
    const { ticketId, crewId, callbackType, payload, clientId } = req.body as {
      ticketId?: number;
      crewId?: number;
      callbackType?: string;
      payload?: unknown;
      clientId?: string;
    };
    const result = dispatchService.crewCallback(
      Number(ticketId),
      Number(crewId),
      String(callbackType ?? "ARRIVED"),
      payload ?? {},
      String(clientId ?? "")
    );
    const status = result.status === "INVALID" ? 202 : 201;
    res.status(status).json(result);
  },

  sync: (req: Request, res: Response) => {
    const { crewId, callbacks } = req.body as {
      crewId?: number;
      callbacks?: Array<{ ticket_id: number; crew_id?: number; callback_type: string; payload: unknown; client_id: string }>;
    };
    res.json(dispatchService.syncCallbacks(Number(crewId), Array.isArray(callbacks) ? callbacks : []));
  },

  resolveReconciliation: (req: Request, res: Response) => {
    const id = Number(req.params.id);
    res.json(dispatchService.resolveReconciliation(id, dispatcherId(req)));
  }
};
