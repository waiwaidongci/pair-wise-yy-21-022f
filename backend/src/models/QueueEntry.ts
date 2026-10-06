import type { QueueStatus } from "../constants/QueueStatus";

export interface QueueEntry {
  id: number;
  ticket_id: number;
  crew_id: number;
  queued_by: string;
  queued_at: string;
  status: QueueStatus;
}
