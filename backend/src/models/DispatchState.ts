import type { RepairTicket } from "./RepairTicket";
import type { Crew } from "./Crew";
import type { SparePartUsage } from "./SparePartUsage";
import type { PartStock } from "./PartStock";
import type { DispatchHold } from "./DispatchHold";
import type { QueueEntry } from "./QueueEntry";
import type { CrewReport } from "./CrewReport";
import type { Reconciliation } from "./Reconciliation";

export interface DispatchLogEntry {
  time: string;
  template: string;
  actor: string;
  detail: string;
}

export interface DispatchState {
  tickets: RepairTicket[];
  crews: Crew[];
  partStock: PartStock[];
  sparePartUsage: SparePartUsage[];
  holds: DispatchHold[];
  queue: QueueEntry[];
  reports: CrewReport[];
  reconciliations: Reconciliation[];
  logs: DispatchLogEntry[];
  seq: { queue: number; reconciliation: number; usage: number };
}
