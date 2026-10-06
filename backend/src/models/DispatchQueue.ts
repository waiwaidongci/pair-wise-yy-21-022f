export interface DispatchQueueEntry {
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
