import { seed } from "../seed";
import type { Crew } from "../models/Crew";
import type { DispatchLogEntry, DispatchState } from "../models/DispatchState";
import type { QueueEntry } from "../models/QueueEntry";
import type { RepairTicket } from "../models/RepairTicket";

const ACTIVE_TICKET_STATUS = ["ASSIGNED", "ARRIVED", "REPAIRING"];

export const createInitialDispatchState = (): DispatchState => ({
  tickets: seed.repairTicket.map((row) => ({ ...row })),
  crews: seed.crew.map((row) => ({ ...row })),
  partStock: seed.partStock.map((row) => ({ ...row })),
  sparePartUsage: seed.sparePartUsage.map((row) => ({ ...row })),
  holds: [],
  queue: [],
  reports: [],
  reconciliations: [],
  logs: [],
  seq: { queue: 1, reconciliation: 1, usage: seed.sparePartUsage.length + 1 }
});

export const createLogEntry = (template: string, actor: string, detail: string): DispatchLogEntry => ({
  time: new Date().toISOString(),
  template,
  actor,
  detail
});

export const inHandTicketIds = (tickets: RepairTicket[], crewId: number): number[] =>
  tickets.filter((t) => t.team_id === crewId && ACTIVE_TICKET_STATUS.includes(t.status)).map((t) => t.id);

export const createCrewView = (crew: Crew, tickets: RepairTicket[]) => {
  const inHand = inHandTicketIds(tickets, crew.id);
  return { ...crew, in_hand: inHand.length, in_hand_ids: inHand };
};

export const createQueueEntryView = (entry: QueueEntry, state: DispatchState) => {
  const waiting = state.queue
    .filter((q) => q.crew_id === entry.crew_id && q.status === "WAITING")
    .sort((a, b) => a.queued_at.localeCompare(b.queued_at));
  return {
    ...entry,
    position: waiting.findIndex((q) => q.id === entry.id) + 1,
    ticket_summary: state.tickets.find((t) => t.id === entry.ticket_id)?.summary ?? "",
    crew_name: state.crews.find((c) => c.id === entry.crew_id)?.name ?? ""
  };
};
