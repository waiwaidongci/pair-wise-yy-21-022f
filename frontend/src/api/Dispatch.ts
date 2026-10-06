import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import type { CrewReportDraft, DispatchStateResponse, SyncResult } from "../types/Dispatch";

const endpoint = "/api/dispatch";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${endpoint}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
  } catch {
    throw new ApiError(ERROR_CODES.NETWORK_ERROR, ERROR_MESSAGES.NETWORK_ERROR, 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.code ?? "INTERNAL_ERROR", body.message ?? res.statusText, res.status, body.details ?? {});
  }
  return body as T;
}

const post = <T>(path: string, payload: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(payload) });

export const fetchDispatchState = () => request<DispatchStateResponse>("/state");
export const postHold = (ticket_id: number, dispatcher: string) => post("/hold", { ticket_id, dispatcher });
export const postRelease = (ticket_id: number, dispatcher: string) => post("/release", { ticket_id, dispatcher });
export const postConfirm = (ticket_id: number, crew_id: number, dispatcher: string) => post("/confirm", { ticket_id, crew_id, dispatcher });
export const postEnqueue = (ticket_id: number, crew_id: number, dispatcher: string) => post("/queue", { ticket_id, crew_id, dispatcher });
export const postCancelQueue = (id: number, dispatcher: string) => post(`/queue/${id}/cancel`, { dispatcher });
export const postDispatchQueue = (id: number, dispatcher: string) => post(`/queue/${id}/dispatch`, { dispatcher });
export const postReassign = (ticket_id: number, dispatcher: string, reason?: string) => post("/reassign", { ticket_id, dispatcher, reason });
export const postSyncReports = (crew_id: number, reports: CrewReportDraft[]) => post<SyncResult>("/reports/sync", { crew_id, reports });
export const postResolveReconciliation = (id: number, resolver: string, note?: string) => post(`/reconciliations/${id}/resolve`, { resolver, note });
export const postReset = () => post<DispatchStateResponse>("/reset", {});
