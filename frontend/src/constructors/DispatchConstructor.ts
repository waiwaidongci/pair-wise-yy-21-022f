import type {
  ConfirmResult,
  CrewAvailability,
  DispatchConsole,
  Evaluation,
  Occupancy,
  PendingCallback,
  QueueEntry,
  Reconciliation,
  SyncResponse,
  TicketDispatch
} from "../types/Dispatch";

export const createDefaultQueueEntry = (overrides: Partial<QueueEntry> = {}): QueueEntry => ({
  id: 0,
  ticket_id: 0,
  crew_id: null,
  required_skills: "",
  reason: "",
  status: "WAITING",
  enqueued_by: 0,
  enqueued_at: "",
  updated_at: "",
  ...overrides
});

export const createDefaultOccupancy = (overrides: Partial<Occupancy> = {}): Occupancy => ({
  id: 0,
  ticket_id: 0,
  crew_id: 0,
  dispatcher_id: 0,
  status: "HELD",
  held_at: "",
  confirmed_at: null,
  released_at: null,
  ...overrides
});

export const createDefaultReconciliation = (overrides: Partial<Reconciliation> = {}): Reconciliation => ({
  id: 0,
  callback_id: 0,
  ticket_id: 0,
  old_crew_id: 0,
  new_crew_id: null,
  reason: "",
  status: "PENDING",
  created_at: "",
  resolved_at: null,
  resolved_by: null,
  ...overrides
});

export const createPendingCallback = (overrides: Partial<PendingCallback> = {}): PendingCallback => ({
  client_id: "",
  ticket_id: 0,
  crew_id: 0,
  callback_type: "ARRIVED",
  payload: {},
  created_at: "",
  ...overrides
});

export const createEmptyConsole = (): DispatchConsole => ({
  crews: [],
  tickets: [],
  queue: [],
  occupancies: [],
  reconciliations: [],
  parts: []
});

export const createEmptyEvaluation = (): Evaluation => ({
  canAccept: false,
  reasons: [],
  missingSkills: [],
  missingParts: [],
  inHand: 0,
  capacity: 0,
  requiredSkills: [],
  requiredParts: []
});

export const createEmptyConfirmResult = (): ConfirmResult => ({ status: "QUEUED" });

export type { CrewAvailability, TicketDispatch, SyncResponse };
