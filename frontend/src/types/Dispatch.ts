import type { CrewReportType } from "../constants/CrewReportType";

export interface DispatchTicket {
  id: number;
  fault_report_id: number;
  team_id: number;
  dispatcher_id: number;
  dispatcher_name: string;
  priority: string;
  status: string;
  assigned_at: string;
  restored_at: string;
  required_skill: string;
  required_part_code: string;
  required_part_qty: number;
  summary: string;
}

export interface DispatchCrew {
  id: number;
  name: string;
  leader_id: number;
  skill_tags: string;
  duty_status: string;
  current_ticket_id: number;
  contact_phone: string;
  max_tasks: number;
  in_hand: number;
  in_hand_ids: number[];
}

export interface PartStock { part_code: string; part_name: string; warehouse_name: string; stock: number }

export interface SparePartUsageRow {
  id: number;
  ticket_id: number;
  part_code: string;
  part_name: string;
  quantity: number;
  warehouse_name: string;
  approved_by: string;
  usage_status: string;
}

export interface DispatchHold { ticket_id: number; dispatcher: string; acquired_at: string; expires_at: string }

export interface QueueEntryView {
  id: number;
  ticket_id: number;
  crew_id: number;
  queued_by: string;
  queued_at: string;
  status: string;
  position: number;
  ticket_summary: string;
  crew_name: string;
}

export interface CrewReportRow {
  client_report_id: string;
  ticket_id: number;
  crew_id: number;
  type: CrewReportType;
  content: string;
  reported_at: string;
  merged_at: string;
  status: "MERGED" | "INVALID";
}

export interface ReconciliationRow {
  id: number;
  report_client_id: string;
  ticket_id: number;
  crew_id: number;
  reason: string;
  status: "PENDING" | "RESOLVED";
  created_at: string;
  resolved_at: string;
  resolved_by: string;
}

export interface EligibilityReason { code: string; message: string }
export interface Eligibility { ok: boolean; reasons: EligibilityReason[] }

export interface DispatchLogEntry { time: string; template: string; actor: string; detail: string }

export interface DispatchStateResponse {
  now: string;
  hold_ttl_ms: number;
  tickets: DispatchTicket[];
  crews: DispatchCrew[];
  part_stock: PartStock[];
  spare_part_usage: SparePartUsageRow[];
  holds: DispatchHold[];
  queue: QueueEntryView[];
  reports: CrewReportRow[];
  reconciliations: ReconciliationRow[];
  eligibility: Record<number, Record<number, Eligibility>>;
  logs: DispatchLogEntry[];
}

export interface CrewReportDraft {
  client_report_id: string;
  ticket_id: number;
  crew_id: number;
  type: CrewReportType;
  content: string;
  reported_at: string;
}

export interface SyncResult { merged: string[]; duplicated: string[]; invalidated: string[] }
