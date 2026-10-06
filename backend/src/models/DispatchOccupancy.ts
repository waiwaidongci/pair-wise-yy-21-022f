export interface DispatchOccupancy {
  id: number;
  ticket_id: number;
  crew_id: number;
  dispatcher_id: number;
  status: string;
  held_at: string;
  confirmed_at: string | null;
  released_at: string | null;
}
