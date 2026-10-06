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
