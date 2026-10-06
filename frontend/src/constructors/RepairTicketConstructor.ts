import type { RepairTicket } from "../types/RepairTicket";

export const createDefaultRepairTicket = (overrides: Partial<RepairTicket> = {}): RepairTicket => ({
  id: 0,
  fault_report_id: 0,
  team_id: 0,
  dispatcher_id: 0,
  dispatcher_name: "",
  priority: "P2",
  status: "WAIT_DISPATCH",
  assigned_at: "",
  restored_at: "",
  required_skill: "架空线路",
  required_part_code: "",
  required_part_qty: 0,
  summary: "",
  ...overrides
});

export const createRepairTicketForm = createDefaultRepairTicket;
export const createRepairTicketResponse = createDefaultRepairTicket;
