import { TicketStatus } from "../constants/TicketStatus";

const FLOW: Record<string, string> = {
  WAIT_DISPATCH: "ASSIGNED",
  ASSIGNED: "ARRIVED",
  ARRIVED: "REPAIRING",
  REPAIRING: "RESTORED",
  RESTORED: "CLOSED",
  CLOSED: "CLOSED"
};

export function useTicketFlow() {
  const nextStatus = (status: string): string => FLOW[status] ?? status;
  const flow = TicketStatus;
  const isTerminal = (status: string): boolean => status === "CLOSED";
  return { nextStatus, flow, isTerminal };
}
