export interface PendingReconciliation {
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
