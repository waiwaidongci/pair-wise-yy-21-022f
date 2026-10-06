import type {
  ConfirmResult,
  DispatchConsole,
  Evaluation,
  SyncResponse
} from "../types/Dispatch";

const endpoint = "/api/dispatch";

function dispatcherId(): string {
  return localStorage.getItem("dispatcherId") ?? "1";
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "x-role": "dispatcher",
      "x-user-id": dispatcherId()
    },
    ...options
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
    throw new Error(body.message ?? body.code ?? `请求失败（${res.status}）`);
  }
  return (await res.json()) as T;
}

export interface SyncCallbackInput {
  ticket_id: number;
  crew_id?: number;
  callback_type: string;
  payload: unknown;
  client_id: string;
}

export const dispatchApi = {
  getConsole: (): Promise<DispatchConsole> => request<DispatchConsole>(`${endpoint}/console`),

  evaluate: (ticketId: number, crewId: number): Promise<Evaluation> =>
    request<Evaluation>(`${endpoint}/evaluate`, {
      method: "POST",
      body: JSON.stringify({ ticketId, crewId })
    }),

  confirm: (ticketId: number, crewId: number): Promise<ConfirmResult> =>
    request<ConfirmResult>(`${endpoint}/confirm`, {
      method: "POST",
      body: JSON.stringify({ ticketId, crewId })
    }),

  reassign: (ticketId: number, newCrewId: number): Promise<ConfirmResult> =>
    request<ConfirmResult>(`${endpoint}/reassign`, {
      method: "POST",
      body: JSON.stringify({ ticketId, newCrewId })
    }),

  callback: (
    ticketId: number,
    crewId: number,
    callbackType: string,
    payload: unknown,
    clientId: string
  ): Promise<{ status: "SYNCED" | "INVALID" | "DUPLICATE"; callback: { id: number } }> =>
    request(`${endpoint}/callback`, {
      method: "POST",
      body: JSON.stringify({ ticketId, crewId, callbackType, payload, clientId })
    }),

  sync: (crewId: number, callbacks: SyncCallbackInput[]): Promise<SyncResponse> =>
    request<SyncResponse>(`${endpoint}/sync`, {
      method: "POST",
      body: JSON.stringify({ crewId, callbacks })
    }),

  resolveReconciliation: (id: number): Promise<{ status: string }> =>
    request(`${endpoint}/reconciliations/${id}/resolve`, { method: "POST" })
};
