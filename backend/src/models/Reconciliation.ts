import type { ReconciliationStatus } from "../constants/ReconciliationStatus";

export interface Reconciliation {
  id: number;
  report_client_id: string;
  ticket_id: number;
  crew_id: number;
  reason: string;
  status: ReconciliationStatus;
  created_at: string;
  resolved_at: string;
  resolved_by: string;
}
