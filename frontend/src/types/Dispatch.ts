export interface CrewAvailability {
  id: number;
  name: string;
  leader_id: number;
  skill_tags: string;
  duty_status: string;
  current_ticket_id: number;
  contact_phone: string;
  capacity: number;
  skills: string[];
  inHand: number;
  available: boolean;
}

export interface QueueEntry {
  id: number;
  ticket_id: number;
  crew_id: number | null;
  required_skills: string;
  reason: string;
  status: string;
  enqueued_by: number;
  enqueued_at: string;
  updated_at: string;
}

export interface Occupancy {
  id: number;
  ticket_id: number;
  crew_id: number;
  dispatcher_id: number;
  status: string;
  held_at: string;
  confirmed_at: string | null;
  released_at: string | null;
}

export interface CrewCallback {
  id: number;
  ticket_id: number;
  crew_id: number;
  client_id: string;
  callback_type: string;
  payload: string;
  status: string;
  created_at: string;
  synced_at: string | null;
  invalid_reason: string | null;
}

export interface Reconciliation {
  id: number;
  callback_id: number;
  ticket_id: number;
  old_crew_id: number;
  new_crew_id: number | null;
  reason: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: number | null;
}

export interface PartStock {
  id: number;
  part_code: string;
  part_name: string;
  stock: number;
  applicable_fault_types: string;
}

export type DispatchState = "UNASSIGNED" | "QUEUED" | "OCCUPIED" | "DISPATCHED";

export interface TicketDispatch {
  id: number;
  fault_report_id: number;
  team_id: number;
  dispatcher_id: number;
  priority: string;
  status: string;
  assigned_at: string;
  restored_at: string;
  fault_type: string;
  address: string;
  requiredSkills: string[];
  queueEntry?: QueueEntry;
  occupancy?: Occupancy;
  dispatchState: DispatchState;
}

export interface Evaluation {
  canAccept: boolean;
  reasons: string[];
  missingSkills: string[];
  missingParts: PartStock[];
  inHand: number;
  capacity: number;
  requiredSkills: string[];
  requiredParts: PartStock[];
}

export interface ConfirmResult {
  status: "OCCUPIED" | "QUEUED" | "CONFLICT";
  occupancy?: Occupancy;
  queueEntry?: QueueEntry;
  evaluation?: Evaluation;
  occupier?: CrewAvailability;
}

export interface SyncResultItem {
  status: "SYNCED" | "INVALID" | "DUPLICATE";
  callback: CrewCallback;
}

export interface SyncResponse {
  merged: number;
  invalid: number;
  duplicates: number;
  results: SyncResultItem[];
}

export interface DispatchConsole {
  crews: CrewAvailability[];
  tickets: TicketDispatch[];
  queue: QueueEntry[];
  occupancies: Occupancy[];
  reconciliations: Reconciliation[];
  parts: PartStock[];
}

export interface PendingCallback {
  client_id: string;
  ticket_id: number;
  crew_id: number;
  callback_type: string;
  payload: unknown;
  created_at: string;
}
