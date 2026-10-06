import { fileStore } from "./FileStore";
import { seed } from "../seed";
import type { DispatchQueueEntry } from "../models/DispatchQueue";
import type { DispatchOccupancy } from "../models/DispatchOccupancy";
import type { CrewCallback } from "../models/CrewCallback";
import type { PendingReconciliation } from "../models/PendingReconciliation";
import type { PartStock } from "../models/PartStock";

const QUEUE = "dispatch_queue";
const OCCUPANCY = "dispatch_occupancy";
const CALLBACK = "crew_callback";
const RECONCILIATION = "pending_reconciliation";

export const dispatchRepository = {
  // 基础数据来自种子（静态卡片）
  crews: () => seed.crew,
  tickets: () => seed.repairTicket,
  faultReports: () => seed.faultReport,
  parts: (): PartStock[] => seed.partStock as PartStock[],
  sparePartUsage: () => seed.sparePartUsage,

  // 队列
  listQueue: (): DispatchQueueEntry[] => fileStore.read<DispatchQueueEntry>(QUEUE),
  findWaitingQueueEntry: (ticketId: number): DispatchQueueEntry | undefined =>
    fileStore.find<DispatchQueueEntry>(QUEUE, (q) => q.ticket_id === ticketId && q.status === "WAITING"),
  insertQueue: (row: Partial<DispatchQueueEntry>): DispatchQueueEntry =>
    fileStore.insert<DispatchQueueEntry>(QUEUE, row),
  updateQueue: (id: number, patch: Record<string, unknown>): DispatchQueueEntry | undefined =>
    fileStore.update<DispatchQueueEntry>(QUEUE, id, patch),

  // 占用
  listOccupancies: (): DispatchOccupancy[] => fileStore.read<DispatchOccupancy>(OCCUPANCY),
  findActiveOccupancy: (ticketId: number): DispatchOccupancy | undefined =>
    fileStore.find<DispatchOccupancy>(OCCUPANCY, (o) => o.ticket_id === ticketId && o.status === "HELD"),
  findOccupancyByCrew: (ticketId: number, crewId: number): DispatchOccupancy | undefined =>
    fileStore.find<DispatchOccupancy>(OCCUPANCY, (o) => o.ticket_id === ticketId && o.crew_id === crewId && o.status === "HELD"),
  insertOccupancy: (row: Partial<DispatchOccupancy>): DispatchOccupancy =>
    fileStore.insert<DispatchOccupancy>(OCCUPANCY, row),
  updateOccupancy: (id: number, patch: Record<string, unknown>): DispatchOccupancy | undefined =>
    fileStore.update<DispatchOccupancy>(OCCUPANCY, id, patch),
  countCrewOccupancies: (crewId: number): number =>
    fileStore.filter<DispatchOccupancy>(OCCUPANCY, (o) => o.crew_id === crewId && o.status === "HELD").length,

  // 回传
  listCallbacks: (): CrewCallback[] => fileStore.read<CrewCallback>(CALLBACK),
  findCallbackByClientId: (clientId: string): CrewCallback | undefined =>
    fileStore.find<CrewCallback>(CALLBACK, (c) => c.client_id === clientId),
  insertCallback: (row: Partial<CrewCallback>): CrewCallback =>
    fileStore.insert<CrewCallback>(CALLBACK, row),
  updateCallback: (id: number, patch: Record<string, unknown>): CrewCallback | undefined =>
    fileStore.update<CrewCallback>(CALLBACK, id, patch),
  listCallbacksByTicket: (ticketId: number): CrewCallback[] =>
    fileStore.filter<CrewCallback>(CALLBACK, (c) => c.ticket_id === ticketId),

  // 待对账
  listReconciliations: (): PendingReconciliation[] => fileStore.read<PendingReconciliation>(RECONCILIATION),
  insertReconciliation: (row: Partial<PendingReconciliation>): PendingReconciliation =>
    fileStore.insert<PendingReconciliation>(RECONCILIATION, row),
  updateReconciliation: (id: number, patch: Record<string, unknown>): PendingReconciliation | undefined =>
    fileStore.update<PendingReconciliation>(RECONCILIATION, id, patch)
};
