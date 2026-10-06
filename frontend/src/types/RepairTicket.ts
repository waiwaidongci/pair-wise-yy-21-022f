export interface RepairTicket {
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
